/* Motore GLM-5.2 (architettura glm_moe_dsa) in C puro.
 * Stadio B: replica fedele del forward di transformers (modeling_glm_moe_dsa.py):
 *   - attenzione MLA (q/kv-LoRA, RoPE interleaved parziale)
 *   - router sigmoid + noaux_tc (n_group=1) con routed_scaling_factor
 *   - shared expert + expert routed in streaming dal disco (per-expert)
 *   - primi first_k_dense_replace layer densi
 * Il DSA indexer e' un NO-OP per seq <= index_topk (seleziona tutte le key): qui si usa
 * attenzione causale densa -> output identico all'oracolo su prompt corti.
 *
 * QUANTIZZAZIONE: gli expert (streaming) e la parte DENSA residente (attenzione, lm_head,
 * embed, mlp densa, shared expert) sono tenuti in int8 per-riga + scala (dequant-on-use).
 * E' cio' che fa entrare GLM-5.2 nei 15 GB: ~17B param residenti a int4 ~= 8.7 GB.
 * Norme/router/bias restano f32 (piccoli e sensibili).
 *
 * Validazione: stessi token id di ref_glm.json (oracolo transformers, c/tools/make_glm_oracle.py).
 *   build: make glm   run: SNAP=./glm_tiny ./glm <cap> <expert_bits> <dense_bits>
 *   TF=1 -> teacher-forcing (valida il prefill su tutta la sequenza)
 */
#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <math.h>
#include <time.h>
#include <limits.h>
#include <pthread.h>                              /* thread I/O del PILOTA */
#include <stdatomic.h>                            /* PIPE ready-flags/job queue + PILOT_REAL cross-layer handshake */
#include <sched.h>                                /* sched_yield: PIPE spin / PILOT barrier */
#include <unistd.h>
#if defined(__APPLE__) || defined(__linux__) || defined(__FreeBSD__)
#include <sys/select.h>                             /* select() serve-loop polling (#68); not on native MinGW */
#endif
#if defined(__APPLE__) || defined(__linux__) || defined(__FreeBSD__)
#include <sys/resource.h>
#include <sys/mman.h>                             /* mlock: inchioda le pagine in RAM / wire pages into RAM */
#ifdef __linux__
#include <sys/syscall.h>                          /* COLI_NUMA: mbind degli slab expert / expert-slab interleave */
#endif
#include <sys/stat.h>                             /* fstat per mmap degli shard (COLI_MMAP) */
#include <signal.h>                               /* SIGINT = stop morbido del turno in serve mode */
#elif defined(_WIN32)
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <psapi.h>                                /* Required for GetProcessMemoryInfo */
#endif
#ifdef __linux__
#include <sys/vfs.h>                              /* statfs: real fs-type check for the 9p warning (below) */
#endif
#if defined(_WIN32) && (defined(__x86_64__) || defined(__i386__))
#include <cpuid.h>                                /* hwinfo_emit: CPU brand string senza /proc */
#endif
#include "st.h"
#ifdef __linux__
#include "uring.h"
#endif
#include "tok.h"
#include "tier.h"
#include "grammar.h"                              /* metodo F: draft grammaticali (#48) */
#include "schema_gbnf.h"                          /* SCHEMA=: JSON-Schema -> GBNF for method F */
#include "decode_batch.h"
#ifdef _OPENMP
#include <omp.h>                                  /* scratch per-thread nell'attention */
#else
static inline int omp_get_max_threads(void){ return 1; }
static inline int omp_get_thread_num(void){ return 0; }
#endif
#ifdef COLI_CUDA
#include "backend_cuda.h"
#endif
#ifdef COLI_METAL
#include "backend_metal.h"
#include <omp.h>
static int g_metal_enabled;
static int g_metal_gemm_min=16;   /* COLI_METAL_GEMM_MIN: min rows to send a matmul_qt GEMM to GPU */
/* output dello shared expert gia' calcolato su GPU (solo Metal layer-CB) */
static const float *g_pre_sh;
#endif
/* routing precalcolata dalla GPU (Metal layer CB o device router CUDA, #431):
 * moe() la usa e salta la FASE A. NULL = router su CPU. */
static const int *g_pre_idx; static const float *g_pre_w; static const int *g_pre_keff;
#ifdef __APPLE__
#include <mach/mach.h>                            /* host_statistics64: MemAvailable di macOS */
#endif

typedef struct {
    int hidden, n_layers, n_heads, n_experts, topk, moe_inter, dense_inter;
    int first_dense, q_lora, kv_lora, qk_nope, qk_rope, qk_head, v_head, n_shared, vocab;
    int n_group, topk_group, norm_topk;
    int stop_ids[8], n_stop;                     /* eos_token_id dal config (GLM-5.2 ne ha 3!) */
    int index_topk, index_nh, index_hd;          /* DSA lightning indexer */
    int8_t idx_type[128];                        /* per layer: 1=full (calcola), 0=shared (riusa) */
    float eps, theta, attn_scale, routed_scale;
} Cfg;

/* tensore [O,I] in uno di tre formati:
 *   fmt=0 F32   -> qf
 *   fmt=1 INT8  -> q8 (1 byte/param) + scala per riga
 *   fmt=2 INT4  -> q4 (2 valori per byte, impacchettati) + scala per riga
 * INT4 e' cio' che fa stare la densa residente nei 15 GB (0.5 byte/param). */
/* fmt: 0 F32, 1 INT8, 2 INT4 (2/byte), 3 INT2 (4/byte), 4 INT4-GROUPED, 5 INT3-G64.
 * q4 ospita int4/int2/int3 packed. fmt=4 (grouped int4, #242): per-row nibbles + one f32
 * scale per group of `gs` inputs (s has O*ceil(I/gs) entries).
 * fmt=6 (E8/IQ3 lattice, #452): 98B per 256 weights = 3.0625 bits/weight, grid
 * indices + parity-packed signs + sub-scales + fp16 super-scale, ALL inside q4 —
 * `s` is unused for this format (see quant.h E8_* and tools/iq3_pack.py).
 * fmt=5 (int3, per-GROUP scales, group=64, see quant.h I3_*): values in [-4,3] stored per
 * 64-input group as 24 bytes = 16B low plane (2 bits/val, int2 layout) + 8B high plane
 * (1 bit/val), plus ONE f32 scale PER GROUP (s has O*ceil(I/64) entries, not O). 3.5
 * bits/weight effective — the quality/size sweet spot measured in the #132 ablation. */
typedef struct {
    int fmt; float *qf; int8_t *q8; uint8_t *q4; float *s; int O, I, gs;  /* gs=group size (0=per-row, 128=grouped) */
#ifdef COLI_CUDA
    ColiCudaTensor *cuda;
#endif
    int cuda_eligible, cuda_failed, cuda_device;  /* resident tensor, never a reused expert slot */
} QT;
static int64_t qt_bytes(const QT *t){    /* byte residenti del tensore */
    int64_t n=(int64_t)t->O*t->I;
    if(t->fmt==0) return n*4;
    if(t->fmt==1) return n + (int64_t)t->O*4;
    if(t->fmt==3) return (int64_t)t->O*((t->I+3)/4) + (int64_t)t->O*4;
    if(t->fmt==4){ /* int4 grouped: packed nibbles + O*ceil(I/gs) scales */
        int ng=(t->I+t->gs-1)/t->gs;
        return (int64_t)t->O*((t->I+1)/2) + (int64_t)t->O*ng*4; }
    if(t->fmt==5){ /* int3-g64: 24B/group weights + one f32 scale per group (I3_* in quant.h,
                    * included below — keep the arithmetic literal here) */
        int64_t ng=((int64_t)t->I+63)/64;
        return (int64_t)t->O*ng*24 + (int64_t)t->O*ng*4; }
    if(t->fmt==6)  /* E8/IQ3: 98B per 256 weights, scales in-block, .qs is a 4-byte tag */
        return (int64_t)t->O*(((int64_t)t->I+255)/256)*98 + 4;
    return (int64_t)t->O*((t->I+1)/2) + (int64_t)t->O*4;  /* fmt=2 int4 per-row */
}

typedef struct {
    float *in_ln, *post_ln;
    /* MLA (densa, quantizzata) */
    QT q_a, q_b, kv_a, kv_b, o; float *q_a_ln, *kv_a_ln;
#ifdef COLI_CUDA
    ColiCudaTensor *kv_b_shard[COLI_CUDA_MAX_DEVICES];
    int shard_h0[COLI_CUDA_MAX_DEVICES],shard_hn[COLI_CUDA_MAX_DEVICES],n_kv_b_shard;
    int shared_w4a16_failed;
#endif
    int sparse;
    /* dense mlp (sparse==0) */
    QT gate_proj, up_proj, down_proj;
    /* moe (sparse==1) */
    float *router, *router_bias;                 /* router f32 (sensibile) */
#ifdef COLI_CUDA
    void *router_cuda, *router_bias_cuda;        /* device router (#431 PR-A), lazy-uploaded */
    int router_cuda_bad;                         /* upload failed once: stay on the CPU router */
#endif
    QT sh_gate, sh_up, sh_down;                  /* shared expert */
} Layer;

/* slot di un expert: pesi quantizzati + scale. Nel container pre-quantizzato g/u/d sono
 * VISTE dentro `slab` (una sola pread coalescente); nel fallback hanno buffer propri.
 * slab_cap/fslab_cap: capienza allocata — gli slot ws[] sono riusati TRA layer e gli
 * expert non hanno tutti la stessa taglia (layer MTP int8 = 2x i layer int4). */
typedef struct { int eid; QT g,u,d; uint8_t *slab; float *fslab;
                 int64_t slab_cap, fslab_cap; uint64_t used;
                 /* pin-arena backing (#419): when set, slab/fslab are interior
                  * slices of a per-layer arena and must never be free()d —
                  * expert_host_release detaches them, expert_host_ensure
                  * re-attaches. NULL for every individually-allocated slot. */
                 uint8_t *aslab; float *afslab; } ESlot;

typedef struct {
    float **Lc, **Rc, **Ic;
    int *kv_start, max_t;
    int disk_nrec;
    char disk_path[2048];
    FILE *disk_fp;       /* kept-open handle: fopen once, fwrite per turn, fclose at exit (#4) */
    uint8_t *disk_buf;   /* staging buffer: one contiguous record per position (#1) */
    int64_t disk_buf_cap;
} KVState;

typedef struct {
    KVState *kv;
    int token, pos;
} DecodeRow;

typedef struct {
    Cfg c; shards S;
    int ebits, dbits;                            /* bit expert / bit densa */
    QT embed, lm_head; float *final_norm;
    Layer *L;
    /* KV-cache MLA COMPRESSA: per token si tiene solo il latente normato [kv_lora] e
     * k_rot [qk_rope] (576 vs 32768 valori/token). k_nope e value si ricostruiscono al
     * volo con kv_b. E' cio' che rende gestibile il contesto su 15 GB (64 teste, no GQA). */
    float **Lc, **Rc; int max_t;                 /* alias della KVState attiva */
    int *kv_start;                               /* prima pos valida nella KV del layer (MTP: parziale) */
    KVState *kv;
    ESlot **ecache; int *ecn; int ecap;          /* LRU expert per-layer */
    float **kv_dev_L, **kv_dev_R; int *kv_dev_valid; /* ombra KV su device (decode) */
    float **ln_dev;                              /* in_ln/post_ln cached on device: [layer*2+{0,1}] (Inc.4) */
    ESlot ws[64];                                /* working set del layer corrente (load paralleli) */
    ESlot **pin; int *npin;                      /* HOT-STORE: expert pinnati in RAM (mai evicted) */
    uint32_t **eusage;                           /* contatori persistenti (per STATS/PIN) */
    uint32_t **eheat;                            /* calore recente per promotion/demotion live */
    uint32_t **elast, eaccess_clock;              /* recency per LFRU session-local */
    /* DISK-CLASS: PRIVATE recency state, read only by expert_classify(). Private --
     * not the real elast/eaccess_clock -- kept fully separate so DISK-CLASS's bookkeeping
     * can never read from or write into stock eviction state: every DISK-CLASS write lives
     * inside its own need_classify/dc_on gate, so "byte-identical with PROF=0" is provable
     * by construction instead of by argument. (Historical note: when this was first written,
     * the Metal pre-routed FASE A path (g_pre_idx) never bumped the real elast/eaccess_clock
     * -- on Metal decode the real clock froze at end of prefill, so REPIN's LRU tie-breaker
     * ran on stale recency for the rest of the run. That was an upstream defect; it has since
     * been reported and fixed (#417, cfcc742) -- FASE A now bumps the real clock too. The
     * private clock is retained anyway: separation from stock state is the stronger property,
     * independent of whether the real clock is correct.) elast_dc/eaccess_clock_dc tick in
     * BOTH FASE A paths, under the same need_classify gate, at the same rate the real clock
     * ticks on the CPU path (one per selected (position,expert)) -- so the
     * COLI_DISKCLASS_WINDOW window keeps its meaning in every mode. elast_pre snapshots
     * elast_dc just BEFORE this call's own bump (see the touched[] guard in FASE A) --
     * classifying against the live array would read the bump routing just made a few lines
     * above the load that needed it, so a giant cold prefill burst would score every expert
     * "just accessed" and get called warm. Recency alone (not eheat's access COUNT): a count
     * never decays, so an expert hot early in a long session would keep reading "warm" long
     * after it dropped out of the working set. Same shape/allocation as elast; NULL for dense
     * layers. */
    uint32_t **elast_dc, **elast_pre, eaccess_clock_dc;
    /* DSA lightning indexer (attivo solo se i pesi out-idx-* sono presenti) */
    int has_dsa;
    QT *ix_wq, *ix_wk, *ix_wp;                   /* per layer FULL: wq_b, wk, weights_proj */
    float **ix_knw, **ix_knb;                    /* k_norm (LayerNorm, eps 1e-6) */
    float **Ic;                                  /* alias KVState: cache indexer [max_t*hd] */
    int *dsa_sel, *dsa_nsel; int dsa_scap;       /* selezione per posizione del batch corrente */
    /* testa MTP (layer n_layers, stile DeepSeek-V3): draft nativi ad alta acceptance */
    int has_mtp; Layer mtpL; QT eh_proj;
    float *enorm, *hnorm, *mtp_norm;
    float *hlast, *h_all;                        /* hidden pre-norm: ultima pos / tutte le pos batch */
    uint64_t mtp_prop, mtp_acc;                  /* statistica acceptance */
    int **eroute; int *enr;                      /* metodo C: routing dell'ULTIMO token per layer */
    uint64_t eclock, hits, miss, ereq;
    uint64_t hit_pin, hit_ecache;                /* split di hits per tier (#336): pin vs LRU ecache */
    uint64_t gpu_expert_calls; int gpu_expert_count; int64_t gpu_expert_bytes;
    uint64_t n_fw, n_emit;                       /* metodo E: forward di decode / token emessi */
    uint64_t route_slots, route_swaps;            /* CACHE_ROUTE: slots chosen / substituted vs true top-K */
    uint64_t route_agree_hit, route_agree_tot;    /* ROUTE_AGREE: |chosen ∩ true top-K| / K */
    double route_kl_sum; uint64_t route_kl_n;     /* mean KL(true||chosen) on gate mass */
    double t_ewait, t_emm, t_ecpu, t_egpu, t_route, t_p2p, t_attn, t_kvb, t_head;
    uint64_t n_p2p;                              /* P0 execution profile: tier split + residual hops */
    uint64_t cpu_expert_rows; int64_t cpu_expert_bytes;
                                                 /* profiling: dove va il tempo (wall del
                                                  * thread di compute; il servizio disco
                                                  * overlappato vive in g_edisk_ns) */
    double t_aproj,t_acore,t_aout;                     /* attention breakdown */
    int64_t resident_bytes;
    /* DISK_SPLIT=1: split dei DISK LOAD (miss LRU -> expert_load) per contesto e per tipo
     * di layer. ld_ctx: 0=main/verify/prefill, 1=dentro mtp_draft, 2=dentro mtp_absorb. */
    int ld_ctx;
    uint64_t miss_draft, miss_absorb;            /* miss in moe() per contesto */
    uint64_t ld_mtp, ld_main;                    /* expert_load per tipo layer (MTP int8 vs main int4) */
    uint64_t bytes_mtp, bytes_main;              /* byte letti da disco per tipo layer */
} Model;

#include "quant.h"
static int g_no_fused_pair=0;
static int g_spec_pin=1;
static int g_spec_live=0;
static inline int spec_pinned(void){ return g_spec_pin && g_spec_live; }

static void matmul_qt_ex(float *y, const float *x, QT *w, int S, int allow_idot);
static void matmul_qt(float *y, const float *x, QT *w, int S){ matmul_qt_ex(y,x,w,S,1); }

/* fmt=4 fused gate+up (defined later, after the quant kernels) */
static void matmul_i4_grouped_pair(float *yg, float *yu, const float *x,
                                    const uint8_t *qg, const float *sg,
                                    const uint8_t *qu, const float *su,
                                    int S, int I, int O, int gs);

static void expert_gate_up(float *g,float *u,const float *x,QT *wg,QT *wu,int S){
    if(!g_no_fused_pair&&!spec_pinned()&&S==1&&wg->fmt==2&&wu->fmt==2&&wg->I==wu->I&&wg->O==wu->O)
        matmul_i4_pair(g,u,x,wg->q4,wg->s,wu->q4,wu->s,wg->I,wg->O);
    else if(!g_no_fused_pair&&S==1&&wg->fmt==4&&wu->fmt==4&&wg->I==wu->I&&wg->O==wu->O&&wg->gs==wu->gs)
        matmul_i4_grouped_pair(g,u,x,wg->q4,wg->s,wu->q4,wu->s,S,wg->I,wg->O,wg->gs);
    else { matmul_qt(g,x,wg,S); matmul_qt(u,x,wu,S); }
}

static int g_repin;
static uint64_t g_last_repin;
#ifdef COLI_CUDA
static int g_cuda_enabled;
static double g_cuda_expert_gb;
static int g_cuda_expert_auto;
static int g_cuda_dense;
static int g_cuda_release_host;
static double g_cuda_reserve_gb;   /* CUDA_RESERVE_GB: VRAM headroom kept free of expert tier (default 2 GB) */
static int g_cuda_devices[COLI_CUDA_MAX_DEVICES], g_cuda_ndev, g_cuda_rr;
static int64_t g_cuda_dense_projected[COLI_CUDA_MAX_DEVICES];
static void qt_cuda_reset(QT *t){
    if(t->cuda){ coli_cuda_tensor_free(t->cuda); t->cuda=NULL; }
    t->cuda_failed=0;
}
static int g_cuda_e8_ready;   /* codebook published to the devices (see cuda_boot) */
static int qt_cuda_upload(QT *t){
    if(t->fmt==5) return 0;   /* int3-g64: no CUDA kernel yet — tensor stays CPU-side */
    if(t->fmt==6 && !g_cuda_e8_ready) return 0;   /* E8 without its codebook would decode garbage */
    const void *weights = t->fmt==0 ? (const void*)t->qf
                        : t->fmt==1 ? (const void*)t->q8 : (const void*)t->q4;
    if(t->fmt==4)   /* grouped int4 (#334): scales are [O, ceil(I/gs)] — the plain
                     * upload would truncate them to O floats and the group kernels
                     * would read garbage. An old DLL without the _g symbol returns 0
                     * and the tensor simply stays CPU-side. */
        return coli_cuda_tensor_upload_g(&t->cuda,weights,t->s,t->fmt,t->I,t->O,t->cuda_device,t->gs);
    return coli_cuda_tensor_upload(&t->cuda,weights,t->s,t->fmt,t->I,t->O,t->cuda_device);
}
static int qt_cuda_update(QT *t){
    const void *weights=t->fmt==0?(const void*)t->qf:
                        t->fmt==1?(const void*)t->q8:(const void*)t->q4;
    return coli_cuda_tensor_update(t->cuda,weights,t->s);
}
static double g_ovl_issue,g_ovl_cpu,g_ovl_take,g_ovl_mark; /* Inc.4 overlap-window split (OVL report) */
static void cuda_stats_print(void){
    size_t n=0,b=0; coli_cuda_stats(-1,&n,&b);
    fprintf(stderr,"[CUDA] resident set: %zu tensors, %.2f GB VRAM\n",n,b/1e9);
    if(g_cuda_ndev>1) for(int i=0;i<g_cuda_ndev;i++){
        coli_cuda_stats(g_cuda_devices[i],&n,&b);
        fprintf(stderr,"[CUDA]   device %d: %zu tensors, %.2f GB\n",g_cuda_devices[i],n,b/1e9);
    }
    uint64_t calls=0,experts=0,rows=0; double h2d=0,kernel=0,d2h=0;
    coli_cuda_group_stats(&calls,&experts,&rows,&h2d,&kernel,&d2h);
    if(calls) fprintf(stderr,"[CUDA] expert groups: %llu call, %llu expert, %llu righe "
        "(%.2f expert/call)%s\n",(unsigned long long)calls,(unsigned long long)experts,
        (unsigned long long)rows,(double)experts/calls,
        getenv("COLI_CUDA_PROFILE")?"; timing sotto":"");
    if(calls&&getenv("COLI_CUDA_PROFILE")) fprintf(stderr,
        "[CUDA] expert groups timing: H2D %.1f ms | kernel %.1f ms | D2H %.1f ms\n",h2d,kernel,d2h);
    if(g_ovl_issue+g_ovl_cpu+g_ovl_take>0) fprintf(stderr,
        "[CUDA] overlap window: pack+issue %.2fs | cpu-rows %.2fs | take(sync+acc) %.2fs\n",
        g_ovl_issue,g_ovl_cpu,g_ovl_take);
}
static int parse_cuda_devices(const char *list, int *out){
    if(!list||!*list) return 0;
    int n=0; const char *p=list;
    while(*p){
        char *end=NULL; long v=strtol(p,&end,10);
        if(end==p||v<0||v>INT_MAX||n>=COLI_CUDA_MAX_DEVICES) return 0;
        for(int i=0;i<n;i++) if(out[i]==(int)v) return 0;
        out[n++]=(int)v; p=end;
        while(*p==' '||*p=='\t') p++;
        if(!*p) break;
        if(*p++!=',') return 0;
        while(*p==' '||*p=='\t') p++;
        if(!*p) return 0;
    }
    return n;
}
#endif
static double now_s(void){
#ifdef _WIN32
    LARGE_INTEGER freq, count;
    QueryPerformanceFrequency(&freq);
    QueryPerformanceCounter(&count);
    return (double)count.QuadPart / (double)freq.QuadPart;
#else
    struct timespec t; clock_gettime(CLOCK_MONOTONIC,&t); return t.tv_sec+t.tv_nsec*1e-9;
#endif
}
static double rss_gb(void){
#ifdef _WIN32
    PROCESS_MEMORY_COUNTERS_EX pmc = {0}; pmc.cb = sizeof(pmc);
    if(GetProcessMemoryInfo(GetCurrentProcess(), (PROCESS_MEMORY_COUNTERS*)&pmc, sizeof(pmc)))
        return pmc.WorkingSetSize / (1024.0 * 1024.0 * 1024.0);
    return 0;
#else
    struct rusage r; getrusage(RUSAGE_SELF,&r);
#ifdef __APPLE__
    return r.ru_maxrss/(1024.0*1024.0*1024.0);   /* macOS: ru_maxrss in BYTE */
#else
    return r.ru_maxrss/(1024.0*1024.0);          /* Linux: in KB */
#endif
#endif
}
/* ---- PROF=1: opt-in performance profile ----------------------------------
 * Records per-forward decode latency and expert-file bytes fetched, then
 * reports percentiles, I/O totals, phase shares and a tuning verdict next to
 * the existing PROFILE line. Additive only: with PROF unset the output of
 * every mode stays byte-identical. */
static int g_prof=0;
static _Atomic int64_t g_prof_io;                /* bytes pread()/faulted from expert files */
/* Disk service: wall time inside expert_load on whichever thread runs the read
 * (PIPE I/O workers, OMP loaders, the speculative pilot). It overlaps compute,
 * so it is NOT a wall-time phase — the stall the compute thread actually felt
 * is m->t_ewait. Thread-seconds, so it can exceed wall time under parallel
 * reads; wait << service means overlap/parallelism is hiding the reads,
 * wait ~ service means the loads block the compute thread. */
static _Atomic int64_t g_edisk_ns;
static double edisk_s(void){ return atomic_load_explicit(&g_edisk_ns,memory_order_relaxed)*1e-9; }
/* DISK-CLASS (PROF=1): per-load cold/warm classification against the engine's own
 * recency state. Instrumentation only -- it never changes which fd serves a read (see
 * expert_classify() and its call site in expert_load_impl; the fd choice expression is
 * untouched by this feature). COLI_DISKCLASS_WINDOW is the recency window in ticks of the
 * PRIVATE clock (m->eaccess_clock_dc -- NOT the real eaccess_clock; see elast_dc in Model
 * for why DISK-CLASS keeps its own clock instead of reading the real one): one tick per
 * selected (position,expert) in FASE A while classification is active, the same per-token
 * rate the real clock has on the CPU path, so the window's meaning is unchanged. At or
 * under the window = warm; 0 (default, unset) derives it from topk*n_layers*8 once the
 * model config is known (main(), right after model_init) -- roughly "seen in the last ~8
 * tokens", generous on purpose (conservative-toward-warm: a load the page cache could have
 * served that gets labeled cold overstates the cold class, the bucket this line exists to
 * size). */
static uint32_t g_direct_heat_ticks=0;
static int g_direct_heat_explicit=0;    /* 1 if COLI_DISKCLASS_WINDOW was set (skip the auto-derive) */
#define DC_COLD 0
#define DC_WARM 1
static _Atomic uint64_t g_dc_n[2];              /* [DC_COLD]/[DC_WARM]: loads classified */
static _Atomic int64_t  g_dc_bytes[2];          /* bytes read (weights + scales, matches g_prof_io) */
static _Atomic int64_t  g_dc_ns[2];             /* wall ns spent reading (thread-seconds, like g_edisk_ns) */
static _Atomic uint64_t g_dc_direct_n[2];       /* subset of the above ACTUALLY served by the uncached fd */
/* Busy-wall per class + combined: how much WALL time had >=1 classified load of the
 * class in flight (thread-seconds / busy-wall = average concurrency; bytes / busy-wall
 * = aggregate GB/s the disk actually delivered for that class -- the quantity the
 * thread-second numbers alone can't answer: N slow overlapped reads can beat N fast
 * serial ones in aggregate, and only wall-denominated rates see it). Transition scheme:
 * 0->1 records a start, 1->0 accumulates (now - start). One dedicated mutex serializes
 * the transition bookkeeping -- two short lock/unlock pairs per load against ms-scale
 * reads; a CAS scheme would save nothing measurable and be harder to audit
 * (correctness over cleverness). Only COMPLETED intervals are in the accumulators: an
 * interval still open at report time is not counted (bounded by one read's duration --
 * noise at report granularity). */
static pthread_mutex_t g_dc_wall_mx=PTHREAD_MUTEX_INITIALIZER;
static int g_dc_inflight[2], g_dc_inflight_all;              /* guarded by g_dc_wall_mx */
static double g_dc_wall_open[2], g_dc_wall_open_all;         /* start of the open interval */
static int64_t g_dc_wall_ns[2], g_dc_wall_all_ns;            /* completed busy-wall ns */
static void dc_wall_enter(int cls, double now){
    pthread_mutex_lock(&g_dc_wall_mx);
    if(g_dc_inflight[cls]++==0) g_dc_wall_open[cls]=now;
    if(g_dc_inflight_all++==0)  g_dc_wall_open_all=now;
    pthread_mutex_unlock(&g_dc_wall_mx);
}
static void dc_wall_exit(int cls, double now){
    pthread_mutex_lock(&g_dc_wall_mx);
    if(--g_dc_inflight[cls]==0) g_dc_wall_ns[cls]+=(int64_t)((now-g_dc_wall_open[cls])*1e9);
    if(--g_dc_inflight_all==0)  g_dc_wall_all_ns +=(int64_t)((now-g_dc_wall_open_all)*1e9);
    pthread_mutex_unlock(&g_dc_wall_mx);
}
static int dc_needed(void);                                  /* fwd: defined with the classifier (needs g_prof) */
static void dc_wall_read(int64_t out[2], int64_t *all){      /* mutex-consistent snapshot for the report */
    if(!dc_needed()){ out[0]=out[1]=0; *all=0; return; }     /* off for the whole process => accumulators are
                                                              * provably zero (only dc_wall_exit writes them,
                                                              * only under dc_on): skip the lock, zero work.
                                                              * Needed because prof_base runs unconditionally
                                                              * at some call sites ("cheap enough to always"). */
    pthread_mutex_lock(&g_dc_wall_mx);
    out[0]=g_dc_wall_ns[0]; out[1]=g_dc_wall_ns[1]; *all=g_dc_wall_all_ns;
    pthread_mutex_unlock(&g_dc_wall_mx);
}
#define PROF_LAT_CAP 32768
static double g_prof_lat[PROF_LAT_CAP];          /* per-forward decode wall clock (ring) */
static uint64_t g_prof_nlat;                     /* forwards recorded (monotonic) */
static void prof_lat(double s){ g_prof_lat[g_prof_nlat++ % PROF_LAT_CAP]=s; }
/* snapshot for windowed reports (serve mode: one report per turn) */
typedef struct {
    double edisk,ewait,emm,ecpu,egpu,route,p2p,attn,head;
    int64_t io,cpu_bytes; uint64_t hits,miss,ereq,n_fw,n_emit,nlat,n_p2p,cpu_rows;
    uint64_t hit_pin,hit_ecache;
    uint64_t dc_n[2], dc_direct_n[2]; int64_t dc_bytes[2], dc_ns[2]; /* DISK-CLASS */
    int64_t dc_wall_ns[2], dc_wall_all_ns;       /* busy-wall (per class + combined) */
} ProfBase;
static void prof_base(Model *m, ProfBase *b){
    b->edisk=edisk_s(); b->ewait=m->t_ewait; b->emm=m->t_emm;
    b->ecpu=m->t_ecpu; b->egpu=m->t_egpu; b->route=m->t_route; b->p2p=m->t_p2p;
    b->attn=m->t_attn; b->head=m->t_head;
    b->io=atomic_load_explicit(&g_prof_io,memory_order_relaxed);
    b->hits=m->hits; b->miss=m->miss; b->ereq=m->ereq;
    b->hit_pin=m->hit_pin; b->hit_ecache=m->hit_ecache;
    b->n_fw=m->n_fw; b->n_emit=m->n_emit; b->nlat=g_prof_nlat; b->n_p2p=m->n_p2p;
    b->cpu_bytes=m->cpu_expert_bytes;b->cpu_rows=m->cpu_expert_rows;
    for(int i=0;i<2;i++){
        b->dc_n[i]=atomic_load_explicit(&g_dc_n[i],memory_order_relaxed);
        b->dc_bytes[i]=atomic_load_explicit(&g_dc_bytes[i],memory_order_relaxed);
        b->dc_ns[i]=atomic_load_explicit(&g_dc_ns[i],memory_order_relaxed);
        b->dc_direct_n[i]=atomic_load_explicit(&g_dc_direct_n[i],memory_order_relaxed);
    }
    dc_wall_read(b->dc_wall_ns,&b->dc_wall_all_ns);
}

static float *falloc(int64_t n){
    /* guardia anti-wrap (report PR #25): n assurdo da file modello ostili non deve
     * diventare una malloc piccola. Niente calloc: il memset nel percorso caldo costa. */
    if(n<0 || (uint64_t)n > SIZE_MAX/sizeof(float)){ fprintf(stderr,"falloc: n=%lld is out of range\n",(long long)n); exit(1); }
    float *p=malloc((size_t)n*sizeof(float)); if(!p){fprintf(stderr,"OOM\n");exit(1);} return p; }

/* Come falloc, per i buffer non-float del percorso caldo. moe() e' la funzione piu'
 * chiamata del motore e girare al soffitto di RAM e' la premessa del progetto: e'
 * esattamente la condizione in cui malloc torna NULL. Un deref di NULL li' e' un
 * segfault a meta' generazione senza diagnostica, indistinguibile da un bug vero
 * quando l'utente lo riporta. exit(1) con messaggio e' la stessa convenzione di
 * falloc e dello scratch xexp. */
static void *xalloc(size_t n, const char *what){
    if(n==0) n=1;
    void *p=malloc(n);
    if(!p){ fprintf(stderr,"OOM: %s (%zu byte)\n",what,n); exit(1); }
    return p;
}
static void *xzalloc(size_t n, const char *what){
    if(n==0) n=1;
    void *p=calloc(n,1);
    if(!p){ fprintf(stderr,"OOM: %s (%zu byte)\n",what,n); exit(1); }
    return p;
}



/* Fused gate+up for grouped int4 (fmt=4): computes both yg[S,O] and yu[S,O] from
 * the same x[S,I], reading x once instead of twice — saves ~33% of expert-matmul time at decode.
 * The per-group scale logic matches matmul_i4_grouped exactly. */
static void matmul_i4_grouped_pair(float *yg, float *yu, const float *x,
                                    const uint8_t *qg, const float *sg,
                                    const uint8_t *qu, const float *su,
                                    int S, int I, int O, int gs){
    int rb=(I+1)/2; int ng=(I+gs-1)/gs;
    #pragma omp parallel for schedule(static)
    for(int o=0;o<O;o++){
        const uint8_t *wg=qg+(int64_t)o*rb; const uint8_t *wu2=qu+(int64_t)o*rb;
        const float *sgl=sg+(int64_t)o*ng;   const float *sul=su+(int64_t)o*ng;
        for(int s=0;s<S;s++){
            const float *xs=x+(int64_t)s*I;
            float ag=0, au=0;
            for(int g=0; g*gs<I; g++){
                int base=g*gs; int glen=gs; if(base+glen>I) glen=I-base;
                float scg=sgl[g], scu=sul[g];
                int i=base;
#ifdef __AVX2__
                const __m128i m4=_mm_set1_epi8(0x0F); const __m256i b8=_mm256_set1_epi32(8);
                __m256 accg=_mm256_setzero_ps(), accu=_mm256_setzero_ps();
                for(; i+16<=base+glen; i+=16){
                    __m128i byg=_mm_loadl_epi64((const __m128i*)(wg+(i>>1)));
                    __m128i log=_mm_and_si128(byg,m4),hig=_mm_and_si128(_mm_srli_epi16(byg,4),m4);
                    __m128i nibg=_mm_unpacklo_epi8(log,hig);
                    __m256 w0g=_mm256_cvtepi32_ps(_mm256_sub_epi32(_mm256_cvtepu8_epi32(nibg),b8));
                    __m256 w1g=_mm256_cvtepi32_ps(_mm256_sub_epi32(_mm256_cvtepu8_epi32(_mm_srli_si128(nibg,8)),b8));
                    accg=_mm256_fmadd_ps(_mm256_loadu_ps(xs+i),   w0g, accg);
                    accg=_mm256_fmadd_ps(_mm256_loadu_ps(xs+i+8), w1g, accg);
                    __m128i byu=_mm_loadl_epi64((const __m128i*)(wu2+(i>>1)));
                    __m128i lou=_mm_and_si128(byu,m4),hiu=_mm_and_si128(_mm_srli_epi16(byu,4),m4);
                    __m128i nibu=_mm_unpacklo_epi8(lou,hiu);
                    __m256 w0u=_mm256_cvtepi32_ps(_mm256_sub_epi32(_mm256_cvtepu8_epi32(nibu),b8));
                    __m256 w1u=_mm256_cvtepi32_ps(_mm256_sub_epi32(_mm256_cvtepu8_epi32(_mm_srli_si128(nibu,8)),b8));
                    accu=_mm256_fmadd_ps(_mm256_loadu_ps(xs+i),   w0u, accu);
                    accu=_mm256_fmadd_ps(_mm256_loadu_ps(xs+i+8), w1u, accu);
                }
                ag+=hsum256(accg)*scg; au+=hsum256(accu)*scu;
#endif
                for(; i+1<base+glen; i+=2){
                    uint8_t bg=wg[i>>1], bu=wu2[i>>1];
                    ag+=(xs[i]*(float)((int)(bg&0xF)-8)+xs[i+1]*(float)((int)(bg>>4)-8))*scg;
                    au+=(xs[i]*(float)((int)(bu&0xF)-8)+xs[i+1]*(float)((int)(bu>>4)-8))*scu;
                }
                if(i<base+glen){
                    uint8_t bg=wg[i>>1], bu=wu2[i>>1];
                    ag+=xs[i]*(float)((int)(bg&0xF)-8)*scg;
                    au+=xs[i]*(float)((int)(bu&0xF)-8)*scu;
                }
            }
            yg[(int64_t)s*O+o]=ag; yu[(int64_t)s*O+o]=au;
        }
    }
}

/* allow_idot=0: forza il kernel int4/int8 ESATTO (attivazioni f32). Serve alle proiezioni di
 * attenzione: sono sensibili alla quantizzazione int8 delle attivazioni dell'IDOT. Misurato su
 * GLM-5.2 int4, 1023 token, log-lik -5040.33 (esatto) -> -5160.47 (IDOT) = +0.117 nat/token,
 * ~+12% perplexity. Gli altri matmul del prefill (o_proj, kv_b, expert) tengono l'IDOT.
 * EN: allow_idot=0 forces the EXACT int4/int8 kernel (f32 activations). The attention
 * projections need it: IDOT's int8 activation quantization costs +0.117 nats/token there
 * (~+12% perplexity), measured. Every other prefill matmul keeps IDOT as before. */
static void matmul_qt_ex(float *y, const float *x, QT *w, int S, int allow_idot){
#ifdef COLI_METAL
    if(g_metal_enabled && S>=g_metal_gemm_min && !spec_pinned() && (w->fmt==1||w->fmt==2) && !omp_in_parallel()){
        const void *wp = w->fmt==1 ? (const void*)w->q8 : (const void*)w->q4;
        if(coli_metal_gemm(y,x,wp,w->s,w->fmt,S,w->I,w->O)) return;
    }
#endif
#ifdef COLI_CUDA
    if(g_cuda_enabled && w->cuda_eligible && !w->cuda_failed && w->fmt!=5 && !omp_in_parallel()){
        const void *weights = w->fmt==0 ? (const void*)w->qf
                            : w->fmt==1 ? (const void*)w->q8 : (const void*)w->q4;
        if(coli_cuda_matmul(&w->cuda,y,x,weights,w->s,w->fmt,S,w->I,w->O,w->cuda_device,w->gs)) return;
        w->cuda_failed=1;
        fprintf(stderr,"[CUDA] tensor [%d,%d] on device %d disabled after an error; falling back to CPU\n",
            w->O,w->I,w->cuda_device);
    }
#endif
    if(w->fmt==0){ matmul(y,x,w->qf,S,w->I,w->O); return; }
    if(w->fmt==4){ matmul_i4_grouped(y,x,w->q4,w->s,S,w->I,w->O,w->gs); return; }
    if(w->fmt==6){ matmul_e8(y,x,w->q4,NULL,S,w->I,w->O); return; }   /* scales live in-block */
    if(allow_idot && g_idot && (w->fmt==1 || (w->fmt==2 && (spec_pinned() ? g_i4s<=1 : S>=g_i4s)))){
        int I=w->I; int8_t *xq; float *sx;
        if(S<0 || I<0 || (size_t)S>SIZE_MAX/(size_t)(I?I:1)){ fprintf(stderr,"matmul_qt: shape overflow\n"); exit(1); }
        quant_scratch((size_t)S*I,(size_t)S,&xq,&sx);
        for(int s=0;s<S;s++) sx[s]=qrow_i8(x+(int64_t)s*I, xq+(int64_t)s*I, I);
        if(w->fmt==1) matmul_q_idot(y,xq,sx,w->q8,w->s,S,I,w->O);
        else matmul_i4_idot(y,xq,sx,w->q4,w->s,S,I,w->O);
        return;
    }
    if(w->fmt==1) matmul_q(y,x,w->q8,w->s,S,w->I,w->O);
    else if(w->fmt==3) matmul_i2(y,x,w->q4,w->s,S,w->I,w->O);
    else if(w->fmt==5) matmul_i3(y,x,w->q4,w->s,S,w->I,w->O);
    else matmul_i4(y,x,w->q4,w->s,S,w->I,w->O);
}

static int g_nopack=0;   /* NOPACK=1 -> tiene i valori <=4bit in contenitore int8 (per validare il packing) */
static int g_drop=0;     /* DROP=1 -> scarta le pagine expart dopo l'uso. Default 0: le lascia in
                          * page-cache (buff/cache, NON RSS) come L2 gratuito -> sfrutta lo
                          * sbilanciamento del routing MoE (pochi expert "caldi" riusati). */
static int g_prefetch=0; /* PREFETCH=1 -> riabilita il WILLNEED cross-layer (metodo C). Default
                          * OFF: i load VERI in parallelo lo hanno reso superfluo, e sotto
                          * pressione di memoria il readahead speculativo veniva rievictato. */
static int g_direct=0;   /* DIRECT=1 -> O_DIRECT sugli slab expert. Default OFF: su questo host
                          * (VHDX su NVMe DRAM-less, latenza serializzata ~60ms/req) il buffered
                          * liscio e' risultato il migliore; su NVMe veri DIRECT=1 rende di piu'. */
static float g_temp=-1;  /* COLI_TEMP: temperatura di sampling sui TOKEN. <0 = auto (1.0 in chat/
                          * testo, 0=greedy in validazione). 0 = greedy puro. */

/* #509: COLI_TEMP e' il canale primario; TEMP resta come alias legacy ma SOLO se
 * interamente numerica. $TEMP e' la directory temporanea per ROCm (comgr/MIOpen) e
 * per Windows: un valore tipo 0.6 fa fallire l'init HIP, e sulle build native
 * Windows atof("C:\...\Temp")==0 avrebbe silenziosamente forzato greedy sempre. */
static float temp_from_env(const char *coli_temp, const char *temp){
    if(coli_temp) return (float)atof(coli_temp);
    if(temp && *temp){ char *tend; double tv=strtod(temp,&tend);
                       if(tend!=temp && *tend=='\0') return (float)tv; }
    return -1.f;
}
static float g_nuc=0.95f;/* NUCLEUS: top-p sul vocabolario (default dal generation_config GLM-5.2) */
static int g_topk=0;     /* TOPK=n -> usa n expert/token invece di config (ricerca: meno disco) */
static float g_topp=0;   /* TOPP=p (0..1) -> top-p adattivo: tieni gli expert fino a peso cumulato p */
static int g_expert_budget=0; /* EXPERT_BUDGET=N -> cap distinct experts loaded per layer across the
                               * batch-union. Reduces disk I/O on cold/low-RAM hosts by dropping the
                               * lowest-gate-weight experts from the cross-position union. MoE-Spec
                               * (arXiv 2602.16052): top-32 of 64 capture 93% routing weight. */
static int64_t g_budget_dropped=0; /* total experts dropped by EXPERT_BUDGET across all layers */
static int64_t g_budget_rescued=0; /* experts re-kept because a position would have been left with zero */
/* CACHE_ROUTE (paper 2412.00099 max-rank): opt-in only. Keep true top-J always;
 * fill remaining slots preferring pin∪LRU experts ranked within top-M (or mass ROUTE_P). */
static int g_cache_route=0;
static int g_route_j=2;      /* ROUTE_J: sacred top ranks (always take, even uncached) */
static int g_route_m=12;     /* ROUTE_M: max-rank window for cache-preferring fill */
static float g_route_p=0;    /* ROUTE_P: if >0, choose M from cumulative router mass instead */
static float g_route_alpha=1.f; /* ROUTE_ALPHA: scale gate mass of CACHE_ROUTE substitutes before renorm (1=off) */
static int g_route_agree=0;  /* ROUTE_AGREE=1: footer overlap% + mean KL vs true top-K */
static int expert_is_resident(Model *m, int layer, int eid); /* pin∪LRU; defined near pilot */
static int g_spec=1;     /* metodo C: SPEC=0 disabilita il prefetch speculativo cross-layer */
static int g_draft=0;    /* metodo E: DRAFT=n token auto-speculati per forward via n-gram lookup
                          * (0=off). LOSSLESS: verifica = output identico al greedy. Default OFF:
                          * misurato sul run reale (2026-07-03) acceptance ~5% -> ogni draft
                          * rifiutato paga comunque i suoi expert dal disco = ~3x piu' lento.
                          * Opt-in (DRAFT=4) per testi ripetitivi dove l'acceptance e' alta. */
/* metodo F (#48): GRAMMAR=<file.gbnf> -> terza sorgente di draft, la grammatica stessa.
 * Nei workload a output vincolato (JSON/NDJSON, function calling) i byte FORZATI dalla
 * grammatica (chiavi, punteggiatura, valori enum) sono draft gratuiti ad acceptance ~1:
 * nessuna testa, nessuna lookup table, e si aggancia anche dove la testa MTP int4 non
 * parte (#8). MAI un vincolo sul sampling: solo proposte, la verifica batch-union
 * decide — grammatica sbagliata = draft rifiutati, output identico.
 * GRAMMAR_DRAFT=n (default 24) limita i token forzati per forward. */
static FILE *g_route_fp=NULL; /* ROUTE_TRACE=<path>: dump per-position top-K routing (ids:gates)
                               * per layer — offline co-activation / coupling analysis. Zero
                               * effect on computation; measurement only. */
static int g_route_call=0;
/* COUPLE=<.coli_pairs>: coupling-scored cross-layer prefetch. The routing of layer L
 * strongly constrains the routing of L+1/L+2 (measured: median co-activation lift 1.8x
 * over independence, p99 40x, and the structure TRANSFERS across workloads — it is a
 * property of the model, not the session). An offline table (tools/route_pairs.py,
 * built from ROUTE_TRACE dumps) maps (layer, expert) -> top co-activated experts of the
 * next layer(s); after FASE A routing we score candidates by summing counts over the
 * position's routed set and enqueue the top COUPLE_K non-resident ones into the SAME
 * pilot ring (worker, residency re-check, safety invariants unchanged). Unlike PILOT,
 * no router matmul is needed — prediction is a table lookup on ids the layer just
 * produced. Hints only: a wrong prediction costs bandwidth, never output. */
#define CP_M 16
static int g_couple=0, g_couple_k=8, g_couple_d=1;
static int16_t *cp_pred=NULL;    /* [(L*2+(dL-1))*E + e]*CP_M + j -> target id (-1 none) */
static float   *cp_cnt=NULL;
static long g_cp_enq=0;
/* All grammar-forced-draft state in one struct so it can become per-request
 * in the multiplexed server. Fields (same semantics as the former globals):
 * on = grammar loaded and walker alive; armed = lazy start from the first byte
 * accepted at the root (skips preambles); max = forced-span cap per forward;
 * prop/acc = proposed/accepted forced-draft counters. */
typedef struct {
    Grammar gram;
    GrState st;
    Tok *T;
    int on, armed, max;
    uint64_t prop, acc;
} GrDraft;
/* NO initializer: GrDraft is ~107 KB (Grammar's 1024 static rules + the walker), and any
 * initializer — even `={.max=24}` — moves the whole struct from .bss into .data, writing
 * 106,848 bytes of mostly zeros into every binary we ship (#527: the v1.1.0 Windows exe
 * grew a 108 KB near-zero-entropy .data blob, which is also exactly the shape an antivirus
 * ML heuristic reads as an unpacking buffer). Static storage is zero-initialized by the C
 * standard; `max` is set in grammar_setup(), which runs before any read of it. */
static GrDraft g_grd;             /* process-level instance: PROMPT mode + run_serve keep using this */
static void couple_prefetch(Model *m, int layer, const int *idx, int Ke);
static int g_looka=0;    /* LOOKA=1: misura (solo contatori, zero effetti) quanto il routing MoE
                          * e' predicibile IN ANTICIPO — la domanda che decide se un prefetch
                          * pilotato dal router puo' riempire i tempi morti del disco.
                          * [0] token precedente, stesso layer (cio' che usa gia' SPEC/PREFETCH)
                          * [1] ingresso del layer -> routing dello STESSO layer (salta l'attention)
                          * [2] post-attention del layer L -> routing di L+1 (un residuo MoE e
                          *     un'attention di anticipo: il punto dove il prefetch avrebbe
                          *     un intero giro di disco per lavorare in ombra). */
static int64_t la_hit[4], la_tot[4];  /* [0]=prev, [1]=skip-attn, [2]=PILOT, [3]=two-step */
static int la_pred[3][130][16]; static signed char la_val[3][130];
static int g_pilot=0;    /* PILOT=1: prefetch pilotato dal router (vedi pilot_prefetch) */
static int g_pilot_k=8;  /* PILOT_K=k: prefetcha solo le prime k predizioni per posizione */
static int g_disk_split=0; /* DISK_SPLIT=1: contatori che spezzano i DISK LOAD (miss LRU) in
                          * draft MTP / absorb / verify-main e in layer MTP (int8) vs main
                          * (int4), con i byte letti. Default OFF: a flag spento gli atomic
                          * non vengono MAI toccati (zero overhead), le righe extra di stats
                          * non vengono stampate. Solo misura: nessun effetto sull'output. */

#include "sample.h"
#include "kv_persist.h"
#include "telemetry.h"

/* Aligned allocator for dense QT weights/scales: under METAL, page-align + register so the
 * GPU reads them zero-copy (no upload duplicate). Plain malloc otherwise. */
/* ---- COLI_NUMA=1 (#82): interleave the expert slabs across NUMA nodes ----
 * On multi-socket hosts first-touch parks nearly the whole pin+LRU on the loader
 * thread's node (measured: node0 766MB free / node1 idle), and every far-socket
 * core then streams weights over the interconnect. Interleaving ONLY the expert
 * slabs recruits all memory controllers: +7%/-14% expert-matmul on 2 sockets,
 * +40% on a 4-socket (#82). Blanket `numactl --interleave=all` is NOT equivalent:
 * it also interleaves the CUDA pinned staging buffers and cost a 4-socket GPU host
 * 10x (#82) — hence per-region mbind here and nothing else. Raw syscall, no libnuma
 * dependency. Linux-only, silent no-op elsewhere or on single-node hosts.
 *
 * VMA discipline (#419): every mbind carries its own memory policy, so a bound
 * region cannot merge with its neighbours — measured ~2 VMAs per slab, with or
 * without MPOL_MF_MOVE. Per-slab binds on a PIN_GB=all load (19,456 experts x
 * slab+fslab) cross the default vm.max_map_count=65530 and posix_memalign dies
 * with terabytes free. So the bulk (the pinned hot-store) is bound as ONE arena
 * per layer (see pin_load), and per-slab mbind remains only for the bounded
 * allocations: dense qalloc, the LRU ecache, and GPU-tier staging. No flag:
 * every bind here lands before the pread that first-touches the pages, so
 * there is nothing to migrate. */
#ifdef __linux__
static int g_numa_nodes=0;      /* only touched under __linux__; off-Linux NUMA is a no-op */
static int g_numa_skip_bind=0;  /* raised around the GPU-prefix pin load: those slabs are
                                 * upload staging, freed right after — binding them buys
                                 * nothing and costs ~2 transient VMAs each (#419) */
#endif
static void numa_slab_bind(void *p, size_t n){
#ifdef __linux__
    if(g_numa_nodes<2 || g_numa_skip_bind || !p || !n) return;
    unsigned long mask=(1UL<<g_numa_nodes)-1;
    uintptr_t a=(uintptr_t)p & ~(uintptr_t)4095;
    size_t len=(((uintptr_t)p+n+4095) & ~(uintptr_t)4095) - a;
    syscall(SYS_mbind,a,len,3/*MPOL_INTERLEAVE*/,&mask,
            (unsigned long)(g_numa_nodes+1),0);
#else
    (void)p;(void)n;
#endif
}
static void numa_init(void){
#ifdef __linux__
    if(!getenv("COLI_NUMA")||!atoi(getenv("COLI_NUMA"))) return;
    for(int i=0;i<64;i++){ char pth[64]; snprintf(pth,sizeof(pth),"/sys/devices/system/node/node%d",i);
        struct stat st; if(stat(pth,&st)) break; g_numa_nodes=i+1; }
    if(g_numa_nodes<2){ fprintf(stderr,"[NUMA] single node: COLI_NUMA ignored\n"); return; }
    /* Probe mbind once so a constrained container degrades with a message
     * instead of silently losing the interleave. The probe page must be
     * page-aligned (mbind rejects unaligned addresses with EINVAL) and only
     * errno==EPERM disables — any other failure keeps NUMA on. */
    { void *pg=NULL;
      if(!posix_memalign(&pg,4096,4096)){
          unsigned long mask=(1UL<<g_numa_nodes)-1; errno=0;
          long rc=syscall(SYS_mbind,pg,4096,3/*MPOL_INTERLEAVE*/,&mask,
                          (unsigned long)(g_numa_nodes+1),0);
          int eperm = rc<0 && errno==EPERM;
          free(pg);
          if(eperm){
              fprintf(stderr,"[NUMA] mbind not permitted (EPERM) — COLI_NUMA disabled\n");
              g_numa_nodes=1; return;
          }
      }
    }
    fprintf(stderr,"[NUMA] expert slabs interleaved across %d nodes\n",g_numa_nodes);
#endif
}

static void *qalloc(size_t n){
#ifdef COLI_METAL
    if(g_metal_enabled){ void *p; size_t r=(n+16383)&~(size_t)16383;
        if(posix_memalign(&p,16384,r)){fprintf(stderr,"OOM qalloc\n");exit(1);}
        coli_metal_register(p,r); return p; }
#endif
    void *p=malloc(n);
    if(n>=(size_t)1<<20) numa_slab_bind(p,n);      /* resident dense weights too (#82: attention/shared stream from RAM every token) */
    return p;
}
static float *qsalloc(int O){ return (float*)qalloc((size_t)O*sizeof(float)); }
static int g_pilot_real=0;/* PILOT_REAL=1: il pilota fa LOAD VERI cross-layer dentro ecache[L+1]
                          * (non il semplice WILLNEED). Implica PILOT=1. Default OFF: hint-only. */
static int g_pilot_two=0; /* PILOT_TWO=1: two-step prefetch — before running L+1's router,
                          * approximate MoE(L) using only the shared expert (resident, no disk)
                          * and add it to the state. Trades 3 small matmuls for +2.3% recall. */
static int g_pilot_evict_guard=1;/* PILOT_EVICT_GUARD=0 -> old behavior (a speculation evicts the plain LRU).
                          * Default ON: protect a RESIDENT demand-loaded expert from a speculation only when
                          * it is genuinely WARM (>=2 accesses) AND clearly hotter than the predicted expert
                          * by tier_pick_lfru's 25%+4-freq hysteresis; otherwise the speculation may evict the
                          * plain-LRU victim as before. Cache placement only -> output byte-identical. (#441, #490) */
/* Handshake main<->pilota per il load-vero cross-layer. Invariante di sicurezza in DUE parti:
 *  1) Percorso MATMUL (moe): il pilota scrive SOLO ecache[layer] con layer > g_cur_moe_layer;
 *     il matmul in moe() legge SOLO ecache[layer]==g_cur_moe_layer, e la barriera a inizio moe()
 *     aspetta l'eventuale load in volo su QUEL layer. Quindi NESSUNO slot mezzo-caricato viene
 *     mai matmul-ato: il matmul e il pilota non toccano mai lo stesso layer contemporaneamente.
 *  2) Percorso SCAN (pilot_prefetch, anch'esso sul MAIN): la scansione di residenza gira sul
 *     layer FUTURO (lnext = layer corrente + 1), esattamente il layer che il pilota sta scrivendo
 *     -> QUI i due thread toccano davvero la stessa ecache. Percio' quella scansione prende
 *     g_pilot_mx (lo stesso lock del worker): letture e pubblicazione degli slot sono serializzate,
 *     niente torn read di ecn[]/eid. Il pilota non altera MAI il valore di un expert, solo QUALE
 *     expert e' residente: con un load andato a buon fine l'output resta byte-identico all'OFF. */
static pthread_mutex_t g_pilot_mx=PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t g_pilot_cv=PTHREAD_COND_INITIALIZER;
static _Atomic int g_cur_moe_layer=-1;   /* massimo layer moe in cui il MAIN e' entrato (per forward) */
static int g_pilot_inflight[256];        /* protected by g_pilot_mx; URING can load a layer concurrently */
static _Atomic long g_pilot_loads=0;     /* load cross-layer VERI completati (banda spesa) */
static _Atomic long g_pilot_drops=0;     /* predizioni scartate perche' il main possiede gia' il layer */
/* format from `bits`: >=16 f32, 5..8 int8, 4 int4-packed, 3 int3-g64 (group scales), <=2 int2 */
static void qt_alloc(QT *t, int O, int I, int bits){
    t->O=O; t->I=I; t->qf=NULL; t->q8=NULL; t->q4=NULL; t->s=NULL;
    if(bits>=16){ t->fmt=0; t->qf=falloc((int64_t)O*I); }
    else if(bits>=5 || g_nopack){ t->fmt=1; t->q8=qalloc((int64_t)O*I); t->s=qsalloc(O); }
    else if(bits>=4){ t->fmt=2; t->q4=qalloc((int64_t)O*((I+1)/2)); t->s=qsalloc(O); }
    else if(bits==3){ t->fmt=5; t->q4=qalloc((int64_t)O*i3_rowbytes(I));
                      t->s=(float*)qalloc((size_t)O*i3_groups(I)*sizeof(float)); }
    else { t->fmt=3; t->q4=qalloc((int64_t)O*((I+3)/4)); t->s=qsalloc(O); }
}
static void qt_fill(QT *t, const float *w, int bits){
    if(t->fmt==0) memcpy(t->qf, w, (int64_t)t->O*t->I*sizeof(float));
    else if(t->fmt==1) quantize_rows(w, t->q8, t->s, t->O, t->I, bits);
    else if(t->fmt==3) pack_int2(w, t->q4, t->s, t->O, t->I, bits);
    else if(t->fmt==5) pack_int3_g64(w, t->q4, t->s, t->O, t->I);
    else pack_int4(w, t->q4, t->s, t->O, t->I, bits);
}

static void rmsnorm(float *out, const float *x, const float *w, int D, float eps){
    double ms=0; for(int i=0;i<D;i++) ms+=(double)x[i]*x[i];
    float r=1.f/sqrtf((float)(ms/D)+eps); for(int i=0;i<D;i++) out[i]=x[i]*r*w[i];
}
/* LayerNorm classica (media+varianza, weight+bias) — usata dal k_norm dell'indexer DSA */
static void layernorm(float *v, const float *w, const float *b, int n, float eps){
    double mu=0; for(int i=0;i<n;i++) mu+=v[i]; mu/=n;
    double var=0; for(int i=0;i<n;i++){ double d=v[i]-mu; var+=d*d; } var/=n;
    float r=1.f/sqrtf((float)var+eps);
    for(int i=0;i<n;i++) v[i]=((float)(v[i]-mu))*r*w[i]+b[i];
}
static void softmax(float *x,int n){ float m=-1e30f; for(int i=0;i<n;i++) if(x[i]>m)m=x[i];
    float s=0; for(int i=0;i<n;i++){x[i]=expf(x[i]-m);s+=x[i];} for(int i=0;i<n;i++) x[i]/=s; }
static inline float sigmoidf(float x){ return 1.f/(1.f+expf(-x)); }
static inline float siluf(float x){ return x/(1.f+expf(-x)); }

/* RoPE interleaved su un vettore di dimensione qk_rope a posizione pos */
static void rope_interleave(float *v, int pos, const Cfg *c){
    int half = c->qk_rope/2;
    /* Validate against the fixed buffers (in[256], cache cs/sn[128] -> qk_rope<=256).
     * Abort cleanly instead of smashing the stack. (GLM-5.2 qk_rope=64.) (#183) */
    if(c->qk_rope > 256){ fprintf(stderr,"qk_rope=%d exceeds rope_interleave buffer (256)\n",c->qk_rope); exit(1); }
    typedef struct { int pos,qk,valid; float theta,cs[128],sn[128]; } RopeCache;   /* (#80) */
    static _Thread_local RopeCache cache;
    float in[256]; memcpy(in,v,c->qk_rope*sizeof(float));
    if(!cache.valid||cache.pos!=pos||cache.qk!=c->qk_rope||cache.theta!=c->theta){
        for(int j=0;j<half;j++){
            float inv=powf(c->theta,-2.0f*j/c->qk_rope),ang=pos*inv;
            cache.cs[j]=cosf(ang); cache.sn[j]=sinf(ang);
        }
        cache.pos=pos; cache.qk=c->qk_rope; cache.theta=c->theta; cache.valid=1;
    }
    for(int j=0;j<half;j++){
        float cs=cache.cs[j],sn=cache.sn[j];
        float a=in[2*j], b=in[2*j+1];
        v[j]      = a*cs - b*sn;
        v[half+j] = b*cs + a*sn;
    }
}

/* ---------- config ---------- */
/* SEC-9: bounded slurp for untrusted config/oracle JSON. config.json arrives from
 * unverified mirrors (see qt_check_fmt threat model); an unbounded ftell->malloc
 * gave a hostile file a load-time OOM or, on malloc failure, a NULL deref via
 * b[got]=0. Cap the size, NULL-check the alloc, require a full read. Returns a
 * malloc'd NUL-terminated buffer, or NULL on any failure. Mirrors tok.h tk_read_file. */
#define CFG_MAX_BYTES (256ll<<20)   /* config/oracle JSON is KB-MB in practice */
static char* cfg_slurp(const char *path){
    FILE *f=fopen(path,"rb"); if(!f) return NULL;
    fseek(f,0,SEEK_END); long n=ftell(f); fseek(f,0,SEEK_SET);
    if(n<0 || (long long)n>CFG_MAX_BYTES){ fclose(f); return NULL; }
    char *b=malloc((size_t)n+1); if(!b){ fclose(f); return NULL; }
    size_t got=fread(b,1,(size_t)n,f); fclose(f);
    if((long)got!=n){ free(b); return NULL; }
    b[got]=0; return b;
}
static jval* cfg_root(const char *snap, char **arena){
    char p[2048]; snprintf(p,sizeof(p),"%s/config.json",snap);
    FILE *f=fopen(p,"rb"); if(!f){perror(p);exit(1);}
    fseek(f,0,SEEK_END); long n=ftell(f); fseek(f,0,SEEK_SET);
    /* SEC: config.json arriva dalla dir modello non fidata. Limita la dimensione
     * (un file ostile enorme = OOM al load) e controlla la malloc: senza il NULL
     * check, b[got]=0 su malloc fallita era un NULL-deref. */
    if(n<0 || n>(256L<<20)){ fprintf(stderr,"%s: size %ld out of range (0..256 MB)\n",p,n); exit(1); }
    char *b=malloc((size_t)n+1); if(!b){ fprintf(stderr,"OOM reading %s (%ld bytes)\n",p,n); exit(1); }
    size_t got=fread(b,1,(size_t)n,f); b[got]=0; fclose(f);
    if((long)got!=n) fprintf(stderr,"warning: short read on %s (%ld of %ld)\n",p,(long)got,n);
    return json_parse(b,arena);
}
static int gi(jval*r,const char*k){ jval*v=json_get(r,k); return v?(int)v->num:0; }
static void load_cfg(Cfg *c, const char *snap){
    char *ar=NULL; jval *r=cfg_root(snap,&ar);
    c->hidden=gi(r,"hidden_size"); c->n_layers=gi(r,"num_hidden_layers");
    c->n_heads=gi(r,"num_attention_heads"); c->n_experts=gi(r,"n_routed_experts");
    c->topk=gi(r,"num_experts_per_tok"); c->moe_inter=gi(r,"moe_intermediate_size");
    c->dense_inter=gi(r,"intermediate_size"); c->first_dense=gi(r,"first_k_dense_replace");
    c->q_lora=gi(r,"q_lora_rank"); c->kv_lora=gi(r,"kv_lora_rank");
    c->qk_nope=gi(r,"qk_nope_head_dim"); c->qk_rope=gi(r,"qk_rope_head_dim");
    c->v_head=gi(r,"v_head_dim"); c->n_shared=gi(r,"n_shared_experts"); c->vocab=gi(r,"vocab_size");
    c->n_group=gi(r,"n_group"); c->topk_group=gi(r,"topk_group");
    jval *nt=json_get(r,"norm_topk_prob"); c->norm_topk=(nt&&nt->t==J_BOOL)?nt->boolean:0;
    jval *ep=json_get(r,"rms_norm_eps"); c->eps=ep?(float)ep->num:1e-5f;
    jval *rs=json_get(r,"routed_scaling_factor"); c->routed_scale=rs?(float)rs->num:1.f;
    jval *rp=json_get(r,"rope_parameters"); jval *th=rp?json_get(rp,"rope_theta"):NULL;
    c->theta = th?(float)th->num:10000.f;
    /* token di stop: GLM-5.2 ne ha TRE (endoftext, user, observation). Fermarsi solo sul
     * primo = generare spazzatura invisibile dopo la fine del turno (5-10x token sprecati). */
    c->n_stop=0;
    jval *eo=json_get(r,"eos_token_id");
    if(eo){ if(eo->t==J_NUM) c->stop_ids[c->n_stop++]=(int)eo->num;
            else if(eo->t==J_ARR) for(int i=0;i<eo->len && c->n_stop<8;i++)
                c->stop_ids[c->n_stop++]=(int)eo->kids[i]->num; }
    /* generation_config.json e' il file AUTOREVOLE per la generazione secondo HuggingFace:
     * config.json ne porta spesso una copia legacy o parziale. Un tool di conversione che
     * rigenera un config.json ridotto lascia il motore fermo su MENO stop del dovuto, e i
     * token di controllo che restano finiscono stampati in chat come testo (woolcoxm, #298:
     * "the stop token being printed to chat", verificato sui token id). Unione dei due:
     * uno stop in piu' non fa danno, uno in meno si' -- e chi converte i pesi non siamo noi.
     * EN: generation_config.json is HF's authority for generation; config.json often carries
     * a partial legacy copy. Union both -- an extra stop is harmless, a missing one is not. */
    { char gp[2100]; snprintf(gp,sizeof(gp),"%s/generation_config.json",snap);
      FILE *gf=fopen(gp,"rb");                  /* assente = nessun problema: e' opzionale */
      if(gf){
        fseek(gf,0,SEEK_END); long gn=ftell(gf); fseek(gf,0,SEEK_SET);
        char *gb = (gn>0 && gn<=(256L<<20)) ? malloc((size_t)gn+1) : NULL;   /* SEC: cap + NULL check */
        if(gb){
            size_t gg=fread(gb,1,(size_t)gn,gf); gb[gg]=0;
            char *ga=NULL; jval *gr=json_parse(gb,&ga);
            jval *ge=gr?json_get(gr,"eos_token_id"):NULL;
            if(ge){
                int add[8], na=0;
                if(ge->t==J_NUM) add[na++]=(int)ge->num;
                else if(ge->t==J_ARR) for(int i=0;i<ge->len && na<8;i++) add[na++]=(int)ge->kids[i]->num;
                for(int i=0;i<na && c->n_stop<8;i++){
                    int dup=0; for(int j=0;j<c->n_stop;j++) if(c->stop_ids[j]==add[i]) dup=1;
                    if(!dup) c->stop_ids[c->n_stop++]=add[i];
                }
            }
            free(ga); free(gb);
        }
        fclose(gf);
      } }
    /* DSA lightning indexer: parametri + tipo per-layer (lista esplicita o formula freq/offset) */
    c->index_topk=gi(r,"index_topk"); c->index_nh=gi(r,"index_n_heads"); c->index_hd=gi(r,"index_head_dim");
    { jval *it=json_get(r,"indexer_types");
      int freq=gi(r,"index_topk_freq"); if(freq<1) freq=1;
      jval *of=json_get(r,"index_skip_topk_offset"); int off=of?(int)of->num:2;
      for(int i=0;i<c->n_layers && i<128;i++){
          if(it && it->t==J_ARR && i<it->len && it->kids[i]->str)
              c->idx_type[i] = !strcmp(it->kids[i]->str,"full");
          else { int v=i-off+1; if(v<0) v=0; c->idx_type[i] = (v%freq)==0; }
      } }
    c->qk_head=c->qk_nope+c->qk_rope;
    c->attn_scale = 1.f / sqrtf((float)c->qk_head);
    if(c->n_group!=1){ fprintf(stderr,"this engine requires n_group=1 (GLM-5.2)\n"); exit(1); }
    /* VALIDAZIONE (report PR #25): il config.json arriva da mirror non fidati — dimensioni
     * ostili non devono superare questo punto. Un solo choke point protegge ogni alloc a valle. */
    #define CKR(name,v,lo,hi) if((v)<(lo)||(v)>(hi)){ \
        fprintf(stderr,"config: %s=%d is outside [%d,%d]\n",name,(int)(v),(int)(lo),(int)(hi)); exit(1); }
    CKR("hidden_size",c->hidden,1,1<<20)         CKR("num_hidden_layers",c->n_layers,1,128)
    CKR("num_attention_heads",c->n_heads,1,1024) CKR("n_routed_experts",c->n_experts,1,4096)
    CKR("num_experts_per_tok",c->topk,1,64)      CKR("moe_intermediate_size",c->moe_inter,1,1<<20)
    CKR("intermediate_size",c->dense_inter,1,1<<24) CKR("first_k_dense_replace",c->first_dense,0,c->n_layers)
    CKR("q_lora_rank",c->q_lora,0,1<<20)         CKR("kv_lora_rank",c->kv_lora,1,1<<20)
    CKR("qk_nope_head_dim",c->qk_nope,1,1<<16)   CKR("qk_rope_head_dim",c->qk_rope,1,1<<16)
    CKR("v_head_dim",c->v_head,1,1<<16)          CKR("n_shared_experts",c->n_shared,0,64)
    CKR("vocab_size",c->vocab,1,1<<24)           CKR("index_topk",c->index_topk,0,1<<20)
    CKR("index_n_heads",c->index_nh,0,1024)      CKR("index_head_dim",c->index_hd,0,1<<16)
    #undef CKR
    free(ar);
}

/* Derive the fmt=4 group size from the scale-array byte count. A grouped-int4
 * tensor stores ceil(I/gs) f32 scales per output row, so:
 *     ns_bytes == O * ceil(I/gs) * 4   =>   gs == I * 4 / (ns_bytes/O - ... )
 * We probe candidate group sizes (must be a multiple of 16, the AVX2 vector
 * width the grouped kernel requires) from finest to coarsest and return the
 * first whose predicted scale-array size matches ns_bytes. Returns 0 if no
 * candidate fits (then it's plain per-row int4, fmt=2, not grouped).
 * Data-driven: g64/g128/g256 all just work; adding a size means listing it. */
static int detect_group_size(int O, int I, int64_t ns){
    if(O<=0 || ns<=(int64_t)O*4 || I<=0) return 0;   /* not grouped */
    /* ns/O is the per-row scale bytes; groups = (ns/O)/4; gs = ceil(I/groups).
     * Probe from small gs (finest granularity) upward so the most granular
     * match wins — that's what we want, since finer groups are unambiguous. */
    static const int cands[]={16,32,48,64,96,128,192,256};
    for(int ci=0; ci<(int)(sizeof(cands)/sizeof(cands[0])); ci++){
        int gs=cands[ci];
        if(gs>I) break;
        int ng=(I+gs-1)/gs;
        if(ns==(int64_t)O*ng*4) return gs;
    }
    return 0;
}

/* SEC: risolve e VALIDA il formato quantizzato di un tensore [O,I] letto da un
 * container non fidato (mirror). L'inferenza precedente (`?1:?2:3`) cadeva su
 * int2 per QUALSIASI conteggio byte non riconosciuto: un peso troppo corto
 * diventava un int2 valido e il matmul leggeva oltre il buffer (O*I nibble a
 * 4/byte). Qui i byte del peso devono corrispondere a un layout noto e i byte
 * della scala alla cardinalita' attesa (O per-row, O*ng per-gruppo) — altrimenti
 * si termina invece di sforare. Ritorna fmt (1/2/3/4/5) e scrive *gs. */
static int qt_resolve_fmt(const char *name, int O, int I, int64_t nb, int64_t ns, int *gs){
    int64_t exp_i8=(int64_t)O*I, exp_i4=(int64_t)O*((I+1)/2), exp_i2=(int64_t)O*((I+3)/4);
    int64_t exp_i3=(int64_t)O*i3_rowbytes(I);   /* int3-g64 (fmt=5): 24B per 64-input group */
    /* fmt=6 (E8/IQ3, #452): scales live inside the 98B super-blocks, so the .qs
     * convention is kept with a single-float tag — ns==4 is the discriminator
     * (every other format carries at least O floats of real scales). */
    if(ns==4 && nb==(int64_t)O*e8_rowbytes(I)){ *gs=0; return 6; }
    /* Row formats take precedence: for tiny I the int3-g64 byte count can coincide with
     * a row layout (e.g. [O,48]: ceil(48/2)=24=1*24). For real tensor shapes the counts
     * are distinct, and the weight bytes — not the scale size — are the int3 tag, because
     * int3-g64 and grouped-int4-at-gs=64 carry the SAME scale cardinality O*ceil(I/64). */
    int fmt = (nb==exp_i8)?1 : (nb==exp_i4)?2 : (nb==exp_i2)?3 : (nb==exp_i3)?5 : 0;
    if(!fmt){
        fprintf(stderr,"%s: quantized weight is %lld bytes — no int8/int4/int2/int3-g64 layout for [%d,%d], refusing (untrusted container)\n",
                name,(long long)nb,O,I); exit(1); }
    *gs=0;
    if(fmt==2){ int g=detect_group_size(O,I,ns); if(g>0){ fmt=4; *gs=g; } }
    int64_t exp_scale = (fmt==4)? (int64_t)O*((I+*gs-1)/(*gs))
                      : (fmt==5)? (int64_t)O*i3_groups(I) : (int64_t)O;   /* in FLOAT */
    if(ns != exp_scale*4){
        fprintf(stderr,"%s: scale array is %lld bytes — expected %lld for [%d,%d] fmt=%d, refusing (untrusted container)\n",
                name,(long long)ns,(long long)(exp_scale*4),O,I,fmt); exit(1); }
    return fmt;
}
/* costruisce un QT [O,I] dal disco in `t` (buffer riusabili tra chiamate).
 *  - se esiste `name.qs`: pesi GIA' quantizzati nel container (U8 qdata + F32 scala) -> letti diretti
 *  - altrimenti: tensore pieno (f32/bf16) -> quantizzato a runtime a `bits` (oracolo tiny / pesi pieni)
 * drop=1 -> fadvise DONTNEED (streaming expert). */
static void qt_from_disk(Model *m, const char *name, int O, int I, int bits, int drop, QT *t){
    char sn[300]; snprintf(sn,sizeof(sn),"%s.qs",name);
    if(st_has(&m->S,sn)){
        int64_t nb=st_nbytes(&m->S,name);
        int64_t ns=st_nbytes(&m->S,sn);   /* scale bytes (F32) */
        /* fmt=4 int4-grouped: byte int4 ma scala > O*4 — gs deriva dalla scala.
         * qt_resolve_fmt valida entrambi i conteggi contro [O,I] e termina se
         * non fidati (SEC). */
        int gs=0;
        int fmt = qt_resolve_fmt(name,O,I,nb,ns,&gs);
        if(fmt==1){ if(t->fmt!=1||!t->q8){ t->fmt=1; t->O=O; t->I=I; t->gs=0; t->q8=qalloc(nb); t->s=qsalloc(O); } st_read_raw(&m->S,name,t->q8,drop); }
        else if(fmt==4){ int ng=(I+gs-1)/gs;
            if(t->fmt!=4||!t->q4){ t->fmt=4; t->O=O; t->I=I; t->gs=gs; t->q4=qalloc(nb); t->s=falloc((int64_t)O*ng); }
            st_read_raw(&m->S,name,t->q4,drop); }
        else if(fmt==5){ int64_t ng=i3_groups(I);   /* int3-g64: 24B/group weights + O*ng group scales */
            if(t->fmt!=5||!t->q4){ t->fmt=5; t->O=O; t->I=I; t->gs=0; t->q4=qalloc(nb); t->s=falloc((int64_t)O*ng); }
            st_read_raw(&m->S,name,t->q4,drop); }
        else if(fmt==6){   /* E8/IQ3: everything in-block, .qs is the 4-byte tag */
            if(t->fmt!=6||!t->q4){ t->fmt=6; t->O=O; t->I=I; t->gs=0; t->q4=qalloc(nb); t->s=qsalloc(1); }
            st_read_raw(&m->S,name,t->q4,drop); }
        else      { if(t->fmt!=fmt||!t->q4){ t->fmt=fmt; t->O=O; t->I=I; t->gs=0; t->q4=qalloc(nb); t->s=qsalloc(O); } st_read_raw(&m->S,name,t->q4,drop); }
        /* cap MUST match the scale cardinality qt_resolve_fmt already validated and
         * the falloc above actually reserved, per format: grouped-int4 (fmt=4) keeps
         * O*ceil(I/gs) scales and int3-g64 (fmt=5) keeps O*i3_groups(I); everything
         * else is per-row O. Using the per-row bound for a grouped format would
         * reject a legitimate container (fmt=5 regressed exactly that way). */
        st_read_f32_cap(&m->S,sn,t->s,
                        fmt==4 ? (int64_t)O*((I+gs-1)/gs) :
                        fmt==5 ? (int64_t)O*i3_groups(I)  :
                        fmt==6 ? (int64_t)1               : (int64_t)O, drop);
    } else {
        if(!t->qf && !t->q8 && !t->q4) qt_alloc(t,O,I,bits);
        if(t->fmt==0) st_read_f32_cap(&m->S,name,t->qf,(int64_t)O*I,drop);
        else { float *tmp=falloc((int64_t)O*I); st_read_f32_cap(&m->S,name,tmp,(int64_t)O*I,drop); qt_fill(t,tmp,bits); free(tmp); }
    }
}
static QT qt_load(Model *m, const char *name, int O, int I, int bits){
    QT t; memset(&t,0,sizeof(t)); qt_from_disk(m,name,O,I,bits,0,&t);
#ifdef COLI_CUDA
    if(g_cuda_enabled&&g_cuda_dense){
        t.cuda_eligible=1;
        int slot=g_cuda_rr++%g_cuda_ndev; t.cuda_device=g_cuda_devices[slot];
        g_cuda_dense_projected[slot]+=qt_bytes(&t);
    }
#endif
    return t;
}
static float *ld(Model *m, const char *name){   /* tensore 1D f32 residente (norme/bias) */
    int64_t n=st_numel(&m->S,name); if(n<0) st_die_missing(&m->S,name);
    float *p=(float*)qalloc((size_t)n*sizeof(float));   /* registrato per la GPU sotto METAL */
    st_read_f32(&m->S,name,p,0); return p;
}
#ifdef COLI_CUDA
static void qt_cuda_colocate(QT *dst,const QT *src){
    if(!g_cuda_enabled||!g_cuda_dense||!dst->cuda_eligible||!src->cuda_eligible||
       dst->cuda_device==src->cuda_device)return;
    int old=-1,now=-1;for(int i=0;i<g_cuda_ndev;i++){
        if(g_cuda_devices[i]==dst->cuda_device)old=i;if(g_cuda_devices[i]==src->cuda_device)now=i;
    }
    if(old>=0)g_cuda_dense_projected[old]-=qt_bytes(dst);
    if(now>=0)g_cuda_dense_projected[now]+=qt_bytes(dst);
    dst->cuda_device=src->cuda_device;
}
static void layer_cuda_shard_kvb(Layer *l,int H,int Q,int V){
    if(!g_cuda_enabled||!g_cuda_dense||g_cuda_ndev<2||l->kv_b.fmt==0)return;
    int rb=l->kv_b.fmt==1?l->kv_b.I:
           (l->kv_b.fmt==2||l->kv_b.fmt==4)?(l->kv_b.I+1)/2:(l->kv_b.I+3)/4;
    const uint8_t *weights=l->kv_b.fmt==1?(const uint8_t*)l->kv_b.q8:l->kv_b.q4;
    for(int d=0,h0=0;d<g_cuda_ndev;d++){
        int hn=H/g_cuda_ndev+(d<H%g_cuda_ndev),rows=hn*(Q+V);
        const void *part=weights+(int64_t)h0*(Q+V)*rb;
        const float *scale=l->kv_b.s+(int64_t)h0*(Q+V)*(l->kv_b.gs>0?(l->kv_b.I+l->kv_b.gs-1)/l->kv_b.gs:1);
        if(!coli_cuda_tensor_upload_g(&l->kv_b_shard[d],part,scale,l->kv_b.fmt,l->kv_b.I,rows,g_cuda_devices[d],l->kv_b.gs))return;
        l->shard_h0[d]=h0;l->shard_hn[d]=hn;l->n_kv_b_shard++;h0+=hn;
    }
    int old=-1;for(int i=0;i<g_cuda_ndev;i++)if(g_cuda_devices[i]==l->kv_b.cuda_device)old=i;
    if(old>=0)g_cuda_dense_projected[old]-=qt_bytes(&l->kv_b);
    l->kv_b.cuda_eligible=0;
}
#endif

static void model_init(Model *m, const char *snap, int cap, int ebits, int dbits){
    memset(m,0,sizeof(*m)); m->ebits=ebits; m->dbits=dbits;
    load_cfg(&m->c,snap);
    { const char *xd=getenv("COLI_MODEL_DIRS");        /* SPLIT: model shards spread across N drives */
      st_init_multi(&m->S,snap,(xd&&*xd)?xd:NULL); }
    Cfg *c=&m->c; char nm[256]; int H=c->n_heads, D=c->hidden;
    /* embed e lm_head sono il confine I/O: tenerli ad alta precisione (come i quant dynamic
     * reali). A bf16 ~1.9GB su GLM reale: trascurabile. dbits>=8 -> qui f32; piu' basso -> dbits. */
    int io_bits = dbits>=8 ? 16 : dbits;
    m->embed   = qt_load(m,"model.embed_tokens.weight", c->vocab, D, io_bits);
    m->lm_head = qt_load(m,"lm_head.weight", c->vocab, D, io_bits);
    m->final_norm = ld(m,"model.norm.weight");
    m->L=calloc(c->n_layers,sizeof(Layer));
    int NR=c->n_layers+1;                        /* +1: riga del layer MTP */
    m->ecap=cap; m->ecache=calloc(NR,sizeof(ESlot*)); m->ecn=calloc(NR,sizeof(int));
    m->kv_dev_L=calloc(NR,sizeof(float*)); m->kv_dev_R=calloc(NR,sizeof(float*));
    m->kv_dev_valid=calloc(NR,sizeof(int));
    m->eroute=calloc(NR,sizeof(int*)); m->enr=calloc(NR,sizeof(int));
    m->pin=calloc(NR,sizeof(ESlot*)); m->npin=calloc(NR,sizeof(int));
    m->eusage=calloc(NR,sizeof(uint32_t*)); m->eheat=calloc(NR,sizeof(uint32_t*));
    m->elast=calloc(NR,sizeof(uint32_t*));
    m->elast_dc=calloc(NR,sizeof(uint32_t*)); m->elast_pre=calloc(NR,sizeof(uint32_t*));
    m->kv=calloc(1,sizeof(KVState));
    m->kv_start=m->kv->kv_start=calloc(NR,sizeof(int));
    for(int i=0;i<c->n_layers;i++){
        Layer *l=&m->L[i];
        #define P(s) (snprintf(nm,sizeof(nm),"model.layers.%d." s,i),nm)
        l->in_ln=ld(m,P("input_layernorm.weight"));
        l->post_ln=ld(m,P("post_attention_layernorm.weight"));
        l->q_a   = qt_load(m,P("self_attn.q_a_proj.weight"), c->q_lora, D, dbits);
        l->q_a_ln= ld(m,P("self_attn.q_a_layernorm.weight"));
        l->q_b   = qt_load(m,P("self_attn.q_b_proj.weight"), H*c->qk_head, c->q_lora, dbits);
        l->kv_a  = qt_load(m,P("self_attn.kv_a_proj_with_mqa.weight"), c->kv_lora+c->qk_rope, D, dbits);
        l->kv_a_ln= ld(m,P("self_attn.kv_a_layernorm.weight"));
        l->kv_b  = qt_load(m,P("self_attn.kv_b_proj.weight"), H*(c->qk_nope+c->v_head), c->kv_lora, dbits);
        l->o     = qt_load(m,P("self_attn.o_proj.weight"), D, H*c->v_head, dbits);
#ifdef COLI_CUDA
        qt_cuda_colocate(&l->o,&l->kv_b);
        qt_cuda_colocate(&l->q_a,&l->kv_b);   /* PIPE: intera catena attention sulla */
        qt_cuda_colocate(&l->q_b,&l->kv_b);   /* stessa scheda / whole attention chain */
        qt_cuda_colocate(&l->kv_a,&l->kv_b);  /* on the layer home device */
        if(getenv("COLI_CUDA_ATTN_SHARD")&&atoi(getenv("COLI_CUDA_ATTN_SHARD")))
            layer_cuda_shard_kvb(l,H,c->qk_nope,c->v_head);
#endif
        l->sparse = (i >= c->first_dense);
        if(!l->sparse){
            l->gate_proj = qt_load(m,P("mlp.gate_proj.weight"), c->dense_inter, D, dbits);
            l->up_proj   = qt_load(m,P("mlp.up_proj.weight"),   c->dense_inter, D, dbits);
            l->down_proj = qt_load(m,P("mlp.down_proj.weight"), D, c->dense_inter, dbits);
        } else {
            l->router=ld(m,P("mlp.gate.weight"));
            l->router_bias=ld(m,P("mlp.gate.e_score_correction_bias"));
            int sI=c->moe_inter*c->n_shared;
            l->sh_gate = qt_load(m,P("mlp.shared_experts.gate_proj.weight"), sI, D, dbits);
            l->sh_up   = qt_load(m,P("mlp.shared_experts.up_proj.weight"),   sI, D, dbits);
            l->sh_down = qt_load(m,P("mlp.shared_experts.down_proj.weight"), D, sI, dbits);
#ifdef COLI_CUDA
            qt_cuda_colocate(&l->sh_gate,&l->kv_b);  /* PIPE2: shared chain on the layer home device */
            qt_cuda_colocate(&l->sh_up,&l->sh_gate);
            qt_cuda_colocate(&l->sh_down,&l->sh_gate);
#endif
            m->ecache[i]=calloc(cap,sizeof(ESlot));
            m->eroute[i]=calloc(c->topk,sizeof(int));      /* metodo C: ultimo routing del layer */
            m->eusage[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->eheat[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->elast[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->elast_dc[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->elast_pre[i]=calloc(c->n_experts,sizeof(uint32_t));
        }
        #undef P
    }
    /* testa MTP (layer n_layers): presente solo se convertita con --mtp */
    {
        /* MTP attiva SOLO se il set e' COMPLETO (i tensori vivono su 3 shard: durante la
         * conversione parziale ne esiste solo una parte). MTP=0 la disabilita comunque. */
        const char *req[]={"eh_proj.weight","enorm.weight","hnorm.weight","shared_head.norm.weight",
            "input_layernorm.weight","post_attention_layernorm.weight",
            "self_attn.q_a_proj.weight","self_attn.q_b_proj.weight","self_attn.kv_a_proj_with_mqa.weight",
            "self_attn.kv_b_proj.weight","self_attn.o_proj.weight","mlp.gate.weight",
            "mlp.shared_experts.gate_proj.weight","mlp.shared_experts.down_proj.weight",
            "mlp.experts.0.gate_proj.weight"};
        char mn[256]; m->has_mtp=1;
        for(unsigned q=0;q<sizeof(req)/sizeof(req[0]);q++){
            snprintf(mn,sizeof(mn),"model.layers.%d.%s",c->n_layers,req[q]);
            if(!st_has(&m->S,mn)){ m->has_mtp=0; break; }
        }
        /* probe the LAST expert by index, not a fixed 255: REAP-pruned
         * checkpoints have n_routed_experts < 256 and the MTP set stays complete,
         * so a hardcoded expert.255 would spuriously report has_mtp=0 on them. */
        snprintf(mn,sizeof(mn),"model.layers.%d.mlp.experts.%d.down_proj.weight",c->n_layers,c->n_experts-1);
        if(!st_has(&m->S,mn)) m->has_mtp=0;
        if(getenv("MTP") && atoi(getenv("MTP"))==0) m->has_mtp=0;
        if(m->has_mtp){
            int i=c->n_layers; Layer *l=&m->mtpL;
            #define PM(s) (snprintf(nm,sizeof(nm),"model.layers.%d." s,i),nm)
            l->in_ln=ld(m,PM("input_layernorm.weight"));
            l->post_ln=ld(m,PM("post_attention_layernorm.weight"));
            l->q_a   = qt_load(m,PM("self_attn.q_a_proj.weight"), c->q_lora, D, dbits);
            l->q_a_ln= ld(m,PM("self_attn.q_a_layernorm.weight"));
            l->q_b   = qt_load(m,PM("self_attn.q_b_proj.weight"), H*c->qk_head, c->q_lora, dbits);
            l->kv_a  = qt_load(m,PM("self_attn.kv_a_proj_with_mqa.weight"), c->kv_lora+c->qk_rope, D, dbits);
            l->kv_a_ln= ld(m,PM("self_attn.kv_a_layernorm.weight"));
            l->kv_b  = qt_load(m,PM("self_attn.kv_b_proj.weight"), H*(c->qk_nope+c->v_head), c->kv_lora, dbits);
            l->o     = qt_load(m,PM("self_attn.o_proj.weight"), D, H*c->v_head, dbits);
            l->sparse=1;
            l->router=ld(m,PM("mlp.gate.weight"));
            l->router_bias=ld(m,PM("mlp.gate.e_score_correction_bias"));
            int sI=c->moe_inter*c->n_shared;
            l->sh_gate = qt_load(m,PM("mlp.shared_experts.gate_proj.weight"), sI, D, dbits);
            l->sh_up   = qt_load(m,PM("mlp.shared_experts.up_proj.weight"),   sI, D, dbits);
            l->sh_down = qt_load(m,PM("mlp.shared_experts.down_proj.weight"), D, sI, dbits);
            m->eh_proj = qt_load(m,PM("eh_proj.weight"), D, 2*D, dbits);
            m->enorm=ld(m,PM("enorm.weight")); m->hnorm=ld(m,PM("hnorm.weight"));
            m->mtp_norm=ld(m,PM("shared_head.norm.weight"));
            m->ecache[i]=calloc(cap,sizeof(ESlot));
            m->eroute[i]=calloc(c->topk,sizeof(int));
            m->eusage[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->eheat[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->elast[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->elast_dc[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->elast_pre[i]=calloc(c->n_experts,sizeof(uint32_t));
            m->kv_start[i]=-1;                    /* KV MTP: parte dalla prima posizione di decode */
            #undef PM
        }
    }
    /* DSA lightning indexer: attivo SOLO se i pesi (conversione --indexer) ci sono per
     * TUTTI i layer full. Auto-rilevamento come per MTP: niente flag, niente passi extra. */
    {
        m->has_dsa = (c->index_topk>0 && c->index_nh>0 && c->index_hd>0 && c->index_hd<=256);
        char inm[300];
        for(int i=0;i<c->n_layers && m->has_dsa;i++){
            if(!c->idx_type[i]) continue;
            snprintf(inm,sizeof(inm),"model.layers.%d.self_attn.indexer.wq_b.weight",i);
            if(!st_has(&m->S,inm)) m->has_dsa=0;
        }
        if(getenv("DSA") && atoi(getenv("DSA"))==0) m->has_dsa=0;
        if(m->has_dsa){
            m->ix_wq=calloc(c->n_layers,sizeof(QT)); m->ix_wk=calloc(c->n_layers,sizeof(QT));
            m->ix_wp=calloc(c->n_layers,sizeof(QT));
            m->ix_knw=calloc(c->n_layers,sizeof(float*)); m->ix_knb=calloc(c->n_layers,sizeof(float*));
            for(int i=0;i<c->n_layers;i++){
                if(!c->idx_type[i]) continue;
                #define PI(s) (snprintf(nm,sizeof(nm),"model.layers.%d.self_attn.indexer." s,i),nm)
                m->ix_wq[i]=qt_load(m,PI("wq_b.weight"), c->index_nh*c->index_hd, c->q_lora, dbits);
                m->ix_wk[i]=qt_load(m,PI("wk.weight"), c->index_hd, D, dbits);
                m->ix_wp[i]=qt_load(m,PI("weights_proj.weight"), c->index_nh, D, dbits);
                m->ix_knw[i]=ld(m,PI("k_norm.weight")); m->ix_knb[i]=ld(m,PI("k_norm.bias"));
                #undef PI
            }
            fprintf(stderr,"[DSA] indexer active: top-%d sparse attention beyond %d context tokens\n",
                c->index_topk, c->index_topk);
        }
    }
    m->hlast=falloc(D); m->h_all=falloc((int64_t)512*D);

    /* byte della parte DENSA residente (embed+lm_head+attn+mlp densa+shared+norme) */
    int64_t rb=qt_bytes(&m->embed)+qt_bytes(&m->lm_head);
    for(int i=0;i<c->n_layers;i++){ Layer *l=&m->L[i];
        rb+=qt_bytes(&l->q_a)+qt_bytes(&l->q_b)+qt_bytes(&l->kv_a)+qt_bytes(&l->kv_b)+qt_bytes(&l->o);
        if(!l->sparse) rb+=qt_bytes(&l->gate_proj)+qt_bytes(&l->up_proj)+qt_bytes(&l->down_proj);
        else rb+=qt_bytes(&l->sh_gate)+qt_bytes(&l->sh_up)+qt_bytes(&l->sh_down);
    }
    if(m->has_mtp){ Layer *l=&m->mtpL;
        rb+=qt_bytes(&l->q_a)+qt_bytes(&l->q_b)+qt_bytes(&l->kv_a)+qt_bytes(&l->kv_b)+qt_bytes(&l->o);
        rb+=qt_bytes(&l->sh_gate)+qt_bytes(&l->sh_up)+qt_bytes(&l->sh_down)+qt_bytes(&m->eh_proj);
    }
    if(m->has_dsa) for(int i=0;i<c->n_layers;i++) if(c->idx_type[i])
        rb+=qt_bytes(&m->ix_wq[i])+qt_bytes(&m->ix_wk[i])+qt_bytes(&m->ix_wp[i]);
    m->resident_bytes=rb;
}

/* embed: dequantizza la riga del token (scala per-riga) in x[hidden] */
static void embed_row(Model *m, int tok, float *x){
    int D=m->c.hidden; QT *e=&m->embed;
    if(tok<0 || tok>=e->O){ memset(x,0,(size_t)D*sizeof(float)); return; }   /* #SEC-5: out-of-range token id -> zero row, never OOB */
    if(e->fmt==0){ memcpy(x, e->qf+(int64_t)tok*D, D*sizeof(float)); return; }
    if(e->fmt==4){ /* grouped int4: per-group scale (embed/lm_head at io_bits, usually fmt 0/1) */
        const uint8_t *q=e->q4+(int64_t)tok*((D+1)/2); int gs=e->gs,ng=(D+gs-1)/gs;
        const float *scl=e->s+(int64_t)tok*ng;
        for(int g=0;g*gs<D;g++){ int base=g*gs,glen=gs; if(base+glen>D)glen=D-base; float s=scl[g];
            for(int i=base;i+1<base+glen;i+=2){ uint8_t byte=q[i>>1]; x[i]=(float)((int)(byte&0xF)-8)*s;
                x[i+1]=(float)((int)(byte>>4)-8)*s; }
            if(glen&1){ uint8_t byte=q[(base+glen-1)>>1]; x[base+glen-1]=(float)((int)(byte&0xF)-8)*s; } }
        return; }
    if(e->fmt==1){ const int8_t *q=e->q8+(int64_t)tok*D; float s=e->s[tok];
        for(int i=0;i<D;i++) x[i]=(float)q[i]*s; return; }
    if(e->fmt==2){ const uint8_t *q=e->q4+(int64_t)tok*((D+1)/2); float s=e->s[tok];   /* int4 */
        for(int i=0;i<D;i+=2){ uint8_t byte=q[i>>1]; x[i]=(float)((int)(byte&0xF)-8)*s;
            if(i+1<D) x[i+1]=(float)((int)(byte>>4)-8)*s; }
        return; }
    if(e->fmt==5){ const uint8_t *q=e->q4+(int64_t)tok*i3_rowbytes(D);   /* int3-g64 */
        const float *sr=e->s+(int64_t)tok*i3_groups(D); int64_t ng=i3_groups(D);
        for(int64_t g=0; g<ng; g++){ const uint8_t *lo=q+g*I3_GBYTES, *hi=lo+16;
            int base=(int)(g*I3_GROUP), n=D-base<I3_GROUP?D-base:I3_GROUP;
            for(int k=0;k<n;k++){ unsigned u=((lo[k>>2]>>((k&3)*2))&3)|(((hi[k>>3]>>(k&7))&1)<<2);
                x[base+k]=(float)((int)u-4)*sr[g]; } }
        return; }
    const uint8_t *q=e->q4+(int64_t)tok*((D+3)/4); float s=e->s[tok];   /* int2 */
    for(int i=0;i<D;i++){ uint8_t byte=q[i>>2]; int sh=(i&3)*2; x[i]=(float)((int)((byte>>sh)&3)-2)*s; }
}

/* COLI_MMAP=1: gli expert diventano VISTE dentro mmap dei file safetensors (niente pread,
 * niente slab, niente copia: la page cache del kernel E' la cache). Le mappe sono
 * registrate con Metal (newBufferWithBytesNoCopy su pagine file-backed, come llama.cpp),
 * quindi la GPU legge gli stessi byte. Fallback allo slab path su disallineamento. */
static int g_mmap=0;
static struct { int fd; void *base; size_t len; } g_maps[512]; static int g_nmaps;
static pthread_mutex_t g_map_mtx = PTHREAD_MUTEX_INITIALIZER;   /* expert_load e' OMP-parallel */
/* forward decls: mem_should_wire/mem_wire live near pin_wire() further down, but
 * qt_wire_mmap() (also further down, used by pin_wire()'s COLI_MMAP path) needs
 * them declared before its own definition. Real mlock-ing of mmap'd pinned
 * experts happens there, not in expert_load() -- see qt_wire_mmap() for why. */
static int mem_should_wire(void);
static int mem_wire(void *addr, size_t len);
static void qt_unwire_mmap(QT *t);   /* def. presso pin_wire / defined near pin_wire */
static int64_t g_mmap_wired=0; static long g_mmap_wire_failed=0;
static void *map_of_fd(int fd){
    pthread_mutex_lock(&g_map_mtx);
    for(int i=0;i<g_nmaps;i++) if(g_maps[i].fd==fd){ void *b=g_maps[i].base; pthread_mutex_unlock(&g_map_mtx); return b; }
    void *base=NULL;
#if defined(__APPLE__) || defined(__linux__) || defined(__FreeBSD__)
    struct stat st;
    if(g_nmaps<512 && fstat(fd,&st)==0){
        size_t len=((size_t)st.st_size+16383)&~(size_t)16383;
        void *p=mmap(NULL,len,PROT_READ,MAP_SHARED,fd,0);
        if(p!=MAP_FAILED){
            base=p; g_maps[g_nmaps].fd=fd; g_maps[g_nmaps].base=p; g_maps[g_nmaps].len=len; g_nmaps++;
#ifdef COLI_METAL
            if(g_metal_enabled) coli_metal_register(p,len);
#endif
        }
    }
#endif
    pthread_mutex_unlock(&g_map_mtx);
    return base;
}

/* ==================== DUAL-SSD: two model copies, two drives ====================
 * COLI_MODEL_MIRROR=<dir> registers a SECOND (read-only) copy of the model on
 * another drive; expert reads are split between the two according to
 * COLI_DISK_WEIGHTS=<primary>,<mirror> (relative bandwidth; without the env it
 * is measured at startup with the engine's own access pattern). Cold decode is
 * disk-bound (~11 GB/token): two NVMe drives reading in parallel add up. */
static const char *g_mirror_dir=NULL;  /* COLI_MODEL_MIRROR / SNAP_MIRROR */
static int g_mirror=0;                 /* 1 = mirror active (at least one shard accepted) */
static int g_mir_share=64;             /* expert share routed to the mirror, out of 256 */
static _Atomic int64_t g_mir_bytes[2]; /* bytes served per drive: [0] primary, [1] mirror */
static _Atomic int64_t g_mir_nread[2];

/* replica of one expert: DETERMINISTIC hash of (layer,eid). Determinism is a
 * requirement, not a style choice: the readahead/PILOT WILLNEED and the demand
 * pread must hit the same fd/page-cache, and in buffered mode an expert must
 * never be cached twice (one copy per drive). */
static inline int expert_route(int layer,int eid){
    if(!g_mirror) return 0;
    uint32_t h=(uint32_t)layer*2654435761u ^ (uint32_t)eid*0x9E3779B9u;
    h^=h>>16; h*=0x45d9f3bu; h^=h>>16;
    return (int)(h&255) < g_mir_share;
}

/* buffered fd of the replica, falling back to the primary if the file is not mirrored */
static inline int rep_bfd(shards *S,int fd,int rep){
    int r=st_fd_rep(S,fd,rep); return r<0?fd:r;
}

static int pread_full(int fd, void *buf, int64_t n, int64_t off, const char *tag);

/* pread on the chosen replica with fallback to the primary on error/short-read:
 * an unreadable sector (or an unmount) of the mirror must never kill the process
 * when the primary can serve the same bytes. Delegates to pread_full so the
 * mirror path inherits the short-read/EINTR loop and honest reporting (#236).
 * Accounts bytes per drive. Returns 0 = ok, -1 = real error/EOF (like pread_full). */
static ssize_t mir_pread(shards *S,int fd,int rep,void *buf,int64_t n,int64_t off,const char *tag){
    int rfd = st_fd_rep(S,fd,rep);
    int used = rep && rfd>=0;
    if(rfd<0) rfd=fd;
    int rc=pread_full(rfd,buf,n,off,tag);
    if(rc && used){
        static _Atomic int warned;
        if(!atomic_exchange(&warned,1))
            fprintf(stderr,"[MIRROR] read error on the mirror copy — falling back to the primary drive\n");
        used=0; rc=pread_full(fd,buf,n,off,tag);
    }
    if(!rc){ atomic_fetch_add_explicit(&g_mir_bytes[used],n,memory_order_relaxed);
             atomic_fetch_add_explicit(&g_mir_nread[used],1,memory_order_relaxed); }
    return rc;
}

/* carica un expert nello slot. Container pre-quantizzato: le 3 matrici sono contigue nel
 * file -> UNA pread coalescente da ~19 MB dentro `slab` (+ le scale in fslab); i QT sono
 * viste dentro lo slab (zero copie). Fallback per modelli non quantizzati (oracolo tiny).
 * THREAD-SAFE su slot distinti (pread posizionale, st_find read-only). */
/* Load one expert's weights into slot `s`. Returns 0 on success, -1 on failure.
 * fatal=1 (all main / on-demand / REPIN / pin callers): preserve the original
 * exit-on-error contract byte-for-byte — any missing tensor, OOM, short read or
 * pread error aborts the process. fatal=0 (speculative pilot only): the same
 * errors instead abandon the load and return -1 without touching s->eid, so a
 * mispredicted cross-layer prefetch can never kill the server. */
/* pread completo: gestisce le short-read (POSIX le ammette su file regolari
 * sotto pressione di memoria) e le EINTR, e riporta un errore ONESTO. perror
 * stampava "Success" quando pread ritorna un conteggio corto invece di -1
 * (errno resta 0 dalla syscall precedente) -> messaggio fuorviante nel path
 * score/bench (#236). Ritorna 0 = ok, -1 = errore reale o EOF. */
static int pread_full(int fd, void *buf, int64_t n, int64_t off, const char *tag){
    char *p=buf; int64_t got=0;
    while(got<n){
        ssize_t r=pread(fd, p+got, (size_t)(n-got), off+got);
        if(r<0){ if(errno==EINTR) continue;
#ifdef _WIN32
            fprintf(stderr,"%s: %s (off %lld, %lld/%lld bytes, WinErr=%lu)\n",tag,strerror(errno),
                    (long long)off,(long long)got,(long long)n,(unsigned long)compat_pread_lasterr);
#else
            fprintf(stderr,"%s: %s (off %lld, %lld/%lld bytes)\n",tag,strerror(errno),
                    (long long)off,(long long)got,(long long)n);
#endif
            return -1; }
        if(r==0){ fprintf(stderr,"%s: short read at EOF (off %lld, %lld/%lld bytes) — truncated shard?\n",
                    tag,(long long)off,(long long)got,(long long)n); return -1; }
        got+=r;
    }
    return 0;
}
/* DISK-CLASS: is classification active right now? Single point of truth shared by
 * moe()'s pre-bump snapshot (FASE A, below) and expert_load_impl's classify-and-read --
 * they must agree, or expert_load_impl reads a snapshot moe() never bothered to write.
 * PROF=1 is the only trigger: this feature is measurement-only, the verdict never picks
 * an fd (kept as one function anyway so a future policy consumer cannot drift out of
 * sync with the snapshot writer by construction). */
static int dc_needed(void){ return g_prof; }
/* DISK-CLASS: cold/warm verdict for ONE demand load, read from the pre-bump snapshot
 * (Model's elast_pre) so routing's OWN bump for THIS call can't contaminate the read --
 * prefill is one giant moe() call where every newly-seen expert gets its `last` bumped
 * a few lines above the load that made it "new"; classifying off the live, post-bump
 * array would call the whole cold burst warm. Ages against the PRIVATE clock
 * (eaccess_clock_dc, see its declaration in Model), NEVER the real eaccess_clock: kept
 * separate by design (see elast_dc in Model for why DISK-CLASS keeps its own clock
 * instead of reading the real one -- before #417/cfcc742 the real one also froze on the
 * Metal pre-routed decode path, which would have made every prefill-touched expert warm
 * forever and everything else cold forever; that's fixed upstream now, but DISK-CLASS
 * still doesn't read the real clock, for the isolation property, not the freeze).
 * Conservative-toward-warm on the one genuinely ambiguous input (missing snapshot --
 * defensive only, elast_pre is allocated everywhere elast is); a demonstrable first-ever
 * access (last_pre==0) is not a judgment call, it stays cold regardless of that bias. */
static int expert_classify(Model *m, int layer, int eid){
    if(!m->elast_pre || !m->elast_pre[layer]) return DC_WARM;  /* no snapshot: label as the safe class */
    uint32_t last_pre=m->elast_pre[layer][eid];
    if(last_pre==0) return DC_COLD;                             /* never touched before this call: certain cold */
    uint32_t age=m->eaccess_clock_dc-last_pre;                  /* ticks since last access, PRE this call's bump */
    return age>g_direct_heat_ticks ? DC_COLD : DC_WARM;         /* '>' not '>=': ties lean warm */
}
static int expert_load_impl(Model *m, int layer, int eid, ESlot *s, int fatal, int demand){
#ifdef COLI_CUDA
    /* A live REPIN may reuse a GPU-enabled pinned slot for a different expert.
     * Keep its tier assignment, but invalidate the old device weights. */
    if(s->eid!=eid){ qt_cuda_reset(&s->g); qt_cuda_reset(&s->u); qt_cuda_reset(&s->d); }
#endif
    Cfg *c=&m->c; int I=c->moe_inter, D=c->hidden, b=m->ebits;
    /* suf as a bounded char[][16] (not const char*) lets GCC prove the %s in the
     * nm[k]/qn snprintfs can't overflow: worst key is "model.layers.<i>.mlp.experts.<i>.down_proj.weight"
     * = 66 bytes incl NUL, well under nm[288] and qn[320]. See #484. */
    char nm[3][288]; const char suf[3][16]={"gate_proj","up_proj","down_proj"};
    for(int k=0;k<3;k++) snprintf(nm[k],sizeof(nm[k]),"model.layers.%d.mlp.experts.%d.%s.weight",layer,eid,suf[k]);
    char qn[320]; snprintf(qn,sizeof(qn),"%s.qs",nm[0]);
    if(!st_has(&m->S,qn)){                       /* fallback: tensori pieni, quantizza a runtime.
                                                  * Reachable ONLY for unquantized models (no .qs);
                                                  * GLM always has .qs, so the pilot never hits it. */
        qt_from_disk(m,nm[0],I,D,b,g_drop,&s->g);
        qt_from_disk(m,nm[1],I,D,b,g_drop,&s->u);
        qt_from_disk(m,nm[2],D,I,b,g_drop,&s->d);
        atomic_fetch_add_explicit(&g_prof_io,
            st_nbytes(&m->S,nm[0])+st_nbytes(&m->S,nm[1])+st_nbytes(&m->S,nm[2]),memory_order_relaxed);
        s->eid=eid; return 0;
    }
    st_tensor *tw[3], *tq[3];
    for(int k=0;k<3;k++){
        tw[k]=st_find(&m->S,nm[k]);
        snprintf(qn,sizeof(qn),"%s.qs",nm[k]); tq[k]=st_find(&m->S,qn);
        if(!tw[k]||!tq[k]){ if(fatal) st_die_missing(&m->S,nm[k]);   /* #586: diagnose, don't just name it */
                            fprintf(stderr,"missing %s\n",nm[k]); return -1; }
    }
    if(g_disk_split){ /* split load/byte per tipo layer; atomici: expert_load gira anche su OMP/pipe/pilot */
        int64_t tb=0; for(int k=0;k<3;k++) tb+=tw[k]->nbytes+tq[k]->nbytes;
        if(layer==c->n_layers){ __atomic_add_fetch(&m->ld_mtp,1,__ATOMIC_RELAXED);
                                __atomic_add_fetch(&m->bytes_mtp,(uint64_t)tb,__ATOMIC_RELAXED); }
        else                  { __atomic_add_fetch(&m->ld_main,1,__ATOMIC_RELAXED);
                                __atomic_add_fetch(&m->bytes_main,(uint64_t)tb,__ATOMIC_RELAXED); }
    }
    int rep=expert_route(layer,eid);             /* DUAL-SSD: this expert's replica */
    if(rep && st_fd_rep(&m->S,tw[0]->fd,1)<0) rep=0;   /* shard not in the mirror (partial) */
    if(g_mmap){
        void *bw[3],*bq[3]; int okm=1;
        for(int k=0;k<3;k++){
            bw[k]=map_of_fd(rep_bfd(&m->S,tw[k]->fd,rep)); bq[k]=map_of_fd(rep_bfd(&m->S,tq[k]->fd,rep));
            if(!bw[k]||!bq[k]||((tw[k]->off)&3)||((tq[k]->off)&3)) okm=0;
        }
        if(okm){
            QT *qt[3]={&s->g,&s->u,&s->d}; int OO[3]={I,I,D}, II[3]={D,D,I};
            for(int k=0;k<3;k++){
                int64_t nb=tw[k]->nbytes;
                int gs=0;
                int fmt=qt_resolve_fmt(tw[k]->name,OO[k],II[k],nb,tq[k]->nbytes,&gs);
                qt[k]->fmt=fmt; qt[k]->O=OO[k]; qt[k]->I=II[k]; qt[k]->gs=gs; qt[k]->qf=NULL;
                qt[k]->q8=(int8_t*)((char*)bw[k]+tw[k]->off); qt[k]->q4=(uint8_t*)((char*)bw[k]+tw[k]->off);
                qt[k]->s=(float*)((char*)bq[k]+tq[k]->off);
            }
            /* CPU pre-touch: fault the pages in HERE (cheap, parallel, overlapped with the
             * resident-experts GPU submit) so the GPU never demand-faults file-backed pages
             * (measured catastrophic). madvise starts async readahead, the touch guarantees
             * residency. This is pread's I/O without the copy and without the slab. */
            for(int k=0;k<3;k++){
                char *p=(char*)bw[k]+tw[k]->off; size_t n=(size_t)tw[k]->nbytes;
#if defined(__APPLE__) || defined(__linux__) || defined(__FreeBSD__)
                madvise((void*)((uintptr_t)p & ~16383UL), n+16384, MADV_WILLNEED);
#endif
                volatile char acc=0;
                for(size_t i=0;i<n;i+=4096) acc+=p[i];
                acc+=p[n-1]; (void)acc;
                char *q=(char*)bq[k]+tq[k]->off; size_t nq=(size_t)tq[k]->nbytes;
                for(size_t i=0;i<nq;i+=4096) acc+=q[i];
                /* mlock deliberately NOT done here: this fires for every expert_load call,
                 * including the transient VRAM-staging pass in pin_load (host copy loaded,
                 * uploaded to GPU, then "released" via expert_host_release -- which only
                 * knows how to munlock s->slab, always NULL under mmap, so wiring here would
                 * leak locked pages for every GPU-tier expert). See pin_wire() below: it wires
                 * the final resident set only, after GPU release has already nulled out the
                 * pointers for anything that isn't genuinely RAM-tier. */
                atomic_fetch_add_explicit(&g_prof_io,(int64_t)(n+nq),memory_order_relaxed);
                atomic_fetch_add_explicit(&g_mir_bytes[rep],tw[k]->nbytes+tq[k]->nbytes,memory_order_relaxed);
            }
            atomic_fetch_add_explicit(&g_mir_nread[rep],1,memory_order_relaxed);
            s->eid=eid; return 0;
        }
    }
    int64_t wtot=tw[0]->nbytes+tw[1]->nbytes+tw[2]->nbytes;
    int64_t ftot=(tq[0]->nbytes+tq[1]->nbytes+tq[2]->nbytes)/4;
    /* rialloca se lo slot (riusato tra layer) e' troppo piccolo per QUESTO expert:
     * pread oltre la mappatura = short-read o CORRUZIONE silenziosa dei vicini */
    if(!s->slab || wtot+8192 > s->slab_cap){
#ifdef COLI_METAL
        /* page-align + zero-copy wrap: the GPU reads this slab in place (unified memory) */
        if(s->slab && g_metal_enabled) coli_metal_unregister(s->slab);
        compat_aligned_free(s->slab);
        size_t need=((size_t)wtot+8192+16383)&~(size_t)16383;
        if(posix_memalign((void**)&s->slab,16384,need)){fprintf(stderr,"OOM slab\n"); if(fatal) exit(1); s->slab=NULL; s->slab_cap=0; return -1;}
        s->slab_cap=need;
        if(g_metal_enabled) coli_metal_register(s->slab,need);
#else
        compat_aligned_free(s->slab);
        if(posix_memalign((void**)&s->slab,4096,wtot+8192)){fprintf(stderr,"OOM slab\n"); if(fatal) exit(1); s->slab=NULL; s->slab_cap=0; return -1;}
        s->slab_cap=wtot+8192;
        numa_slab_bind(s->slab,(size_t)s->slab_cap);
#endif
    }
    if(!s->fslab || ftot > s->fslab_cap){
#ifdef COLI_METAL
        /* page-align + register: the GPU reads the scales in place (unified memory).
         * Honours `fatal` exactly like the CPU arm below — a speculative pilot load
         * that hits OOM must unwind into a clean hidden slot, never exit(). */
        if(s->fslab && g_metal_enabled) coli_metal_unregister(s->fslab);
        free(s->fslab);
        size_t fb=(((size_t)ftot*sizeof(float))+16383)&~(size_t)16383;
        if(ftot<0 || (uint64_t)ftot > SIZE_MAX/sizeof(float) ||
           posix_memalign((void**)&s->fslab,16384,fb)){
            fprintf(stderr,"OOM fslab\n"); if(fatal) exit(1);
            /* unregister BEFORE freeing -- a stale g_slabs entry would let resolve() hand
             * the GPU a pointer into freed memory (and under COLI_METAL_RESSET=1, leave the
             * buffer a permanent residency-set member over it). Ported from e4/metal-heap
             * validator fix 6753225; pre-existing gap on main/dev. */
            if(s->slab && g_metal_enabled) coli_metal_unregister(s->slab);
            compat_aligned_free(s->slab); s->slab=NULL; s->slab_cap=0;  /* clean, hidden slot (eid stays -1) */
            s->fslab=NULL; s->fslab_cap=0; return -1;
        }
        s->fslab_cap=ftot;
        if(g_metal_enabled) coli_metal_register(s->fslab,fb);
#else
        free(s->fslab);
        if(fatal){ s->fslab=falloc(ftot); }          /* main path: byte-identical exit-on-OOM */
        else {                                        /* speculative pilot: checked alloc, never exit() */
            /* replicate falloc's anti-wrap guard + malloc (no zeroing/alignment) */
            if(ftot<0 || (uint64_t)ftot > SIZE_MAX/sizeof(float) ||
               !(s->fslab=malloc((size_t)ftot*sizeof(float)))){
                fprintf(stderr,"OOM fslab\n");
                compat_aligned_free(s->slab); s->slab=NULL; s->slab_cap=0; /* leave a clean, hidden slot (eid stays -1) */
                s->fslab=NULL; s->fslab_cap=0; return -1;
            }
        }
        s->fslab_cap=ftot;
        numa_slab_bind(s->fslab,(size_t)ftot*sizeof(float));
#endif
    }
    /* DISK-CLASS: classify before the reads; computed unconditionally at dc_on sites so
     * the timer (dc_t0) brackets exactly the read work, matching what the GB/s in the
     * DISK-CLASS line describes. dc_on gates ALL of it off demand=0 call sites
     * (pilot/repin/pin -- never classified, see the call sites) and off PROF=0 runs
     * (dc_needed()) -- zero cost, zero behavior change there. The fd choice below is
     * NOT influenced by the verdict: this is measurement only. */
    int dc_on = demand && dc_needed();
    int dc_cls = dc_on ? expert_classify(m,layer,eid) : DC_WARM;
    double dc_t0 = dc_on ? now_s() : 0;
    if(dc_on) dc_wall_enter(dc_cls,dc_t0);        /* busy-wall open; EVERY exit path below must pair it */
    int ord[3]={0,1,2};                          /* ordina per offset nel file */
    for(int a=0;a<3;a++) for(int bb=a+1;bb<3;bb++) if(tw[ord[bb]]->off<tw[ord[a]]->off){ int t=ord[a]; ord[a]=ord[bb]; ord[bb]=t; }
    int contig = tw[ord[0]]->fd==tw[ord[1]]->fd && tw[ord[1]]->fd==tw[ord[2]]->fd
              && tw[ord[0]]->off+tw[ord[0]]->nbytes==tw[ord[1]]->off
              && tw[ord[1]]->off+tw[ord[1]]->nbytes==tw[ord[2]]->off;
    int64_t pos[3]; int done=0, dc_direct=0;
    if(contig){
        int64_t off0=tw[ord[0]]->off;
        int dfd = g_direct ? st_direct_fd_rep(&m->S, tw[ord[0]]->fd, rep) : -1;
        if(dfd>=0){                              /* O_DIRECT: offset/len allineati a 4K */
            int64_t base=off0 & ~4095LL, need=(off0-base)+wtot;
            int64_t len=(need+4095)&~4095LL;
            ssize_t r=pread(dfd, s->slab, len, base);
            if(r>=need){
                pos[ord[0]]=off0-base; pos[ord[1]]=pos[ord[0]]+tw[ord[0]]->nbytes;
                pos[ord[2]]=pos[ord[1]]+tw[ord[1]]->nbytes; done=1; dc_direct=1;
                atomic_fetch_add_explicit(&g_mir_bytes[rep],(int64_t)r,memory_order_relaxed);
                atomic_fetch_add_explicit(&g_mir_nread[rep],1,memory_order_relaxed);
            }
        }
        if(!done){                               /* fallback bufferizzato */
            if(mir_pread(&m->S, tw[ord[0]]->fd, rep, s->slab, wtot, off0, "pread expert")){ if(fatal) exit(1);
                if(dc_on) dc_wall_exit(dc_cls,now_s());   /* pair the enter on the non-fatal unwind */
                return -1; }
            pos[ord[0]]=0; pos[ord[1]]=tw[ord[0]]->nbytes; pos[ord[2]]=tw[ord[0]]->nbytes+tw[ord[1]]->nbytes; done=1;
        }
    }
    if(!done){                                   /* non contigui: 3 pread bufferizzate */
        int64_t o=0;
        for(int a=0;a<3;a++){ int k=ord[a];
            if(mir_pread(&m->S, tw[k]->fd, rep, s->slab+o, tw[k]->nbytes, tw[k]->off, "pread expert")){ if(fatal) exit(1);
                if(dc_on) dc_wall_exit(dc_cls,now_s());   /* pair the enter on the non-fatal unwind */
                return -1; }
            pos[k]=o; o+=tw[k]->nbytes; }
    }
    float *fp[3]; int64_t fo=0;                  /* scale (piccole) */
    for(int k=0;k<3;k++){
        if(mir_pread(&m->S, tq[k]->fd, rep, (char*)(s->fslab+fo), tq[k]->nbytes, tq[k]->off, "pread qs")){ if(fatal) exit(1);
            if(dc_on) dc_wall_exit(dc_cls,now_s());       /* pair the enter on the non-fatal unwind */
            return -1; }
        fp[k]=s->fslab+fo; fo+=tq[k]->nbytes/4; }
    atomic_fetch_add_explicit(&g_prof_io,wtot+fo*4,memory_order_relaxed);
    if(dc_on){                                    /* DISK-CLASS accounting, see dc_needed() */
        double dc_t1=now_s();                     /* one clock read for thread-ns AND the wall exit */
        int64_t bytes=wtot+fo*4;
        atomic_fetch_add_explicit(&g_dc_n[dc_cls],1,memory_order_relaxed);
        atomic_fetch_add_explicit(&g_dc_bytes[dc_cls],bytes,memory_order_relaxed);
        atomic_fetch_add_explicit(&g_dc_ns[dc_cls],(int64_t)((dc_t1-dc_t0)*1e9),memory_order_relaxed);
        dc_wall_exit(dc_cls,dc_t1);
        if(dc_direct)                             /* which fd ACTUALLY served this class */
            atomic_fetch_add_explicit(&g_dc_direct_n[dc_cls],1,memory_order_relaxed);
    }
    if(g_drop){                                  /* scarta subito le pagine: evita che la page
                                                  * cache in pressione strangoli il throughput.
                                                  * The drop targets the fd of the replica READ. */
        posix_fadvise(rep_bfd(&m->S,tw[ord[0]]->fd,rep), tw[ord[0]]->off, wtot, POSIX_FADV_DONTNEED);
        for(int k=0;k<3;k++) posix_fadvise(rep_bfd(&m->S,tq[k]->fd,rep), tq[k]->off, tq[k]->nbytes, POSIX_FADV_DONTNEED);
    }
    QT *qt[3]={&s->g,&s->u,&s->d}; int OO[3]={I,I,D}, II[3]={D,D,I};
    for(int k=0;k<3;k++){
        int64_t nb=tw[k]->nbytes;
        int gs=0;
        int fmt=qt_resolve_fmt(tw[k]->name,OO[k],II[k],nb,tq[k]->nbytes,&gs);
        qt[k]->fmt=fmt; qt[k]->O=OO[k]; qt[k]->I=II[k]; qt[k]->gs=gs; qt[k]->qf=NULL;
        qt[k]->q8=(int8_t*)(s->slab+pos[k]); qt[k]->q4=s->slab+pos[k]; qt[k]->s=fp[k];
    }
    s->eid=eid; return 0;
}
/* Every expert read goes through here: time the whole load (pread/fault +
 * bookkeeping) on the thread that runs it, into the disk-service counter. */
static int expert_load(Model *m, int layer, int eid, ESlot *s, int fatal, int demand){
    /* `demand` marks a routing-driven demand-load (moe()'s PIPE/OMP miss path, where the
     * pre-bump elast_pre snapshot moe() just wrote is valid) -- pass 0 from anywhere else
     * (pilot speculative loads, repin, startup PIN loading): those never run through THIS
     * call's own FASE A, so the snapshot either doesn't apply or was never written for
     * them, and DISK-CLASS deliberately leaves them unclassified -- see expert_classify()'s
     * call site. */
    double t0=now_s();
    int rc=expert_load_impl(m,layer,eid,s,fatal,demand);
    atomic_fetch_add_explicit(&g_edisk_ns,(int64_t)((now_s()-t0)*1e9),memory_order_relaxed);
    return rc;
}

#ifdef __linux__
/* io_uring expert batches.  One owner prepares all reads for a block, submits
 * them in one syscall, and reaps CQEs on demand.  The kernel, rather than a set
 * of blocking pthreads, owns the I/O concurrency. */
#define URING_LOAD_MAX 64
#define URING_REQ_MAX  512
typedef struct {
    int load, expect;
} UringRead;
typedef struct {
    Model *m; ESlot *s; int layer,eid,fatal;
    st_tensor *tw[3],*tq[3]; int64_t pos[3];
    int pending,done,finalized,error;
} UringLoad;
typedef struct {
    ColiUring ring;
    UringLoad load[URING_LOAD_MAX];
    UringRead req[URING_REQ_MAX];
    int nload,nreq,started;
} UringBatch;
static UringBatch g_ub_pipe, g_ub_pilot;

static int uring_batch_init(UringBatch *b){
    if(b->started) return 0;
    if(coli_uring_init(&b->ring,URING_REQ_MAX)) return -1;
    b->started=1; return 0;
}
static void uring_batch_reset(UringBatch *b){
    b->nload=0; b->nreq=0;
}
static int uring_load_error(UringLoad *l,int err,const char *what){
    l->error=err?err:EIO; l->done=1;
    if(l->fatal){ errno=l->error; perror(what); exit(1); }
    return -1;
}
static int uring_add_read(UringBatch *b,int li,int fd,void *buf,size_t len,
                          int64_t off,size_t expect){
    if(b->nreq>=URING_REQ_MAX || expect>INT_MAX){ errno=E2BIG; return -1; }
    int ri=b->nreq++;
    b->req[ri]=(UringRead){li,(int)expect};
    if(coli_uring_prep_read(&b->ring,fd,buf,len,off,(uint64_t)ri+1)) return -1;
    b->load[li].pending++;
    return 0;
}
/* Returns the load index. URING is intentionally a quantized streaming path;
 * unsupported layouts fail instead of silently dropping back to pread. */
static int uring_load_add(UringBatch *b,Model *m,int layer,int eid,ESlot *s,int fatal){
    if(b->nload>=URING_LOAD_MAX){ errno=E2BIG; return -1; }
    int li=b->nload++;
    UringLoad *l=&b->load[li]; memset(l,0,sizeof(*l));
    l->m=m; l->s=s; l->layer=layer; l->eid=eid; l->fatal=fatal;
    char nm[3][288],qn[320]; const char suf[3][16]={"gate_proj","up_proj","down_proj"};  /* bounded suf: see #484 */
    for(int k=0;k<3;k++) snprintf(nm[k],sizeof(nm[k]),"model.layers.%d.mlp.experts.%d.%s.weight",layer,eid,suf[k]);
    snprintf(qn,sizeof(qn),"%s.qs",nm[0]);
    if(g_mmap || !st_has(&m->S,qn))
        return uring_load_error(l,ENOTSUP,"URING requires quantized expert tensors"),li;
#ifdef COLI_CUDA
    if(s->eid!=eid){ qt_cuda_reset(&s->g); qt_cuda_reset(&s->u); qt_cuda_reset(&s->d); }
#endif
    for(int k=0;k<3;k++){
        l->tw[k]=st_find(&m->S,nm[k]);
        size_t n=strnlen(nm[k],sizeof(nm[k]));
        if(n+3>=sizeof(qn)) return uring_load_error(l,ENAMETOOLONG,"io_uring expert metadata"),li;
        memcpy(qn,nm[k],n); memcpy(qn+n,".qs",4); l->tq[k]=st_find(&m->S,qn);
        if(!l->tw[k]||!l->tq[k]) return uring_load_error(l,ENOENT,"io_uring expert metadata"),li;
    }
    int64_t wtot=l->tw[0]->nbytes+l->tw[1]->nbytes+l->tw[2]->nbytes;
    int64_t ftot=(l->tq[0]->nbytes+l->tq[1]->nbytes+l->tq[2]->nbytes)/4;
    if(wtot<=0 || ftot<=0) return uring_load_error(l,EINVAL,"io_uring expert size"),li;
    if(!s->slab || wtot+8192>s->slab_cap){
#ifdef COLI_METAL
        if(s->slab&&g_metal_enabled) coli_metal_unregister(s->slab);
        compat_aligned_free(s->slab);
        size_t need=((size_t)wtot+8192+16383)&~(size_t)16383;
        if(posix_memalign((void**)&s->slab,16384,need)){
            s->slab=NULL; s->slab_cap=0; return uring_load_error(l,ENOMEM,"io_uring expert slab"),li; }
        s->slab_cap=need; if(g_metal_enabled) coli_metal_register(s->slab,need);
#else
        compat_aligned_free(s->slab);
        if(posix_memalign((void**)&s->slab,4096,(size_t)wtot+8192)){
            s->slab=NULL; s->slab_cap=0; return uring_load_error(l,ENOMEM,"io_uring expert slab"),li; }
        s->slab_cap=wtot+8192;
#endif
    }
    if(!s->fslab || ftot>s->fslab_cap){
#ifdef COLI_METAL
        if(s->fslab&&g_metal_enabled) coli_metal_unregister(s->fslab);
        free(s->fslab); size_t fb=(((size_t)ftot*sizeof(float))+16383)&~(size_t)16383;
        if(posix_memalign((void**)&s->fslab,16384,fb)){
            s->fslab=NULL; s->fslab_cap=0; return uring_load_error(l,ENOMEM,"io_uring expert scales"),li; }
        s->fslab_cap=ftot; if(g_metal_enabled) coli_metal_register(s->fslab,fb);
#else
        free(s->fslab); s->fslab=malloc((size_t)ftot*sizeof(float));
        if(!s->fslab){ s->fslab_cap=0; return uring_load_error(l,ENOMEM,"io_uring expert scales"),li; }
        s->fslab_cap=ftot;
#endif
    }
    int ord[3]={0,1,2};
    for(int a=0;a<3;a++) for(int z=a+1;z<3;z++) if(l->tw[ord[z]]->off<l->tw[ord[a]]->off){int t=ord[a];ord[a]=ord[z];ord[z]=t;}
    int contig=l->tw[ord[0]]->fd==l->tw[ord[1]]->fd && l->tw[ord[1]]->fd==l->tw[ord[2]]->fd
        && l->tw[ord[0]]->off+l->tw[ord[0]]->nbytes==l->tw[ord[1]]->off
        && l->tw[ord[1]]->off+l->tw[ord[1]]->nbytes==l->tw[ord[2]]->off;
    if(contig){
        int64_t off0=l->tw[ord[0]]->off;
        int dfd=g_direct?st_direct_fd(&m->S,l->tw[ord[0]]->fd):-1;
        if(dfd>=0){
            int64_t base=off0&~4095LL,need=(off0-base)+wtot,len=(need+4095)&~4095LL;
            l->pos[ord[0]]=off0-base; l->pos[ord[1]]=l->pos[ord[0]]+l->tw[ord[0]]->nbytes;
            l->pos[ord[2]]=l->pos[ord[1]]+l->tw[ord[1]]->nbytes;
            if(uring_add_read(b,li,dfd,s->slab,(size_t)len,base,(size_t)need))
                return uring_load_error(l,errno,"io_uring direct expert read"),li;
        }else{
            l->pos[ord[0]]=0; l->pos[ord[1]]=l->tw[ord[0]]->nbytes;
            l->pos[ord[2]]=l->pos[ord[1]]+l->tw[ord[1]]->nbytes;
            if(uring_add_read(b,li,l->tw[ord[0]]->fd,s->slab,(size_t)wtot,off0,(size_t)wtot))
                return uring_load_error(l,errno,"io_uring expert read"),li;
        }
    }else{
        int64_t o=0;
        for(int a=0;a<3;a++){ int k=ord[a]; l->pos[k]=o;
            if(uring_add_read(b,li,l->tw[k]->fd,s->slab+o,(size_t)l->tw[k]->nbytes,l->tw[k]->off,(size_t)l->tw[k]->nbytes))
                return uring_load_error(l,errno,"io_uring expert read"),li;
            o+=l->tw[k]->nbytes;
        }
    }
    int64_t fo=0;
    for(int k=0;k<3;k++){
        if(uring_add_read(b,li,l->tq[k]->fd,s->fslab+fo,(size_t)l->tq[k]->nbytes,l->tq[k]->off,(size_t)l->tq[k]->nbytes))
            return uring_load_error(l,errno,"io_uring expert scale read"),li;
        fo+=l->tq[k]->nbytes/4;
    }
    return li;
}
static void uring_reap(UringBatch *b){
    struct io_uring_cqe cqe;
    while(coli_uring_peek(&b->ring,&cqe)){
        if(!cqe.user_data || cqe.user_data>(uint64_t)b->nreq) continue;
        UringRead *r=&b->req[cqe.user_data-1]; UringLoad *l=&b->load[r->load];
        if(cqe.res<r->expect && !l->error) l->error=cqe.res<0?-cqe.res:EIO;
        if(l->pending>0) l->pending--;
        if(l->pending==0) l->done=1;
    }
}
static int uring_submit_batch(UringBatch *b){
    if(coli_uring_enter(&b->ring,0)<0) return -1;
    uring_reap(b); return 0;
}
static int uring_wait_load(UringBatch *b,int li){
    UringLoad *l=&b->load[li];
    while(!l->done){
        uring_reap(b); if(l->done) break;
        if(coli_uring_enter(&b->ring,1)<0) return uring_load_error(l,errno,"io_uring wait");
    }
    return l->error?-1:0;
}
static int uring_finalize_load(UringBatch *b,int li,int publish_eid){
    UringLoad *l=&b->load[li]; ESlot *s=l->s;
    if(l->finalized) return 0;
    if(uring_wait_load(b,li)<0){ errno=l->error; if(l->fatal){perror("io_uring expert completion");exit(1);} return -1; }
    if(g_drop){
        int ord0=0; for(int k=1;k<3;k++) if(l->tw[k]->off<l->tw[ord0]->off) ord0=k;
        int64_t wtot=l->tw[0]->nbytes+l->tw[1]->nbytes+l->tw[2]->nbytes;
        posix_fadvise(l->tw[ord0]->fd,l->tw[ord0]->off,wtot,POSIX_FADV_DONTNEED);
        for(int k=0;k<3;k++) posix_fadvise(l->tq[k]->fd,l->tq[k]->off,l->tq[k]->nbytes,POSIX_FADV_DONTNEED);
    }
    Cfg *c=&l->m->c; int I=c->moe_inter,D=c->hidden; float *fp[3]; int64_t fo=0;
    QT *qt[3]={&s->g,&s->u,&s->d}; int OO[3]={I,I,D},II[3]={D,D,I};
    for(int k=0;k<3;k++){
        fp[k]=s->fslab+fo; fo+=l->tq[k]->nbytes/4;
        int64_t nb=l->tw[k]->nbytes;
        /* qt_resolve_fmt like the other two expert paths: the raw ?1:?2:3 inference here
         * missed grouped int4 (fmt=4, gs never set) and would mis-tag int3-g64 as int2. */
        int gs=0;
        int fmt=qt_resolve_fmt(l->tw[k]->name,OO[k],II[k],nb,l->tq[k]->nbytes,&gs);
        qt[k]->fmt=fmt; qt[k]->O=OO[k]; qt[k]->I=II[k]; qt[k]->gs=gs; qt[k]->qf=NULL;
        qt[k]->q8=(int8_t*)(s->slab+l->pos[k]); qt[k]->q4=s->slab+l->pos[k]; qt[k]->s=fp[k];
    }
    if(publish_eid) s->eid=l->eid;
    l->finalized=1; return 0;
}
static int uring_wait_all(UringBatch *b){
    for(int i=0;i<b->nload;i++) if(uring_wait_load(b,i)<0) return -1;
    return 0;
}
#endif

/* ============================ PIPE: load ‖ matmul ============================
 * Overlap NVMe expert-weight loads with expert matmul. A small persistent pool
 * of I/O worker pthreads runs the misses' pread (expert_load) into distinct
 * ws[] slabs and sets a per-slot `ready` flag; the MAIN thread walks the block's
 * experts in order, waiting on ready[q] only for the expert it needs right now,
 * and does all matmul_qt on itself (matmul_qt parallelises internally via OpenMP
 * and checks !omp_in_parallel() for GPU dispatch — so it must stay off the omp
 * team and off these I/O threads).
 *
 * Cross-generation safety is provided by a single generation-tagged, lock-free
 * cursor `cur = (gen<<8) | index`. The main thread is the sole writer of `gen`
 * (monotonic bump, so no ABA); workers grab jobs by CAS-advancing the low 8-bit
 * index. THE INVARIANT: a worker reads eids[i]/layer only AFTER its winning CAS,
 * and that CAS's comparand carries the generation — so if `cur`'s gen advanced
 * (a new batch was published), the CAS fails and the worker re-reads, seeing the
 * new generation. A straggler preempted anywhere (wake gap, post-cursor) can
 * therefore NEVER grab a wrong-generation job or read torn batch state: its
 * first act is a gen-checked CAS. dispatch publishes all batch state with
 * relaxed stores and then RELEASE-stores `cur`; each worker ACQUIRE-loads `cur`,
 * so the ready[] reset + eids[]/njobs/layer are visible before any worker acts.
 * The per-expert pipe_wait(ready[q]) in the matmul loop makes every grabbed job
 * complete before the block ends, so no grab outlives its generation — which is
 * why the old `active` counter AND the end-of-block drain barrier are gone (both
 * were redundant with those per-slot waits + the gen-tagged cursor). The mutex/
 * condvar exist ONLY to park/wake idle workers, never for correctness. Gated
 * behind PIPE=1; OFF => the original blocking-load + serial-matmul path runs
 * byte-identically. */
static int g_pipe=0;      /* PIPE=1: async expert-load pipeline. Default ON for Windows
                           * (parsed in main: getenv("PIPE")?:1 on _WIN32, :0 elsewhere).
                           * Keeps expert pread off the forward-pass thread so loads overlap
                           * the matmul. PIPE=0 opts back into the blocking serial path. */
static int g_pipe_nw=8;   /* PIPE_WORKERS=n: I/O worker threads (disk-parallel reads) */
static int g_uring=0;     /* URING=1: Linux io_uring load/completion backend; implies PIPE */
static int g_pipe_block=0;/* COLI_PIPE_BLOCK=1: pipe_wait blocca su una condvar invece dello
                           * spin sched_yield (default OFF = spin byte-identico). EN: a yield
                           * storm on the main thread fights the OpenMP team for cycles during
                           * multi-ms loads; the condvar wake costs ~5us against reads that
                           * cost 0.5-3ms (#159). Pthread pool only: the URING backend has no
                           * waiter spin to replace. */
/* PIPE_WORKERS>0 esplicito nell'env implica PIPE=1: dimensionare il pool
 * dichiara l'intento di usarlo (una campagna intera l'ha impostato con la
 * pipe spenta senza accorgersene). EN: fires ONLY when PIPE is unset in the
 * env AND the platform default left the pipe off (on _WIN32 it already
 * defaults to 1) AND PIPE_WORKERS parses positive — the internal default of
 * 8 does not count, PIPE_WORKERS=0/empty does not, and an explicit PIPE=0
 * always wins. */
static int pipe_workers_imply_pipe(const char *pipe_env, const char *pw_env, int pipe_now){
    return !pipe_now && !pipe_env && pw_env && atoi(pw_env)>0;
}
typedef struct {
    _Atomic uint64_t cur;                         /* (gen<<8)|index; gen main-only, index 0..njobs (≤64) */
    _Atomic int njobs;                            /* current batch job count */
    _Atomic int eids[64];                         /* current batch expert ids */
    _Atomic int layer;                            /* current batch layer */
    _Atomic int ready[64];                        /* per-slot load-done flag */
    pthread_mutex_t mx; pthread_cond_t cv;        /* ONLY for parking/waking idle workers */
    pthread_cond_t cv_done;                       /* COLI_PIPE_BLOCK: signals ready[] transitions */
    Model *m;
    pthread_t th[16]; int nw; int started;
} PipePool;
static PipePool g_pp;

static void *pipe_worker(void *arg){
    (void)arg; PipePool *p=&g_pp; uint64_t seen=0;
    for(;;){
        pthread_mutex_lock(&p->mx);
        while((atomic_load_explicit(&p->cur,memory_order_relaxed)>>8)==seen)
            pthread_cond_wait(&p->cv,&p->mx);
        pthread_mutex_unlock(&p->mx);
        for(;;){
            uint64_t c=atomic_load_explicit(&p->cur,memory_order_acquire);
            seen=c>>8;
            uint32_t i=(uint32_t)(c & 0xFF);
            if(i >= (uint32_t)atomic_load_explicit(&p->njobs,memory_order_relaxed))
                break;                                /* batch drained → re-park */
            if(atomic_compare_exchange_weak_explicit(&p->cur,&c,c+1,
                    memory_order_acq_rel,memory_order_relaxed)){
                int L  =atomic_load_explicit(&p->layer,memory_order_relaxed);
                int eid=atomic_load_explicit(&p->eids[i],memory_order_relaxed); /* AFTER winning CAS */
                expert_load(p->m,L,eid,&p->m->ws[i],1,1);  /* needed-now load: fatal on I/O error (matches serial path); demand=1: this IS moe()'s own miss path */
                atomic_store_explicit(&p->ready[i],1,memory_order_release);
                if(g_pipe_block){                     /* wake a main thread parked in pipe_wait */
                    pthread_mutex_lock(&p->mx);
                    pthread_cond_broadcast(&p->cv_done);
                    pthread_mutex_unlock(&p->mx);
                }
            }
            /* CAS failed → another worker advanced index (or gen advanced): re-loop */
        }
    }
    return NULL;
}
static void pipe_init(Model *m){
    if(g_pp.started) return;
#ifdef __linux__
    if(g_uring){
        if(uring_batch_init(&g_ub_pipe)){ perror("URING=1 io_uring_setup"); exit(1); }
        g_pp.m=m; g_pp.started=1; return;
    }
#endif
    g_pp.m=m; g_pp.nw=g_pipe_nw; if(g_pp.nw>16) g_pp.nw=16; if(g_pp.nw<1) g_pp.nw=1;
    atomic_store(&g_pp.cur,0); atomic_store(&g_pp.njobs,0);
    pthread_mutex_init(&g_pp.mx,NULL); pthread_cond_init(&g_pp.cv,NULL);
    pthread_cond_init(&g_pp.cv_done,NULL);
    for(int i=0;i<g_pp.nw;i++) pthread_create(&g_pp.th[i],NULL,pipe_worker,NULL);
    g_pp.started=1;
}
/* enqueue `njobs` loads (slots ws[0..njobs)); returns immediately, workers run ahead.
 * Order is load-bearing: write all batch state RELAXED, then RELEASE-store cur to
 * publish it, then wake parked workers. */
static void pipe_dispatch(Model *m,int layer,const int *eids,int njobs){
#ifdef __linux__
    if(g_uring){
        uring_batch_reset(&g_ub_pipe);
        for(int q=0;q<njobs;q++){
            int li=uring_load_add(&g_ub_pipe,m,layer,eids[q],&m->ws[q],1);
            if(li!=q){ fprintf(stderr,"URING: expert batch overflow\n"); exit(1); }
        }
        if(uring_submit_batch(&g_ub_pipe)){ perror("URING: submit"); exit(1); }
        return;
    }
#endif
    g_pp.m=m;
    atomic_store_explicit(&g_pp.njobs,njobs,memory_order_relaxed);
    atomic_store_explicit(&g_pp.layer,layer,memory_order_relaxed);
    for(int q=0;q<njobs;q++) atomic_store_explicit(&g_pp.eids[q],eids[q],memory_order_relaxed);
    for(int q=0;q<njobs;q++) atomic_store_explicit(&g_pp.ready[q],0,memory_order_relaxed); /* reset BEFORE publish */
    uint64_t g=(atomic_load_explicit(&g_pp.cur,memory_order_relaxed)>>8)+1;
    atomic_store_explicit(&g_pp.cur,(g<<8),memory_order_release);                          /* PUBLISH */
    pthread_mutex_lock(&g_pp.mx); pthread_cond_broadcast(&g_pp.cv); pthread_mutex_unlock(&g_pp.mx);
}
static inline void pipe_wait(int q){
#ifdef __linux__
    if(g_uring){
        if(uring_finalize_load(&g_ub_pipe,q,1)){ perror("URING: expert load"); exit(1); }
        return;
    }
#endif
    if(g_pipe_block){
        /* Fast path senza lock; poi ri-verifica SOTTO il lock prima di ogni
         * wait. EN: the worker stores ready (release) BEFORE it takes mx to
         * broadcast, so a set flag can never be missed (no lost wakeup). */
        if(atomic_load_explicit(&g_pp.ready[q],memory_order_acquire)) return;
        pthread_mutex_lock(&g_pp.mx);
        while(!atomic_load_explicit(&g_pp.ready[q],memory_order_acquire))
            pthread_cond_wait(&g_pp.cv_done,&g_pp.mx);
        pthread_mutex_unlock(&g_pp.mx);
        return;
    }
    while(!atomic_load_explicit(&g_pp.ready[q],memory_order_acquire)) sched_yield();
}

#ifdef COLI_CUDA
static void expert_host_release(Model *m, ESlot *s){
    if(!s->slab&&!s->fslab) return;
#if defined(__APPLE__) || defined(__linux__) || defined(__FreeBSD__)
    if(s->slab) munlock(s->slab,(size_t)s->slab_cap);
    if(s->fslab) munlock(s->fslab,(size_t)s->fslab_cap*sizeof(float));
#elif defined(_WIN32)
    if(s->slab) compat_munlock(s->slab,(size_t)s->slab_cap);
    if(s->fslab) compat_munlock(s->fslab,(size_t)s->fslab_cap*sizeof(float));
#endif
    int64_t bytes=qt_bytes(&s->g)+qt_bytes(&s->u)+qt_bytes(&s->d);
    /* slab is posix_memalign'd: on Windows that is _aligned_malloc, and plain
     * free() corrupts the CRT heap (0xC0000374) — same bug the compat.h audit
     * fixed at the original expert_load site. fslab is plain malloc/falloc
     * on the CPU path, so its free() stays plain (Metal path frees it before
     * re-alloc and never reaches here with an aligned fslab on _WIN32). */
    if(s->aslab){ s->slab=NULL; s->fslab=NULL; }  /* arena slice (#419): detach, keep caps, never free */
    else { compat_aligned_free(s->slab); free(s->fslab); s->slab=NULL; s->fslab=NULL; s->slab_cap=s->fslab_cap=0; }
    QT *q[3]={&s->g,&s->u,&s->d};
    for(int k=0;k<3;k++){ q[k]->qf=NULL; q[k]->q8=NULL; q[k]->q4=NULL; q[k]->s=NULL; }
    m->resident_bytes-=bytes; if(m->resident_bytes<0) m->resident_bytes=0;
}
static void expert_host_ensure(Model *m, int layer, ESlot *s){
    if(s->slab) return;
    if(s->aslab){ s->slab=s->aslab; s->fslab=s->afslab; }  /* re-attach the arena slice; caps survived release */
    /* re-materializing a GPU-resident expert's host copy, not a routing miss: demand=0 */
    expert_load(m,layer,s->eid,s,1,0);                     /* rebuild the QT views (release NULLed them) + reload */
}
#endif

/* prefetch asincrono dei pesi di un expert (e delle sue scale .qs): avvia il readahead
 * cosi' le letture sincrone successive trovano la page-cache calda.
 * Sotto g_direct i PESI vengono letti con O_DIRECT (bypassa la page-cache, vedi
 * expert_load): il WILLNEED su di essi scalda pagine che la lettura di domanda non
 * consuma -> readahead sprecato sul disco, la risorsa piu' scarsa nello streaming.
 * Le scale .qs restano SEMPRE bufferizzate (pread sul fd normale), quindi il loro
 * WILLNEED resta utile anche con DIRECT=1. fadvise e' solo consultivo: saltarlo non
 * cambia mai l'output (bit-identico), riduce solo I/O sprecato.
 * The readahead targets the SAME replica that will serve the pread (expert_route
 * is deterministic).
 * EN: under O_DIRECT the weights bypass the page cache, so their WILLNEED is wasted;
 * the .qs scales are always buffered, so keep theirs. Advisory hint -> output-preserving. */
static void expert_prefetch(Model *m, int layer, int eid){
    char nm[300]; int rep=expert_route(layer,eid);
    const char *suf[3]={"gate_proj.weight","up_proj.weight","down_proj.weight"};
    for(int k=0;k<3;k++){
        snprintf(nm,sizeof(nm),"model.layers.%d.mlp.experts.%d.%s",layer,eid,suf[k]);
        if(!g_direct) st_prefetch_rep(&m->S,nm,rep);
        char qs[320]; snprintf(qs,sizeof(qs),"%s.qs",nm); st_prefetch_rep(&m->S,qs,rep);
    }
}

/* ---- helper per l'ABSORPTION: accesso per-riga ai QT quantizzati ---- */
/* acc[0..I) += coef * W[row,:] (dequant al volo) */
static void qt_addrow(const QT *t, int row, float coef, float *acc){
    int I=t->I;
    if(t->fmt==0){ const float *w=t->qf+(int64_t)row*I; for(int i=0;i<I;i++) acc[i]+=coef*w[i]; return; }
    /* fmt=4 PRIMA del calcolo di c: s[] e' [O,ng] per-gruppo, s[row] sarebbe la scala
     * sbagliata. Senza questo ramo il fall-through int2 decodificava i nibble int4 come
     * coppie di valori a 2 bit — lo stesso bug di #298 sui kernel absorb CUDA, lato CPU.
     * EN: fmt=4 BEFORE computing c: s[] is [O,ng] per-group, s[row] would be the wrong
     * scale. Without this branch the int2 fall-through decoded int4 nibbles as pairs of
     * 2-bit values — the same bug #298 fixed in the CUDA absorb kernels, CPU side. */
    if(t->fmt==4){ const uint8_t *w=t->q4+(int64_t)row*((I+1)/2);
        int gs=t->gs, ng=(I+gs-1)/gs; const float *scl=t->s+(int64_t)row*ng;
        for(int i=0;i+1<I;i+=2){ uint8_t b=w[i>>1];
            acc[i]  +=coef*scl[i/gs]    *((int)(b&0xF)-8);
            acc[i+1]+=coef*scl[(i+1)/gs]*((int)(b>>4)-8); }
        if(I&1){ uint8_t b=w[I>>1]; acc[I-1]+=coef*scl[(I-1)/gs]*((int)(b&0xF)-8); } return; }
    /* fmt=5 likewise before c: int3-g64 scales are per-GROUP [O,ng], not s[row] */
    if(t->fmt==5){ const uint8_t *w=t->q4+(int64_t)row*i3_rowbytes(I);
        const float *sr=t->s+(int64_t)row*i3_groups(I); int64_t ng=i3_groups(I);
        for(int64_t g=0; g<ng; g++){ const uint8_t *lo=w+g*I3_GBYTES, *hi=lo+16;
            float cg=coef*sr[g]; int base=(int)(g*I3_GROUP), n=I-base<I3_GROUP?I-base:I3_GROUP;
            for(int k=0;k<n;k++){ unsigned u=((lo[k>>2]>>((k&3)*2))&3)|(((hi[k>>3]>>(k&7))&1)<<2);
                acc[base+k]+=cg*(float)((int)u-4); } }
        return; }
    float c=coef*t->s[row];
    if(t->fmt==1){ const int8_t *w=t->q8+(int64_t)row*I; for(int i=0;i<I;i++) acc[i]+=c*(float)w[i]; return; }
    if(t->fmt==2){ const uint8_t *w=t->q4+(int64_t)row*((I+1)/2);
#if defined(__AVX512F__) && defined(__AVX512BW__)
        axpy_i4f_avx512(w,c,acc,I); return;   /* bit-identical: one fma per element */
#endif
        for(int i=0;i+1<I;i+=2){ uint8_t b=w[i>>1]; acc[i]+=c*((int)(b&0xF)-8); acc[i+1]+=c*((int)(b>>4)-8); }
        if(I&1){ uint8_t b=w[I>>1]; acc[I-1]+=c*((int)(b&0xF)-8); } return; }
    const uint8_t *w=t->q4+(int64_t)row*((I+3)/4);
    for(int i=0;i<I;i++){ uint8_t b=w[i>>2]; acc[i]+=c*((int)((b>>((i&3)*2))&3)-2); }
}
/* y[0..n) = W[r0+j,:]·x  (matvec su una FETTA di righe del QT) */
static void qt_matvec_rows(const QT *t, int r0, int n, const float *x, float *y){
    int I=t->I;
    for(int j=0;j<n;j++){ int row=r0+j; double a=0;
        if(t->fmt==0){ const float *w=t->qf+(int64_t)row*I; for(int i=0;i<I;i++) a+=(double)w[i]*x[i]; }
        else if(t->fmt==4){ /* grouped int4: per-group scale */
            const uint8_t *w=t->q4+(int64_t)row*((I+1)/2); int gs=t->gs,ng=(I+gs-1)/gs;
            const float *scl=t->s+(int64_t)row*ng;
            for(int g=0;g*gs<I;g++){ int base=g*gs,glen=gs; if(base+glen>I)glen=I-base; float sc=scl[g]; float acc=0;
                for(int i=base;i+1<base+glen;i+=2){ uint8_t b=w[i>>1]; acc+=((int)(b&0xF)-8)*x[i]+((int)(b>>4)-8)*x[i+1]; }
                if(glen&1){ uint8_t b=w[(base+glen-1)>>1]; acc+=((int)(b&0xF)-8)*x[base+glen-1]; }
                a+=acc*sc; } }
        else if(t->fmt==1){ const int8_t *w=t->q8+(int64_t)row*I; float s=t->s[row];
            float acc=0; for(int i=0;i<I;i++) acc+=(float)w[i]*x[i]; a=acc*s; }
        else if(t->fmt==2){ const uint8_t *w=t->q4+(int64_t)row*((I+1)/2); float s=t->s[row]; float acc=0;
#if defined(__AVX512F__) && defined(__AVX512BW__)
            /* same accumulation-order tradeoff (and gate) as matmul_i4's I4_ACC512 path */
            if(g_i4_acc512 && !(I&31)){ y[j]=dot_i4f_avx512(w,x,I)*s; continue; }
#endif
            for(int i=0;i+1<I;i+=2){ uint8_t b=w[i>>1]; acc+=((int)(b&0xF)-8)*x[i]+((int)(b>>4)-8)*x[i+1]; }
            if(I&1){ uint8_t b=w[I>>1]; acc+=((int)(b&0xF)-8)*x[I-1]; } a=acc*s; }
        else if(t->fmt==4){ /* per-gruppo, come matmul_i4_grouped / per-group, as matmul_i4_grouped */
            const uint8_t *w=t->q4+(int64_t)row*((I+1)/2);
            int gs=t->gs, ng=(I+gs-1)/gs; const float *scl=t->s+(int64_t)row*ng;
            for(int g=0; g*gs<I; g++){ int base=g*gs, end=base+gs>I?I:base+gs; float acc=0;
                for(int i=base;i<end;i++){ uint8_t b=w[i>>1];
                    acc+=(float)((i&1)?((int)(b>>4)-8):((int)(b&0xF)-8))*x[i]; }
                a+=(double)acc*scl[g]; } }
        else if(t->fmt==5){ const uint8_t *w=t->q4+(int64_t)row*i3_rowbytes(I);
            const float *sr=t->s+(int64_t)row*i3_groups(I); int64_t ng=i3_groups(I);
            for(int64_t g=0; g<ng; g++){ const uint8_t *lo=w+g*I3_GBYTES, *hi=lo+16;
                int base=(int)(g*I3_GROUP), n=I-base<I3_GROUP?I-base:I3_GROUP; float acc=0;
                for(int k=0;k<n;k++){ unsigned u=((lo[k>>2]>>((k&3)*2))&3)|(((hi[k>>3]>>(k&7))&1)<<2);
                    acc+=(float)((int)u-4)*x[base+k]; }
                a+=(double)(acc*sr[g]); } }
        else { const uint8_t *w=t->q4+(int64_t)row*((I+3)/4); float s=t->s[row]; float acc=0;
            for(int i=0;i<I;i++){ uint8_t b=w[i>>2]; acc+=((int)((b>>((i&3)*2))&3)-2)*x[i]; } a=acc*s; }
        y[j]=(float)a;
    }
}
static int g_absorb=-1;
#ifdef COLI_CUDA
static int g_cuda_pipe=0;   /* COLI_CUDA_PIPE=1: prefill attention chain resident on the layer home device */
static int g_cuda_router=0; /* COLI_CUDA_ROUTER=1 (#431 PR-A): router on the layer home device at decode */
static int g_cuda_resid=0;  /* COLI_CUDA_RESID=1 (#431 PR-C0): expert-group results stay on device */
/* pipe -> moe handoff for the resident group path (set per layer by
 * pipe_layer_sparse, consumed by moe()'s group dispatch, cleared after take) */
static int g_pres_home=-1;                /* home device, -1 = path off        */
static const float *g_pres_xsrc;          /* nrm_d on the home device          */
static float *g_pres_slots;               /* [ndev][D] partial slots on home   */
static int g_pres_used[COLI_CUDA_MAX_DEVICES], g_pres_nused;
#endif   /* ABSORB: -1 auto (decode S<=4), 0 mai, 1 sempre (test) */
static int g_dsa_force=0; /* DSA_FORCE=1: selezione sempre attiva (test: top-min(k,T)=denso) */
static int cmp_fdesc(const void *a,const void *b){
    float x=*(const float*)a, y=*(const float*)b; return x<y?1:x>y?-1:0; }

/* PARTIAL SELECT (quickselect, Hoare partition, DESCending). After this call the k
 * LARGEST elements of a[0..n) are in a[0..k) in unspecified order; the (k+1)-th and
 * beyond are untouched-or-smaller. O(n) average, O(n^2) pathological (mitigated by
 * median-of-three below) — and unlike a full qsort it never orders more than needed.
 *
 * Why this exists (#356): the DSA top-keep in attention_rows previously full-qsorted
 * all nk context scores (O(nk log nk)) per layer per token just to read ONE value --
 * the keep-th largest (the threshold). quickselect finds that pivot in O(nk) average,
 * and the position-order scans that build dst[] are unchanged, so the kept set is
 * bit-identical. Mirrors the sampling-side fix in #335 (heap partial-select there).
 *
 * NOT a stable partition: callers must derive the threshold and then re-scan the
 * ORIGINAL array (the DSA code does exactly this) rather than reading a[0..k). */
static void partial_select_desc(float *a, int n, int k){
    if(k<=0) return;
    if(k>=n) return;                 /* nothing to partition: all kept */
    int lo=0, hi=n-1;
    while(lo<hi){
        /* median-of-three pivot to dodge the O(n^2) path on sorted/reverse input */
        int mid=lo+((hi-lo)>>1);
        if(a[mid]>a[lo]){ float t=a[lo]; a[lo]=a[mid]; a[mid]=t; }
        if(a[hi]>a[lo]){  float t=a[lo]; a[lo]=a[hi];  a[hi]=t;  }
        if(a[mid]>a[hi]){ float t=a[hi]; a[hi]=a[mid]; a[mid]=t; }
        float piv=a[hi];
        int i=lo, j=hi;
        for(;;){
            while(a[i]>piv) i++;     /* desc: large values go left */
            while(j>lo && a[j]<piv) j--;
            if(i>=j) break;
            float t=a[i]; a[i]=a[j]; a[j]=t; i++; if(i>j) break; j--;
        }
        /* partition point: a[lo..i) are all >= piv, a[i..hi] are all <= piv */
        if(k<=i-1) hi=i-1;          /* the k-th largest is in the left partition */
        else       lo=i;            /* it's in the right partition */
    }
}

/* attenzione MLA con KV-cache compressa, su token nuovi x[S,hidden], pos_base = pos del primo */
/* kvs/pos describe a ragged decode batch: each row may belong to a different
 * sequence.  NULL keeps the original contiguous, currently-bound KV path. */
#ifdef COLI_CUDA
/* Ombra KV su device per il DECODE: righe [0,upto) valide sulla scheda di kv_b.
 * L'host resta canonico; l'ombra si riallinea in blocco quando resta indietro e
 * viene invalidata da kv_bind / dalla riscrittura di righe gia' specchiate. */
static int kv_dev_sync(Model *m, Layer *l, int layer, int upto){
    Cfg *c=&m->c; int kvl=c->kv_lora, R=c->qk_rope, dev=l->kv_b.cuda_device;
    if(upto>m->max_t) return 0;
    if(!m->kv_dev_L[layer]){
        m->kv_dev_L[layer]=(float*)coli_cuda_pipe_alloc(dev,(size_t)m->max_t*kvl*4);
        m->kv_dev_R[layer]=(float*)coli_cuda_pipe_alloc(dev,(size_t)m->max_t*R*4);
        m->kv_dev_valid[layer]=0;
        if(!m->kv_dev_L[layer]||!m->kv_dev_R[layer]) return 0;
    }
    int v=m->kv_dev_valid[layer];
    if(v<upto){
        if(!coli_cuda_pipe_upload(dev,m->kv_dev_L[layer]+(size_t)v*kvl,
            coli_kv_row(m->kv->Lc[layer],v,kvl),(size_t)(upto-v)*kvl*4)||
           !coli_cuda_pipe_upload(dev,m->kv_dev_R[layer]+(size_t)v*R,
            coli_kv_row(m->kv->Rc[layer],v,R),(size_t)(upto-v)*R*4)) return 0;
        m->kv_dev_valid[layer]=upto;
    }
    return 1;
}

/* Inc.1a — catena attention residente sul device del layer / attention chain
 * resident on the layer home device. Proiezioni q/kv, norme, RoPE, batch
 * attention e o_proj girano sulla scheda di kv_b; scaricano solo out [S,D],
 * i nuovi record KV [S,kvl+R] e nulla altro. Ritorna 0 su qualsiasi errore:
 * il chiamante riesegue il percorso CPU (idempotente). */
static int attn_pipe_prefill(Model *m, Layer *l, int layer, const float *x, int x_is_dev,
                             int S, int pos_base, float *out, float *out_dev){
    Cfg *c=&m->c; int H=c->n_heads, D=c->hidden, qh=c->qk_head;
    int kvl=c->kv_lora, R=c->qk_rope, ql=c->q_lora;
    int dev=l->kv_b.cuda_device;
    if(l->q_a.cuda_device!=dev||l->q_b.cuda_device!=dev||
       l->kv_a.cuda_device!=dev||l->o.cuda_device!=dev) return 0;
    int st0=m->kv_start[layer], T=pos_base+S-st0, old=pos_base-st0;
    if(T<S||T>8192) return 0;
    double t0=now_s();
    size_t xb=(size_t)S*D*4, qrb=(size_t)S*ql*4, qb=(size_t)S*H*qh*4;
    size_t cb=(size_t)S*(kvl+R)*4, lb=(size_t)T*kvl*4, rb=(size_t)T*R*4;
    float *chost=NULL; int ok=0;
    /* scratch persistenti (slot fissi per device): zero churn di cudaMalloc */
    float *xd =x_is_dev?(float*)x:coli_cuda_pipe_scratch(dev,0,xb);
    float *qrd=coli_cuda_pipe_scratch(dev,1,qrb);
    float *qd =coli_cuda_pipe_scratch(dev,2,qb),  *cd =coli_cuda_pipe_scratch(dev,3,cb);
    float *ld_=coli_cuda_pipe_scratch(dev,4,lb),  *rd =coli_cuda_pipe_scratch(dev,5,rb);
    float *w1 =coli_cuda_pipe_scratch(dev,6,(size_t)ql*4);
    float *w2 =coli_cuda_pipe_scratch(dev,7,(size_t)kvl*4);
    chost=(float*)malloc(cb);
    if(!xd||!qrd||!qd||!cd||!ld_||!rd||!w1||!w2||!chost) goto done;
    if((!x_is_dev&&!coli_cuda_pipe_upload(dev,xd,x,xb))||
       !coli_cuda_pipe_upload(dev,w1,l->q_a_ln,(size_t)ql*4)||
       !coli_cuda_pipe_upload(dev,w2,l->kv_a_ln,(size_t)kvl*4)) goto done;
    /* proiezioni + norme + rope, tutto sul device */
    if(!coli_cuda_pipe_gemm(l->q_a.cuda,qrd,xd,S)) goto done;
    if(!coli_cuda_pipe_rmsnorm(dev,qrd,qrd,w1,S,ql,c->eps)) goto done;
    if(!coli_cuda_pipe_gemm(l->q_b.cuda,qd,qrd,S)) goto done;
    if(!coli_cuda_pipe_rope_base(dev,qd,pos_base,S*H,qh,c->qk_nope,R,H,c->theta)) goto done;
    if(!coli_cuda_pipe_gemm(l->kv_a.cuda,cd,xd,S)) goto done;
    if(!coli_cuda_pipe_rmsnorm_s(dev,cd,cd,w2,S,kvl,c->eps,kvl+R,kvl+R)) goto done;
    if(!coli_cuda_pipe_rope_base(dev,cd,pos_base,S,kvl+R,kvl,R,1,c->theta)) goto done;
    /* cache latente [T,kvl] + rot [T,R] contigue: righe vecchie da host, nuove da cd */
    if(old>0){
        if(!coli_cuda_pipe_upload(dev,ld_,coli_kv_row(m->Lc[layer],st0,kvl),(size_t)old*kvl*4)||
           !coli_cuda_pipe_upload(dev,rd,coli_kv_row(m->Rc[layer],st0,R),(size_t)old*R*4)) goto done;
    }
    if(!coli_cuda_pipe_copy2d(dev,ld_+(size_t)old*kvl,kvl,cd,kvl+R,kvl,S)) goto done;
    if(!coli_cuda_pipe_copy2d(dev,rd+(size_t)old*R,R,cd+kvl,kvl+R,R,S)) goto done;
    /* KV host resta canonica: scarica i record nuovi (gia' normati+ropati) */
    if(!coli_cuda_pipe_download(dev,cd,chost,cb)) goto done;
    for(int s=0;s<S;s++){
        memcpy(coli_kv_row(m->Lc[layer],pos_base+s,kvl),chost+(size_t)s*(kvl+R),kvl*4);
        memcpy(coli_kv_row(m->Rc[layer],pos_base+s,R),chost+(size_t)s*(kvl+R)+kvl,R*4);
    }
    if(m->kv_dev_valid[layer]>pos_base) m->kv_dev_valid[layer]=pos_base;
    m->t_aproj+=now_s()-t0; t0=now_s();
#ifdef COLI_CUDA
    /* Negativo (2026-07-13): P2P a stella dal device di casa serializza ~95MB/layer
     * sul suo link PCIe — attention 26->41-44s. Resta opt-in per topologie NVLink. */
    if(out_dev && l->n_kv_b_shard>1 &&
       getenv("COLI_CUDA_PIPE_SHARD") && atoi(getenv("COLI_CUDA_PIPE_SHARD"))){
        /* head-shard nel pipeline: q gia' sul device di casa. Per ogni scheda:
         * slice di q (repack strided->contiguo), broadcast latent+rope via P2P,
         * score parallelo sui rispettivi head, ctx slice riportata a casa e
         * ricomposta, poi o_proj residente. */
        int n=l->n_kv_b_shard, vh=c->v_head;
        size_t ctxb=(size_t)S*H*vh*4;
        size_t stage_one=(size_t)S*H*(size_t)(c->qk_head>vh?c->qk_head:vh)*4;
        float *ctx_full=coli_cuda_pipe_scratch(dev,16,ctxb);
        float *stage=coli_cuda_pipe_scratch(dev,17,stage_one*n);
        int ok_sh=(ctx_full&&stage)?1:0;
        if(ok_sh){
            #pragma omp parallel for schedule(static) reduction(&:ok_sh)
            for(int d2=0;d2<n;d2++){
                int hn=l->shard_hn[d2], h0=l->shard_h0[d2];
                int sdev=coli_cuda_tensor_device(l->kv_b_shard[d2]);
                float *st=stage+(size_t)d2*(stage_one/4);
                size_t qsb=(size_t)S*hn*qh*4, csb=(size_t)S*hn*vh*4;
                float *qs_r=coli_cuda_pipe_scratch(sdev,18,qsb);
                float *ld_r=coli_cuda_pipe_scratch(sdev,19,(size_t)T*kvl*4);
                float *rr_r=coli_cuda_pipe_scratch(sdev,20,(size_t)T*R*4);
                float *cx_r=coli_cuda_pipe_scratch(sdev,21,csb);
                int okd=qs_r&&ld_r&&rr_r&&cx_r;
                /* slice di q: [S,H,qh] -> [S,hn,qh] contigua sul device di casa */
                okd=okd&&coli_cuda_pipe_copy2d(dev,st,hn*qh,qd+(size_t)h0*qh,H*qh,hn*qh,S);
                okd=okd&&coli_cuda_pipe_peer_copy(sdev,qs_r,dev,st,qsb);
                okd=okd&&coli_cuda_pipe_peer_copy(sdev,ld_r,dev,ld_,(size_t)T*kvl*4);
                okd=okd&&coli_cuda_pipe_peer_copy(sdev,rr_r,dev,rd,(size_t)T*R*4);
                okd=okd&&coli_cuda_attention_absorb_batch_dev(l->kv_b_shard[d2],cx_r,qs_r,ld_r,rr_r,
                        S,hn,c->qk_nope,R,vh,kvl,T,c->attn_scale);
                okd=okd&&coli_cuda_pipe_peer_copy(dev,st,sdev,cx_r,csb);
                okd=okd&&coli_cuda_pipe_copy2d(dev,ctx_full+(size_t)h0*vh,H*vh,st,hn*vh,hn*vh,S);
                ok_sh&=okd;
            }
        }
        if(ok_sh){
            ok=coli_cuda_pipe_gemm(l->o.cuda,out_dev,ctx_full,S)&&coli_cuda_pipe_sync(dev);
        } else ok=0;
        if(!ok)
            ok=coli_cuda_attention_project_batch_dev_out(l->kv_b.cuda,l->o.cuda,out_dev,qd,ld_,rd,
                S,H,c->qk_nope,R,c->v_head,kvl,T,c->attn_scale);
    } else
#endif
    ok=out_dev?coli_cuda_attention_project_batch_dev_out(l->kv_b.cuda,l->o.cuda,out_dev,qd,ld_,rd,
            S,H,c->qk_nope,R,c->v_head,kvl,T,c->attn_scale)
              :coli_cuda_attention_project_batch_dev(l->kv_b.cuda,l->o.cuda,out,qd,ld_,rd,
            S,H,c->qk_nope,R,c->v_head,kvl,T,c->attn_scale);
    m->t_acore+=now_s()-t0;
done:
    free(chost);                              /* gli scratch device restano al contesto */
    return ok;
}
#endif

static void attention_rows(Model *m, Layer *l, int layer, float *x, int S, int pos_base,
                           KVState *const *kvs, const int *positions, float *out){
    Cfg *c=&m->c; int H=c->n_heads, D=c->hidden, qh=c->qk_head, vh=c->v_head;
    int kvb_dim=H*(c->qk_nope+vh), Tk=pos_base+S;
    double ta0=now_s();
#ifdef COLI_METAL
    /* Fused decode attention on GPU: whole layer in one command buffer (keeps the GPU hot).
     * S<=4 absorption path with st0==0, DSA selection inactive, and GLM-5.2 int4 dims.
     * RAGGED GUARD (!kvs): the kernel takes ONE Lc/Rc pair and ONE pos_base — it assumes
     * row s is token pos_base+s of the SAME sequence. The batched mux decode
     * (step_decode_batch) passes per-row kvs[]/positions[] with pos_base=0, so the kernel
     * would rope every row at position 0 and attend over a 1-token window of the wrong
     * cache -> greedy decode hits EOS at token 2 (mux answers truncated to 1 token).
     * Ragged rows take the CPU absorb path below, which reads kvs[s]/positions[s]. */
    if(g_metal_enabled && !kvs && S<=4 && (g_absorb==1||(g_absorb<0&&S<=4)) && m->kv_start[layer]==0
       && D==6144 && H==64 && c->q_lora==2048 && c->kv_lora==512 && c->qk_nope==192
       && c->qk_rope==64 && vh==256 && l->kv_b.fmt==2){
        int sel_active = m->has_dsa && layer<c->n_layers && c->idx_type[layer] && (pos_base+S) > c->index_topk;
        if(!sel_active){
            if(m->has_dsa && layer<c->n_layers && c->idx_type[layer]){   /* index keys for future selection */
                for(int s=0;s<S;s++){ int pos=pos_base+s; float *kd=m->Ic[layer]+(int64_t)pos*c->index_hd;
                    matmul_qt(kd, x+(int64_t)s*D, &m->ix_wk[layer], 1);
                    layernorm(kd, m->ix_knw[layer], m->ix_knb[layer], c->index_hd, 1e-6f);
                    rope_interleave(kd, pos, c); }
            }
            #define WP_(q) ((q).fmt==1?(const void*)(q).q8:(const void*)(q).q4)
            int ok = coli_metal_attn_decode(x,
                WP_(l->q_a), l->q_a.s, l->q_a.fmt, l->q_a_ln,
                WP_(l->q_b), l->q_b.s, l->q_b.fmt,
                WP_(l->kv_a), l->kv_a.s, l->kv_a.fmt, l->kv_a_ln,
                WP_(l->kv_b), l->kv_b.s, l->kv_b.fmt,
                WP_(l->o), l->o.s, l->o.fmt,
                m->Lc[layer], m->Rc[layer], S, pos_base, m->kv_start[layer], c->eps, c->theta, c->attn_scale, out);
            #undef WP_
            if(ok){ m->t_attn += now_s()-ta0; return; }
        }
    }
#endif
    float *ctx=falloc((int64_t)S*H*vh);
    float *Q=falloc((int64_t)S*H*qh);                  /* query (roped) dei token nuovi */
    int cw=c->kv_lora+c->qk_rope;
    float *QR=falloc((int64_t)S*c->q_lora), *comp=falloc((int64_t)S*cw);
    /* 1) query roped + latente normato e k_rot roped -> in cache.
     * QR tiene il residuo q_a per TUTTE le posizioni: serve anche all'indexer DSA.
     *
     * BATCH-ROWS: le tre proiezioni girano su tutte le S righe in un colpo solo, come gia' fa
     * o_proj (matmul_qt(...,S) sotto) e come fa moe() con la batch-union. Una riga per volta
     * il peso veniva ri-letto per OGNI token; a S righe si legge una volta sola.
     * matmul_qt_ex(...,0): restano sul kernel int4 ESATTO. Con l'IDOT (che il gate S>=g_i4s
     * abiliterebbe da solo appena S>1) il prefill sarebbe molto piu' veloce ma la qualita'
     * cala: -5040.33 -> -5158.68 di log-lik su 1023 token (~+12% perplexity). Il batch da
     * solo e' bit-identical all'originale; il kernel no. Vedi issue.
     * EN: batch the three projections over all S rows, like o_proj below and moe()'s
     * batch-union. matmul_qt_ex(...,0) keeps them on the EXACT int4 kernel: letting S>1 pull
     * them into IDOT is much faster but costs ~12% perplexity (measured). Batching alone is
     * bit-identical to upstream; the kernel switch is not. */
    int pipe_done=0;
#ifdef COLI_CUDA
    if(g_cuda_pipe&&!kvs&&S>=8&&layer<c->n_layers&&g_cuda_enabled&&c->kv_lora<=512&&
       !(m->has_dsa&&pos_base+S>c->index_topk)&&
       l->q_a.cuda_eligible&&l->q_b.cuda_eligible&&l->kv_a.cuda_eligible&&
       l->kv_b.cuda_eligible&&l->o.cuda_eligible&&
       qt_cuda_upload(&l->q_a)&&qt_cuda_upload(&l->q_b)&&qt_cuda_upload(&l->kv_a)&&
       qt_cuda_upload(&l->kv_b)&&qt_cuda_upload(&l->o))
        pipe_done=attn_pipe_prefill(m,l,layer,x,0,S,pos_base,out,NULL);
#endif
    if(!pipe_done){
        matmul_qt_ex(QR, x, &l->q_a, S, 0);
        for(int s=0;s<S;s++){ float *qr=QR+(int64_t)s*c->q_lora;
            rmsnorm(qr, qr, l->q_a_ln, c->q_lora, c->eps); }         /* q_b legge il residuo NORMATO */
        matmul_qt_ex(Q, QR, &l->q_b, S, 0);
        matmul_qt_ex(comp, x, &l->kv_a, S, 0);
    }
    if(!pipe_done) for(int s=0;s<S;s++){
        KVState *ks=kvs?kvs[s]:m->kv;
        int pos=positions?positions[s]:pos_base+s;
        float *qfull=Q+(int64_t)s*H*qh;
        for(int h=0;h<H;h++) rope_interleave(qfull+(int64_t)h*qh+c->qk_nope, pos, c);
        const float *cs=comp+(int64_t)s*cw;
        float *Ldst=coli_kv_row(ks->Lc[layer],pos,c->kv_lora);
        float *Rdst=coli_kv_row(ks->Rc[layer],pos,c->qk_rope);
#ifdef COLI_CUDA
        if(ks==m->kv&&m->kv_dev_valid&&layer<=c->n_layers&&m->kv_dev_valid[layer]>pos)
            m->kv_dev_valid[layer]=pos;              /* riga riscritta: l'ombra si accorcia */
#endif
        memcpy(Ldst, cs, c->kv_lora*sizeof(float));
        rmsnorm(Ldst, Ldst, l->kv_a_ln, c->kv_lora, c->eps);     /* latente normato */
        memcpy(Rdst, cs+c->kv_lora, c->qk_rope*sizeof(float));
        rope_interleave(Rdst, pos, c);                            /* k_rot roped, condiviso fra teste */
    }
    /* ---- DSA lightning indexer ----
     * Layer FULL: k_idx dei token nuovi in cache + selezione top-k per query (riusata
     * dai layer SHARED successivi). Selezione attiva solo con contesto > index_topk
     * (o DSA_FORCE=1 per il test: selezionare TUTTO deve dare l'output denso esatto). */
    const int *dsel=NULL, *dnsel=NULL; int dtopk=0;
    if(m->has_dsa && layer<c->n_layers && ((!kvs && m->kv_start[layer]==0) || kvs)){
        int nh=c->index_nh, hd=c->index_hd; dtopk=c->index_topk;
        if(c->idx_type[layer]){
            /* BATCH-ROWS, come le proiezioni di attenzione sopra: ix_wk (D x index_hd) veniva
             * ri-letto per OGNI token. matmul_qt_ex(...,0) lo tiene sul kernel int4 ESATTO:
             * il batch da solo supererebbe il gate S>=g_i4s e cambierebbe la quantizzazione
             * delle attivazioni. Cosi' l'output resta bit-identical.
             * EN: batch ix_wk over all S rows like the attention projections; allow_idot=0
             * keeps it on the exact int4 kernel so the result stays bit-identical. */
            float *KD=falloc((int64_t)S*hd);
            matmul_qt_ex(KD, x, &m->ix_wk[layer], S, 0);
            for(int s=0;s<S;s++){
                KVState *ks=kvs?kvs[s]:m->kv;
                int pos=positions?positions[s]:pos_base+s;
                float *kd=coli_kv_row(ks->Ic[layer],pos,hd);
                memcpy(kd, KD+(int64_t)s*hd, (size_t)hd*sizeof(float));
                layernorm(kd, m->ix_knw[layer], m->ix_knb[layer], hd, 1e-6f);
                rope_interleave(kd, pos, c);                 /* primi qk_rope dim, interleaved */
            }
            free(KD);
            if((int64_t)S*dtopk > m->dsa_scap){
                free(m->dsa_sel); free(m->dsa_nsel);
                m->dsa_scap=(int64_t)S*dtopk;
                m->dsa_sel=malloc((size_t)m->dsa_scap*sizeof(int));
                m->dsa_nsel=malloc((size_t)S*sizeof(int));
            }
            #pragma omp parallel for schedule(dynamic,1)
            for(int s=0;s<S;s++){
                KVState *ks=kvs?kvs[s]:m->kv;
                int pos=positions?positions[s]:pos_base+s, nk=pos+1;
                if(ks->kv_start[layer]!=0){ m->dsa_nsel[s]=0; continue; }
                if(nk<=dtopk && !g_dsa_force){ m->dsa_nsel[s]=0; continue; }
                int keep = nk<dtopk ? nk : dtopk;
                float *qi=falloc((int64_t)nh*hd);
                matmul_qt(qi, QR+(int64_t)s*c->q_lora, &m->ix_wq[layer], 1);
                for(int h=0;h<nh;h++) rope_interleave(qi+(int64_t)h*hd, pos, c);
                float *w32=falloc(nh);
                matmul_qt(w32, x+(int64_t)s*D, &m->ix_wp[layer], 1);
                float wsc=1.f/sqrtf((float)nh), rs=1.f/sqrtf((float)hd);
                float *isc=falloc(nk);
                for(int t=0;t<nk;t++){
                    const float *kt=coli_kv_row(ks->Ic[layer],t,hd);
                    float a=0;
                    for(int h=0;h<nh;h++){ const float *qhp=qi+(int64_t)h*hd;
                        float d0=0; for(int i=0;i<hd;i++) d0+=qhp[i]*kt[i];
                        d0*=rs; if(d0>0) a+=w32[h]*d0;       /* ReLU sullo score, poi peso */
                    }
                    isc[t]=a*wsc;
                }
                /* top-keep: threshold via PARTIAL SELECT (#356), poi scan in ordine di posizione.
                 * Era un qsort completo su nk (O(nk log nk)); quickselect estrae solo il
                 * keep-esimo valore piu' grande in O(nk) medio. La soglia (= min del blocco
                 * dei keep maggiori) e' identica a tmp[keep-1] del vecchio qsort, quindi i
                 * due scan qui sotto costruiscono dst[] bit-identical. */
                float *tmp=falloc(nk); memcpy(tmp,isc,nk*sizeof(float));
                partial_select_desc(tmp,nk,keep);
                float thr=tmp[0]; for(int t=1;t<keep;t++) if(tmp[t]<thr) thr=tmp[t];
                int *dst=m->dsa_sel+(int64_t)s*dtopk, nd=0;
                for(int t=0;t<nk && nd<keep;t++) if(isc[t]>thr) dst[nd++]=t;
                for(int t=0;t<nk && nd<keep;t++) if(isc[t]==thr) dst[nd++]=t;
                m->dsa_nsel[s]=nd;
                free(qi); free(w32); free(isc); free(tmp);
            }
        }
        if(m->dsa_nsel){ dsel=m->dsa_sel; dnsel=m->dsa_nsel; }
    }
    /* WEIGHT ABSORPTION (DeepSeek): per S piccoli (decode/verifica MTP) NON si ricostruisce
     * k/v per ogni token del contesto. Per linearita':
     *   q·k_nope_t = (W_K^hT q_nope)·L_t      ctx^h = W_V^h (Σ_t a_t L_t)
     * costo per step ~O(T·kv_lora) invece di O(T·H·(nope+vh)) del matmul kvb_all. */
    if(pipe_done){
        free(ctx); free(Q); free(QR); free(comp);
        m->t_attn += now_s()-ta0;
        return;
    }
    int cuda_absorb=0;
#ifdef COLI_CUDA
    cuda_absorb=layer<c->n_layers&&!kvs&&g_cuda_enabled&&getenv("COLI_CUDA_ATTN")&&
                atoi(getenv("COLI_CUDA_ATTN"))&&c->kv_lora<=512;
#endif
    int absorb = kvs || g_absorb==1 || (g_absorb<0 && S<=4) || cuda_absorb;
    if(absorb && c->kv_lora<=512){
        m->t_aproj+=now_s()-ta0; double tac=now_s();
        int kvl=c->kv_lora, r0v=c->qk_nope;      /* offset righe V dentro il blocco di testa */
        /* Punteggi per-thread sul HEAP. Il cap DEVE essere il massimo nt effettivo del
         * batch, non Tk+1: Tk=pos_base+S vale solo quando pos==pos_base+s. Il percorso
         * batched (step_decode_batch da run_serve_mux) passa positions[] e kv_start
         * per-slot, quindi nt=pos+1-st0 puo' superare Tk+1 -> heap-buffer-overflow su
         * sc[jj]. Si conta esattamente come il loop sotto. */
        int64_t sc_cap = 1;
        for(int s=0;s<S;s++){
            KVState *ks=kvs?kvs[s]:m->kv;
            int pos=positions?positions[s]:pos_base+s;
            int st0=ks->kv_start[layer];
            int ns=(dnsel && dnsel[s]>0)?dnsel[s]:0;      /* DSA: top-k, altrimenti range pieno */
            int64_t nt = ns ? (int64_t)ns : (int64_t)pos+1-st0;
            if(nt>sc_cap) sc_cap=nt;
        }
        float *sc_all = falloc((int64_t)omp_get_max_threads()*sc_cap);
        int cuda_core=0,cuda_projected=0;
#ifdef COLI_CUDA
        if(kvs&&g_cuda_enabled&&getenv("COLI_CUDA_ATTN")&&atoi(getenv("COLI_CUDA_ATTN"))&&
           !dnsel&&l->kv_b.cuda_eligible&&l->o.cuda_eligible&&
           qt_cuda_upload(&l->kv_b)&&qt_cuda_upload(&l->o)){
            const float **rl=malloc((size_t)S*sizeof(*rl)),**rr=malloc((size_t)S*sizeof(*rr));
            const void **rk=malloc((size_t)S*sizeof(*rk));
            int *rn=malloc((size_t)S*sizeof(*rn)); int mt=0;
            if(rk&&rl&&rr&&rn){
                for(int s=0;s<S;s++){
                    int pos=positions[s],st0=kvs[s]->kv_start[layer]; rn[s]=pos+1-st0;
                    rk[s]=kvs[s];
                    rl[s]=coli_kv_row(kvs[s]->Lc[layer],st0,kvl);
                    rr[s]=coli_kv_row(kvs[s]->Rc[layer],st0,c->qk_rope);
                    if(rn[s]>mt)mt=rn[s];
                }
                cuda_core=cuda_projected=coli_cuda_attention_project_ragged(l->kv_b.cuda,l->o.cuda,
                    out,Q,rk,rl,rr,rn,S,H,c->qk_nope,c->qk_rope,vh,kvl,mt,c->attn_scale);
            }
            free(rk);free(rl);free(rr);free(rn);
        } else if(cuda_absorb&&l->n_kv_b_shard>1){
            int n=l->n_kv_b_shard,st0=m->kv_start[layer],nt=pos_base+S-st0,ok=1;
            float *qs=falloc((int64_t)S*H*qh),*cs=falloc((int64_t)S*H*vh);
            for(int d=0;d<n;d++)for(int s=0;s<S;s++)memcpy(
                qs+(int64_t)l->shard_h0[d]*S*qh+(int64_t)s*l->shard_hn[d]*qh,
                Q+((int64_t)s*H+l->shard_h0[d])*qh,(size_t)l->shard_hn[d]*qh*sizeof(float));
            #pragma omp parallel for schedule(static) reduction(&:ok)
            for(int d=0;d<n;d++)ok&=coli_cuda_attention_absorb_batch(l->kv_b_shard[d],
                cs+(int64_t)l->shard_h0[d]*S*vh,qs+(int64_t)l->shard_h0[d]*S*qh,
                coli_kv_row(m->Lc[layer],st0,kvl),coli_kv_row(m->Rc[layer],st0,c->qk_rope),
                S,l->shard_hn[d],c->qk_nope,c->qk_rope,vh,kvl,nt,c->attn_scale);
            if(ok)for(int d=0;d<n;d++)for(int s=0;s<S;s++)memcpy(
                ctx+((int64_t)s*H+l->shard_h0[d])*vh,
                cs+(int64_t)l->shard_h0[d]*S*vh+(int64_t)s*l->shard_hn[d]*vh,
                (size_t)l->shard_hn[d]*vh*sizeof(float));
            free(qs);free(cs);cuda_core=ok;
        } else if(cuda_absorb&&l->kv_b.cuda_eligible&&l->o.cuda_eligible&&
           qt_cuda_upload(&l->kv_b)&&qt_cuda_upload(&l->o)){
            int st0=m->kv_start[layer],nt=pos_base+S-st0;
            cuda_core=cuda_projected=coli_cuda_attention_project_batch(l->kv_b.cuda,l->o.cuda,out,Q,
                coli_kv_row(m->Lc[layer],st0,kvl),coli_kv_row(m->Rc[layer],st0,c->qk_rope),
                S,H,c->qk_nope,c->qk_rope,vh,kvl,nt,c->attn_scale);
        } else if(S<=4&&g_cuda_enabled&&getenv("COLI_CUDA_ATTN")&&atoi(getenv("COLI_CUDA_ATTN"))&&
           l->kv_b.cuda_eligible&&qt_cuda_upload(&l->kv_b)){
            cuda_core=1;
            for(int s=0;s<S&&cuda_core;s++){
                KVState *ks=kvs?kvs[s]:m->kv;int pos=positions?positions[s]:pos_base+s;
                int st0=ks->kv_start[layer],nt=pos+1-st0;
                if(dnsel&&dnsel[s]>0){
                    /* Sparse decode used to force the CPU path here: the CUDA
                     * absorb kernel only scans contiguous rows and cannot take
                     * the DSA gather list. COLI_DSA_GATHER=1: gather the
                     * selected top-k rows into a compact staging pair and hand
                     * the dense kernel that instead. Host KV stays canonical —
                     * only ~index_topk rows cross PCIe per (layer, token), so
                     * the device never needs the full context resident (the
                     * first stone of KV tiering). Same row set as the CPU loop
                     * below; results differ only by kernel-family FP order,
                     * the same class of divergence the dense CUDA absorb
                     * already has vs the CPU path (#510). Verified: with
                     * DSA_FORCE=1 (identity selection) output is byte-identical
                     * to the dense CUDA path. */
                    static int dsag=-1;
                    if(dsag<0) dsag=getenv("COLI_DSA_GATHER")?atoi(getenv("COLI_DSA_GATHER")):0;
                    if(!dsag){cuda_core=0;break;}
                    int ns=dnsel[s]; const int *tl=dsel+(int64_t)s*dtopk;
                    float *gl=falloc((int64_t)ns*kvl), *gr=falloc((int64_t)ns*c->qk_rope);
                    for(int jj=0;jj<ns;jj++){
                        memcpy(gl+(int64_t)jj*kvl, coli_kv_row(ks->Lc[layer],tl[jj],kvl), (size_t)kvl*sizeof(float));
                        memcpy(gr+(int64_t)jj*c->qk_rope, coli_kv_row(ks->Rc[layer],tl[jj],c->qk_rope), (size_t)c->qk_rope*sizeof(float));
                    }
                    cuda_core=coli_cuda_attention_absorb(l->kv_b.cuda,ctx+(int64_t)s*H*vh,
                        Q+(int64_t)s*H*qh,gl,gr,H,c->qk_nope,c->qk_rope,vh,kvl,ns,c->attn_scale);
                    free(gl);free(gr);
                    if(!cuda_core)break;    /* CPU fallback recomputes every row: idempotent */
                    continue;
                }
                cuda_core=0;
                if(g_cuda_pipe&&ks==m->kv&&layer<c->n_layers&&kv_dev_sync(m,l,layer,pos+1))
                    cuda_core=coli_cuda_attention_absorb_kvdev(l->kv_b.cuda,ctx+(int64_t)s*H*vh,
                        Q+(int64_t)s*H*qh,m->kv_dev_L[layer]+(size_t)st0*kvl,
                        m->kv_dev_R[layer]+(size_t)st0*c->qk_rope,H,c->qk_nope,c->qk_rope,
                        vh,kvl,nt,c->attn_scale);
                if(!cuda_core)
                    cuda_core=coli_cuda_attention_absorb(l->kv_b.cuda,ctx+(int64_t)s*H*vh,
                        Q+(int64_t)s*H*qh,coli_kv_row(ks->Lc[layer],st0,kvl),
                        coli_kv_row(ks->Rc[layer],st0,c->qk_rope),H,c->qk_nope,c->qk_rope,
                        vh,kvl,nt,c->attn_scale);
            }
        }
#endif
        if(!cuda_core){
        /* Causal rows grow with s; round-robin pairs keep that work balanced. */
        #pragma omp parallel for collapse(2) schedule(static,1)
        for(int s=0;s<S;s++) for(int h=0;h<H;h++){
            KVState *ks=kvs?kvs[s]:m->kv;
            int pos=positions?positions[s]:pos_base+s;
            const float *qp=Q+(int64_t)s*H*qh+(int64_t)h*qh;
            const float *qr=qp+c->qk_nope;
            int rbase=h*(c->qk_nope+vh);
            float qabs[512]; memset(qabs,0,kvl*sizeof(float));
            for(int d=0;d<c->qk_nope;d++) qt_addrow(&l->kv_b, rbase+d, qp[d], qabs);
            float *sc = sc_all + (int64_t)omp_get_thread_num()*sc_cap;
            int st0=ks->kv_start[layer];
            int ns = (dnsel && dnsel[s]>0) ? dnsel[s] : 0;    /* DSA: lista top-k o range pieno */
            const int *tlist = ns ? dsel+(int64_t)s*dtopk : NULL;
            int nt = ns ? ns : pos+1-st0;
            for(int jj=0;jj<nt;jj++){ int t = tlist ? tlist[jj] : st0+jj;
                const float *Lt=coli_kv_row(ks->Lc[layer],t,kvl);
                const float *kr=coli_kv_row(ks->Rc[layer],t,c->qk_rope);
                /* MLA-absorb score: dot(qabs, Lt) + dot(qr, kr). #442: the qabs·Lt
                 * reduction is the hot f32 dot at this site (kvl=512 on GLM-5.2,
                 * runs nt times per (s,h), grows with context). SIMD-ify under
                 * AVX2 (8-lane fmadd + hsum256, same shape as matmul_q in quant.h)
                 * and NEON, with a scalar tail for the remainder. Reassociation
                 * is accepted here — softmax downstream softens the rounding flip. */
                float a=0; int i=0;
#if defined(__AVX2__)
                __m256 acc=_mm256_setzero_ps();
                for(;i+8<=kvl;i+=8)
                    acc=_mm256_fmadd_ps(_mm256_loadu_ps(qabs+i), _mm256_loadu_ps(Lt+i), acc);
                a=hsum256(acc);
#elif defined(__ARM_NEON)
                float32x4_t ac0=vdupq_n_f32(0), ac1=vdupq_n_f32(0);
                for(;i+8<=kvl;i+=8){
                    ac0=vfmaq_f32(ac0, vld1q_f32(qabs+i),   vld1q_f32(Lt+i));
                    ac1=vfmaq_f32(ac1, vld1q_f32(qabs+i+4), vld1q_f32(Lt+i+4)); }
                a=vaddvq_f32(vaddq_f32(ac0,ac1));
#endif
                for(;i<kvl;i++) a+=qabs[i]*Lt[i];
                for(int d=0;d<c->qk_rope;d++) a+=qr[d]*kr[d];
                sc[jj]=a*c->attn_scale;
            }
            softmax(sc,nt);
            float clat[512]; memset(clat,0,kvl*sizeof(float));
            for(int jj=0;jj<nt;jj++){ int t = tlist ? tlist[jj] : st0+jj;
                const float *Lt=coli_kv_row(ks->Lc[layer],t,kvl);
                /* MLA-absorb value mix: clat += sc[jj] * Lt (AXPY over kvl).
                 * #442: SIMD-ified — each lane writes back independently so there
                 * is no reassociation here (strictly bit-identical to scalar). */
                float a=sc[jj]; int i=0;
#if defined(__AVX2__)
                __m256 va=_mm256_set1_ps(a);
                for(;i+8<=kvl;i+=8){
                    __m256 cl=_mm256_loadu_ps(clat+i), lt=_mm256_loadu_ps(Lt+i);
                    _mm256_storeu_ps(clat+i, _mm256_fmadd_ps(va, lt, cl));
                }
#elif defined(__ARM_NEON)
                float32x4_t va=vdupq_n_f32(a);
                for(;i+8<=kvl;i+=8){
                    vst1q_f32(clat+i,   vfmaq_f32(vld1q_f32(clat+i),   va, vld1q_f32(Lt+i)));
                    vst1q_f32(clat+i+4, vfmaq_f32(vld1q_f32(clat+i+4), va, vld1q_f32(Lt+i+4)));
                }
#endif
                for(;i<kvl;i++) clat[i]+=a*Lt[i];
            }
            qt_matvec_rows(&l->kv_b, rbase+r0v, vh, clat, ctx+((int64_t)s*H+h)*vh);
        }
        }
        m->t_acore+=now_s()-tac; double tao=now_s();
        if(!cuda_projected){matmul_qt(out, ctx, &l->o, S);} m->t_aout+=now_s()-tao;
        free(ctx); free(Q); free(QR); free(comp); free(sc_all);
        m->t_attn += now_s()-ta0;
        return;
    }
    /* 2) ricostruzione di k_nope+value per TUTTI i token 0..Tk-1 (un solo matmul su kv_b) */
    m->t_aproj+=now_s()-ta0; double tk0=now_s();
    int stL=m->kv_start[layer];
    float *kvb_all=falloc((int64_t)Tk*kvb_dim);
    matmul_qt(kvb_all+(int64_t)stL*kvb_dim, m->Lc[layer]+(int64_t)stL*c->kv_lora, &l->kv_b, Tk-stL);
    m->t_kvb += now_s()-tk0;
    /* 3) attenzione causale: score = q_pass·k_nope + q_rot·k_rot
     * (punteggi sul heap, per-thread: vedi il commento nel ramo absorb) */
    int64_t sc_cap = Tk - stL;
    float *sc_all = falloc((int64_t)omp_get_max_threads()*sc_cap);
    double tac=now_s();
    /* Causal rows grow with s; round-robin pairs keep that work balanced. */
    #pragma omp parallel for collapse(2) schedule(static,1)
    for(int s=0;s<S;s++) for(int h=0;h<H;h++){
        int pos=pos_base+s;
        const float *qp=Q+(int64_t)s*H*qh+(int64_t)h*qh;          /* [qk_nope | qk_rope] */
        const float *qr=qp+c->qk_nope;
        float *sc = sc_all + (int64_t)omp_get_thread_num()*sc_cap;
        int st0=m->kv_start[layer];
        int ns = (dnsel && dnsel[s]>0) ? dnsel[s] : 0;        /* DSA: lista top-k o range pieno */
        const int *tlist = ns ? dsel+(int64_t)s*dtopk : NULL;
        int nt = ns ? ns : pos+1-st0;
        for(int jj=0;jj<nt;jj++){ int t = tlist ? tlist[jj] : st0+jj;
            const float *kn=kvb_all+(int64_t)t*kvb_dim+(int64_t)h*(c->qk_nope+vh);
            const float *kr=m->Rc[layer]+(int64_t)t*c->qk_rope;
            float a=0; for(int d=0;d<c->qk_nope;d++) a+=qp[d]*kn[d];
            for(int d=0;d<c->qk_rope;d++) a+=qr[d]*kr[d];
            sc[jj]=a*c->attn_scale;
        }
        softmax(sc,nt);
        float *cx=ctx+((int64_t)s*H+h)*vh; for(int d=0;d<vh;d++) cx[d]=0;
        for(int jj=0;jj<nt;jj++){ int t = tlist ? tlist[jj] : st0+jj;
            const float *vv=kvb_all+(int64_t)t*kvb_dim+(int64_t)h*(c->qk_nope+vh)+c->qk_nope;
            float a=sc[jj]; for(int d=0;d<vh;d++) cx[d]+=a*vv[d]; }
    }
    m->t_acore+=now_s()-tac; double tao=now_s();
    matmul_qt(out, ctx, &l->o, S); m->t_aout+=now_s()-tao;
    free(ctx); free(Q); free(QR); free(comp); free(kvb_all); free(sc_all);
    m->t_attn += now_s()-ta0;
}

static void attention(Model *m, Layer *l, int layer, float *x, int S, int pos_base, float *out){
    attention_rows(m,l,layer,x,S,pos_base,NULL,NULL,out);
}

/* MoE GLM su x[S,hidden] -> out (router sigmoid/noaux_tc, n_group=1, + shared expert).
 * BATCH-UNION: per S>1 (prefill, verifica MTP) ogni expert UNICO del batch viene caricato
 * una volta sola e moltiplicato per tutte le posizioni che lo usano (pesi letti 1 volta);
 * lo shared expert e' un unico matmul a S righe. Per posizione l'accumulo resta
 * nell'ordine (routed nel loro ordine di union, poi shared). */
/* pin ∪ LRU residency probe (used by CACHE_ROUTE max-rank fill). */
static int expert_is_resident(Model *m, int layer, int eid){
    ESlot *P=m->pin[layer];
    for(int z=0;z<m->npin[layer];z++) if(P[z].eid==eid) return 1;
    ESlot *Sl=m->ecache[layer];
    for(int z=0;z<m->ecn[layer];z++) if(Sl[z].eid==eid) return 1;
    return 0;
}

/* I loop di selezione top-K partono da best=-1 e lo usano come indice appena il
 * giro finisce. Se OGNI punteggio candidato e' non finito nessun confronto riesce
 * (NaN>bv e' falso) e best resta -1: logit[-1] e' una lettura fuori range, e
 * idx[]=-1 si propaga a eusage/eheat/elast (tre scritture heap a indice -1) e al
 * VLA seen[] (underflow di stack). Non e' teorico: c/tests/test_logit_nan.c
 * documenta NaN/Inf nei logit da un tile expert corrotto o da un overflow fp al
 * confine di eviction, e ha indurito solo il lato sampling — il router e' a monte.
 * Qui degradiamo a una scelta deterministica e avvisiamo una volta sola. */
static int router_best_or_fallback(int best, int kk, int E, int layer){
    if(best>=0) return best;
    static int warned;
    if(!warned){ warned=1;
        fprintf(stderr,"[router] logits non finiti al layer %d: selezione degradata\n",layer); }
    return kk<E ? kk : 0;
}

static void moe(Model *m, Layer *l, int layer, float *x, int S, float *out, int with_shared){
    if(g_pilot_real){   /* barriera cross-layer: prendi possesso di QUESTO layer e aspetta
                         * l'eventuale load-pilota in volo sullo stesso layer (dopodiche' il
                         * worker droppa ogni nuovo load <= layer -> ecache[layer] e' stabile
                         * per tutto il resolve/matmul/promozione qui sotto). */
        pthread_mutex_lock(&g_pilot_mx);
        atomic_store_explicit(&g_cur_moe_layer,layer,memory_order_release);
        while(layer>=0 && layer<256 && g_pilot_inflight[layer]>0)
            pthread_cond_wait(&g_pilot_cv,&g_pilot_mx);
        pthread_mutex_unlock(&g_pilot_mx);
    }
    Cfg *c=&m->c; int D=c->hidden, E=c->n_experts, K=c->topk, I=c->moe_inter;
    /* DISK-CLASS: does THIS call need the pre-bump recency snapshot? Must agree with
     * dc_needed() in expert_load_impl -- that's what reads what this writes. touched[]
     * makes the write once-per-call: an expert routed by more than one position in a big
     * batch (prefill's S) must snapshot the state from BEFORE this call started, not from
     * an earlier position's bump within the SAME call (which would reintroduce the
     * same-call contamination one position later). Unconditional VLA like the FASE B
     * `seen[E]` below -- E is small, cost is noise. */
    int need_classify = dc_needed();
    unsigned char touched[E]; if(need_classify) memset(touched,0,(size_t)E);
    float *choice=falloc(E);
    int sI=c->moe_inter*c->n_shared;
    /* Rank buffer for CACHE_ROUTE max-rank selection (up to all E experts). */
    int *rank_buf=NULL; float *rank_w=NULL;
    int do_cache_route = g_cache_route && E>0 && K>0;
    int rank_cap = do_cache_route ? (g_route_m>K?g_route_m:K) : 0;
    if(rank_cap>E) rank_cap=E;
    if(do_cache_route){
        rank_buf=malloc((size_t)rank_cap*sizeof(int));
        rank_w=malloc((size_t)rank_cap*sizeof(float));
        if(!rank_buf||!rank_w){ free(rank_buf); free(rank_w); rank_buf=NULL; rank_w=NULL; do_cache_route=0; }
    }
    /* ---- FASE A: routing di tutte le S posizioni ---- */
    double route_t0=g_prof?now_s():0;
    int *idxs=xalloc((size_t)S*K*sizeof(int),"moe idxs"); float *ws=xalloc((size_t)S*K*sizeof(float),"moe ws");
    int *keff=xalloc((size_t)S*sizeof(int),"moe keff");
    /* router in UN matmul batch: stessa matematica, via le S chiamate S=1 */
    float *logits_all=falloc((int64_t)S*E);
    int pre_routed=0; (void)pre_routed;
    /* pre-routed shortcut: Metal layer-CB o device router CUDA (#431) — stessa
     * contabilita' (#417: recency clock incluso), la selezione arriva dalla GPU */
    if(g_pre_idx){                               /* routing gia' calcolata dal layer CB (GPU) */
        memcpy(idxs,g_pre_idx,(size_t)S*K*sizeof(int));
        memcpy(ws,g_pre_w,(size_t)S*K*sizeof(float));
        memcpy(keff,g_pre_keff,(size_t)S*sizeof(int));
        /* Stessa classe di difetto dal lato GPU: un risultato di routing malformato
         * (keff oltre K, id expert fuori range) indicizzerebbe gli stessi array
         * eusage/eheat/elast e il VLA seen[] di FASE B. Meglio sanificare qui una
         * volta che fidarsi del device. */
        for(int s=0;s<S;s++){
            if(keff[s]<0) keff[s]=0;
            if(keff[s]>K) keff[s]=K;
            for(int kk=0;kk<keff[s];kk++){
                int e=idxs[(int64_t)s*K+kk];
                if(e<0||e>=E){
                    static int warned_pre;
                    if(!warned_pre){ warned_pre=1;
                        fprintf(stderr,"[router] indice expert %d fuori range al layer %d: azzerato\n",e,layer); }
                    idxs[(int64_t)s*K+kk]=0;
                }
            }
        }
        for(int s=0;s<S;s++){
            m->ereq+=keff[s];
            for(int kk=0;kk<keff[s];kk++){
                m->eusage[layer][idxs[(int64_t)s*K+kk]]++;
                ehit_mark(m,layer,idxs[(int64_t)s*K+kk]);
                if(need_classify){                /* DISK-CLASS private recency -- snapshot BEFORE this call's own bump,
                                                   * then tick. This path also bumps the REAL elast/eaccess_clock a few
                                                   * lines below (#417/cfcc742 fixed the once-missing bump on Metal
                                                   * decode) -- DISK-CLASS's own clock stays independent regardless of
                                                   * that fix, see elast_dc in Model. */
                    int e=idxs[(int64_t)s*K+kk];
                    if(!touched[e]){ m->elast_pre[layer][e]=m->elast_dc[layer][e]; touched[e]=1; }
                    m->elast_dc[layer][e]=++m->eaccess_clock_dc;
                }
                if(m->eheat[layer][idxs[(int64_t)s*K+kk]]<UINT32_MAX) m->eheat[layer][idxs[(int64_t)s*K+kk]]++;
                /* #417: la scorciatoia GPU-prerouted deve far avanzare l'orologio di recency
                 * come il percorso router completo (riga ~3055), altrimenti elast/eaccess_clock
                 * si congelano a fine prefill e il tie-breaker LFRU di REPIN gira su punteggi
                 * stantii durante il decode su Metal. */
                m->elast[layer][idxs[(int64_t)s*K+kk]]=++m->eaccess_clock;
            }
            for(int d=0;d<D;d++) out[(int64_t)s*D+d]=0;
        }
        pre_routed=1;
    }
    if(!pre_routed) matmul(logits_all, x, l->router, S, D, E);
    if(!pre_routed)
    for(int s=0;s<S;s++){
        float *logit=logits_all+(int64_t)s*E;
        for(int e=0;e<E;e++){ logit[e]=sigmoidf(logit[e]); choice[e]=logit[e]+l->router_bias[e]; }
        int *idx=idxs+(int64_t)s*K; float *w=ws+(int64_t)s*K;
        int Ksel = g_topk>0 ? (g_topk<K?g_topk:K) : K;
        if(do_cache_route){
            /* Full ranking of top rank_cap experts by choice (bias-augmented). */
            int Mwin=rank_cap;
            if(g_route_p>0.f && g_route_p<1.f){
                /* Cumulative-mass variant: grow M until mass covers ROUTE_P. */
                int Mmax=g_route_m>Ksel*4?g_route_m:Ksel*4; if(Mmax>E) Mmax=E; if(Mmax>rank_cap) Mmax=rank_cap;
                for(int kk=0;kk<Mmax;kk++){ int best=-1; float bv=-1e30f;
                    for(int e=0;e<E;e++){ int tk=0; for(int j=0;j<kk;j++) if(rank_buf[j]==e){tk=1;break;}
                        if(!tk && choice[e]>bv){bv=choice[e];best=e;} }
                    best=router_best_or_fallback(best,kk,E,layer);
                    rank_buf[kk]=best; rank_w[kk]=logit[best];
                }
                float tot=1e-20f; for(int kk=0;kk<Mmax;kk++) tot+=rank_w[kk]>0?rank_w[kk]:0;
                float cum=0; Mwin=Ksel;
                for(int kk=0;kk<Mmax;kk++){ cum+=rank_w[kk]>0?rank_w[kk]:0;
                    if(cum>=g_route_p*tot){ Mwin=kk+1; break; } Mwin=kk+1; }
                if(Mwin<Ksel) Mwin=Ksel;
            } else {
                for(int kk=0;kk<Mwin;kk++){ int best=-1; float bv=-1e30f;
                    for(int e=0;e<E;e++){ int tk=0; for(int j=0;j<kk;j++) if(rank_buf[j]==e){tk=1;break;}
                        if(!tk && choice[e]>bv){bv=choice[e];best=e;} }
                    best=router_best_or_fallback(best,kk,E,layer);
                    rank_buf[kk]=best; rank_w[kk]=logit[best];
                }
            }
            int J=g_route_j; if(J<0) J=0; if(J>Ksel) J=Ksel;
            int chosen=0;
            /* Always take true top-J (even if uncached). */
            for(int kk=0;kk<J && chosen<Ksel;kk++){
                idx[chosen]=rank_buf[kk]; w[chosen]=rank_w[kk]; chosen++;
            }
            /* Remaining slots: prefer resident experts within top-Mwin. */
            for(int r=J;r<Mwin && chosen<Ksel;r++){
                int e=rank_buf[r]; int already=0;
                for(int j=0;j<chosen;j++) if(idx[j]==e){already=1;break;}
                if(already) continue;
                if(expert_is_resident(m,layer,e)){
                    idx[chosen]=e; w[chosen]=rank_w[r]; chosen++;
                }
            }
            /* Fill remainder from true ranking order. */
            for(int r=0;r<Mwin && chosen<Ksel;r++){
                int e=rank_buf[r]; int already=0;
                for(int j=0;j<chosen;j++) if(idx[j]==e){already=1;break;}
                if(already) continue;
                idx[chosen]=e; w[chosen]=rank_w[r]; chosen++;
            }
            /* Swap accounting vs true top-Ksel (rank_buf[0..Ksel)). */
            m->route_slots+=(uint64_t)Ksel;
            for(int kk=0;kk<Ksel;kk++){
                int e=idx[kk], in_true=0;
                for(int t=0;t<Ksel;t++) if(rank_buf[t]==e){in_true=1;break;}
                if(!in_true) m->route_swaps++;
            }
            /* Pad if somehow short (shouldn't happen). */
            while(chosen<Ksel){ idx[chosen]=rank_buf[chosen]; w[chosen]=rank_w[chosen]; chosen++; }
            /* ROUTE_ALPHA: down-weight substituted experts' gate mass before renorm. */
            if(g_route_alpha>0.f && g_route_alpha<1.f){
                for(int kk=0;kk<Ksel;kk++){
                    int e=idx[kk], in_true=0;
                    for(int t=0;t<Ksel;t++) if(rank_buf[t]==e){in_true=1;break;}
                    if(!in_true) w[kk]*=g_route_alpha;
                }
            }
            /* ROUTE_AGREE: overlap + KL(true top-K mass || chosen mass). */
            if(g_route_agree || g_cache_route){
                int ov=0;
                for(int kk=0;kk<Ksel;kk++){
                    for(int t=0;t<Ksel;t++) if(idx[kk]==rank_buf[t]){ ov++; break; }
                }
                m->route_agree_hit+=(uint64_t)ov;
                m->route_agree_tot+=(uint64_t)Ksel;
                float tsum=1e-20f, csum=1e-20f;
                for(int t=0;t<Ksel;t++) tsum+=rank_w[t]>0?rank_w[t]:0;
                for(int kk=0;kk<Ksel;kk++) csum+=w[kk]>0?w[kk]:0;
                double kl=0;
                for(int t=0;t<Ksel;t++){
                    double pt=(rank_w[t]>0?rank_w[t]:0)/tsum;
                    if(pt<=0) continue;
                    double pc=1e-12;
                    for(int kk=0;kk<Ksel;kk++) if(idx[kk]==rank_buf[t]){
                        pc=(w[kk]>0?w[kk]:0)/csum; break; }
                    kl+=pt*log(pt/pc);
                }
                m->route_kl_sum+=kl; m->route_kl_n++;
            }
        } else {
            for(int kk=0;kk<Ksel;kk++){ int best=-1; float bv=-1e30f;
                for(int e=0;e<E;e++){ int tk=0; for(int j=0;j<kk;j++) if(idx[j]==e){tk=1;break;}
                    if(!tk && choice[e]>bv){bv=choice[e];best=e;} }
                best=router_best_or_fallback(best,kk,E,layer);
                idx[kk]=best; w[kk]=logit[best];
            }
            if(g_route_agree){
                m->route_agree_hit+=(uint64_t)Ksel;
                m->route_agree_tot+=(uint64_t)Ksel;
                m->route_kl_sum+=0; m->route_kl_n++;
            }
        }
        int Ke=Ksel;
        if(g_topp>0 && g_topp<1.f){
            for(int a=1;a<Ksel;a++){ int ii=idx[a]; float ww=w[a]; int b=a-1;
                while(b>=0 && w[b]<ww){ w[b+1]=w[b]; idx[b+1]=idx[b]; b--; } w[b+1]=ww; idx[b+1]=ii; }
            float tot=1e-20f; for(int kk=0;kk<Ksel;kk++) tot+=w[kk];
            float cum=0; for(int kk=0;kk<Ksel;kk++){ cum+=w[kk]; if(cum>=g_topp*tot){ Ke=kk+1; break; } }
        }
        keff[s]=Ke; m->ereq+=Ke;
        for(int kk=0;kk<Ke;kk++){
            m->eusage[layer][idx[kk]]++;
            ehit_mark(m,layer,idx[kk]);
            if(need_classify){                    /* DISK-CLASS private recency -- snapshot BEFORE this call's own bump,
                                                   * then tick (same rate as the real clock below: one per (s,kk)) */
                if(!touched[idx[kk]]){ m->elast_pre[layer][idx[kk]]=m->elast_dc[layer][idx[kk]]; touched[idx[kk]]=1; }
                m->elast_dc[layer][idx[kk]]=++m->eaccess_clock_dc;
            }
            if(m->eheat[layer][idx[kk]]<UINT32_MAX) m->eheat[layer][idx[kk]]++;
            m->elast[layer][idx[kk]]=++m->eaccess_clock;
        }
        if(c->norm_topk){ float sm=0; for(int kk=0;kk<Ke;kk++) sm+=w[kk]; sm+=1e-20f; for(int kk=0;kk<Ke;kk++) w[kk]/=sm; }
        for(int kk=0;kk<Ke;kk++) w[kk]*=c->routed_scale;
        if(g_route_fp){                       /* ROUTE_TRACE: one line per (position, layer) */
            fprintf(g_route_fp,"%d %d %d",g_route_call,s,layer);
            for(int kk=0;kk<Ke;kk++) fprintf(g_route_fp," %d:%.4f",idx[kk],w[kk]);
            fputc('\n',g_route_fp);
        }
        for(int d=0;d<D;d++) out[(int64_t)s*D+d]=0;
    }
    free(rank_buf); free(rank_w);
    if(g_prof)m->t_route+=now_s()-route_t0;
    if(g_route_fp) g_route_call++;
    if(g_couple && cp_pred && S<=8)
        for(int s2=0;s2<S;s2++) couple_prefetch(m,layer,idxs+(int64_t)s2*K,keff[s2]);
    if(g_looka && S==1 && layer<c->n_layers){
        int Ke=keff[0];
        if(m->enr[layer]>0){                       /* [0] vs routing del token precedente */
            for(int kk=0;kk<Ke;kk++) for(int z=0;z<m->enr[layer];z++)
                if(m->eroute[layer][z]==idxs[kk]){ la_hit[0]++; break; }
            la_tot[0]+=Ke;
        }
        for(int kind=0;kind<3;kind++) if(la_val[kind][layer]){   /* score all prediction kinds */
            for(int kk=0;kk<Ke;kk++) for(int z=0;z<K;z++)
                if(la_pred[kind][layer][z]==idxs[kk]){ la_hit[1+kind]++; break; }
            la_tot[1+kind]+=Ke; la_val[kind][layer]=0;
        }
    }
    m->enr[layer]=keff[S-1]; for(int kk=0;kk<keff[S-1];kk++) m->eroute[layer][kk]=idxs[(int64_t)(S-1)*K+kk];
    /* ---- FASE B: union degli expert del batch ---- */
    int *uniq=xalloc((size_t)E*sizeof(int),"moe uniq"); int nu=0;
    unsigned char seen[E]; memset(seen,0,(size_t)E);
    for(int s=0;s<S;s++) for(int kk=0;kk<keff[s];kk++){
        int e=idxs[(int64_t)s*K+kk];
        if(!seen[e]){ seen[e]=1; uniq[nu++]=e; }
    }
    /* EXPERT_BUDGET: cap distinct experts per layer to reduce disk I/O on cold/low-RAM
     * hosts. MISS-AWARE: always keep cache hits (pin/LRU — they're free, no disk I/O),
     * only drop from misses. From the misses, keep the highest-aggregate-gate-weight
     * ones up to the budget; drop the rest from idxs[] so they're never loaded.
     * (MoE-Spec arXiv 2602.16052: top-32 of 64 capture 93% routing weight.)
     * Complementary to TOPP (per-position) — this trims cross-position.
     * DECODE-ONLY (S<=4, incl. MTP verify): during prefill S=prompt_len the batch
     * union nu is 30-100+ experts and capping to 4-8 drops 80-90% of them, each with
     * non-trivial gate weight -> corrupted prefill hidden state -> wrong KV cache ->
     * repetitive garbage decode. The budget is only safe token-by-token, where the
     * prefill KV cache is already correct. (woolcoxm, #292.) */
    if(g_expert_budget>0 && S<=4 && nu>g_expert_budget){
        /* compute aggregate gate weight per unique expert */
        float *wsum=falloc(nu); for(int j=0;j<nu;j++) wsum[j]=0;
        for(int s=0;s<S;s++) for(int kk=0;kk<keff[s];kk++){
            int e=idxs[(int64_t)s*K+kk];
            for(int j=0;j<nu;j++) if(uniq[j]==e){ wsum[j]+=ws[(int64_t)s*K+kk]; break; }
        }
        /* residency pre-scan: which experts are already in pin or ecache (hits)? */
        unsigned char *is_hit=xzalloc((size_t)nu,"moe is_hit"); int nhits=0;
        for(int j=0;j<nu;j++){ int eid=uniq[j];
            int found=0;
            ESlot *P=m->pin[layer];
            for(int z=0;z<m->npin[layer];z++) if(P[z].eid==eid){ found=1; break; }
            if(!found){ ESlot *Sl=m->ecache[layer]; int nn=m->ecn[layer];
                for(int z=0;z<nn;z++) if(Sl[z].eid==eid){ found=1; break; } }
            if(found){ is_hit[j]=1; nhits++; }
        }
        /* budget for misses = total budget - hits already kept (min 0) */
        int miss_budget = g_expert_budget - nhits; if(miss_budget<0) miss_budget=0;
        /* mark which unique experts to keep (1) or drop (0): keep all hits, fill rest
         * with top-weight misses up to miss_budget */
        unsigned char *keep=xzalloc((size_t)nu,"moe keep"); int nkeep=0;
        for(int j=0;j<nu;j++) if(is_hit[j]){ keep[j]=1; nkeep++; }
        for(int rank=0;rank<miss_budget;rank++){
            int best=-1; float bv=-1e30f;
            for(int j=0;j<nu;j++) if(!keep[j] && wsum[j]>bv){ bv=wsum[j]; best=j; }
            if(best<0) break; keep[best]=1; nkeep++;
        }
        /* build a lookup: for each expert id, is it kept? (reuse seen[]) */
        memset(seen,0,(size_t)E);
        for(int j=0;j<nu;j++) if(keep[j]) seen[uniq[j]]=1;
        /* Nessuna posizione puo' restare a ZERO routed expert. keep[] parte da tutti
         * i cache hit, quindi con nhits>=g_expert_budget il miss_budget e' 0 e una
         * posizione il cui top-K e' fatto solo di miss viene compattata a w==0 (il
         * guard `w>0` qui sotto lo ammette). Quel token riceverebbe solo lo shared
         * expert, e lo stato nascosto sbagliato finisce nella KV cache avvelenando
         * ogni token successivo — la stessa modalita' di guasto descritta sopra per
         * il prefill (#292), raggiunta da un'altra direzione. Bastano S=2, K=1,
         * EXPERT_BUDGET=1 e due miss diversi. Ripeschiamo il miss col peso di gate
         * piu' alto della posizione e lo contiamo in STATS. */
        for(int s=0;s<S;s++){
            int alive=0;
            for(int kk=0;kk<keff[s] && !alive;kk++) if(seen[idxs[(int64_t)s*K+kk]]) alive=1;
            if(alive || keff[s]<=0) continue;
            int be=-1; float bw=-1e30f;
            for(int kk=0;kk<keff[s];kk++){
                float wv=ws[(int64_t)s*K+kk];
                if(wv>bw){ bw=wv; be=idxs[(int64_t)s*K+kk]; }
            }
            if(be<0) be=idxs[(int64_t)s*K];        /* pesi tutti non finiti: primo della lista */
            seen[be]=1; g_budget_rescued++;
            for(int j=0;j<nu;j++) if(uniq[j]==be && !keep[j]){ keep[j]=1; nkeep++; break; }
        }
        int dropped=nu-nkeep; g_budget_dropped+=dropped;
        /* remove dropped experts from each position's routing list */
        for(int s=0;s<S;s++){
            int w=0; float sold=0, snew=0;
            for(int kk=0;kk<keff[s];kk++){
                int e=idxs[(int64_t)s*K+kk]; float wv=ws[(int64_t)s*K+kk];
                sold+=wv;
                if(seen[e]){ idxs[(int64_t)s*K+w]=e; ws[(int64_t)s*K+w]=wv; snew+=wv; w++; }
            }
            if(w<keff[s]){
                keff[s]=w;
                /* renormalize remaining weights per position */
                if(c->norm_topk && w>0){
                    /* sm porta gia' routed_scale (applicato in FASE A): la divisione lo
                     * cancella e il multiply qui sotto lo riapplica — non e' doppio scaling */
                    float sm=0; for(int kk=0;kk<w;kk++) sm+=ws[(int64_t)s*K+kk]; sm+=1e-20f;
                    for(int kk=0;kk<w;kk++) ws[(int64_t)s*K+kk]/=sm;
                    for(int kk=0;kk<w;kk++) ws[(int64_t)s*K+kk]*=c->routed_scale;
                } else if(w>0 && snew>1e-20f && sold>snew){
                    /* Senza norm_topk i pesi NON sono normalizzati: scartare expert
                     * ridurrebbe la magnitudine del contributo routed di tutta la massa
                     * di gate buttata via, cioe' il budget cambierebbe la matematica del
                     * layer invece di risparmiare solo I/O. Riscaliamo per old/new (il
                     * rapporto e' invariante a routed_scale) cosi' la magnitudine resta.
                     * GLM-5.2 usa norm_topk=1, quindi questo tocca solo le altre config MoE. */
                    float sc=sold/snew;
                    for(int kk=0;kk<w;kk++) ws[(int64_t)s*K+kk]*=sc;
                }
            }
        }
        /* compact uniq[] to kept experts only */
        int nu2=0;
        for(int j=0;j<nu;j++) if(keep[j]) uniq[nu2++]=uniq[j];
        nu=nu2;
        free(wsum); free(is_hit); free(keep);
    }
    /* ---- FASE C/D: risolvi (pin/cache/disco) e calcola, a blocchi di 64 unici ---- */
    float *xg=falloc((int64_t)S*D), *gg=falloc((int64_t)S*I), *uu=falloc((int64_t)S*I), *hh=falloc((int64_t)S*D);
    float *xe=NULL;   /* fmt=6: x under the rotation Q^T, built once per call — all routed
                       * experts of the layer share it (the placement rule in quant.h) */
    /* Materialise xe on first use. Every site that feeds a routed expert's gate/up
     * input — CPU, the per-expert GPU call, and all three group packing paths —
     * must go through here: doing the transform per expert instead of per layer
     * costs ~11 ms against ~1.4 ms on GLM dims (#452). */
    #define E8_XE(e) ((e)->g.fmt==6 ? (xe ? xe : (xe=falloc((int64_t)S*D), \
        memcpy(xe,x,(size_t)S*D*sizeof(float)), e8_rot_rows(xe,S,D), xe)) : x)
    int *rows=xalloc((size_t)S*sizeof(int),"moe rows"); float *rw=xalloc((size_t)S*sizeof(float),"moe rw");
#ifdef COLI_CUDA
    /* PIPE Inc.1b: il batch-union del prefill passa dai gruppi GPU — prima di
     * questo, 9343 expert in VRAM restavano INUTILIZZATI durante il prefill
     * (misurato: 81s di expert-matmul tutto su CPU, GPU groups 21ms totali). */
    int group_enabled = S<=64 || (g_cuda_pipe && S<=4096);
    float *group_x=group_enabled?falloc((int64_t)S*K*D):NULL;
    float *group_y=group_enabled?falloc((int64_t)S*K*D):NULL;
    int *group_row=group_enabled?xalloc((size_t)64*S*sizeof(int),"moe group_row"):NULL;
    float *group_weight=group_enabled?xalloc((size_t)64*S*sizeof(float),"moe group_weight"):NULL;
#endif
    int shared_on_gpu=0; (void)shared_on_gpu;   /* set by the Metal path when Phase E was fused */
    for(int base=0;base<nu;base+=64){
        int nb = nu-base<64 ? nu-base : 64;
        ESlot *use[64]; int missk[64]; int qof[64]; int nmiss=0;
        for(int j=0;j<nb;j++){ int eid=uniq[base+j]; use[j]=NULL; qof[j]=-1;
            ESlot *P=m->pin[layer];
            for(int z=0;z<m->npin[layer];z++) if(P[z].eid==eid){ m->hits++; m->hit_pin++; use[j]=&P[z]; break; }
            if(!use[j]){ ESlot *Sl=m->ecache[layer]; int nn=m->ecn[layer];
                for(int z=0;z<nn;z++) if(Sl[z].eid==eid){ m->hits++; m->hit_ecache++; Sl[z].used=(uint64_t)__atomic_add_fetch(&m->eclock,1,__ATOMIC_RELAXED); use[j]=&Sl[z]; break; } }
            if(!use[j]){ qof[j]=nmiss; use[j]=&m->ws[nmiss]; missk[nmiss++]=j; m->miss++;
                if(g_disk_split){ if(m->ld_ctx==1) m->miss_draft++; else if(m->ld_ctx==2) m->miss_absorb++; } }
        }
        int metal_done=0;
#ifdef COLI_METAL
        /* GPU/disk OVERLAP: submit the RESIDENT experts (pin/LRU hits, + shared expert on
         * the first block) to the GPU BEFORE loading the missed experts from disk, so the
         * preads run while the GPU computes; the missed subset follows in a second submit.
         * Per-subset CPU fallback on unresolved slab / bad fmt / GPU fault. */
        int is_miss[64]={0}; ColiMetalMoeHandle *mh=NULL;
        int cpu_res=1, cpu_miss=1, mh_shared=0, nbb=0, Rtot=0, mfmt=-1, sh_in=0;
        const void *MG[65],*MU[65],*MD[65]; const float *MGS[65],*MUS[65],*MDS[65];
        int xoffb[65],nrb[65];
        float *mxg=NULL; int *mrows=NULL; float *mrw=NULL;
        /* subset builder: experts with is_miss==WANTMISS (+ shared expert when TRY_SH) */
        #define MB_BUILD(WANTMISS, TRY_SH) do{ \
            nbb=0; Rtot=0; mfmt=-1; sh_in=0; \
            for(int j=0;j<nb;j++){ if(is_miss[j]!=(WANTMISS)) continue; \
                int eid=uniq[base+j]; ESlot *e=use[j]; int cnt=0; \
                for(int s=0;s<S;s++) for(int kk=0;kk<keff[s];kk++) \
                    if(idxs[(int64_t)s*K+kk]==eid){ cnt++; break; } \
                if(!cnt) continue; \
                if(mfmt<0) mfmt=e->g.fmt; \
                MG[nbb]=e->g.fmt==1?(const void*)e->g.q8:(const void*)e->g.q4; \
                MU[nbb]=e->u.fmt==1?(const void*)e->u.q8:(const void*)e->u.q4; \
                MD[nbb]=e->d.fmt==1?(const void*)e->d.q8:(const void*)e->d.q4; \
                MGS[nbb]=e->g.s; MUS[nbb]=e->u.s; MDS[nbb]=e->d.s; \
                xoffb[nbb]=Rtot; nrb[nbb]=cnt; Rtot+=cnt; nbb++; \
            } \
            if(TRY_SH){ int shf = mfmt<0 ? l->sh_gate.fmt : mfmt; \
                if(c->n_shared==1 && sI==I && l->sh_gate.fmt==shf && l->sh_up.fmt==shf && l->sh_down.fmt==shf){ \
                    if(mfmt<0) mfmt=shf; \
                    MG[nbb]=shf==1?(const void*)l->sh_gate.q8:(const void*)l->sh_gate.q4; \
                    MU[nbb]=shf==1?(const void*)l->sh_up.q8  :(const void*)l->sh_up.q4; \
                    MD[nbb]=shf==1?(const void*)l->sh_down.q8:(const void*)l->sh_down.q4; \
                    MGS[nbb]=l->sh_gate.s; MUS[nbb]=l->sh_up.s; MDS[nbb]=l->sh_down.s; \
                    xoffb[nbb]=Rtot; nrb[nbb]=S; Rtot+=S; nbb++; sh_in=1; } } \
            int p=0; \
            for(int j=0;j<nb;j++){ if(is_miss[j]!=(WANTMISS)) continue; int eid=uniq[base+j]; \
                for(int s=0;s<S;s++) for(int kk=0;kk<keff[s];kk++) \
                    if(idxs[(int64_t)s*K+kk]==eid){ \
                        memcpy(mxg+(int64_t)p*D, x+(int64_t)s*D, D*sizeof(float)); \
                        mrows[p]=s; mrw[p]=ws[(int64_t)s*K+kk]; p++; break; } } \
            if(sh_in) for(int s=0;s<S;s++){ \
                memcpy(mxg+(int64_t)p*D, x+(int64_t)s*D, D*sizeof(float)); \
                mrows[p]=s; mrw[p]=1.0f; p++; } \
        }while(0)
        if(g_metal_enabled){
            for(int q=0;q<nmiss;q++) is_miss[missk[q]]=1;
            mxg=falloc((int64_t)(nb+1)*S*D);
            mrows=xalloc((size_t)(nb+1)*S*sizeof(int),"moe mrows"); mrw=xalloc((size_t)(nb+1)*S*sizeof(float),"moe mrw");
            MB_BUILD(0, base==0 && !g_pre_sh);
            if(nbb>0){
                double t0=now_s();
                mh=coli_metal_moe_block_begin(nbb,D,I,mfmt,MG,MU,MD,MGS,MUS,MDS,mxg,xoffb,nrb,mrows,mrw);
                m->t_emm += now_s()-t0;
                if(mh){ cpu_res=0; mh_shared=sh_in; }
            } else cpu_res=0;
        }
#endif
        /* Expert loads run HERE, after the resident-experts GPU submit above: under METAL the
         * preads overlap the GPU compute (that submit is async). With METAL off the submit block
         * is a no-op / compiled out, so this sits exactly where dev put it and CPU behaviour is
         * unchanged. */
        if(nmiss){
            if(g_pipe){                            /* PIPE: launch loads async, matmul overlaps them */
                if(!g_pp.started) pipe_init(m);
                double t0=now_s();
                int eids[64]; for(int q=0;q<nmiss;q++) eids[q]=uniq[base+missk[q]];
                pipe_dispatch(m,layer,eids,nmiss);
                m->t_ewait += now_s()-t0;           /* dispatch only; the reads overlap matmul and
                                                     * are timed as service inside expert_load */
            } else { double t0=now_s();             /* ORIGINALE: blocking parallel load */
                #pragma omp parallel for schedule(dynamic,1)
                for(int q=0;q<nmiss;q++) expert_load(m,layer,uniq[base+missk[q]],&m->ws[q],1,1);   /* demand=1: this IS the miss path */
                m->t_ewait += now_s()-t0; }         /* compute thread blocked for the whole load */
        }
        /* I/O ASINCRONO: readahead (WILLNEED) del blocco SUCCESSIVO mentre calcoliamo
         * questo — il kernel legge in background, le pread dopo trovano cache calda */
        if(base+64<nu){
            int nb2 = nu-(base+64)<64 ? nu-(base+64) : 64;
            for(int j=0;j<nb2;j++){ int eid=uniq[base+64+j]; int found=0;
                ESlot *P=m->pin[layer];
                for(int z=0;z<m->npin[layer] && !found;z++) if(P[z].eid==eid) found=1;
                ESlot *Sl=m->ecache[layer];
                for(int z=0;z<m->ecn[layer] && !found;z++) if(Sl[z].eid==eid) found=1;
                if(!found) expert_prefetch(m,layer,eid);
            }
        }
#ifdef COLI_CUDA
        ESlot *group_e[64]; int group_n[64]; int ngroup=0;
        /* Inc.4 overlap stash: pass-1 packing kept for the take phase after the CPU loop */
        ESlot *eg_e[64]; int eg_n[64], eg_row[64][4], eg_npg=0; float eg_w[64][4];
        int dev_nc0[COLI_CUDA_MAX_DEVICES], dev_off0[COLI_CUDA_MAX_DEVICES],
            dev_total0[COLI_CUDA_MAX_DEVICES], dev_which0[COLI_CUDA_MAX_DEVICES][64];
        memset(dev_nc0,0,sizeof(dev_nc0)); (void)eg_npg; (void)dev_total0; (void)dev_off0;
#endif
#ifdef COLI_METAL
        if(g_metal_enabled){
            /* PIPE drain. Two reasons this barrier is mandatory here, and not optional:
             *  1) MB_BUILD(1) hands the missed experts' slabs straight to the GPU — a slot still
             *     being pread by an I/O worker would be matmul-ed half-loaded.
             *  2) PIPE's only drain barrier is the per-expert pipe_wait() in the CPU matmul loop
             *     below, which metal_done SKIPS ENTIRELY. Without this, a still-writing worker
             *     would race the end-of-block LRU swap that recycles ws[].
             * pipe_wait() is an idempotent spin on ready[q], so the per-expert waits below stay
             * correct (and free) when a subset falls back to the CPU. */
            if(g_pipe && nmiss){ double tw=now_s();
                for(int q=0;q<nmiss;q++) pipe_wait(q);
                m->t_ewait += now_s()-tw; }
            MB_BUILD(1, 0);                                   /* missed experts, now loaded */
            if(nbb>0){
                double t0=now_s();
                if(coli_metal_moe_block(nbb,D,I,mfmt,MG,MU,MD,MGS,MUS,MDS,mxg,xoffb,nrb,mrows,mrw,out,S)) cpu_miss=0;
                m->t_emm += now_s()-t0;
            } else cpu_miss=0;
            if(mh){ double t0=now_s();
                if(coli_metal_moe_block_end(mh,out)){ if(mh_shared) shared_on_gpu=1; }
                else cpu_res=1;
                m->t_emm += now_s()-t0; mh=NULL; }
            metal_done = (!cpu_res && !cpu_miss);
            free(mxg); free(mrows); free(mrw);
        }
        #undef MB_BUILD
#endif
#ifdef COLI_CUDA
        /* Inc.4 pass 1: collect the VRAM-resident experts' groups and ISSUE them async
         * BEFORE the CPU loop below, so the GPU computes its share while the CPU works
         * through the RAM-tier/miss rows — t_emm becomes max(cpu, gpu) instead of the
         * sum. Only resident experts are collected (misses are never cuda_eligible), so
         * no pipe_wait is needed here; the CPU loop keeps its own waits. Any issue
         * failure drops the layer back to the collect-in-loop + sync-group path. */
        int early_issued=0, done_j[64]={0};
        {
            static int g_group_async2=-1;
            if(g_group_async2<0) g_group_async2=getenv("COLI_GROUP_ASYNC")?atoi(getenv("COLI_GROUP_ASYNC")):0;
            if(!metal_done && g_group_async2 && group_enabled && S<=4 && g_cuda_enabled &&
               g_cuda_ndev>0 && !omp_in_parallel()){
                ESlot *pg_e[64]; int pg_n[64], pg_j[64], npg=0;
                int prow[64][4]; float pw[64][4];
                for(int j=0;j<nb;j++){ ESlot *e=use[j]; int eid=uniq[base+j];
                    if(!(e->g.cuda_eligible&&e->u.cuda_eligible&&e->d.cuda_eligible)) continue;
                    int nr=0;
                    for(int s=0;s<S && nr<4;s++) for(int kk=0;kk<keff[s];kk++)
                        if(idxs[(int64_t)s*K+kk]==eid){ prow[npg][nr]=s; pw[npg][nr]=ws[(int64_t)s*K+kk]; nr++; break; }
                    if(!nr) continue;
                    pg_e[npg]=e; pg_n[npg]=nr; pg_j[npg]=j; npg++;
                }
                if(npg){
                    /* pack per device exactly like the sync path below */
                    ColiCudaTensor *pd_g[COLI_CUDA_MAX_DEVICES][64],*pd_u[COLI_CUDA_MAX_DEVICES][64],*pd_d[COLI_CUDA_MAX_DEVICES][64];
                    int pd_rows[COLI_CUDA_MAX_DEVICES][64],pd_which[COLI_CUDA_MAX_DEVICES][64];
                    int pd_nc[COLI_CUDA_MAX_DEVICES]={0},pd_total[COLI_CUDA_MAX_DEVICES]={0},pd_off[COLI_CUDA_MAX_DEVICES]={0};
                    for(int di=0;di<g_cuda_ndev;di++) for(int q=0;q<npg;q++)
                        if(pg_e[q]->g.cuda_device==g_cuda_devices[di]) pd_total[di]+=pg_n[q];
                    for(int di=1;di<g_cuda_ndev;di++) pd_off[di]=pd_off[di-1]+pd_total[di-1];
                    for(int di=0;di<g_cuda_ndev;di++){
                        int cursor=0,device=g_cuda_devices[di];
                        for(int q=0;q<npg;q++) if(pg_e[q]->g.cuda_device==device){
                            int nc=pd_nc[di]++; ESlot *e=pg_e[q];
                            pd_g[di][nc]=e->g.cuda; pd_u[di][nc]=e->u.cuda; pd_d[di][nc]=e->d.cuda;
                            pd_rows[di][nc]=pg_n[q]; pd_which[di][nc]=q;
                            const float *xsrc=E8_XE(e);      /* fmt=6 feeds the rotated copy */
                            for(int r=0;r<pg_n[q];r++) memcpy(group_x+(int64_t)(pd_off[di]+cursor+r)*D,
                                xsrc+(int64_t)prow[q][r]*D,D*sizeof(float));
                            cursor+=pg_n[q];
                        }
                    }
                    double tg0=now_s();
                    int all=1, issued[COLI_CUDA_MAX_DEVICES]={0};
                    for(int di=0;di<g_cuda_ndev && all;di++) if(pd_nc[di])
                        all=issued[di]=coli_cuda_expert_group_issue(pd_g[di],pd_u[di],pd_d[di],
                                pd_rows[di],pd_nc[di],group_x+(int64_t)pd_off[di]*D);
                    g_ovl_issue+=now_s()-tg0;
                    if(all){
                        static int announced2;
                        if(!announced2){ announced2=1; fprintf(stderr,"[CUDA] expert group overlap active\n"); }
                        early_issued=1; g_ovl_mark=now_s();
                        for(int q=0;q<npg;q++) done_j[pg_j[q]]=1;
                        /* stash packing for the take phase */
                        for(int di=0;di<g_cuda_ndev;di++){ dev_nc0[di]=pd_nc[di]; dev_off0[di]=pd_off[di]; dev_total0[di]=pd_total[di];
                            for(int q=0;q<pd_nc[di];q++) dev_which0[di][q]=pd_which[di][q]; }
                        for(int q=0;q<npg;q++){ eg_e[q]=pg_e[q]; eg_n[q]=pg_n[q];
                            for(int r=0;r<pg_n[q];r++){ eg_row[q][r]=prow[q][r]; eg_w[q][r]=pw[q][r]; } }
                        eg_npg=npg;
                        m->t_emm+=now_s()-tg0;
                        for(int q=0;q<npg;q++){                    /* bookkeeping normally done in the loop */
                            m->gpu_expert_calls++;
                        }
                    } else {
                        for(int di=0;di<g_cuda_ndev;di++)
                            if(issued[di]) coli_cuda_expert_group_take(g_cuda_devices[di]);
                    }
                }
            }
        }
#endif
        /* ---- XEXP=1: one parallel region across ALL experts of the block (S==1, all
         * resident, all int4, IDOT S=1 family active). The default path opens ~2 OpenMP
         * regions per expert (16/layer at topk=8) and each worker touches only ~200 KB
         * per region; on wide multi-socket hosts the fork/join cadence and short streams
         * cap the expert loop well below DRAM bandwidth. Here: phase 1 computes gate+up
         * row-chunks (dot_i4i8 per row, same function as matmul_i4_idot S=1) and applies
         * silu*up on the chunk; a per-expert pass requantizes the intermediate; phase 2
         * computes down-projection row-chunks. One region, two internal barriers, per
         * block. Byte-identical to the stock g_i4s<=1 + COLI_NO_FUSED_PAIR path (verified
         * on GLM-5.2 int4: identical 256-token greedy output, and on the int4 tiny
         * oracle). Gated off the speculation window like every S-dependent kernel switch. */
        int xexp_done=0;
        if(g_xexp && !metal_done && S==1 && !nmiss && !spec_pinned() && g_idot && g_i4s<=1
#ifdef COLI_CUDA
           && !g_cuda_enabled
#endif
          ){
            int allq4=1;
            for(int j=0;j<nb;j++){ ESlot *e=use[j];
                if(e->g.fmt!=2||e->u.fmt!=2||e->d.fmt!=2||e->g.I!=D||e->g.O!=I||e->d.I!=I||e->d.O!=D){ allq4=0; break; } }
            if(allq4){
                double t0=now_s();
                float wj[64]; int okw=1;
                for(int j=0;j<nb;j++){ int eid=uniq[base+j]; wj[j]=0; int f=0;
                    for(int kk=0;kk<keff[0];kk++) if(idxs[kk]==eid){ wj[j]=ws[kk]; f=1; break; }
                    if(!f) okw=0; }
                if(okw){
                    int rbD=(D+1)/2, rbI=(I+1)/2;
                    int8_t *xq8=malloc((size_t)D + (size_t)nb*I);
                    float *GG=falloc((int64_t)nb*I), *UU=falloc((int64_t)nb*I), *HH=falloc((int64_t)nb*D);
                    float gsc[64];
                    if(!xq8){ fprintf(stderr,"OOM xexp scratch\n"); exit(1); }
                    int8_t *GQ=xq8+D;
                    float sx0=qrow_i8(x, xq8, D);
                    const int C1=12, C2=12;           /* chunks per expert per phase */
                    int r1=(I+C1-1)/C1, r2=(D+C2-1)/C2;
                    #pragma omp parallel
                    {
                        #pragma omp for schedule(dynamic,1)
                        for(int it=0; it<nb*C1; it++){ int j=it/C1, c0=(it%C1)*r1;
                            int c1=c0+r1<I?c0+r1:I; ESlot *e=use[j];
                            const uint8_t *qg=e->g.q4, *qu=e->u.q4;
                            float *gj=GG+(int64_t)j*I, *uj=UU+(int64_t)j*I;
                            for(int o=c0;o<c1;o++) gj[o]=(float)dot_i4i8(qg+(int64_t)o*rbD,xq8,D)*e->g.s[o]*sx0;
                            for(int o=c0;o<c1;o++) uj[o]=(float)dot_i4i8(qu+(int64_t)o*rbD,xq8,D)*e->u.s[o]*sx0;
                            for(int o=c0;o<c1;o++) gj[o]=siluf(gj[o])*uj[o];
                        }                              /* implicit barrier */
                        #pragma omp for schedule(static)
                        for(int j=0;j<nb;j++) gsc[j]=qrow_i8(GG+(int64_t)j*I, GQ+(int64_t)j*I, I);
                        #pragma omp for schedule(dynamic,1)
                        for(int it=0; it<nb*C2; it++){ int j=it/C2, c0=(it%C2)*r2;
                            int c1=c0+r2<D?c0+r2:D; ESlot *e=use[j];
                            const uint8_t *qd=e->d.q4; const int8_t *gq=GQ+(int64_t)j*I;
                            float *hj=HH+(int64_t)j*D;
                            for(int o=c0;o<c1;o++) hj[o]=(float)dot_i4i8(qd+(int64_t)o*rbI,gq,I)*e->d.s[o]*gsc[j];
                        }
                    }
                    for(int j=0;j<nb;j++){ float w=wj[j], *hj=HH+(int64_t)j*D;
                        for(int d=0;d<D;d++) out[d]+=w*hj[d]; }
                    double dt=now_s()-t0; m->t_emm+=dt;
                    if(g_prof){ m->t_ecpu+=dt; m->cpu_expert_rows+=(uint64_t)nb;
                        for(int j=0;j<nb;j++) m->cpu_expert_bytes+=qt_bytes(&use[j]->g)+qt_bytes(&use[j]->u)+qt_bytes(&use[j]->d); }
                    free(xq8); free(GG); free(UU); free(HH);
                    xexp_done=1;
                }
            }
        }
        if(!metal_done && !xexp_done)
        for(int j=0;j<nb;j++){ int eid=uniq[base+j]; ESlot *e=use[j];
#ifdef COLI_CUDA
            if(early_issued && done_j[j]) continue;    /* computing on the GPU right now */
#endif
            /* Drain this miss's async load BEFORE the nr==0 early-exit below: every
             * dispatched slot must be waited before the end-of-block LRU swap can reuse
             * its ws[] slab, so correctness does not depend on the nr>=1 routing invariant.
             * Stays ABOVE the METAL skip: a subset that fell back to the CPU still needs its
             * slot drained here, and under METAL the block-level drain above already ran (this
             * spin is then a no-op). */
            if(g_pipe && qof[j]>=0){ double tw=now_s(); pipe_wait(qof[j]); m->t_ewait += now_s()-tw; }
#ifdef COLI_METAL
            /* skip the subsets already computed on GPU */
            if(g_metal_enabled && ((is_miss[j] && !cpu_miss) || (!is_miss[j] && !cpu_res))) continue;
#endif
            int nr=0;                                 /* righe (posizioni) che usano questo expert */
            for(int s=0;s<S;s++) for(int kk=0;kk<keff[s];kk++)
                if(idxs[(int64_t)s*K+kk]==eid){ rows[nr]=s; rw[nr]=ws[(int64_t)s*K+kk]; nr++; break; }
            if(!nr) continue;
#ifdef COLI_CUDA
            if(g_cuda_enabled && e->g.cuda_eligible) m->gpu_expert_calls++;
            if(group_enabled && g_cuda_enabled && e->g.cuda_eligible && e->u.cuda_eligible && e->d.cuda_eligible &&
               !omp_in_parallel()){
                group_e[ngroup]=e; group_n[ngroup]=nr;
                for(int r=0;r<nr;r++){ group_row[(int64_t)ngroup*S+r]=rows[r]; group_weight[(int64_t)ngroup*S+r]=rw[r]; }
                ngroup++; continue;
            }
#endif
            const float *xsrc=E8_XE(e);
            for(int r=0;r<nr;r++) memcpy(xg+(int64_t)r*D, xsrc+(int64_t)rows[r]*D, D*sizeof(float));
            double t0=now_s();
#ifdef COLI_CUDA
            if(!group_enabled && g_cuda_enabled && e->g.cuda_eligible && e->u.cuda_eligible &&
               e->d.cuda_eligible && !omp_in_parallel() &&
               coli_cuda_expert_mlp(e->g.cuda,e->u.cuda,e->d.cuda,hh,xg,nr)){
                for(int r=0;r<nr;r++){ float *os=out+(int64_t)rows[r]*D,wgt=rw[r],*hr=hh+(int64_t)r*D;
                    for(int d=0;d<D;d++) os[d]+=wgt*hr[d]; }
                double dt=now_s()-t0;m->t_emm+=dt;if(g_prof)m->t_egpu+=dt;continue;
            }
            if(!e->slab) expert_host_ensure(m,layer,e);
#endif
            expert_gate_up(gg,uu,xg,&e->g,&e->u,nr);
            for(int64_t z=0;z<(int64_t)nr*I;z++) gg[z]=siluf(gg[z])*uu[z];
            if(e->d.fmt==6) e8_rot_rows(gg,nr,I);   /* down input is per-expert — rotate here */
            matmul_qt(hh, gg, &e->d, nr);
            for(int r=0;r<nr;r++){ float *os=out+(int64_t)rows[r]*D, wgt=rw[r], *hr=hh+(int64_t)r*D;
                for(int d=0;d<D;d++) os[d]+=wgt*hr[d]; }
            double dt=now_s()-t0;m->t_emm+=dt;if(g_prof){m->t_ecpu+=dt;
                m->cpu_expert_bytes+=qt_bytes(&e->g)+qt_bytes(&e->u)+qt_bytes(&e->d);
                m->cpu_expert_rows+=(uint64_t)nr;}
        }
#ifdef COLI_CUDA
        /* Inc.4 take phase: the CPU loop above ran while the GPU computed the issued
         * groups — collect them now. A failed device recomputes its experts on the CPU
         * (expert_host_ensure reloads slabs released by CUDA_RELEASE_HOST). */
        if(early_issued){
            double tg1=now_s();
            g_ovl_cpu+=tg1-g_ovl_mark;               /* CPU-row window between issue and take */
            for(int di=0;di<g_cuda_ndev;di++) if(dev_nc0[di]){
                const float *hy=coli_cuda_expert_group_take(g_cuda_devices[di]);
                int cur=0;
                for(int q=0;q<dev_nc0[di];q++){
                    int gi=dev_which0[di][q], nr=eg_n[gi];
                    if(hy){
                        for(int r=0;r<nr;r++){ float *os=out+(int64_t)eg_row[gi][r]*D; float wgt=eg_w[gi][r];
                            const float *hr=hy+(int64_t)(cur+r)*D;
                            for(int d=0;d<D;d++) os[d]+=wgt*hr[d]; }
                    } else {
                        ESlot *e=eg_e[gi];
                        for(int r=0;r<nr;r++) memcpy(xg+(int64_t)r*D,x+(int64_t)eg_row[gi][r]*D,D*sizeof(float));
                        expert_host_ensure(m,layer,e);
                        expert_gate_up(gg,uu,xg,&e->g,&e->u,nr);
                        for(int64_t z=0;z<(int64_t)nr*I;z++) gg[z]=siluf(gg[z])*uu[z];
                        matmul_qt(hh,gg,&e->d,nr);
                        for(int r=0;r<nr;r++){ float *os=out+(int64_t)eg_row[gi][r]*D; float wgt=eg_w[gi][r];
                            for(int d=0;d<D;d++) os[d]+=wgt*hh[(int64_t)r*D+d]; }
                    }
                    cur+=nr;
                }
            }
            m->t_emm+=now_s()-tg1; g_ovl_take+=now_s()-tg1;
        }
        ColiCudaTensor *dev_g[COLI_CUDA_MAX_DEVICES][64],*dev_u[COLI_CUDA_MAX_DEVICES][64];
        ColiCudaTensor *dev_d[COLI_CUDA_MAX_DEVICES][64];
        int dev_rows[COLI_CUDA_MAX_DEVICES][64],dev_which[COLI_CUDA_MAX_DEVICES][64];
        int dev_nc[COLI_CUDA_MAX_DEVICES]={0},dev_total[COLI_CUDA_MAX_DEVICES]={0};
        int dev_off[COLI_CUDA_MAX_DEVICES]={0},dev_ok[COLI_CUDA_MAX_DEVICES]={0};
        double dev_time[COLI_CUDA_MAX_DEVICES]={0};
        for(int di=0;di<g_cuda_ndev;di++) for(int q=0;q<ngroup;q++)
            if(group_e[q]->g.cuda_device==g_cuda_devices[di]) dev_total[di]+=group_n[q];
        for(int di=1;di<g_cuda_ndev;di++) dev_off[di]=dev_off[di-1]+dev_total[di-1];
        for(int di=0;di<g_cuda_ndev;di++){
            int cursor=0,device=g_cuda_devices[di];
            for(int q=0;q<ngroup;q++) if(group_e[q]->g.cuda_device==device){
                int nc=dev_nc[di]++; ESlot *e=group_e[q];
                dev_g[di][nc]=e->g.cuda; dev_u[di][nc]=e->u.cuda; dev_d[di][nc]=e->d.cuda;
                dev_rows[di][nc]=group_n[q]; dev_which[di][nc]=q;
                const float *xsrc=E8_XE(e);                  /* fmt=6 feeds the rotated copy */
                for(int r=0;r<group_n[q];r++) memcpy(group_x+(int64_t)(dev_off[di]+cursor+r)*D,
                    xsrc+(int64_t)group_row[(int64_t)q*S+r]*D,D*sizeof(float));
                cursor+=group_n[q];
            }
        }
        double tg=now_s();
        /* Inc.4: at decode scale, issue every device's group WITHOUT syncing, then take
         * them all — one stream sync per device per layer instead of a full staged
         * round-trip per call (measured: ~70% of the sync call is host-side wait).
         * Any issue failure drains what was issued and the whole layer falls back to
         * the sync path below, which recomputes from group_x (idempotent). */
        int async_done=0;
        static int g_group_async=-1;
        if(g_group_async<0) g_group_async=getenv("COLI_GROUP_ASYNC")?atoi(getenv("COLI_GROUP_ASYNC")):0;
        if(g_group_async && S<=4 && g_cuda_ndev>0){
            int issued[COLI_CUDA_MAX_DEVICES]={0}, all=1;
            for(int di=0;di<g_cuda_ndev && all;di++) if(dev_nc[di])
                all=issued[di]=coli_cuda_expert_group_issue(dev_g[di],dev_u[di],dev_d[di],
                        dev_rows[di],dev_nc[di],group_x+(int64_t)dev_off[di]*D);
            if(all){
                static int announced;
                if(!announced){ announced=1; fprintf(stderr,"[CUDA] expert group async path active\n"); }
                async_done=1;
                for(int di=0;di<g_cuda_ndev;di++) if(dev_nc[di]){
                    const float *hy=coli_cuda_expert_group_take(g_cuda_devices[di]);
                    if(hy){ dev_ok[di]=1;
                        memcpy(group_y+(int64_t)dev_off[di]*D,hy,(size_t)dev_total[di]*D*sizeof(float)); }
                    else dev_ok[di]=0;      /* per-device sync failure: CPU fallback below */
                }
            } else for(int di=0;di<g_cuda_ndev;di++)
                if(issued[di]) coli_cuda_expert_group_take(g_cuda_devices[di]);
        }
        if(!async_done){
            /* resident path (#431 PR-C0): issue the group on its device with the input
             * P2P'd from the home device and the weighted partial pushed back there —
             * no host bytes, no per-device sync; take() runs after moe() returns.
             * Issue is serial (it only queues async work); failure falls back to the
             * synchronous host-round-trip call below, per device. */
            if(g_pres_home>=0 && S==1){
                for(int di=0;di<g_cuda_ndev;di++) if(dev_nc[di]){
                    float wbuf[64];
                    for(int q=0;q<dev_nc[di];q++) wbuf[q]=group_weight[(int64_t)dev_which[di][q]*S];
                    if(coli_cuda_expert_group_resident_issue(dev_g[di],dev_u[di],dev_d[di],wbuf,dev_nc[di],
                            g_pres_home,g_pres_xsrc,g_pres_slots+(int64_t)g_pres_nused*D)){
                        g_pres_used[g_pres_nused++]=g_cuda_devices[di];
                        dev_ok[di]=2;                       /* handled on device: skip host collection */
                    }
                }
            }
        }
        /* dev_ok==0 is the real "needs the synchronous host round-trip" condition:
         * never attempted, or a per-device async take() that failed. The old guard
         * was !=2, which let dev_ok==1 through — a device whose ASYNC group had
         * SUCCEEDED was recomputed here and overwrote group_y with identical values.
         * Output stayed correct, so it went unnoticed; the symptom was simply that
         * COLI_GROUP_ASYNC never showed a speedup while doubling GPU expert work. */
        #pragma omp parallel for if(g_cuda_ndev>1) schedule(static)
        for(int di=0;di<g_cuda_ndev;di++) if(dev_nc[di]&&dev_ok[di]==0){
            double td=g_prof?now_s():0;
            dev_ok[di]=coli_cuda_expert_group(dev_g[di],dev_u[di],dev_d[di],dev_rows[di],dev_nc[di],
                group_y+(int64_t)dev_off[di]*D,group_x+(int64_t)dev_off[di]*D);
            if(g_prof)dev_time[di]=now_s()-td;
        }
        for(int di=0;di<g_cuda_ndev;di++){
            if(dev_ok[di]==2) continue;               /* results live on the home device (#431 PR-C0) */
            int off=dev_off[di];
            for(int q=0;q<dev_nc[di];q++){
                int gi=dev_which[di][q],nr=group_n[gi]; ESlot *e=group_e[gi];
                if(!dev_ok[di]){
                    const float *xsrc=E8_XE(e);          /* fmt=6 feeds the rotated copy */
                    for(int r=0;r<nr;r++) memcpy(xg+(int64_t)r*D,xsrc+(int64_t)group_row[(int64_t)gi*S+r]*D,D*sizeof(float));
                    double tc=g_prof?now_s():0;
                    if(!coli_cuda_expert_mlp(e->g.cuda,e->u.cuda,e->d.cuda,hh,xg,nr)){
                        expert_host_ensure(m,layer,e);
                        expert_gate_up(gg,uu,xg,&e->g,&e->u,nr);
                        for(int64_t z=0;z<(int64_t)nr*I;z++) gg[z]=siluf(gg[z])*uu[z];
                        if(e->d.fmt==6) e8_rot_rows(gg,nr,I);   /* down input, as on the main CPU path */
                        matmul_qt(hh,gg,&e->d,nr);
                        if(g_prof){m->cpu_expert_bytes+=qt_bytes(&e->g)+qt_bytes(&e->u)+qt_bytes(&e->d);
                            m->cpu_expert_rows+=(uint64_t)nr;}
                    }
                    if(g_prof)m->t_ecpu+=now_s()-tc;
                }
                float *src=dev_ok[di]?group_y+(int64_t)off*D:hh;
                for(int r=0;r<nr;r++){ float *os=out+(int64_t)group_row[(int64_t)gi*S+r]*D,wgt=group_weight[(int64_t)gi*S+r];
                    for(int d=0;d<D;d++) os[d]+=wgt*src[(int64_t)r*D+d]; }
                off+=nr;
            }
        }
        if(g_prof){double mx=0;for(int di=0;di<g_cuda_ndev;di++)if(dev_time[di]>mx)mx=dev_time[di];m->t_egpu+=mx;}
        m->t_emm+=now_s()-tg;
#endif
        /* No drain barrier: the per-expert pipe_wait(qof[j]) above (issued for every
         * dispatched miss slot, before the nr==0 skip) already waited on all ws[] loads
         * for this block, so they are complete before the LRU swap — and the gen-tagged
         * cursor keeps any still-spinning worker off a wrong-generation slot. */
        { ESlot *Sl=m->ecache[layer]; int *nn=&m->ecn[layer];   /* promozione LRU (swap buffer) */
          int promo = nmiss<m->ecap ? nmiss : m->ecap;
          for(int a=0;a<promo;a++){ int q=nmiss-1-a; ESlot *dst;
              if(*nn<m->ecap) dst=&Sl[(*nn)++];
              else { int lru=0; for(int z=1;z<*nn;z++) if(Sl[z].used<Sl[lru].used) lru=z; dst=&Sl[lru]; }
              ESlot tmp=*dst; *dst=m->ws[q]; m->ws[q]=tmp; dst->used=(uint64_t)__atomic_add_fetch(&m->eclock,1,__ATOMIC_RELAXED); }
        }
    }
    /* ---- FASE E: shared expert (PIPE2: gia' sul device; Metal CB: gia' sommata) ---- */
    if(!with_shared) goto shared_done;
    {
    float *sg=NULL,*su=NULL;int shared_cuda=0;
#ifdef COLI_METAL
    if(g_pre_sh){ for(int64_t z=0;z<(int64_t)S*D;z++) out[z]+=g_pre_sh[z]; shared_on_gpu=1; }
    if(shared_on_gpu) shared_cuda=2;             /* gia' sommato in out: salta calcolo e add */
#endif
#ifdef COLI_CUDA
    int shared_min=getenv("COLI_CUDA_SHARED_W4A16_MIN_ROWS")?
        atoi(getenv("COLI_CUDA_SHARED_W4A16_MIN_ROWS")):32;
    if(shared_min<16)shared_min=16;
    if(shared_cuda==0&&S>=shared_min&&!l->shared_w4a16_failed&&!omp_in_parallel()&&g_cuda_enabled&&
       l->sh_gate.fmt==2&&l->sh_up.fmt==2&&l->sh_down.fmt==2&&
       getenv("COLI_CUDA_SHARED_W4A16")&&atoi(getenv("COLI_CUDA_SHARED_W4A16"))&&
       qt_cuda_upload(&l->sh_gate)&&qt_cuda_upload(&l->sh_up)&&qt_cuda_upload(&l->sh_down)){
        shared_cuda=coli_cuda_shared_mlp_w4a16(l->sh_gate.cuda,l->sh_up.cuda,
                                               l->sh_down.cuda,hh,x,S);
        if(!shared_cuda)l->shared_w4a16_failed=1;
    }
#endif
    if(!shared_cuda){
        sg=falloc((int64_t)S*sI);su=falloc((int64_t)S*sI);
        matmul_qt(sg, x, &l->sh_gate, S);
        matmul_qt(su, x, &l->sh_up,   S);
        for(int64_t z=0;z<(int64_t)S*sI;z++) sg[z]=siluf(sg[z])*su[z];
        matmul_qt(hh, sg, &l->sh_down, S);
    }
    if(shared_cuda!=2) for(int64_t z=0;z<(int64_t)S*D;z++) out[z]+=hh[z];
    free(sg); free(su);
    }
shared_done:
    free(logits_all); free(choice); free(idxs); free(ws); free(keff); free(uniq);
    free(xg); free(gg); free(uu); free(hh); free(rows); free(rw); free(xe);
    #undef E8_XE
#ifdef COLI_CUDA
    free(group_x);free(group_y);
    free(group_row); free(group_weight);
#endif
}

static void dense_mlp(Layer *l, float *x, int S, int D, int I, float *out){
    float *g=falloc((int64_t)S*I), *u=falloc((int64_t)S*I);
    matmul_qt(g, x, &l->gate_proj, S);
    matmul_qt(u, x, &l->up_proj,   S);
    for(int64_t i=0;i<(int64_t)S*I;i++) g[i]=siluf(g[i])*u[i];
    matmul_qt(out, g, &l->down_proj, S);
    free(g); free(u);
}

/* LOOKA: predice il top-K del router del layer `target` dallo stato h (residual stream),
 * usando la STESSA pipeline del routing vero (post_ln -> router -> sigmoid+bias, top-K).
 * kind 0 = stesso layer saltando l'attention
 * kind 1 = layer successivo (PILOT: stale state, 75.8% recall)
 * kind 2 = two-step: approximate L's shared expert output, add to state, THEN predict L+1.
 *   The shared expert is resident (part of dense model), so this adds 3 small matmuls
 *   but no disk I/O. The corrected state includes the dominant part of MoE(L) that the
 *   stale PILOT prediction is missing. */
static void la_predict(Model *m, int target, const float *h, int kind){
    Cfg *c=&m->c; Layer *l=&m->L[target]; int D=c->hidden, E=c->n_experts, K=c->topk;
    float *nrm=falloc(D), *ch=falloc(E);

    if(kind==2){
        /* Two-step: h is L's post-attention state (pre-MoE). We want to predict L+1's
         * routing. The real L+1 router sees h + MoE(L). We approximate MoE(L) by
         * computing ONLY the shared expert (resident, no disk) on the post_ln-normalized
         * state, then add it to h before running L+1's router.
         *
         * target = L+1, so the layer we need the shared expert from is L = target-1. */
        int src_layer = target - 1;
        if(src_layer < 0 || src_layer >= c->n_layers || !m->L[src_layer].sparse
           || c->n_shared <= 0 || c->moe_inter <= 0){
            la_val[2][target] = 0; free(nrm); free(ch); return;
        }
        Layer *sl = &m->L[src_layer];
        int sI = c->moe_inter * c->n_shared;
        float *snrm = falloc(D), *sg = falloc(sI), *su = falloc(sI);
        float *sout = falloc(D), *hc = falloc(D);
        rmsnorm(snrm, h, sl->post_ln, D, c->eps);
        matmul_qt(sg, snrm, &sl->sh_gate, 1);
        matmul_qt(su, snrm, &sl->sh_up,   1);
        for(int i=0;i<sI;i++) sg[i] = siluf(sg[i]) * su[i];
        matmul_qt(sout, sg, &sl->sh_down, 1);
        for(int i=0;i<D;i++) hc[i] = h[i] + sout[i];
        rmsnorm(nrm, hc, l->post_ln, D, c->eps);
        free(snrm); free(sg); free(su); free(sout); free(hc);
        matmul(ch, nrm, l->router, 1, D, E);
        for(int e=0;e<E;e++) ch[e] = sigmoidf(ch[e]) + l->router_bias[e];
        int *pred = la_pred[2][target];
        for(int kk=0;kk<K;kk++){ int best=-1; float bv=-1e30f;
            for(int e=0;e<E;e++){ int tk=0; for(int j=0;j<kk;j++) if(pred[j]==e){tk=1;break;}
                if(!tk && ch[e]>bv){bv=ch[e];best=e;} }
            pred[kk]=best; }
        la_val[2][target]=1;
        free(nrm); free(ch);
        return;
    }

    /* Baseline kinds 0 and 1: pure router on the given state */
    rmsnorm(nrm,h,l->post_ln,D,c->eps);
    matmul(ch,nrm,l->router,1,D,E);
    for(int e=0;e<E;e++) ch[e]=sigmoidf(ch[e])+l->router_bias[e];
    int *pred=la_pred[kind][target];
    for(int kk=0;kk<K;kk++){ int best=-1; float bv=-1e30f;
        for(int e=0;e<E;e++){ int tk=0; for(int j=0;j<kk;j++) if(pred[j]==e){tk=1;break;}
            if(!tk && ch[e]>bv){bv=ch[e];best=e;} }
        pred[kk]=best; }
    la_val[kind][target]=1;
    free(nrm); free(ch);
}

/* PILOTA: prefetch guidato dal router. Predice il top-K del layer L+1 dallo stato
 * post-attention di L (recall misurato 71.6% su GLM-5.2, vs 41.3% del token precedente)
 * e lancia il WILLNEED degli expert mancanti MENTRE il MoE di L legge i suoi: il disco
 * lavora nei tempi morti del calcolo invece di aspettare il routing vero. Con MTP attiva
 * predice per TUTTE le posizioni del draft: la speculazione pilota anche l'I/O.
 * PILOT_K limita alle prime k predizioni (la testa del ranking e' piu' affidabile
 * della coda: meno banda sprecata sulle predizioni sbagliate).
 *
 * I WILLNEED partono da un THREAD I/O dedicato: con la coda disco satura la submit
 * del fadvise BLOCCA (~0.5ms x 169k chiamate = +92s/48 token, misurato) — inline
 * il pilota costava piu' di quanto rendesse. Ring lock-free 1P/1C; pieno = scarta
 * (un hint perso non e' un errore). */
static struct { int l,e; } pilot_q[4096];
static volatile unsigned pilot_w=0, pilot_r=0;
static Model *pilot_m=NULL;
/* PILOT_REAL: load VERO dell'expert predetto dentro la LRU del layer FUTURO. Vedi
 * l'invariante di sicurezza accanto a g_pilot_real. Il pread (lento) gira FUORI dal lock;
 * il lock protegge solo la scelta/pubblicazione dello slot e l'handshake col main. */
static void pilot_realload(Model *m, int layer, int eid){
    pthread_mutex_lock(&g_pilot_mx);
    if(layer <= atomic_load_explicit(&g_cur_moe_layer,memory_order_acquire)){
        atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed);
        pthread_mutex_unlock(&g_pilot_mx); return;      /* il main possiede gia' questo layer */
    }
    ESlot *P=m->pin[layer];                             /* gia' residente (pin o ecache)? skip */
    for(int z=0;z<m->npin[layer];z++) if(P[z].eid==eid){ pthread_mutex_unlock(&g_pilot_mx); return; }
    ESlot *Sl=m->ecache[layer]; int nn=m->ecn[layer];
    for(int z=0;z<nn;z++) if(Sl[z].eid==eid){ pthread_mutex_unlock(&g_pilot_mx); return; }
    int slot,isnew;                                     /* cresci se c'e' posto, altrimenti LRU */
    if(nn<m->ecap){ slot=nn; isnew=1; }
    else { int lru=0; for(int z=1;z<nn;z++) if(Sl[z].used<Sl[lru].used) lru=z; slot=lru; isnew=0;
        /* LFRU eviction guard (#441, fix #490): a speculation must not drop a WARM
         * demand-loaded expert. We PROTECT the victim only when it is genuinely warm
         * (>=2 demand accesses) AND clearly hotter than the speculation by tier_pick_lfru's
         * 25%+4-freq hysteresis. The original #441 formula tested the speculation's score
         * against victim+margin, which — because a speculation is by definition historically
         * colder than a just-used demand expert — dropped ~all speculations once the cache
         * was full, collapsing the LRU hit share (#490). Cache placement only -> output
         * byte-identical (a dropped speculation is demand-loaded later, same value). */
        if(g_pilot_evict_guard && m->eheat && m->elast && Sl[lru].eid>=0){
            int vid=Sl[lru].eid; uint32_t vh=m->eheat[layer][vid];
            if(vh>=2){
                uint64_t vs=tier_lfru_score(vh,m->elast[layer][vid],m->eaccess_clock);
                uint64_t cs=tier_lfru_score(m->eheat[layer][eid],m->elast[layer][eid],m->eaccess_clock);
                if(vs+(vs>>2)+(4u<<8)>cs){ atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed);
                                            pthread_mutex_unlock(&g_pilot_mx); return; } } } }
    ESlot *dst=&Sl[slot];
    dst->eid=-1;                                        /* nascondi dagli scan-hint mentre carica */
    g_pilot_inflight[layer]++;
    pthread_mutex_unlock(&g_pilot_mx);

    int rc=expert_load(m,layer,eid,dst,0,0);            /* pread VERO — fuori dal lock, sovrapposto al compute; fatal=0: un errore su una speculazione NON deve uccidere il server; demand=0: speculative, never classified */

    pthread_mutex_lock(&g_pilot_mx);
    if(rc==0){
        dst->used=(uint64_t)__atomic_add_fetch(&m->eclock,1,__ATOMIC_RELAXED);
        if(isnew) m->ecn[layer]=slot+1;                 /* pubblica lo slot SOLO ora che eid e' valido */
        atomic_fetch_add_explicit(&g_pilot_loads,1,memory_order_relaxed);
    } else {
        atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed); /* load fallito: slot resta nascosto (eid=-1), mai pubblicato */
    }
    g_pilot_inflight[layer]--;
    pthread_cond_broadcast(&g_pilot_cv);
    pthread_mutex_unlock(&g_pilot_mx);
    if(rc!=0)                                            /* mai swallow silenzioso: logga (una riga) e prosegui */
        fprintf(stderr,"[PILOT] load speculativo abbandonato: layer %d expert %d (I/O error/short read) — nessun impatto sull'output\n",layer,eid);
}
#ifdef __linux__
typedef struct { int layer,eid,li; ESlot *dst; } PilotUringDone;
static void pilot_uring_batch(Model *m){
    PilotUringDone done[URING_LOAD_MAX]; int nd=0;
    uring_batch_reset(&g_ub_pilot);
    unsigned r=__atomic_load_n(&pilot_r,__ATOMIC_ACQUIRE);
    unsigned w=__atomic_load_n(&pilot_w,__ATOMIC_ACQUIRE);
    while(r!=w && nd<URING_LOAD_MAX){
        int layer=pilot_q[r&4095].l,eid=pilot_q[r&4095].e; r++;
        if(layer<0 || layer>=256){ atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed); continue; }
        pthread_mutex_lock(&g_pilot_mx);
        if(layer<=atomic_load_explicit(&g_cur_moe_layer,memory_order_acquire)){
            atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed);
            pthread_mutex_unlock(&g_pilot_mx); continue;
        }
        int found=0; ESlot *P=m->pin[layer];
        for(int z=0;z<m->npin[layer];z++) if(P[z].eid==eid){found=1;break;}
        ESlot *Sl=m->ecache[layer]; int nn=m->ecn[layer];
        for(int z=0;z<nn && !found;z++) if(Sl[z].eid==eid || Sl[z].eid==-(eid+2)) found=1;
        if(found){ pthread_mutex_unlock(&g_pilot_mx); continue; }
        int slot;
        if(nn<m->ecap){ slot=nn; m->ecn[layer]=nn+1; }
        else{
            slot=-1;
            for(int z=0;z<nn;z++){
                if(Sl[z].eid==-1){ slot=z; break; }
                if(Sl[z].eid< -1) continue;          /* URING reservation in flight */
                if(slot<0 || Sl[z].used<Sl[slot].used) slot=z;
            }
            /* LFRU eviction guard (#441, fix #490): protect a WARM resident from a speculation.
             * Same corrected test as pilot_realload: victim must be genuinely warm (>=2 accesses)
             * AND clearly hotter (25%+4-freq hysteresis). See pilot_realload for the rationale and
             * the #490 regression the original formula caused. */
            if(slot>=0 && Sl[slot].eid>=0 && g_pilot_evict_guard && m->eheat && m->elast){
                int vid=Sl[slot].eid; uint32_t vh=m->eheat[layer][vid];
                if(vh>=2){
                    uint64_t vs=tier_lfru_score(vh,m->elast[layer][vid],m->eaccess_clock);
                    uint64_t cs=tier_lfru_score(m->eheat[layer][eid],m->elast[layer][eid],m->eaccess_clock);
                    if(vs+(vs>>2)+(4u<<8)>cs){ atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed);
                                                pthread_mutex_unlock(&g_pilot_mx); continue; }
                }
            }
        }
        if(slot<0){ atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed); pthread_mutex_unlock(&g_pilot_mx); continue; }
        ESlot *dst=&Sl[slot];
        dst->eid=-(eid+2);                         /* visible reservation; never considered resident/evictable */
        g_pilot_inflight[layer]++;
        pthread_mutex_unlock(&g_pilot_mx);

        int li=uring_load_add(&g_ub_pilot,m,layer,eid,dst,0);
        if(li<0){
            pthread_mutex_lock(&g_pilot_mx); dst->eid=-1; g_pilot_inflight[layer]--;
            pthread_cond_broadcast(&g_pilot_cv); pthread_mutex_unlock(&g_pilot_mx);
            atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed); continue;
        }
        done[nd++]=(PilotUringDone){layer,eid,li,dst};
    }
    __atomic_store_n(&pilot_r,r,__ATOMIC_RELEASE);
    if(!nd) return;
    if(uring_submit_batch(&g_ub_pilot)<0){
        int err=errno;
        for(int i=0;i<g_ub_pilot.nload;i++){
            g_ub_pilot.load[i].error=err; g_ub_pilot.load[i].done=1;
        }
    }
    for(int i=0;i<nd;i++){
        PilotUringDone *d=&done[i];
        int rc=uring_finalize_load(&g_ub_pilot,d->li,0);
        pthread_mutex_lock(&g_pilot_mx);
        if(rc==0){
            d->dst->eid=d->eid;
            d->dst->used=(uint64_t)__atomic_add_fetch(&m->eclock,1,__ATOMIC_RELAXED);
            atomic_fetch_add_explicit(&g_pilot_loads,1,memory_order_relaxed);
        }else{
            d->dst->eid=-1;
            atomic_fetch_add_explicit(&g_pilot_drops,1,memory_order_relaxed);
        }
        g_pilot_inflight[d->layer]--;
        pthread_cond_broadcast(&g_pilot_cv);
        pthread_mutex_unlock(&g_pilot_mx);
        if(rc) fprintf(stderr,"[PILOT/URING] load speculativo abbandonato: layer %d expert %d: %s\n",
                       d->layer,d->eid,strerror(g_ub_pilot.load[d->li].error));
    }
}
#endif
static void *pilot_worker(void *arg){
    (void)arg;
    for(;;){
        unsigned r=__atomic_load_n(&pilot_r,__ATOMIC_ACQUIRE);
        unsigned w=__atomic_load_n(&pilot_w,__ATOMIC_ACQUIRE);
        if(r==w){ usleep(200); continue; }
        if(g_pilot_real){
#ifdef __linux__
            if(g_uring){ pilot_uring_batch(pilot_m); continue; }
#endif
            pilot_realload(pilot_m, pilot_q[r&4095].l, pilot_q[r&4095].e);
        }
        else             expert_prefetch(pilot_m, pilot_q[r&4095].l, pilot_q[r&4095].e);
        __atomic_store_n(&pilot_r,r+1,__ATOMIC_RELEASE);
    }
    return NULL;
}
/* parse .coli_pairs (see tools/route_pairs.py): "COLIPAIRS 1 <n>" then
 * "<L> <dL> <e> f:c f:c ..." lines. Needs c->n_experts/n_layers -> called post-init. */
static void couple_load(Model *m, const char *path){
    Cfg *c=&m->c; int E=c->n_experts, NL=c->n_layers;
    FILE *f=fopen(path,"rb");
    if(!f){ fprintf(stderr,"[COUPLE] cannot open %s\n",path); return; }
    char magic[16]; int ver=0; long n=0;
    if(fscanf(f,"%15s %d %ld",magic,&ver,&n)!=3 || strcmp(magic,"COLIPAIRS") || ver!=1){
        fprintf(stderr,"[COUPLE] %s: bad header\n",path); fclose(f); return; }
    size_t cells=(size_t)NL*2*E*CP_M;
    cp_pred=malloc(cells*sizeof(int16_t)); cp_cnt=calloc(cells,sizeof(float));
    if(!cp_pred||!cp_cnt){ fprintf(stderr,"[COUPLE] OOM\n"); free(cp_pred); free(cp_cnt); cp_pred=NULL; fclose(f); return; }
    for(size_t i=0;i<cells;i++) cp_pred[i]=-1;
    long used=0;
    char *ln=NULL; size_t lcap=0;
    while(getline(&ln,&lcap,f)>0){          /* line-based: a malformed line cannot eat the next */
        char *p=ln; int L,dL,e; int nc=0;
        if(sscanf(p,"%d %d %d%n",&L,&dL,&e,&nc)!=3) continue;
        p+=nc;
        if(L<0||L>=NL||(dL!=1&&dL!=2)||e<0||e>=E) continue;
        size_t base=((size_t)(L*2+(dL-1))*E+e)*CP_M;
        int j=0;
        while(j<CP_M){
            int fe; float fc;
            if(sscanf(p," %d:%f%n",&fe,&fc,&nc)!=2) break;
            p+=nc;
            if(fe>=0&&fe<E){ cp_pred[base+j]=(int16_t)fe; cp_cnt[base+j]=fc; j++; }
        }
        if(j) used++;
    }
    free(ln);
    fclose(f);
    g_couple=1;
    fprintf(stderr,"[COUPLE] %s: %ld conditioning entries, K=%d depth=%d\n",path,used,g_couple_k,g_couple_d);
}
/* score + enqueue: called from moe() after FASE A with the position's routed set */
static void couple_prefetch(Model *m, int layer, const int *idx, int Ke){
    Cfg *c=&m->c; int E=c->n_experts;
    if(E>512) return;
    if(!pilot_m){ pilot_m=m; pthread_t t; pthread_create(&t,NULL,pilot_worker,NULL); }
    for(int dL=1; dL<=g_couple_d; dL++){
        int lt=layer+dL;
        if(lt>=c->n_layers || !m->L[lt].sparse) continue;
        float sc[512]; memset(sc,0,(size_t)E*sizeof(float));
        for(int kk=0;kk<Ke;kk++){
            size_t base=((size_t)(layer*2+(dL-1))*E+idx[kk])*CP_M;
            for(int j=0;j<CP_M && cp_pred[base+j]>=0;j++) sc[cp_pred[base+j]]+=cp_cnt[base+j];
        }
        for(int kk=0;kk<g_couple_k;kk++){
            int best=-1; float bv=0;
            for(int e=0;e<E;e++) if(sc[e]>bv){bv=sc[e];best=e;}
            if(best<0) break;
            sc[best]=0;
            int found=0;                            /* residency scan, same locking as pilot */
            pthread_mutex_lock(&g_pilot_mx);
            ESlot *P=m->pin[lt];
            for(int z=0;z<m->npin[lt] && !found;z++) if(P[z].eid==best) found=1;
            ESlot *Sl=m->ecache[lt];
            for(int z=0;z<m->ecn[lt] && !found;z++)
                if(Sl[z].eid==best || Sl[z].eid==-(best+2)) found=1;
            pthread_mutex_unlock(&g_pilot_mx);
            if(!found){
                unsigned w=__atomic_load_n(&pilot_w,__ATOMIC_RELAXED);
                if(w-__atomic_load_n(&pilot_r,__ATOMIC_ACQUIRE)<4096){
                    pilot_q[w&4095].l=lt; pilot_q[w&4095].e=best;
                    __atomic_store_n(&pilot_w,w+1,__ATOMIC_RELEASE);
                    g_cp_enq++;
                }
            }
        }
    }
}
static void pilot_prefetch(Model *m, int lnext, const float *x, int S){
    Cfg *c=&m->c; Layer *l=&m->L[lnext]; int D=c->hidden, E=c->n_experts;
    int K = g_pilot_k<c->topk ? g_pilot_k : c->topk;
    if(!pilot_m){ pilot_m=m; pthread_t t; pthread_create(&t,NULL,pilot_worker,NULL); }
    float *nrm=falloc(D), *ch=falloc(E);
    /* Two-step workspace (allocated once, reused across positions) */
    float *snrm=NULL, *sg=NULL, *su=NULL, *sout=NULL, *hc=NULL;
    int src_layer = lnext - 1;
    int sI = 0;
    int can_two = g_pilot_two && src_layer>=0 && src_layer<c->n_layers
                  && m->L[src_layer].sparse && c->n_shared>0 && c->moe_inter>0;
    if(can_two){
        sI = c->moe_inter * c->n_shared;
        snrm=falloc(D); sg=falloc(sI); su=falloc(sI); sout=falloc(D); hc=falloc(D);
    }
    for(int s=0;s<S;s++){
        const float *xs = x+(int64_t)s*D;
        if(can_two){
            /* Two-step: approximate MoE(src_layer) via shared expert only (resident, no disk),
             * then run lnext's router on the corrected state. */
            Layer *sl = &m->L[src_layer];
            rmsnorm(snrm, xs, sl->post_ln, D, c->eps);
            matmul_qt(sg, snrm, &sl->sh_gate, 1);
            matmul_qt(su, snrm, &sl->sh_up,   1);
            for(int i=0;i<sI;i++) sg[i] = siluf(sg[i]) * su[i];
            matmul_qt(sout, sg, &sl->sh_down, 1);
            for(int i=0;i<D;i++) hc[i] = xs[i] + sout[i];
            rmsnorm(nrm, hc, l->post_ln, D, c->eps);
        } else {
            rmsnorm(nrm, xs, l->post_ln, D, c->eps);
        }
        matmul(ch, nrm, l->router, 1, D, E);
        for(int e=0;e<E;e++) ch[e]=sigmoidf(ch[e])+l->router_bias[e];
        for(int kk=0;kk<K;kk++){
            int best=0; for(int e=1;e<E;e++) if(ch[e]>ch[best]) best=e;
            ch[best]=-2e30f;
            /* Residency scan of the FUTURE layer lnext under g_pilot_mx: with
             * PILOT_REAL=1 the pilot worker mutates ecache[lnext]/ecn[lnext]
             * concurrently, so read them under the same lock (Option A). Decide
             * under the lock, then enqueue AFTER unlocking — the pilot_q ring is
             * lock-free (pilot_w/pilot_r atomics, not g_pilot_mx) so there is no
             * re-entrant double-lock, and the worker re-checks residency under the
             * lock anyway, making a racing redundant enqueue harmless. */
            int found=0;
            pthread_mutex_lock(&g_pilot_mx);
            ESlot *P=m->pin[lnext];
            for(int z=0;z<m->npin[lnext] && !found;z++) if(P[z].eid==best) found=1;
            ESlot *Sl=m->ecache[lnext];
            for(int z=0;z<m->ecn[lnext] && !found;z++)
                if(Sl[z].eid==best || Sl[z].eid==-(best+2)) found=1;
            pthread_mutex_unlock(&g_pilot_mx);
            if(!found){
                unsigned w=__atomic_load_n(&pilot_w,__ATOMIC_RELAXED);
                if(w-__atomic_load_n(&pilot_r,__ATOMIC_ACQUIRE)<4096){
                    pilot_q[w&4095].l=lnext; pilot_q[w&4095].e=best;
                    __atomic_store_n(&pilot_w,w+1,__ATOMIC_RELEASE);
                }
            }
        }
    }
    free(nrm); free(ch);
    if(can_two){ free(snrm); free(sg); free(su); free(sout); free(hc); }
}

/* forward di UN layer (usato dai 78 principali e dal layer MTP) */
#ifdef COLI_CUDA
/* Inc.2a — intero layer SPARSO residente sul device del layer. x_dev entra e resta;
 * lasciano il device solo: nrm post-attention (router + expert CPU + gather dei
 * gruppi), i nuovi record KV, e la nrm pre-attention sui layer con indexer DSA.
 * Ritorna 0 su errore: il chiamante ripristina lo snapshot e rifa' il layer su CPU. */
static int pipe_layer_sparse(Model *m, Layer *l, int li, float *x_dev, int S, int pos_base,
                             float *nrm_host, float *out_host){
    Cfg *c=&m->c; int D=c->hidden, dev=l->kv_b.cuda_device;
    int sI=c->moe_inter*c->n_shared;
    size_t xb=(size_t)S*D*4;
    if(!l->sh_gate.cuda_eligible||!l->sh_up.cuda_eligible||!l->sh_down.cuda_eligible||
       !qt_cuda_upload(&l->sh_gate)||!qt_cuda_upload(&l->sh_up)||!qt_cuda_upload(&l->sh_down)||
       l->sh_gate.cuda_device!=dev||l->sh_up.cuda_device!=dev||l->sh_down.cuda_device!=dev) return 0;
    /* Inc.4: the layernorm weights are constants — upload once per layer and keep them
     * on the layer's device, instead of two synchronous 24 KB uploads per layer per
     * token (152 sync H2D/token measured on the profile). */
    if(!m->ln_dev) m->ln_dev=calloc((size_t)(c->n_layers+1)*2,sizeof(float*));
    float *w_in=m->ln_dev[(size_t)li*2], *w_post=m->ln_dev[(size_t)li*2+1];
    if(!w_in){
        w_in=coli_cuda_pipe_alloc(dev,(size_t)D*4);
        if(!w_in||!coli_cuda_pipe_upload(dev,w_in,l->in_ln,(size_t)D*4)) return 0;
        m->ln_dev[(size_t)li*2]=w_in;
    }
    if(!w_post){
        w_post=coli_cuda_pipe_alloc(dev,(size_t)D*4);
        if(!w_post||!coli_cuda_pipe_upload(dev,w_post,l->post_ln,(size_t)D*4)) return 0;
        m->ln_dev[(size_t)li*2+1]=w_post;
    }
    float *nrm_d=coli_cuda_pipe_scratch(dev,10,xb);
    float *y_d  =coli_cuda_pipe_scratch(dev,11,xb);
    float *sg_d =coli_cuda_pipe_scratch(dev,12,(size_t)S*sI*4);
    float *su_d =coli_cuda_pipe_scratch(dev,13,(size_t)S*sI*4);
    float *snap =coli_cuda_pipe_scratch(dev,14,xb);
    if(!nrm_d||!y_d||!sg_d||!su_d||!snap) return 0;
    if(!coli_cuda_pipe_peer_copy(dev,snap,dev,x_dev,xb)) return 0;   /* snapshot per il fallback */
    double ta=now_s();
    if(!coli_cuda_pipe_rmsnorm(dev,nrm_d,x_dev,w_in,S,D,c->eps)) return 0;
    /* DSA: i layer con indexer FULL cachano k_idx dalla nrm pre-attention (CPU, piccolo) */
    if(m->has_dsa && li<c->n_layers && m->kv_start[li]==0 && c->idx_type[li]){
        if(!coli_cuda_pipe_download(dev,nrm_d,nrm_host,xb)) return 0;
        int nh=c->index_nh, hd=c->index_hd; (void)nh;
        for(int s=0;s<S;s++){
            int pos=pos_base+s;
            float *kd=coli_kv_row(m->kv->Ic[li],pos,hd);
            matmul_qt(kd, nrm_host+(int64_t)s*D, &m->ix_wk[li], 1);
            layernorm(kd, m->ix_knw[li], m->ix_knb[li], hd, 1e-6f);
            rope_interleave(kd, pos, c);
        }
    }
    if(!attn_pipe_prefill(m,l,li,nrm_d,1,S,pos_base,NULL,y_d)) return 0;
    if(!coli_cuda_pipe_add(dev,x_dev,y_d,(size_t)S*D)) return 0;         /* prima mutazione */
    if(!coli_cuda_pipe_rmsnorm(dev,nrm_d,x_dev,w_post,S,D,c->eps)) return 0;
    /* device router (#431 PR-A): route THIS row on the home device while the
     * stream is still hot, then hand the selection to moe() through the same
     * pre-routed shortcut the Metal layer-CB uses. Any failure (upload, launch,
     * feature gate) falls back to the CPU router inside moe() — byte-identical
     * behaviour, just slower. Gated to the plain routing path: CACHE_ROUTE /
     * ROUTE_P / ROUTE_TRACE keep the CPU ranking they need. */
    static int lr_idx[64]; static float lr_w[64]; static int lr_keff[1];
    int dev_routed=0;
    if(g_cuda_router && S==1 && !g_cache_route && g_route_p<=0.f && !g_route_fp
       && c->n_experts<=4096 && c->topk<=64 && !l->router_cuda_bad){
        int E=c->n_experts, K=c->topk;
        int Ksel = g_topk>0 ? (g_topk<K?g_topk:K) : K;
        float tp = (g_topp>0 && g_topp<1.f) ? g_topp : 0.f;
        if(!l->router_cuda){
            void *rw=coli_cuda_pipe_alloc(dev,(size_t)E*D*4);
            void *rb=coli_cuda_pipe_alloc(dev,(size_t)E*4);
            if(rw&&rb&&coli_cuda_pipe_upload(dev,rw,l->router,(size_t)E*D*4)
                    &&coli_cuda_pipe_upload(dev,rb,l->router_bias,(size_t)E*4)){
                l->router_cuda=rw; l->router_bias_cuda=rb;
            } else {
                if(rw)coli_cuda_pipe_free(dev,rw); if(rb)coli_cuda_pipe_free(dev,rb);
                l->router_cuda_bad=1;
            }
        }
        if(l->router_cuda &&
           coli_cuda_pipe_router(dev,nrm_d,l->router_cuda,l->router_bias_cuda,
                                 D,E,Ksel,tp,c->norm_topk,c->routed_scale,
                                 lr_idx,lr_w,lr_keff))
            dev_routed=1;
    }
    if(!coli_cuda_pipe_download(dev,nrm_d,nrm_host,xb)) return 0;
    m->t_attn+=now_s()-ta;
    /* OVERLAP: issue the shared expert on the GPU BEFORE moe() runs on the CPU.
     * The shared expert reads nrm_d (valid after the download above) and writes its
     * residual into x_dev (async). While the GPU computes this, the CPU enters moe()
     * for routing + expert disk loads + matmul — ~50ms of work that previously left
     * the GPU idle. The shared expert (~0.5ms) finishes early in that window.
     *
     * After moe(), the routed-expert result is uploaded (sync pipe_upload) and added
     * to x_dev (async). Both residual adds (shared + routed) are ordered on the same
     * stream — the next layer's pipe_rmsnorm reads x_dev after both complete.
     *
     * No pipe_sync at the end: the next layer's pipe_download (sync cudaMemcpy)
     * provides the implicit sync point. The fallback path (caller downloads x_dev)
     * also uses pipe_download which syncs. This lets GPU work chain across layers
     * without a per-layer stall.
     *
     * Profiling: moe() self-times its own t_emm (routed expert matmul). We time only
     * the GPU work that moe() does NOT cover: the shared-expert dispatch and the
     * routed-expert upload+add. Previously a single outer span wrapped everything
     * including moe(), double-counting the routed-expert time and driving the
     * profile's "other" bucket negative (#292). */
    double te=now_s();
    if(!coli_cuda_pipe_gemm(l->sh_gate.cuda,sg_d,nrm_d,S)) return 0;
    if(!coli_cuda_pipe_gemm(l->sh_up.cuda,su_d,nrm_d,S)) return 0;
    if(!coli_cuda_pipe_silu_mul(dev,sg_d,su_d,(size_t)S*sI)) return 0;
    if(!coli_cuda_pipe_gemm(l->sh_down.cuda,y_d,sg_d,S)) return 0;
    if(!coli_cuda_pipe_add(dev,x_dev,y_d,(size_t)S*D)) return 0;  /* shared residual (async) */
    m->t_emm += now_s()-te;                                       /* shared-expert GPU dispatch only */
    /* expert routed su CPU/gruppi GPU come oggi (shared saltata: la fa il device) */
    if(dev_routed){ g_pre_idx=lr_idx; g_pre_w=lr_w; g_pre_keff=lr_keff; }
    float *res_acc=NULL;
    if(g_cuda_resid && S==1){
        g_pres_slots=coli_cuda_pipe_scratch(dev,25,(size_t)g_cuda_ndev*D*sizeof(float));
        res_acc     =coli_cuda_pipe_scratch(dev,26,(size_t)D*sizeof(float));
        if(g_pres_slots && res_acc){ g_pres_home=dev; g_pres_xsrc=nrm_d; g_pres_nused=0; }
        else { g_pres_slots=NULL; res_acc=NULL; }
    }
    moe(m,l,li,nrm_host,S,out_host,0);                            /* self-times its own t_emm */
    if(dev_routed){ g_pre_idx=NULL; g_pre_w=NULL; g_pre_keff=NULL; }
    if(g_pres_home>=0){
        int nused=g_pres_nused; g_pres_home=-1; g_pres_xsrc=NULL;
        if(nused>0){
            /* partials are in flight toward our slots; take() orders the legacy
             * stream behind every issue event and reduces in issue order. A
             * failure here would silently drop routed experts — that is a wrong
             * answer, not a slow one, so it is fatal by design. */
            if(!coli_cuda_expert_group_resident_take(dev,g_pres_used,nused,g_pres_slots,res_acc,D)||
               !coli_cuda_pipe_add(dev,x_dev,res_acc,(size_t)D)){
                fprintf(stderr,"[CUDA] resident expert take failed — refusing to drop routed experts\n");
                exit(1);
            }
        }
    }
    te=now_s();
    if(!coli_cuda_pipe_upload(dev,y_d,out_host,xb)) return 0;     /* sync: waits for moe */
    if(!coli_cuda_pipe_add(dev,x_dev,y_d,(size_t)S*D)) return 0;  /* routed residual (async) */
    m->t_emm += now_s()-te;                                       /* routed-expert upload + add only */
    return 1;
}
#endif

static void layer_forward_rows(Model *m, Layer *l, int li, float *x, int S, int pos_base,
                               KVState *const *kvs, const int *positions, float *nrm, float *tmp){
    Cfg *c=&m->c; int D=c->hidden;
    if(g_spec && g_prefetch && l->sparse && m->enr[li]>0)
        for(int z=0;z<m->enr[li];z++) expert_prefetch(m,li,m->eroute[li][z]);
    if(g_looka && S==1 && li<c->n_layers && l->sparse) la_predict(m,li,x,0);
#ifdef COLI_METAL
    /* FULL-LAYER CB: in_ln + attention + residuo + post_ln + shared expert + router/top-K
     * in un solo submit GPU; la CPU legge il routing e fa solo resolve/disk/expert-CB.
     * Fallback: qualsiasi condizione mancante -> percorso CPU intero qui sotto.
     * !kvs: ragged mux rows (per-row KV/position) are not expressible in this kernel's
     * single Lc/Rc + pos_base contract — see the matching guard in attention_rows. */
    if(g_metal_enabled && !kvs && S<=4 && li<c->n_layers && l->sparse
       && (g_absorb==1||(g_absorb<0&&S<=4)) && m->kv_start[li]==0
       && D==6144 && c->n_heads==64 && c->q_lora==2048 && c->kv_lora==512
       && c->qk_nope==192 && c->qk_rope==64 && c->v_head==256 && l->kv_b.fmt==2
       && c->n_experts==256 && c->topk==8 && c->n_shared==1 && c->moe_inter==2048){
        int sel_active = m->has_dsa && c->idx_type[li] && (pos_base+S) > c->index_topk;
        if(!sel_active){
            static float *linrm,*lnrm,*lsh,*lw; static int *lidx,*lkeff;
            if(!linrm){ linrm=falloc(4*(int64_t)D); lnrm=falloc(4*(int64_t)D); lsh=falloc(4*(int64_t)D);
                        lidx=malloc(4*8*sizeof(int)); lw=malloc(4*8*sizeof(float)); lkeff=malloc(4*sizeof(int)); }
            int Ksel = g_topk>0 ? (g_topk<8?g_topk:8) : 8;
            float tp = (g_topp>0 && g_topp<1.f) ? g_topp : 0.f;
            double ta0=now_s();
            #define WP_(q) ((q).fmt==1?(const void*)(q).q8:(const void*)(q).q4)
            int ok = coli_metal_layer_decode(x, l->in_ln, l->post_ln,
                WP_(l->q_a), l->q_a.s, l->q_a.fmt, l->q_a_ln,
                WP_(l->q_b), l->q_b.s, l->q_b.fmt,
                WP_(l->kv_a), l->kv_a.s, l->kv_a.fmt, l->kv_a_ln,
                WP_(l->kv_b), l->kv_b.s, l->kv_b.fmt,
                WP_(l->o), l->o.s, l->o.fmt,
                WP_(l->sh_gate), l->sh_gate.s, l->sh_gate.fmt,
                WP_(l->sh_up),   l->sh_up.s,   l->sh_up.fmt,
                WP_(l->sh_down), l->sh_down.s, l->sh_down.fmt,
                l->router, l->router_bias,
                c->n_experts, c->topk, Ksel, tp, c->norm_topk, c->routed_scale,
                m->Lc[li], m->Rc[li], S, pos_base, m->kv_start[li],
                c->eps, c->theta, c->attn_scale,
                linrm, lnrm, lsh, lidx, lw, lkeff);
            #undef WP_
            if(ok){
                m->t_attn += now_s()-ta0;
                if(m->has_dsa && c->idx_type[li]){            /* index key per selezioni future */
                    for(int s=0;s<S;s++){ int pos=pos_base+s;
                        float *kd=m->Ic[li]+(int64_t)pos*c->index_hd;
                        matmul_qt(kd, linrm+(int64_t)s*D, &m->ix_wk[li], 1);
                        layernorm(kd, m->ix_knw[li], m->ix_knb[li], c->index_hd, 1e-6f);
                        rope_interleave(kd, pos, c);
                    }
                }
                if(g_pilot && S<=8 && li+1<c->n_layers && m->L[li+1].sparse) pilot_prefetch(m,li+1,x,S);
                if(g_looka && S==1 && li+1<c->n_layers && m->L[li+1].sparse){
                    la_predict(m,li+1,x,1);
                    la_predict(m,li+1,x,2);
                }
                g_pre_idx=lidx; g_pre_w=lw; g_pre_keff=lkeff; g_pre_sh=lsh;
                moe(m,l,li,lnrm,S,tmp,1);
                g_pre_idx=NULL; g_pre_w=NULL; g_pre_keff=NULL; g_pre_sh=NULL;
                for(int64_t j=0;j<(int64_t)S*D;j++) x[j]+=tmp[j];
                return;
            }
        }
    }
#endif
    for(int s=0;s<S;s++) rmsnorm(nrm+(int64_t)s*D, x+(int64_t)s*D, l->in_ln, D, c->eps);
    attention_rows(m,l,li,nrm,S,pos_base,kvs,positions,tmp);
    for(int64_t j=0;j<(int64_t)S*D;j++) x[j]+=tmp[j];
    if(g_pilot && S<=8 && li+1<c->n_layers && m->L[li+1].sparse) pilot_prefetch(m,li+1,x,S);
    if(g_looka && S==1 && li+1<c->n_layers && m->L[li+1].sparse){
        la_predict(m,li+1,x,1);  /* baseline: stale-state PILOT */
        la_predict(m,li+1,x,2);  /* two-step: shared-expert-corrected prediction */
    }
    for(int s=0;s<S;s++) rmsnorm(nrm+(int64_t)s*D, x+(int64_t)s*D, l->post_ln, D, c->eps);
    if(l->sparse) moe(m,l,li,nrm,S,tmp,1); else dense_mlp(l,nrm,S,D,c->dense_inter,tmp);
    for(int64_t j=0;j<(int64_t)S*D;j++) x[j]+=tmp[j];
}
static void layer_forward(Model *m, Layer *l, int li, float *x, int S, int pos_base, float *nrm, float *tmp){
    layer_forward_rows(m,l,li,x,S,pos_base,NULL,NULL,nrm,tmp);
}
static void layers_forward_rows(Model *m, float *x, int S, int pos_base,
                                KVState *const *kvs, const int *positions){
    Cfg *c=&m->c; int D=c->hidden;
    if(g_pilot_real){   /* nuovo forward: il possesso-layer riparte da -1 (i layer si rifanno da 0) */
        pthread_mutex_lock(&g_pilot_mx);
        atomic_store_explicit(&g_cur_moe_layer,-1,memory_order_release);
        pthread_mutex_unlock(&g_pilot_mx);
    }
    float *nrm=falloc((int64_t)S*D), *tmp=falloc((int64_t)S*D);
#ifdef COLI_CUDA
    /* PIPE2 (Inc.2a): il residuo resta sul device del layer, saltando tra le schede
     * ai confini di layer. x host diventa STALE finche' la residenza e' attiva.
     *
     * S threshold is device-count-dependent (#273): on a single GPU the resident
     * stream wins at S=1 (evicts the CPU round-trips that dominate small-batch
     * decode — +49% on a 5070 Ti). With layers sharded across multiple GPUs each
     * resident forward crosses P2P per layer group, and at one token per forward
     * those hops don't amortize — A/B on 6x5090 showed S=1 is a wash there. So:
     * single-GPU engages at S=1, multi-GPU keeps the original S>=8 prefill gate.
     * COLI_CUDA_PIPE_S_MIN overrides for anyone who wants to measure. */
    float *x_dev=NULL; int x_dev_on=-1;
    size_t xb=(size_t)S*(size_t)D*4;
    int pipe_s_min = getenv("COLI_CUDA_PIPE_S_MIN") ? atoi(getenv("COLI_CUDA_PIPE_S_MIN"))
                                                     : (g_cuda_ndev<=1 ? 1 : 8);
    int pipe2 = g_cuda_pipe>=2 && !kvs && S>=pipe_s_min && g_cuda_enabled && c->kv_lora<=512 &&
                !(m->has_dsa && pos_base+S>c->index_topk);
#endif
    for(int i=0;i<c->n_layers;i++){
        /* progresso su stderr per i batch grossi (prefill): il primo byte di risposta
         * puo' arrivare dopo MINUTI di streaming — al buio sembra un blocco. */
        if(S>=8 && (i%4==0 || i==c->n_layers-1))
            fprintf(stderr,"[prefill] layer %d/%d · %d token\n", i+1, c->n_layers, S);
#ifdef COLI_CUDA
        Layer *l=&m->L[i];
        if(pipe2 && l->sparse && i<c->n_layers &&
           l->q_a.cuda_eligible&&l->q_b.cuda_eligible&&l->kv_a.cuda_eligible&&
           l->kv_b.cuda_eligible&&l->o.cuda_eligible&&
           qt_cuda_upload(&l->q_a)&&qt_cuda_upload(&l->q_b)&&qt_cuda_upload(&l->kv_a)&&
           qt_cuda_upload(&l->kv_b)&&qt_cuda_upload(&l->o)&&
           l->q_a.cuda_device==l->kv_b.cuda_device&&l->q_b.cuda_device==l->kv_b.cuda_device&&
           l->kv_a.cuda_device==l->kv_b.cuda_device&&l->o.cuda_device==l->kv_b.cuda_device){
            int dev=l->kv_b.cuda_device, ok=1;
            float *dst=coli_cuda_pipe_scratch(dev,15,xb);
            /* Ogni uscita dalla residenza deve riportare il residuo su host PRIMA di
             * lasciare il layer al percorso CPU: x host e' STALE finche' x_dev_on>=0,
             * quindi scaricare e' l'unico modo di non calcolare su uno stato vecchio. */
            if(!dst){
                /* niente scratch su questo device: si cade sul percorso CPU qui sotto */
                if(x_dev_on>=0){ coli_cuda_pipe_download(x_dev_on,x_dev,x,xb); x_dev_on=-1; }
            } else {
                if(x_dev_on<0) ok=coli_cuda_pipe_upload(dev,dst,x,xb);
                else if(x_dev_on!=dev){
                    double tp=g_prof?now_s():0;
                    ok=coli_cuda_pipe_peer_copy(dev,dst,x_dev_on,x_dev,xb);
                    if(g_prof){m->t_p2p+=now_s()-tp;m->n_p2p++;}
                }
                else dst=x_dev;
                if(ok){
                    x_dev=dst; x_dev_on=dev;
                    if(pipe_layer_sparse(m,l,i,x_dev,S,pos_base,nrm,tmp)) continue;
                    /* fallback: snapshot -> host, layer rifatto sul percorso CPU */
                    coli_cuda_pipe_peer_copy(dev,x_dev,dev,coli_cuda_pipe_scratch(dev,14,xb),xb);
                    coli_cuda_pipe_download(dev,x_dev,x,xb);
                    x_dev_on=-1;
                }else{
                    /* upload o peer-copy fallita (P2P disabilitato, rifiuto del driver,
                     * NVLink giu'). Se la residenza era attiva il dato autorevole e'
                     * ancora sul device PRECEDENTE, non in dst: va scaricato da li'.
                     * Con x_dev_on<0 ha fallito l'upload e x host e' gia' autorevole. */
                    if(x_dev_on>=0) coli_cuda_pipe_download(x_dev_on,x_dev,x,xb);
                    x_dev_on=-1;
                }
            }
        } else if(x_dev_on>=0){                 /* layer fuori pipe: il residuo torna a casa */
            coli_cuda_pipe_download(x_dev_on,x_dev,x,xb);
            x_dev_on=-1;
        }
#endif
        layer_forward_rows(m,&m->L[i],i,x,S,pos_base,kvs,positions,nrm,tmp);
    }
#ifdef COLI_CUDA
    if(x_dev_on>=0) coli_cuda_pipe_download(x_dev_on,x_dev,x,xb);
#endif
    free(nrm); free(tmp);
}
static void layers_forward(Model *m, float *x, int S, int pos_base){
    layers_forward_rows(m,x,S,pos_base,NULL,NULL);
}

static void kv_alloc(Model *m, int max_t){
    Cfg *c=&m->c;
    KVState *k=m->kv;
#ifdef COLI_CUDA
    if(m->kv_dev_L) for(int i=0;i<c->n_layers+1;i++){    /* dimensioni cambiate: ombra da rifare */
        if(m->kv_dev_L[i]){ coli_cuda_pipe_free(m->L[i<c->n_layers?i:0].kv_b.cuda_device,m->kv_dev_L[i]); m->kv_dev_L[i]=NULL; }
        if(m->kv_dev_R[i]){ coli_cuda_pipe_free(m->L[i<c->n_layers?i:0].kv_b.cuda_device,m->kv_dev_R[i]); m->kv_dev_R[i]=NULL; }
        m->kv_dev_valid[i]=0;
    }
#endif
    if(k->Lc){ for(int i=0;i<c->n_layers+1;i++){
#ifdef COLI_METAL
        if(g_metal_enabled){ coli_metal_unregister(k->Lc[i]); coli_metal_unregister(k->Rc[i]); }
#endif
        free(k->Lc[i]); free(k->Rc[i]); } free(k->Lc); free(k->Rc); }
    if(k->Ic){ for(int i=0;i<c->n_layers;i++) free(k->Ic[i]); free(k->Ic); k->Ic=NULL; }
    if(m->has_dsa){
        k->Ic=calloc(c->n_layers,sizeof(float*));
        for(int i=0;i<c->n_layers;i++) if(c->idx_type[i]) k->Ic[i]=falloc((int64_t)max_t*c->index_hd);
    }
    k->max_t=max_t;
    int NR=c->n_layers+1;                        /* riga extra: KV del layer MTP */
    k->Lc=calloc(NR,sizeof(float*)); k->Rc=calloc(NR,sizeof(float*));
    for(in
import { 
  Globe, 
  Server, 
  Cpu, 
  ArrowRight, 
  Search,
  CheckCircle2
} from 'lucide-react';

const ArchitectureVisual = () => {
  return (
    <div className="w-full space-card rounded-3xl p-10 relative overflow-hidden group">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-accent-secondary/10 rounded-full blur-[100px] animate-pulse"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        
        {/* Layer 1: Frontend */}
        <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/5 group/item transition-all hover:bg-white/10">
          <div className="w-16 h-16 bg-bg-surface rounded-2xl shadow-xl border border-white/10 flex items-center justify-center mb-6 group-hover/item:scale-110 transition-transform">
            <Globe className="text-accent-tertiary w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Frontend</h3>
          <p className="text-xs text-text-muted mb-6 font-medium">React & Tailwind UX</p>
          <div className="mt-auto">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-accent-tertiary/10 text-accent-tertiary border border-accent-tertiary/20">Reactive Interface</span>
          </div>
        </div>

        {/* Connector 1 */}
        <div className="hidden lg:flex items-center justify-center absolute left-[31%] top-1/2 -translate-y-1/2 z-10">
          <div className="p-3 rounded-full bg-bg-surface border border-white/10 shadow-lg">
            <ArrowRight className="text-accent-primary w-4 h-4" />
          </div>
        </div>

        {/* Layer 2: Backend & AI */}
        <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/5 group/item transition-all hover:bg-white/10">
          <div className="w-16 h-16 bg-bg-surface rounded-2xl shadow-xl border border-white/10 flex items-center justify-center mb-6 group-hover/item:scale-110 transition-transform">
            <Server className="text-accent-primary w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Core Engine</h3>
          <p className="text-xs text-text-muted mb-6 font-medium">Django & NLP Pipeline</p>
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary bg-bg-base p-2 rounded-lg border border-white/5">
              <Search className="w-3 h-3 text-accent-primary" /> Clause Intelligence
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary bg-bg-base p-2 rounded-lg border border-white/5">
              <CheckCircle2 className="w-3 h-3 text-accent-secondary" /> Fairness Audit
            </div>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="hidden lg:flex items-center justify-center absolute left-[64%] top-1/2 -translate-y-1/2 z-10">
          <div className="p-3 rounded-full bg-bg-surface border border-white/10 shadow-lg">
            <ArrowRight className="text-accent-secondary w-4 h-4" />
          </div>
        </div>

        {/* Layer 3: Blockchain */}
        <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/5 group/item transition-all hover:bg-white/10">
          <div className="w-16 h-16 bg-bg-surface rounded-2xl shadow-xl border border-white/10 flex items-center justify-center mb-6 group-hover/item:scale-110 transition-transform">
            <Cpu className="text-accent-secondary w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Immutable Layer</h3>
          <p className="text-xs text-text-muted mb-6 font-medium">Solidity & Hardhat</p>
          <div className="mt-auto">
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20 uppercase tracking-widest">
              Verified Ledger
            </span>
          </div>
        </div>

      </div>

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-4 p-1 px-4 rounded-full bg-white/5 border border-white/5">
          <div className="flex -space-x-1">
            <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
            <div className="w-2 h-2 rounded-full bg-accent-secondary"></div>
            <div className="w-2 h-2 rounded-full bg-accent-tertiary"></div>
          </div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.25em]">End-to-End Encryption & Trust</span>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureVisual;

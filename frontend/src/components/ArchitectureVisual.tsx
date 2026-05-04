import { 
  Globe, 
  Server, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  Search,
  CheckCircle2
} from 'lucide-react';

const ArchitectureVisual = () => {
  return (
    <div className="w-full bg-bg-surface/50 backdrop-blur-xl rounded-3xl p-8 border border-border-default shadow-2xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-primary/10 rounded-full blur-[100px] group-hover:bg-accent-primary/20 transition-colors"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Layer 1: Frontend */}
        <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 group/item transition-all hover:bg-white/10 hover:border-accent-primary/50">
          <div className="w-16 h-16 bg-bg-base rounded-2xl shadow-inner border border-white/10 flex items-center justify-center mb-6 group-hover/item:scale-110 group-hover/item:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
            <Globe className="text-accent-primary w-8 h-8" />
          </div>
          <h3 className="font-sans text-xl font-bold mb-2 text-text-primary">Frontend</h3>
          <p className="font-mono text-xs text-text-muted mb-6 uppercase tracking-widest">React & TypeScript</p>
          <div className="flex flex-wrap justify-center gap-2 mt-auto">
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary uppercase">Real-time UI</span>
          </div>
        </div>

        {/* Connector 1 */}
        <div className="hidden lg:flex items-center justify-center absolute left-[31%] top-1/2 -translate-y-1/2 z-10">
          <div className="bg-bg-surface p-2 rounded-full border border-border-default shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <ArrowRight className="text-accent-primary w-4 h-4 animate-pulse" />
          </div>
        </div>

        {/* Layer 2: Backend & AI */}
        <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 group/item transition-all hover:bg-white/10 hover:border-accent-primary/50">
          <div className="w-16 h-16 bg-bg-base rounded-2xl shadow-inner border border-white/10 flex items-center justify-center mb-6 group-hover/item:scale-110 group-hover/item:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
            <Server className="text-accent-primary w-8 h-8" />
          </div>
          <h3 className="font-sans text-xl font-bold mb-2 text-text-primary">Intelligence</h3>
          <p className="font-mono text-xs text-text-muted mb-6 uppercase tracking-widest">Django & spaCy NLP</p>
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-2 text-[10px] font-mono font-medium text-text-primary bg-bg-base/50 p-2 rounded-lg border border-white/5">
              <Search className="w-3 h-3 text-accent-primary" /> Clause Parsing
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono font-medium text-text-primary bg-bg-base/50 p-2 rounded-lg border border-white/5">
              <CheckCircle2 className="w-3 h-3 text-accent-primary" /> Bias Check
            </div>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="hidden lg:flex items-center justify-center absolute left-[64%] top-1/2 -translate-y-1/2 z-10">
          <div className="bg-bg-surface p-2 rounded-full border border-border-default shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <ArrowRight className="text-accent-primary w-4 h-4 animate-pulse" />
          </div>
        </div>

        {/* Layer 3: Blockchain */}
        <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 group/item transition-all hover:bg-white/10 hover:border-accent-primary/50">
          <div className="w-16 h-16 bg-bg-base rounded-2xl shadow-inner border border-white/10 flex items-center justify-center mb-6 group-hover/item:scale-110 group-hover/item:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
            <Cpu className="text-accent-primary w-8 h-8" />
          </div>
          <h3 className="font-sans text-xl font-bold mb-2 text-text-primary">Execution</h3>
          <p className="font-mono text-xs text-text-muted mb-6 uppercase tracking-widest">Solidity & Hardhat</p>
          <div className="flex flex-wrap justify-center gap-2 mt-auto">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-1 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary uppercase">
              <ShieldCheck className="w-3 h-3" /> Audit Log
            </div>
          </div>
        </div>

      </div>

      <div className="mt-12 pt-8 border-t border-white/5">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-primary animate-ping"></div>
            <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-[0.2em]">Flow: Document → Audit → Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureVisual;

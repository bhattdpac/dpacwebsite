import { useState } from 'react';
import { 
  Globe, 
  Server, 
  Cpu, 
  ArrowRight, 
  Search,
  CheckCircle2
} from 'lucide-react';

const ArchitectureVisual = () => {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  const layerDetails: Record<string, {
    title: string;
    importance: string;
    status: string;
    tech: string[];
    accentColor: string;
  }> = {
    frontend: {
      title: "Frontend Layer (UX & Human-in-the-Loop)",
      importance: "Serves as the gateway for legal professionals and clients, transforming complex Web3 variables and bytecode logs into plain-language explanations. This visual validation ensures lawyers remain in control of the final smart contract translation.",
      status: "Operational. Optimized with the 'Cyber Sunset' theme, featuring step-by-step upload wizards, pipeline status trackers, and accessibility elements.",
      tech: ["React 19", "Vite", "TypeScript", "Tailwind CSS", "Lucide React"],
      accentColor: "border-accent-tertiary text-accent-tertiary"
    },
    engine: {
      title: "Core Engine (NLP & Bias Audit Services)",
      importance: "The cognitive processor of the platform. It parses legal agreements, extracts semantic clauses, conducts fairness/bias checking (preventing power imbalances), and queries database indices to suggest relevant academic literature and legal precedents.",
      status: "Active. Powered by a Django REST API. Linked with sqlite3 engines containing over 81,194 arXiv papers and 3,890 indexed Federal Court of Australia legal cases.",
      tech: ["Django REST Framework", "spaCy NLP", "SQLite3", "Python 3.10"],
      accentColor: "border-accent-primary text-accent-primary"
    },
    blockchain: {
      title: "Immutable Layer (Smart Contract Ledger)",
      importance: "Enforces trustless execution of the verified legal agreements. It renders parameters into secure Solidity code, compiles them using Hardhat, deploys them to the blockchain ledger, and logs immutable transaction signatures.",
      status: "Online. Templates (Escrow, NDAs, Loans) tested and secure under Slither audits. Local Hardhat node active in the background under PM2 management.",
      tech: ["Solidity", "Hardhat", "Ethers.js", "TypeChain"],
      accentColor: "border-accent-secondary text-accent-secondary"
    }
  };

  return (
    <div className="w-full space-card rounded-3xl p-10 relative overflow-hidden group">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-accent-secondary/10 rounded-full blur-[100px] animate-pulse"></div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        
        {/* Layer 1: Frontend */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setActiveLayer(activeLayer === 'frontend' ? null : 'frontend')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveLayer(activeLayer === 'frontend' ? null : 'frontend')}
          className={`flex flex-col items-center text-center p-8 bg-border-default/30 rounded-2xl border transition-all duration-300 hover:bg-border-default/50 cursor-pointer focus:outline-none ${activeLayer === 'frontend' ? 'border-accent-tertiary ring-2 ring-accent-tertiary/20' : 'border-border-default/60'}`}
        >
          <div className="w-16 h-16 bg-bg-surface rounded-2xl shadow-xl border border-border-default flex items-center justify-center mb-6 transition-transform hover:scale-110">
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
          <div className="p-3 rounded-full bg-bg-surface border border-border-default shadow-lg">
            <ArrowRight className="text-accent-primary w-4 h-4" />
          </div>
        </div>

        {/* Layer 2: Core Engine */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setActiveLayer(activeLayer === 'engine' ? null : 'engine')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveLayer(activeLayer === 'engine' ? null : 'engine')}
          className={`flex flex-col items-center text-center p-8 bg-border-default/30 rounded-2xl border transition-all duration-300 hover:bg-border-default/50 cursor-pointer focus:outline-none ${activeLayer === 'engine' ? 'border-accent-primary ring-2 ring-accent-primary/20' : 'border-border-default/60'}`}
        >
          <div className="w-16 h-16 bg-bg-surface rounded-2xl shadow-xl border border-border-default flex items-center justify-center mb-6 transition-transform hover:scale-110">
            <Server className="text-accent-primary w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Core Engine</h3>
          <p className="text-xs text-text-muted mb-6 font-medium">Django & NLP Pipeline</p>
          <div className="space-y-2 w-full">
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary bg-bg-base p-2 rounded-lg border border-border-default/60">
              <Search className="w-3 h-3 text-accent-primary" /> Clause Intelligence
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary bg-bg-base p-2 rounded-lg border border-border-default/60">
              <CheckCircle2 className="w-3 h-3 text-accent-secondary" /> Fairness Audit
            </div>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="hidden lg:flex items-center justify-center absolute left-[64%] top-1/2 -translate-y-1/2 z-10">
          <div className="p-3 rounded-full bg-bg-surface border border-border-default shadow-lg">
            <ArrowRight className="text-accent-secondary w-4 h-4" />
          </div>
        </div>

        {/* Layer 3: Blockchain */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setActiveLayer(activeLayer === 'blockchain' ? null : 'blockchain')}
          onKeyDown={(e) => e.key === 'Enter' && setActiveLayer(activeLayer === 'blockchain' ? null : 'blockchain')}
          className={`flex flex-col items-center text-center p-8 bg-border-default/30 rounded-2xl border transition-all duration-300 hover:bg-border-default/50 cursor-pointer focus:outline-none ${activeLayer === 'blockchain' ? 'border-accent-secondary ring-2 ring-accent-secondary/20' : 'border-border-default/60'}`}
        >
          <div className="w-16 h-16 bg-bg-surface rounded-2xl shadow-xl border border-border-default flex items-center justify-center mb-6 transition-transform hover:scale-110">
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

      {/* Interactive Details Panel */}
      {activeLayer && (
        <div className={`mt-8 p-6 bg-border-default/30 rounded-2xl border transition-all duration-300 ${layerDetails[activeLayer].accentColor.split(' ')[0]}`}>
          <div className="flex justify-between items-start gap-4 mb-4">
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-text-primary">
              {layerDetails[activeLayer].title}
            </h4>
            <button 
              onClick={() => setActiveLayer(null)}
              className="text-[10px] uppercase font-bold tracking-widest text-text-muted hover:text-accent-primary transition-colors"
            >
              Close
            </button>
          </div>
          <div className="space-y-4 text-xs leading-relaxed font-medium">
            <p>
              <strong className="text-text-primary uppercase tracking-wider block mb-1 text-[10px]">Role & Importance:</strong>
              <span className="text-text-muted">{layerDetails[activeLayer].importance}</span>
            </p>
            <p>
              <strong className="text-text-primary uppercase tracking-wider block mb-1 text-[10px]">Current Operations:</strong>
              <span className="text-text-muted">{layerDetails[activeLayer].status}</span>
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {layerDetails[activeLayer].tech.map((t, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md bg-border-default/30 border border-border-default/60 text-[9px] font-mono tracking-wider text-text-primary">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-4 p-1 px-4 rounded-full bg-border-default/30 border border-border-default/60">
          <div className="flex -space-x-1">
            <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
            <div className="w-2 h-2 rounded-full bg-accent-secondary"></div>
            <div className="w-2 h-2 rounded-full bg-accent-tertiary"></div>
          </div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.25em]">
            {activeLayer ? 'Click another layer or close to reset' : 'Click a layer card above to view details & importance'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureVisual;

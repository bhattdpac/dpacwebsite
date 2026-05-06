import { 
  BookOpen, 
  Zap, 
  ChevronRight,
  Blocks,
  Globe,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';

const modules = [
  {
    title: "The Trustless Logic",
    description: "Understanding how decentralized state machines reach consensus without central authority.",
    tags: ["Consensus", "Nodes", "State Transition"],
    icon: <Globe className="w-6 h-6 text-accent-primary" />
  },
  {
    title: "Cryptography Primitives",
    description: "Deep dive into Hashing, Digital Signatures, and Public/Private Key Infrastructure.",
    tags: ["SHA-256", "ECDSA", "Zero-Knowledge"],
    icon: <Lock className="w-6 h-6 text-accent-secondary" />
  },
  {
    title: "Smart Contract Architecture",
    description: "Building modular, upgradeable, and gas-efficient protocols on the EVM.",
    tags: ["Solidity", "Gas", "Patterns"],
    icon: <Blocks className="w-6 h-6 text-accent-tertiary" />
  },
  {
    title: "Decentralized Finance (DeFi)",
    description: "How Automated Market Makers (AMMs) and Lending Protocols function under the hood.",
    tags: ["Liquidity", "Yield", "Flash Loans"],
    icon: <Zap className="w-6 h-6 text-accent-primary" />
  }
];

const glossary = [
  { term: "Gas", definition: "The fee required to successfully conduct a transaction or execute a contract on a blockchain." },
  { term: "Immutable", definition: "Unchanging over time or unable to be changed. Once data is on-chain, it cannot be deleted." },
  { term: "Consensus", definition: "The process by which nodes in a network agree on the state of the ledger." },
  { term: "Hard Fork", definition: "A radical change to a network protocol that makes previously invalid blocks/transactions valid." }
];

const Academy = () => {
  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg sunset-gradient flex items-center justify-center">
              <BookOpen className="text-white h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">DPAC<span className="text-accent-primary">.</span>ACADEMY</span>
          </Link>
          <Link to="/" className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">
            Back to Portfolio
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-48 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] bg-accent-primary/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        <div className="max-w-7xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent-tertiary text-[10px] font-bold uppercase tracking-[0.3em]">
            Blockchain Masterclass
          </div>
          <h1 className="text-6xl md:text-8xl font-display font-bold leading-tight tracking-tight">
            Knowledge is <br />
            <span className="text-transparent bg-clip-text sunset-gradient">Decentralized.</span>
          </h1>
          <p className="text-xl text-text-muted font-medium max-w-2xl mx-auto leading-relaxed">
            A structured journey from technical fundamentals to advanced protocol design. Learn the principles of the trustless frontier.
          </p>
        </div>
      </section>

      {/* Curriculum Grid */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {modules.map((module, i) => (
              <div key={i} className="group p-10 space-card rounded-[2.5rem] border border-white/5 hover:bg-white/[0.05] transition-all">
                <div className="w-16 h-16 rounded-2xl bg-bg-base border border-white/5 flex items-center justify-center mb-8 group-hover:border-accent-primary transition-all">
                  {module.icon}
                </div>
                <h3 className="text-3xl font-display font-bold mb-6 uppercase tracking-tight">{module.title}</h3>
                <p className="text-text-muted text-lg font-medium leading-relaxed mb-10">
                  {module.description}
                </p>
                <div className="flex flex-wrap gap-3 mb-12">
                  {module.tags.map((tag, j) => (
                    <span key={j} className="text-[10px] font-bold px-4 py-2 rounded-full bg-white/5 text-text-muted uppercase tracking-[0.2em] border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="flex items-center gap-3 text-accent-primary font-bold uppercase tracking-widest hover:text-white transition-colors">
                  Start Module <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Glossary Section */}
      <section className="py-24 px-8 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6">
            <h2 className="text-5xl font-display font-bold uppercase tracking-tight">Decentralized Dictionary</h2>
            <p className="text-text-muted text-lg font-medium max-w-2xl mx-auto">
              Breaking down the complex terminology of Web3 into human-readable concepts.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {glossary.map((item, i) => (
              <div key={i} className="p-8 space-card rounded-3xl border border-white/5">
                <h4 className="text-accent-tertiary font-bold uppercase tracking-widest text-xs mb-4">{item.term}</h4>
                <p className="text-text-primary text-sm font-medium leading-relaxed">{item.definition}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-48 px-8 text-center">
        <div className="max-w-4xl mx-auto p-16 rounded-[3rem] bg-gradient-to-br from-orange-500/10 to-magenta-500/10 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] -z-10"></div>
          <h2 className="text-4xl font-display font-bold mb-8">Ready to build the future?</h2>
          <Link to="/research" className="inline-block sunset-gradient text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-orange-500/20">
            Explore AI Research Hub
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Academy;

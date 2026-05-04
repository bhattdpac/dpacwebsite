import { 
  Play, 
  Code, 
  Lock, 
  Zap, 
  BookOpen,
  Terminal,
  Trophy
} from 'lucide-react';

const roadmapItems = [
  {
    stage: "The Fundamentals",
    description: "Mastering the core concepts of Web3 and Ethereum architecture.",
    topics: ["Bitcoin vs Ethereum", "Cryptography", "Wallets & Providers"],
    channels: ["Whiteboard Crypto", "Finematics"],
    icon: <Play className="w-5 h-5 text-accent-tertiary" />,
    color: "bg-accent-tertiary/10"
  },
  {
    stage: "Smart Contract Mastery",
    description: "Writing, testing and deploying secure Solidity code.",
    topics: ["Solidity Syntax", "Design Patterns", "Unit Testing"],
    channels: ["Smart Contract Programmer", "EatTheBlocks"],
    icon: <Code className="w-5 h-5 text-accent-primary" />,
    color: "bg-accent-primary/10"
  },
  {
    stage: "Development Workflow",
    description: "Professional tooling and environments for blockchain projects.",
    topics: ["Hardhat & Foundry", "Viem / Ethers.js", "IPFS / Arweave"],
    channels: ["Patrick Collins", "Dapp University"],
    icon: <Terminal className="w-5 h-5 text-accent-secondary" />,
    color: "bg-accent-secondary/10"
  },
  {
    stage: "Advanced Security",
    description: "Auditing, gas optimization, and protocol research.",
    topics: ["Security Audits", "Gas Optimization", "MEV"],
    channels: ["Cyfrin Updraft", "Owen Thurm"],
    icon: <Lock className="w-5 h-5 text-accent-primary" />,
    color: "bg-accent-primary/10"
  },
  {
    stage: "The Frontier",
    description: "Layer 2 scaling solutions and Zero Knowledge proofs.",
    topics: ["L2s (Optimism/Arbitrum)", "ZK-Rollups", "Cross-chain"],
    channels: ["Bankless", "Hashing It Out"],
    icon: <Zap className="w-5 h-5 text-accent-secondary" />,
    color: "bg-accent-secondary/10"
  }
];

const BlockchainRoadmap = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="relative border-l-2 border-white/5 ml-3 md:ml-6 space-y-16">
        {roadmapItems.map((item, index) => (
          <div key={index} className="relative group pl-10">
            {/* Step Marker */}
            <div className={`absolute -left-[1.35rem] md:-left-[1.65rem] top-0 w-10 h-10 rounded-2xl bg-bg-surface border border-white/10 shadow-xl flex items-center justify-center z-10 group-hover:scale-110 group-hover:border-accent-primary transition-all duration-300`}>
              {item.icon}
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-3xl font-display font-bold text-text-primary tracking-tight">{item.stage}</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-text-muted text-[10px] font-bold uppercase tracking-widest border border-white/10">
                  <Play className="w-3 h-3 text-accent-primary" /> Curated Content
                </div>
              </div>
              
              <p className="text-text-muted text-lg font-medium leading-relaxed max-w-2xl">
                {item.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Topics */}
                <div className="space-card p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-4 font-bold text-xs uppercase tracking-[0.2em] text-accent-tertiary">
                    <BookOpen className="w-4 h-4" /> Core Modules
                  </div>
                  <ul className="space-y-3">
                    {item.topics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium text-text-primary">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary"></div>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Channels */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-4 font-bold text-xs uppercase tracking-[0.2em] text-accent-secondary">
                    <Play className="w-4 h-4" /> Expert Channels
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.channels.map((channel, i) => (
                      <span key={i} className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-bg-base border border-white/10 text-text-muted hover:text-text-primary hover:border-accent-primary transition-all">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Final Trophy */}
        <div className="relative group pl-10">
          <div className="absolute -left-[1.35rem] md:-left-[1.65rem] top-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-magenta-500 border border-white/20 shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center z-10 animate-bounce">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-display font-bold text-accent-primary">Lead Systems Architect</h3>
            <p className="text-text-muted font-medium">The journey into the trustless frontier never ends.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainRoadmap;

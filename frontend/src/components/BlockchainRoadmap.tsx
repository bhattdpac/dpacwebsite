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
    icon: <Play className="w-5 h-5 text-accent-primary" />,
    color: "bg-accent-primary/10"
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
    icon: <Terminal className="w-5 h-5 text-accent-primary" />,
    color: "bg-accent-primary/10"
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
    icon: <Zap className="w-5 h-5 text-accent-primary" />,
    color: "bg-accent-primary/10"
  }
];

const BlockchainRoadmap = () => {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="relative border-l border-white/10 ml-6 space-y-16">
        {roadmapItems.map((item, index) => (
          <div key={index} className="relative group pl-12">
            {/* Step Marker */}
            <div className={`absolute -left-[1.35rem] top-0 w-10 h-10 rounded-xl bg-bg-surface border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.15)] flex items-center justify-center z-10 group-hover:border-accent-primary/50 group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-500`}>
              {item.icon}
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-3xl font-sans font-extrabold text-text-primary tracking-tight group-hover:text-accent-primary transition-colors duration-300">
                  {item.stage}
                </h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-text-muted text-[10px] font-mono font-bold uppercase tracking-widest border border-white/10">
                  <Play className="w-3 h-3 text-accent-primary" /> Recommended
                </div>
              </div>
              
              <p className="text-text-muted text-lg font-medium leading-relaxed max-w-2xl">
                {item.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Topics */}
                <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 backdrop-blur-sm group-hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-6 font-mono font-bold text-[10px] uppercase tracking-[0.2em] text-accent-primary">
                    <BookOpen className="w-3.5 h-3.5" /> Core Mastery
                  </div>
                  <ul className="space-y-4">
                    {item.topics.map((topic, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium text-text-primary">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/40"></div>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Channels */}
                <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/5 backdrop-blur-sm group-hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-6 font-mono font-bold text-[10px] uppercase tracking-[0.2em] text-accent-primary">
                    <Play className="w-3.5 h-3.5" /> Best Channels
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.channels.map((channel, i) => (
                      <span key={i} className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-lg bg-bg-base border border-white/10 text-text-muted group-hover:text-text-primary group-hover:border-accent-primary/30 transition-all">
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
        <div className="relative group pl-12">
          <div className="absolute -left-[1.35rem] top-0 w-10 h-10 rounded-xl bg-accent-primary border border-accent-primary shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center z-10 animate-bounce">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-2 pt-1">
            <h3 className="text-2xl font-sans font-extrabold text-white tracking-tight">Senior Blockchain Architect</h3>
            <p className="text-text-muted font-mono text-sm uppercase tracking-widest">Continuous iteration is the protocol.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainRoadmap;

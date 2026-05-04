import { 
  Shield, 
  Cpu, 
  ExternalLink, 
  ChevronRight,
  Blocks,
  FileCode,
  Layout,
  MessageSquare,
  Terminal,
  Zap,
  Box,
  Globe,
  Link as LinkIcon,
  Code
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ArchitectureVisual from '../components/ArchitectureVisual';
import BlockchainRoadmap from '../components/BlockchainRoadmap';

const PortfolioHome = () => {
  const skills = [
    { name: 'Solidity', icon: <Shield className="w-5 h-5" />, category: 'Blockchain' },
    { name: 'Hardhat', icon: <Blocks className="w-5 h-5" />, category: 'Blockchain' },
    { name: 'Ethers.js', icon: <Cpu className="w-5 h-5" />, category: 'Blockchain' },
    { name: 'React', icon: <Layout className="w-5 h-5" />, category: 'Frontend' },
    { name: 'TypeScript', icon: <Terminal className="w-5 h-5" />, category: 'Frontend' },
    { name: 'Tailwind', icon: <Zap className="w-5 h-5" />, category: 'Frontend' },
    { name: 'Django', icon: <FileCode className="w-5 h-5" />, category: 'Backend' },
    { name: 'spaCy AI', icon: <MessageSquare className="w-5 h-5" />, category: 'AI' },
  ];

  const projects = [
    {
      title: 'Legal Framework',
      description: 'Translating complex legal language into executable, audited smart contracts using modular NLP pipelines.',
      tags: ['Django', 'Solidity', 'spaCy'],
      link: '/legal-framework',
      type: 'internal'
    },
    {
      title: 'DEX Aggregator',
      description: 'Advanced liquidity routing engine optimized for low slippage across cross-chain decentralized exchanges.',
      tags: ['Solidity', 'Ethers.js'],
      link: '#',
      type: 'external'
    },
    {
      title: 'DAO Governance',
      description: 'A modular framework for decentralized autonomous organizations with adaptive voting mechanisms.',
      tags: ['Hardhat', 'OpenZeppelin'],
      link: '#',
      type: 'external'
    }
  ];

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white relative">
      
      {/* Refined Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl sunset-gradient flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Box className="text-white h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight">DPAC<span className="text-accent-primary">.</span>DEV</span>
          </div>
          <div className="hidden lg:flex gap-10 text-xs font-bold uppercase tracking-[0.2em] text-text-muted">
            {['About', 'Architecture', 'Skills', 'Work', 'Roadmap'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-accent-primary transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-6">
            <button className="bg-white text-black px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent-primary hover:text-white transition-all shadow-xl shadow-white/5">
              Contact
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-64 pb-48 px-8 overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-accent-primary/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-accent-secondary/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent-tertiary text-[10px] font-bold uppercase tracking-[0.3em]">
              <span className="w-2 h-2 rounded-full bg-accent-tertiary animate-ping"></span>
              Engineering the Trustless Era
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold leading-[0.9] tracking-tight">
              Architecting <br />
              <span className="text-transparent bg-clip-text sunset-gradient">Digital Integrity.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-text-muted font-medium leading-relaxed max-w-2xl">
              I build secure, modular blockchain infrastructure that bridges the gap between <span className="text-text-primary">human-readable agreements</span> and <span className="text-text-primary">immutable code</span>.
            </p>
            
            <div className="flex flex-wrap gap-8 pt-6">
              <div className="flex items-center gap-10">
                <div>
                  <div className="text-4xl font-display font-bold text-text-primary italic">15+</div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Protocols Shipped</div>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div>
                  <div className="text-4xl font-display font-bold text-text-primary italic">5k+</div>
                  <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">On-Chain Commits</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-10">
              <a href="#projects" className="sunset-gradient text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-orange-500/20">
                View Projects
              </a>
              <div className="flex gap-4">
                <a href="#" className="p-5 space-card rounded-2xl">
                  <LinkIcon className="w-6 h-6 text-text-muted hover:text-white transition-colors" />
                </a>
                <a href="#" className="p-5 space-card rounded-2xl">
                  <Globe className="w-6 h-6 text-text-muted hover:text-white transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Skills Split */}
      <section id="about" className="py-40 px-8 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-5xl font-display font-bold uppercase tracking-tight">Systematic <br /> Excellence</h2>
              <div className="w-20 h-1.5 sunset-gradient rounded-full"></div>
            </div>
            <div className="space-y-8 text-xl text-text-muted font-medium leading-relaxed">
              <p>
                My approach to development is rooted in <span className="text-text-primary">rigorous modularity</span>. Every system I build is designed to be extensible, secure, and provably correct.
              </p>
              <p>
                From NLP-driven legal tech to cross-chain DeFi protocols, I focus on creating infrastructure that remains robust under adversarial conditions.
              </p>
            </div>
          </div>
          
          <div id="skills" className="grid grid-cols-2 gap-4">
            {skills.map((skill, i) => (
              <div key={i} className="group p-8 space-card rounded-3xl hover:bg-white/[0.05]">
                <div className="w-12 h-12 rounded-2xl bg-bg-base border border-white/5 flex items-center justify-center mb-6 group-hover:border-accent-primary transition-all">
                  <div className="text-accent-primary group-hover:scale-110 transition-transform">
                    {skill.icon}
                  </div>
                </div>
                <h3 className="text-xl font-display font-bold mb-1">{skill.name}</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{skill.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Visual Section */}
      <section id="architecture" className="py-40 px-8 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-5xl font-display font-bold uppercase tracking-tight">Modular Topology</h2>
            <p className="text-text-muted text-lg font-medium">
              A high-fidelity representation of the Legal Framework System's cross-layer data flow.
            </p>
          </div>
          <ArchitectureVisual />
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="py-40 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="max-w-xl space-y-6">
              <h2 className="text-6xl font-display font-bold uppercase tracking-tight">Work</h2>
              <p className="text-text-muted text-xl font-medium">
                Production-grade implementations of decentralised infrastructure.
              </p>
            </div>
            <a href="#" className="flex items-center gap-3 text-accent-primary font-bold uppercase tracking-widest hover:text-accent-secondary transition-colors group">
              Browse Github <ExternalLink className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <div key={i} className="group relative space-card rounded-[2rem] p-10 hover:bg-white/[0.05] transition-all overflow-hidden flex flex-col h-full">
                {/* Accent Decor */}
                <div className="absolute -top-10 -right-10 w-32 h-32 sunset-gradient opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-opacity"></div>
                
                <div className="mb-10 flex-grow">
                  <div className="flex gap-2 mb-8">
                    {project.tags.map((tag, j) => (
                      <span key={j} className="text-[9px] font-bold px-3 py-1.5 rounded-full bg-white/5 text-text-muted uppercase tracking-[0.2em] border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-display font-bold mb-6 group-hover:text-accent-primary transition-colors leading-tight uppercase tracking-tight">{project.title}</h3>
                  <p className="text-text-muted font-medium leading-relaxed mb-8">
                    {project.description}
                  </p>
                </div>
                
                <div className="pt-8 border-t border-white/5">
                  {project.type === 'internal' ? (
                    <Link to={project.link} className="flex items-center justify-between font-bold text-xs uppercase tracking-widest text-accent-primary hover:text-white transition-colors">
                      Live Protocol <ChevronRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <a href={project.link} className="flex items-center justify-between font-bold text-xs uppercase tracking-widest text-accent-primary hover:text-white transition-colors">
                      Repository <Code className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-40 px-8 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-5xl font-display font-bold uppercase tracking-tight">Upskill Protocol</h2>
            <p className="text-text-muted text-lg font-medium">
              Continuous iteration on knowledge. A curated mastery path for blockchain systems engineering.
            </p>
          </div>
          <BlockchainRoadmap />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-32 bg-bg-base relative px-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent-secondary/5 rounded-full blur-[150px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl sunset-gradient flex items-center justify-center shadow-xl">
                <Box className="text-white h-7 w-7" />
              </div>
              <span className="font-display text-4xl font-bold tracking-tight">DPAC<span className="text-accent-primary">.</span>DEV</span>
            </div>
            <p className="text-text-muted text-xl font-medium max-w-sm leading-relaxed">
              Engineering secure, scalable, and decentralized futures for the global digital economy.
            </p>
            <div className="flex gap-10">
              <a href="#" className="text-text-muted hover:text-accent-primary transition-colors font-bold uppercase tracking-widest text-xs">Twitter</a>
              <a href="#" className="text-text-muted hover:text-accent-primary transition-colors font-bold uppercase tracking-widest text-xs">GitHub</a>
              <a href="#" className="text-text-muted hover:text-accent-primary transition-colors font-bold uppercase tracking-widest text-xs">LinkedIn</a>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-12">
            <a href="mailto:hello@deepakbhatt.dev" className="text-6xl md:text-8xl font-display font-bold uppercase tracking-tighter text-right hover:text-accent-primary transition-all">
              Launch <br /> Project.
            </a>
            <p className="text-text-muted text-sm font-medium tracking-widest">&copy; 2026 Deepak Bhatt. All systems operational.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioHome;

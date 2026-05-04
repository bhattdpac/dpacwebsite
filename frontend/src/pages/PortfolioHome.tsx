import { 
  Shield, 
  Cpu, 
  ExternalLink, 
  Mail, 
  ChevronRight,
  Blocks,
  FileCode,
  Layout,
  MessageSquare,
  Map,
  Network,
  Terminal,
  Layers,
  Zap,
  Box,
  Globe,
  Link as LinkIcon
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
      description: 'NLP-driven legal document to smart contract pipeline with human-in-the-loop validation.',
      tags: ['Django', 'Solidity', 'spaCy'],
      link: '/legal-framework',
      type: 'internal'
    },
    {
      title: 'DEX Aggregator',
      description: 'Smart routing protocol across multiple decentralized exchanges for optimal pricing.',
      tags: ['Solidity', 'Ethers.js'],
      link: '#',
      type: 'external'
    },
    {
      title: 'DAO Governance',
      description: 'Modular governance framework for decentralized organizations with fractional ownership.',
      tags: ['Hardhat', 'OpenZeppelin'],
      link: '#',
      type: 'external'
    }
  ];

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white relative overflow-hidden">
      
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/60 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-accent-primary p-2 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.4)] group-hover:scale-110 transition-transform">
              <Box className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tighter uppercase">DPAC<span className="text-accent-primary">.</span>DEV</span>
          </div>
          <div className="hidden md:flex gap-10 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-text-muted">
            <a href="#about" className="hover:text-accent-primary transition-colors">About</a>
            <a href="#architecture" className="hover:text-accent-primary transition-colors">Architecture</a>
            <a href="#skills" className="hover:text-accent-primary transition-colors">Skills</a>
            <a href="#projects" className="hover:text-accent-primary transition-colors">Work</a>
            <a href="#roadmap" className="hover:text-accent-primary transition-colors">Roadmap</a>
          </div>
          <div className="flex items-center gap-6">
            <a href="mailto:hello@deepakbhatt.dev" className="text-text-muted hover:text-accent-primary transition-colors">
              <Mail className="w-5 h-5" />
            </a>
            <button className="relative group bg-white text-black px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-accent-primary hover:text-white transition-all overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span className="relative z-10">Hire Me</span>
              <div className="absolute inset-0 bg-accent-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        {/* Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] radial-glow opacity-50 -z-10"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-start max-w-4xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent-primary text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
              </span>
              Protocols & Architecture
            </div>
            
            <h1 className="text-7xl md:text-9xl font-extrabold tracking-tighter leading-[0.85] mb-12 uppercase">
              Building <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-purple-400">Trustless</span> <br />
              Systems.
            </h1>
            
            <p className="text-xl md:text-2xl text-text-muted font-medium mb-12 leading-relaxed max-w-2xl font-mono uppercase tracking-tight">
              I architect <span className="text-text-primary">Decentralized Infrastructure</span> and bridge the gap between human legal code and immutable blockchain logic.
            </p>
            
            <div className="flex flex-wrap gap-8 items-center mb-24">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-2 border-bg-base bg-bg-surface flex items-center justify-center">
                    <Layers className="w-5 h-5 text-accent-primary/50" />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-bg-base bg-accent-primary flex items-center justify-center text-[10px] font-bold text-white">
                  +15
                </div>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div>
                <div className="text-3xl font-extrabold text-text-primary">5k+</div>
                <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Git Commits</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-text-primary">100%</div>
                <div className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-widest">Audit Safety</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <a href="#projects" className="flex items-center gap-3 bg-accent-primary text-white px-10 py-5 rounded-xl font-bold uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all group">
                Explore Work <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <div className="flex gap-4">
                <a href="#" className="p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-accent-primary transition-all">
                  <LinkIcon className="w-6 h-6 text-text-muted hover:text-white transition-colors" />
                </a>
                <a href="#" className="p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-accent-primary transition-all">
                  <Globe className="w-6 h-6 text-text-muted hover:text-white transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Skills Split */}
      <section id="about" className="py-32 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-start">
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-[1px] bg-accent-primary"></div>
              <h2 className="text-4xl font-extrabold uppercase tracking-tight">System Engineer</h2>
            </div>
            <div className="space-y-8 text-lg font-medium text-text-muted leading-relaxed">
              <p>
                Specializing in <span className="text-text-primary underline decoration-accent-primary underline-offset-8">Ethereum Infrastructure</span> and Secure Smart Contract development. My approach combines rigorous academic research with battle-tested engineering.
              </p>
              <p>
                My work on the "Legal Framework" system pioneered NLP-driven clause extraction for on-chain execution, ensuring that decentralized agreements maintain legal intent while gaining trustless automation.
              </p>
            </div>
          </div>
          
          <div id="skills" className="grid grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {skills.map((skill, i) => (
              <div key={i} className="group p-10 bg-bg-surface hover:bg-bg-surface/50 transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-bg-base border border-white/5 flex items-center justify-center mb-6 group-hover:bg-accent-primary/10 group-hover:border-accent-primary/50 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all">
                  <div className="text-text-muted group-hover:text-accent-primary transition-colors">
                    {skill.icon}
                  </div>
                </div>
                <h3 className="font-extrabold text-lg mb-1 group-hover:text-white transition-colors">{skill.name}</h3>
                <p className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{skill.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Visual Section */}
      <section id="architecture" className="py-32 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto text-center mb-24">
          <h2 className="text-5xl font-extrabold mb-6 uppercase tracking-tight italic flex items-center justify-center gap-4">
            <Network className="text-accent-primary w-12 h-12" />
            Infrastructure
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto font-mono text-sm uppercase tracking-widest">
            Cross-layer communication protocol for the Legal Framework System.
          </p>
        </div>
        <div className="max-w-7xl mx-auto">
          <ArchitectureVisual />
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="max-w-xl">
              <h2 className="text-6xl font-extrabold mb-6 uppercase tracking-tight italic underline decoration-accent-primary decoration-4 underline-offset-[12px]">Featured Ops</h2>
              <p className="text-text-muted text-xl font-medium">
                Production-grade blockchain architecture and decentralized services.
              </p>
            </div>
            <a href="#" className="flex items-center gap-3 text-accent-primary font-bold uppercase tracking-widest hover:text-white transition-colors group">
              Full Archive <ExternalLink className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {projects.map((project, i) => (
              <div key={i} className="group relative bg-bg-surface p-10 hover:bg-bg-surface/40 transition-all duration-500 overflow-hidden">
                {/* Hover Top Border Animation */}
                <div className="absolute top-0 left-0 w-0 h-1 bg-accent-primary group-hover:w-full transition-all duration-700"></div>
                
                <div className="mb-12">
                  <div className="flex gap-2 mb-8">
                    {project.tags.map((tag, j) => (
                      <span key={j} className="text-[9px] font-mono font-bold px-2 py-1 rounded bg-white/5 text-text-muted uppercase tracking-widest border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-extrabold mb-6 group-hover:text-accent-primary transition-colors leading-tight uppercase">{project.title}</h3>
                  <p className="text-text-muted font-medium leading-relaxed mb-8">
                    {project.description}
                  </p>
                </div>
                
                <div className="pt-8 border-t border-white/5">
                  {project.type === 'internal' ? (
                    <Link to={project.link} className="flex items-center justify-between font-mono font-bold text-[10px] uppercase tracking-[0.3em] text-accent-primary hover:text-white transition-colors">
                      Live Protocol <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <a href={project.link} className="flex items-center justify-between font-mono font-bold text-[10px] uppercase tracking-[0.3em] text-accent-primary hover:text-white transition-colors">
                      Source Code <FileCode className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section id="roadmap" className="py-32 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-extrabold mb-6 uppercase tracking-tight flex items-center justify-center gap-6">
              <Map className="text-accent-primary w-12 h-12" />
              Mastery Path
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto font-mono text-sm uppercase tracking-widest leading-loose">
              Curated blockchain research & development roadmap for the next generation of architects.
            </p>
          </div>
          <BlockchainRoadmap />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-32 bg-bg-base relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-24 items-center">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-accent-primary p-2.5 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Box className="text-white h-6 w-6" />
              </div>
              <span className="text-3xl font-extrabold tracking-tighter uppercase">DPAC<span className="text-accent-primary">.</span>DEV</span>
            </div>
            <p className="text-text-muted font-medium mb-10 max-w-sm">
              Architecting secure, scalable, and decentralized futures. Available for worldwide collaborations.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-text-muted hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
              <a href="#" className="text-text-muted hover:text-white transition-colors"><LinkIcon className="w-5 h-5" /></a>
              <a href="#" className="text-text-muted hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-12">
            <a href="mailto:hello@deepakbhatt.dev" className="text-4xl md:text-6xl font-extrabold uppercase tracking-tighter hover:text-accent-primary transition-colors text-right">
              Let's <br /> Build.
            </a>
            <p className="text-text-muted font-mono text-xs uppercase tracking-[0.4em]">&copy; 2026 Deepak Bhatt. Built for the Web3 Era.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioHome;

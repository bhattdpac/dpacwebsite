import { 
  Shield, 
  Cpu, 
  Database, 
  Globe, 
  ExternalLink, 
  Mail, 
  ChevronRight,
  Blocks,
  FileCode,
  Layout,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PortfolioHome = () => {
  const skills = [
    { name: 'Solidity & Smart Contracts', icon: <Shield className="w-5 h-5" />, category: 'Blockchain' },
    { name: 'Hardhat & Foundry', icon: <Blocks className="w-5 h-5" />, category: 'Blockchain' },
    { name: 'Ethers.js / Viem', icon: <Cpu className="w-5 h-5" />, category: 'Blockchain' },
    { name: 'React & TypeScript', icon: <Layout className="w-5 h-5" />, category: 'Frontend' },
    { name: 'Tailwind CSS', icon: <Layout className="w-5 h-5" />, category: 'Frontend' },
    { name: 'Node.js & Express', icon: <Database className="w-5 h-5" />, category: 'Backend' },
    { name: 'Python & Django', icon: <FileCode className="w-5 h-5" />, category: 'Backend' },
    { name: 'NLP & AI Integration', icon: <MessageSquare className="w-5 h-5" />, category: 'AI' },
  ];

  const projects = [
    {
      title: 'Legal Framework System',
      description: 'A professional platform transforming legal documents into executable smart contracts using NLP and human-in-the-loop validation.',
      tags: ['React', 'Django', 'Solidity', 'spaCy'],
      link: '/legal-framework',
      type: 'internal'
    },
    {
      title: 'DeFi Liquidity Aggregator',
      description: 'Optimizing token swaps across multiple decentralized exchanges using custom routing algorithms.',
      tags: ['Solidity', 'Ethers.js', 'Next.js'],
      link: '#',
      type: 'external'
    },
    {
      title: 'NFT Governance Protocol',
      description: 'A DAO framework for fractionalized NFT ownership and community-driven treasury management.',
      tags: ['Solidity', 'Hardhat', 'OpenZeppelin'],
      link: '#',
      type: 'external'
    }
  ];

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border-default px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-accent-primary p-1.5 rounded-md">
              <Blocks className="text-white h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">DPAC<span className="text-accent-primary">.</span>DEV</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-text-muted">
            <a href="#about" className="hover:text-accent-primary transition-colors">About</a>
            <a href="#skills" className="hover:text-accent-primary transition-colors">Skills</a>
            <a href="#projects" className="hover:text-accent-primary transition-colors">Projects</a>
            <a href="#blogs" className="hover:text-accent-primary transition-colors">Blogs</a>
          </div>
          <div className="flex gap-4 items-center">
            <a href="mailto:hello@deepakbhatt.dev" className="text-text-muted hover:text-accent-primary transition-colors">
              <Mail className="w-5 h-5" />
            </a>
            <button className="bg-accent-primary text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
              Resume
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-accent-primary text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-primary"></span>
            </span>
            AVAILABLE FOR PROJECTS
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            Architecting the <br />
            <span className="text-accent-primary underline decoration-blue-100 underline-offset-8">Trustless Web</span>.
          </h1>
          <p className="text-xl text-text-muted mb-10 leading-relaxed max-w-2xl">
            I'm a <span className="text-text-primary font-semibold">Blockchain Developer</span> specializing in secure smart contract systems and bridging the gap between traditional legal frameworks and decentralized technology.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#projects" className="flex items-center gap-2 bg-text-primary text-white px-8 py-4 rounded-md font-bold hover:bg-black transition-all group">
              View My Work <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <div className="flex gap-2">
              <a href="#" className="p-4 border border-border-default rounded-md hover:bg-gray-50 transition-colors">
                <FileCode className="w-6 h-6" />
              </a>
              <a href="#" className="p-4 border border-border-default rounded-md hover:bg-gray-50 transition-colors">
                <Globe className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-bg-surface border-y border-border-default py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-accent-primary rounded-full"></span>
                About Me
              </h2>
              <div className="space-y-4 text-text-muted text-lg leading-relaxed">
                <p>
                  With a deep focus on Web3 infrastructure, I build decentralized applications that are not only functional but rigorous in their security and legal compliance.
                </p>
                <p>
                  My recent work involves pioneering "Legal Tech" on-chain—creating systems that can interpret complex natural language contracts and manifest them as executable, audited code.
                </p>
                <p>
                  I believe the future of global commerce lies in programmable trust, and I'm dedicated to building the tools that make that future accessible.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-8 bg-bg-base rounded-xl border border-border-default">
                <div className="text-4xl font-extrabold text-accent-primary mb-2">3+</div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-wider">Years Experience</div>
              </div>
              <div className="p-8 bg-bg-base rounded-xl border border-border-default">
                <div className="text-4xl font-extrabold text-accent-primary mb-2">15+</div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-wider">Projects Shipped</div>
              </div>
              <div className="p-8 bg-bg-base rounded-xl border border-border-default">
                <div className="text-4xl font-extrabold text-accent-primary mb-2">5k+</div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-wider">Commits Made</div>
              </div>
              <div className="p-8 bg-bg-base rounded-xl border border-border-default">
                <div className="text-4xl font-extrabold text-accent-primary mb-2">100%</div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-wider">On-Chain Safety</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Technical Arsenal</h2>
          <p className="text-text-muted max-w-xl mx-auto">
            A comprehensive set of tools and languages I use to build modern, secure applications.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {skills.map((skill, i) => (
            <div key={i} className="group p-6 bg-bg-surface rounded-xl border border-border-default hover:border-accent-primary hover:shadow-lg hover:shadow-blue-50 transition-all text-left">
              <div className="w-10 h-10 rounded-lg bg-bg-base flex items-center justify-center mb-4 group-hover:bg-blue-50 group-hover:text-accent-primary transition-colors">
                {skill.icon}
              </div>
              <h3 className="font-bold text-lg mb-1">{skill.name}</h3>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{skill.category}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="bg-text-primary text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-4 italic">Featured Projects</h2>
              <p className="text-gray-400">
                A selection of my recent work in blockchain architecture and full-stack development.
              </p>
            </div>
            <a href="#" className="flex items-center gap-2 text-accent-primary font-bold hover:text-blue-400 transition-colors">
              View All Archive <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <div key={i} className="group flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/[0.08] transition-all">
                <div className="mb-6">
                  <div className="flex gap-2 mb-4">
                    {project.tags.map((tag, j) => (
                      <span key={j} className="text-[10px] font-bold px-2 py-1 rounded bg-white/10 text-white/70 uppercase tracking-tighter">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-accent-primary transition-colors">{project.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    {project.description}
                  </p>
                </div>
                <div className="mt-auto pt-6 border-t border-white/10">
                  {project.type === 'internal' ? (
                    <Link to={project.link} className="flex items-center justify-between font-bold text-sm group-hover:text-accent-primary transition-colors">
                      Live Application <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <a href={project.link} className="flex items-center justify-between font-bold text-sm group-hover:text-accent-primary transition-colors">
                      View Source <FileCode className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blogs Section (Placeholder) */}
      <section id="blogs" className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Recent Writing</h2>
          <p className="text-text-muted">Technical deep-dives and thoughts on the evolving Web3 landscape.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-bg-surface border border-dashed border-border-default rounded-2xl p-20 text-center">
            <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-20" />
            <p className="text-text-muted font-medium">New articles coming soon.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-default py-16 bg-bg-surface">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <div className="bg-accent-primary p-1.5 rounded-md">
                <Blocks className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-bold">DPAC<span className="text-accent-primary">.</span>DEV</span>
            </div>
            <p className="text-text-muted text-sm">&copy; 2026 Deepak Bhatt. Built with React & Tailwind.</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-text-muted hover:text-accent-primary transition-colors">Twitter</a>
            <a href="#" className="text-text-muted hover:text-accent-primary transition-colors">GitHub</a>
            <a href="#" className="text-text-muted hover:text-accent-primary transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioHome;

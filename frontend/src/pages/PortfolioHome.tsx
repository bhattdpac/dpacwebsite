import { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  ChevronRight,
  Terminal,
  Globe,
  Code,
  Brain,
  Mail,
  FileText,
  Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const PortfolioHome = () => {
  const [stats, setStats] = useState({
    papers: '81K+',
    experiments: '24+',
    publications: '4',
    progress: '65%'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; link?: string; anchor?: string }[]>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const term = query.toLowerCase();
    const matches: { type: string; title: string; link?: string; anchor?: string }[] = [];

    // Search research areas
    researchFocus.forEach(f => {
      if (f.title.toLowerCase().includes(term) || f.desc.toLowerCase().includes(term)) {
        matches.push({ type: 'Research Focus', title: f.title, anchor: '#research' });
      }
    });

    // Search projects
    projects.forEach(p => {
      if (p.title.toLowerCase().includes(term) || p.desc.toLowerCase().includes(term)) {
        matches.push({ type: 'Project', title: p.title, anchor: '#projects' });
      }
    });

    // Search publications
    publications.forEach(pub => {
      if (pub.title.toLowerCase().includes(term) || pub.venue.toLowerCase().includes(term)) {
        matches.push({ type: 'Publication', title: pub.title, anchor: '#publications' });
      }
    });

    // Search courses
    courses.forEach(c => {
      if (c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term)) {
        matches.push({ type: 'Course', title: `${c.code}: ${c.name}`, link: '/teaching' });
      }
    });

    // Search blog posts
    blogPosts.forEach(b => {
      if (b.title.toLowerCase().includes(term) || b.desc.toLowerCase().includes(term)) {
        matches.push({ type: 'Blog Post', title: b.title, link: '/journal' });
      }
    });

    setSearchResults(matches);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats-summary/');
        setStats({
          papers: response.data.papers_count > 0 ? `${response.data.papers_count} Papers` : '81K+',
          experiments: response.data.experiments_count > 0 ? `${response.data.experiments_count}+` : '24+',
          publications: response.data.publications_count > 0 ? `${response.data.publications_count}` : '4',
          progress: response.data.thesis_progress || '65%'
        });
      } catch (err) {
        // fallback
      }
    };
    fetchStats();
  }, []);

  const researchFocus = [
    { title: 'Agentic AI', desc: 'Collaborative autonomous nodes auditing, compiling, and deploying legal-tech structures.', icon: '🧠' },
    { title: 'Legal NLP', desc: 'Neural architectures parsing and resolving complex legal documents.', icon: '📑' },
    { title: 'Smart Contracts', desc: 'Procedural rules compiled directly from validated natural language agreements.', icon: '⚖' },
    { title: 'Information Extraction', desc: 'Entity-relation mapping models extracting legal commitments.', icon: '🔍' },
    { title: 'Large Language Models', desc: 'Downstream prompt engineering, bias audits, and model alignment.', icon: '🤖' },
    { title: 'Blockchain', desc: 'Decentralized consensus state engines and smart contract code verification.', icon: '🔗' },
    { title: 'Explainable AI', desc: 'Interpretable embeddings and logic trees behind smart contract outcomes.', icon: '📊' },
    { title: 'Procedural Intelligence', desc: 'Synthesizing case precedents and case laws with local RAG vectors.', icon: '📚' },
  ];

  const timeline = [
    { year: '2024', status: 'Completed', title: 'Proposal Synopsis', desc: 'Acceptance of research degree synopsis on decentralized legal-smart contracts.' },
    { year: '2025', status: 'Completed', title: 'Framework Design', desc: 'Published initial design of the secure and sustainable legal document framework.' },
    { year: '2026', status: 'Active', title: 'Review & Publications', desc: 'AIHLE conference publication, systematic case audit, and IEEE bias transaction under review.' },
    { year: '2027', status: 'Planned', title: 'Thesis & Startup MVP', desc: 'Finalizing defense, filing patents, and spinning out LegalMind AI SaaS MVP.' }
  ];

  const publications = [
    {
      title: 'Framework for Secure and Sustainable Management of Legal Documents in Academic Libraries Using Smart Contracts',
      venue: 'Proceedings of 3rd International Conference on Library & Technology on "Artificial Intelligence and Humanities in Library and Education 4.0" (AIHLE 2025)',
      type: 'Conference',
      doi: '10.2991/978-94-6239-618-0_18',
      pdf: '/Framework_Secure_Academic_Libraries_Smart_Contracts.pdf',
      code: 'https://github.com/bhattdpac/dpacwebsite',
      dataset: '/research',
      citation: 'Bhatt, D., & Rawat, A. J. (2026). Framework for Secure and Sustainable Management of Legal Documents in Academic Libraries Using Smart Contracts. Proceedings of the 3rd AIHLE 2025, pp. 237–251.'
    },

    {
      title: 'Fairness and Bias Audits in Natural Language Processing Pipelines for Smart Contract Mapping',
      venue: 'IEEE Transactions on Software Engineering',
      type: 'Journal',
      doi: '10.1109/TSE.2025.35232',
      pdf: '#',
      code: 'https://github.com/bhattdpac/dpacwebsite',
      dataset: '/experiments',
      citation: 'Bhatt, D., & Rawat, A. J. (2025). Fairness and Bias Audits in Natural Language Processing Pipelines for Smart Contract Mapping. IEEE Transactions on Software Engineering (Under Review).'
    },
    {
      title: 'ILDC for CJPE: Indian Legal Documents Corpus for Court Judgment Prediction and Explanation',
      venue: 'Proceedings of the 59th Annual Meeting of the Association for Computational Linguistics (ACL-IJCNLP)',
      type: 'Conference',
      doi: '10.18653/v1/2021.acl-long.313',
      pdf: 'https://raw.githubusercontent.com/bhattdpac/dpacwebsite/master/docs/UU_Synopsis_Deepak_Bhatt.pdf',
      code: 'https://github.com/bhattdpac/dpacwebsite',
      dataset: '/research',
      citation: 'Malik, V., Sanjay, R., Nigam, S. K., Ghosh, K., Guha, S. K., Bhattacharya, A., & Modi, A. (2021). ILDC for CJPE: Indian Legal Documents Corpus for Court Judgment Prediction and Explanation. Proceedings of the 59th ACL-IJCNLP, 4046–4062.'
    },
    {
      title: 'Named Entity Recognition in Indian Court Judgments',
      venue: 'Proceedings of the Natural Legal Language Processing Workshop 2022 (NLLP 2022)',
      type: 'Conference',
      doi: '10.18653/v1/2022.nllp-1.15',
      pdf: 'https://raw.githubusercontent.com/bhattdpac/dpacwebsite/master/docs/UU_Synopsis_Deepak_Bhatt.pdf',
      code: 'https://github.com/bhattdpac/dpacwebsite',
      dataset: '/research',
      citation: 'Kalamkar, P., Agarwal, A., Tiwari, A., Gupta, S., Karn, S., & Raghavan, V. (2022). Named Entity Recognition in Indian Court Judgments. Proceedings of the ACL Natural Legal Language Processing Workshop 2022, 184–193.'
    }
  ];

  const projects = [
    {
      title: 'LegalMind AI',
      desc: 'AI-powered legal procedural assistant translating natural language contracts into validated Solidity code. Combines local vector stores with explainable bias audits.',
      status: 'In Development',
      tech: ['Python', 'FastAPI', 'Ollama', 'ChromaDB', 'Hyperledger'],
      link: '/legal-framework'
    },
    {
      title: 'Decentralized Academy Protocol',
      desc: 'A curriculum platform for training blockchain systems engineers with compiled Hardhat nodes and automated testing suites.',
      status: 'Active',
      tech: ['React', 'TypeScript', 'Tailwind', 'Hardhat', 'Solidity'],
      link: '/academy'
    }
  ];

  const skillExpertise = [
    { name: 'Artificial Intelligence', level: '100%', width: 'w-full' },
    { name: 'Python', level: '100%', width: 'w-full' },
    { name: 'Machine Learning & NLP', level: '90%', width: 'w-[90%]' },
    { name: 'Blockchain (Solidity & Hardhat)', level: '80%', width: 'w-[80%]' },
    { name: 'Legal NLP (InCaseLawBERT)', level: '90%', width: 'w-[90%]' },
    { name: 'RAG Systems', level: '80%', width: 'w-[80%]' },
    { name: 'Agentic AI', level: '70%', width: 'w-[70%]' },
    { name: 'Cloud & Kubernetes', level: '60%', width: 'w-[60%]' },
  ];

  const startupRoadmap = [
    { step: '1', title: 'Research', desc: 'InCaseLawBERT & InLegalBERT model validation.', status: 'Completed' },
    { step: '2', title: 'Prototype', desc: 'NLP Parser & Hardhat compilation pipeline.', status: 'Completed' },
    { step: '3', title: 'Validation', desc: 'Gas optimization & Slither security audit.', status: 'Completed' },
    { step: '4', title: 'Conference', desc: 'AIHLE 2025 Atlantis Press paper published.', status: 'Completed' },
    { step: '5', title: 'Journal', desc: 'Fairness/Bias IEEE paper under review.', status: 'Active' },
    { step: '6', title: 'Patent', desc: 'Filing automated contract mapping logic.', status: 'Planned' },
    { step: '7', title: 'MVP', desc: 'Multi-tenant legal sandbox dashboard.', status: 'Planned' },
    { step: '8', title: 'Startup', desc: 'Incubation & seed funding validation.', status: 'Planned' },
    { step: '9', title: 'SaaS', desc: 'Production-ready legal-tech agreement SaaS.', status: 'Planned' },
  ];

  const demos = [
    { title: 'Document Analysis', desc: 'Ingest raw legal texts, run bias checks, and extract legal clauses.', path: '/dashboard', type: 'Research Prototype', warning: 'Human Review Required' },
    { title: 'Clause Extraction', desc: 'Identify payment, termination, and NDA parameters using pre-trained legal NLP models.', path: '/dashboard', type: 'Research Prototype', warning: 'Human Review Required' },
    { title: 'Procedural Extraction', desc: 'Map abstract legal structures and workflow timelines into relational graphs.', path: '/research', type: 'Experimental Status', warning: 'Human Review Required' },
    { title: 'Legal Summarization', desc: 'Condense long-form legal agreements into actionable, plain-language client reports.', path: '/research', type: 'Experimental Status', warning: 'Human Review Required' },
    { title: 'Smart Contract Generation', desc: 'Translate validated legal terms into secure, compiled Solidity smart contracts.', path: '/dashboard', type: 'Research Prototype', warning: 'Human Review Required' },
    { title: 'Blockchain Verification', desc: 'Audit deployed contract bytecodes and immutable transaction hashes on EVM nodes.', path: '/dashboard', type: 'Research Prototype', warning: 'Human Review Required' },
    { title: 'Semantic Search', desc: 'Query our indexed 81k arXiv papers and 3.8k FCA legal case precedents.', path: '/research', type: 'Research Prototype', warning: 'Human Review Required' },
    { title: 'Document Comparison', desc: 'Analyze draft versions side-by-side to highlight deviations and risk levels.', path: '/dashboard', type: 'Experimental Status', warning: 'Human Review Required' },
    { title: 'RAG Assistant', desc: 'Interact with a semantic RAG chatbot referencing legal baselines and citations.', path: '/research', type: 'Experimental Status', warning: 'Human Review Required' },
  ];

  const blogPosts = [
    { title: 'State of Legal AI in 2026: From Prompts to Agents', date: 'August 2026', readTime: '5 min read', desc: 'Analyzing the shift from standard LLM prompts to recursive multi-agent reasoning in smart contract generation.' },
    { title: 'Why Smart Contracts Need Hybrid legal Wrappers', date: 'July 2026', readTime: '8 min read', desc: 'Understanding smart contract enforceability issues under the Indian Contract Act (1872) and IT Act (2000).' }
  ];

  const courses = [
    { name: 'Blockchain Technology and Smart Contracts', code: 'UU-CS-501', desc: 'An advanced postgraduate course covering cryptography, distributed ledgers, consensus mechanisms, and writing secure Solidity smart contracts using Hardhat and Remix.' },
    { name: 'Natural Language Processing in Legal-Tech', code: 'UU-CS-502', desc: 'Covers tokenization, POS tagging, dependency parsing, bias auditing, and fine-tuning transformers using HuggingFace and spaCy for legal agreement structure mapping.' }
  ];

  const studentOpportunities = [
    { title: 'Explainable NLP Bias Auditing', desc: 'Investigating gendered pronouns and power imbalances in legal agreements using pre-trained legal transformers.', role: 'Ph.D. / M.Tech Thesis' },
    { title: 'Cross-Chain Escrow Frameworks', desc: 'Designing secure, multi-party escrow smart contracts with verified Hardhat simulation nodes.', role: 'B.Tech Capstone Project' }
  ];

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white relative overflow-hidden">
      
      {/* Dynamic Background Glowing Orbs (Light Mode Electric Blue / Indigo Glow) */}
      <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-gradient-to-tr from-accent-primary/8 to-accent-secondary/5 rounded-full blur-[140px] -z-10 animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-gradient-to-bl from-accent-primary/5 to-accent-tertiary/5 rounded-full blur-[120px] -z-10 animate-float-delay pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-border-default px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
              <Brain className="text-white h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">DEEPAK BHATT</span>
          </div>
          <div className="hidden lg:flex gap-8 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
            <a href="#about" className="hover:text-accent-primary transition-colors">About</a>
            <a href="#research" className="hover:text-accent-primary transition-colors">Focus</a>
            <a href="#projects" className="hover:text-accent-primary transition-colors">Projects</a>
            <a href="#skills" className="hover:text-accent-primary transition-colors">Skills</a>
            <a href="#publications" className="hover:text-accent-primary transition-colors">Publications</a>
            <a href="#timeline" className="hover:text-accent-primary transition-colors">Timeline</a>
            <a href="#demos" className="hover:text-accent-primary transition-colors">Demos</a>
            <a href="#teaching" className="hover:text-accent-primary transition-colors">Teaching</a>
            <a href="#startup" className="hover:text-accent-primary transition-colors">Startup</a>
          </div>
          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search research..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-bg-base border border-border-default rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent-primary w-36 lg:w-48 transition-all font-sans text-text-primary placeholder:text-text-muted"
              />
              {/* Search dropdown results */}
              {searchQuery && (
                <div className="absolute right-0 mt-2 w-72 md:w-96 bg-bg-base/95 backdrop-blur-md border border-border-default rounded-2xl shadow-xl p-4 z-[200] max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="space-y-4 font-sans">
                      {searchResults.map((res, i) => (
                        <div key={i} className="space-y-1 pb-3 border-b border-border-default/50 last:border-0 last:pb-0">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
                              {res.type}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-text-primary leading-snug">{res.title}</h4>
                          {res.link ? (
                            <Link 
                              to={res.link} 
                              onClick={() => setSearchQuery('')}
                              className="text-[10px] text-accent-secondary hover:underline flex items-center gap-0.5 mt-1 font-bold uppercase tracking-wider inline-flex"
                            >
                              Go to page <ChevronRight className="w-3 h-3" />
                            </Link>
                          ) : res.anchor ? (
                            <a 
                              href={res.anchor} 
                              onClick={() => setSearchQuery('')}
                              className="text-[10px] text-accent-secondary hover:underline flex items-center gap-0.5 mt-1 font-bold uppercase tracking-wider inline-flex"
                            >
                              Scroll to section <ChevronRight className="w-3 h-3" />
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-text-muted font-medium font-sans">
                      No matching research files found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link to="/dashboard" className="bg-accent-primary hover:bg-accent-primary/90 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-accent-primary/20">
              Live App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-60 pb-36 px-8 max-w-7xl mx-auto">
        <div className="space-y-8 max-w-5xl">
          <div className="inline-flex items-center gap-2.5 px-4.5 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/25 text-accent-primary text-[10px] font-bold uppercase tracking-[0.25em]">
            <span className="w-2 h-2 rounded-full bg-accent-primary animate-ping"></span>
            Deepak Bhatt AI Lab
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-extrabold tracking-tighter leading-none text-text-primary">
            Building Intelligent <br className="hidden md:inline" /> Legal AI Systems
          </h1>
          
          <h2 className="text-xl md:text-2xl text-text-muted font-bold tracking-tight">
            using LLMs, Agentic AI and Blockchain
          </h2>
          
          <p className="text-xl md:text-2xl text-text-muted/95 font-medium leading-relaxed max-w-4xl">
            Designing secure, verifiable, and explainable neural pipelines for procedural information extraction and smart contract generation.
          </p>

          <div className="flex flex-wrap gap-5 pt-4">
            <a href="#research" className="bg-text-primary text-bg-base hover:bg-accent-primary hover:text-white px-8 py-4.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-md">
              Research
            </a>
            <a href="#projects" className="border border-border-default bg-bg-surface/50 hover:bg-bg-surface hover:border-accent-primary px-8 py-4.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all text-text-muted hover:text-text-primary">
              Projects
            </a>
            <a href="#publications" className="sunset-gradient text-white px-8 py-4.5 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg shadow-accent-primary/10">
              Publications
            </a>
          </div>
        </div>
      </section>

      {/* Research Domains Section */}
      <section id="research" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="space-y-6 mb-20">
          <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Fields of Investigation</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">AI Research Lab Domains</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {researchFocus.map((focus, i) => (
            <div key={i} className="space-card p-8 rounded-2xl flex flex-col justify-between group">
              <div className="space-y-6">
                <div className="text-4xl">
                  {focus.icon}
                </div>
                <h3 className="text-xl font-display font-bold text-text-primary">{focus.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed font-medium">{focus.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-border-default group-hover:text-accent-primary group-hover:translate-x-1.5 transition-all mt-8 self-end" />
            </div>
          ))}
        </div>
      </section>

      {/* Research Projects (LegalMind AI) */}
      <section id="projects" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="space-y-6 mb-20">
          <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Prototype Frameworks</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">Active Research Projects</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, i) => (
            <div key={i} className="group relative space-card rounded-[2rem] p-10 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {project.tech.map((t, j) => (
                      <span key={j} className="text-[9px] font-bold px-2.5 py-1 rounded bg-border-default/40 border border-border-default/85 text-text-muted uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-accent-secondary">{project.status}</span>
                </div>
                <h3 className="text-3xl font-display font-bold uppercase tracking-tight group-hover:text-accent-primary transition-colors text-text-primary">{project.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed font-medium">{project.desc}</p>
              </div>
              <Link to={project.link} className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-accent-primary hover:text-accent-secondary mt-8 pt-6 border-t border-border-default transition-colors">
                Explore Implementation <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Skills & Expertise Visualization Section */}
      <section id="skills" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="space-y-6 mb-20">
          <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Technical Capabilities</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">Expertise Areas</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
          {skillExpertise.map((skill, i) => (
            <div key={i} className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-text-primary">
                <span>{skill.name}</span>
                <span className="font-mono text-accent-primary">{skill.level}</span>
              </div>
              <div className="h-2 w-full bg-border-default rounded-full overflow-hidden">
                <div className={`h-full bg-accent-primary rounded-full ${skill.width} transition-all duration-1000`}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Publications Section */}
      <section id="publications" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Literature Database</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">Peer-Reviewed Publications</h2>
          </div>
          <Link to="/publications" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-primary hover:text-accent-secondary transition-colors">
            Browse Literature Database <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {publications.map((pub, i) => (
            <div key={i} className="space-card p-8 rounded-3xl flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    {pub.type}
                  </span>
                  <span className="text-[9px] text-text-muted font-mono">DOI: {pub.doi}</span>
                </div>
                <h3 className="text-2xl font-display font-bold leading-tight hover:text-accent-primary transition-colors cursor-pointer text-text-primary">{pub.title}</h3>
                <p className="text-xs text-text-muted font-medium">{pub.venue}</p>
                <div className="bg-bg-base/50 p-4 rounded-xl border border-border-default text-[10px] font-mono text-text-muted leading-relaxed">
                  <span className="text-text-primary font-bold">Citation:</span> {pub.citation}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-8 mt-6 border-t border-border-default">
                <a href={pub.pdf} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
                  <FileText className="w-4 h-4" /> PDF
                </a>
                <a href={pub.code} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
                  <Code className="w-4 h-4" /> Source Code
                </a>
                <Link to={pub.dataset} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors">
                  <Database className="w-4 h-4" /> Corpus Dataset
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PhD Timeline Section */}
      <section id="timeline" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="space-y-6 mb-20">
          <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Milestone Progress</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">PhD Research Timeline</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {timeline.map((item, i) => (
            <div key={i} className="relative space-card p-8 rounded-2xl border border-border-default/60 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold font-mono text-accent-primary">{item.year}</span>
                  <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded ${item.status === 'Completed' ? 'bg-state-success/15 text-state-success' : 'bg-accent-secondary/15 text-accent-secondary'}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-text-primary">{item.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live Demos Section */}
      <section id="demos" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default bg-bg-surface/10">
        <div className="space-y-6 mb-20 text-center max-w-2xl mx-auto">
          <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Interactive Sandbox</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">Live Technology Demos</h2>
          <p className="text-sm text-text-muted font-medium">
            Test the live pipelines built for document parsing, smart contract synthesis, and blockchain tracking.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo, i) => (
            <Link key={i} to={demo.path} className="space-card p-8 rounded-2xl flex flex-col justify-between group hover:border-accent-secondary relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-accent-secondary/15 flex items-center justify-center text-accent-secondary group-hover:bg-accent-secondary group-hover:text-white transition-all">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    demo.type === 'Research Prototype'
                      ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary'
                      : 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary'
                  }`}>
                    {demo.type}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold tracking-tight text-text-primary group-hover:text-accent-secondary transition-colors pt-2">{demo.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed font-medium">{demo.desc}</p>
                
                {/* Warning Badge */}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 text-[8px] font-bold text-state-warning bg-state-warning/10 px-2 py-0.5 rounded uppercase tracking-wider">
                    ⚠️ {demo.warning}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-border-default/50 text-[10px] font-bold uppercase tracking-wider text-accent-primary">
                <span>Run Demo</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Research Dashboard (Stats) */}
      <section className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="space-card p-12 rounded-[2rem] grid md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-5xl font-display font-extrabold text-transparent bg-clip-text sunset-gradient mb-2">{stats.papers}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary mb-1">Precedent Corpus</div>
            <div className="text-[9px] text-text-muted">Filtered legal-blockchain research papers</div>
          </div>
          <div className="border-y md:border-y-0 md:border-x border-border-default py-8 md:py-0">
            <div className="text-5xl font-display font-extrabold text-transparent bg-clip-text sunset-gradient mb-2">{stats.experiments}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary mb-1">NLP Model Executions</div>
            <div className="text-[9px] text-text-muted">Bias audits & Solidity compilations</div>
          </div>
          <div>
            <div className="text-5xl font-display font-extrabold text-transparent bg-clip-text sunset-gradient mb-2">{stats.progress}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-primary mb-1">Thesis Completion</div>
            <div className="text-[9px] text-text-muted">PhD milestone requirements fulfilled</div>
          </div>
        </div>
      </section>

      {/* Blog & Research Notes */}
      <section className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Notes from the Lab</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">Research & Writing</h2>
          </div>
          <Link to="/journal" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-primary hover:text-accent-secondary transition-colors">
            Read Research Journal <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {blogPosts.map((post, i) => (
            <div key={i} className="space-card p-8 rounded-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-4 text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  <span>{post.date}</span>
                  <span>&bull;</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-2xl font-display font-bold hover:text-accent-primary transition-colors cursor-pointer text-text-primary">{post.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed font-medium">{post.desc}</p>
              </div>
              <Link to="/journal" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-accent-primary hover:text-accent-secondary transition-colors mt-8 pt-4 border-t border-border-default/50 self-start">
                Read Article <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Teaching & Students Sections */}
      <section id="teaching" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default grid lg:grid-cols-2 gap-16">
        
        {/* Left column: Courses */}
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Curriculum</div>
            <h2 className="text-4xl font-display font-bold uppercase tracking-tight">Courses Taught</h2>
            <p className="text-xs text-text-muted font-medium">Assistant Professor duties mapping theoretical informatics to code.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course, i) => (
              <div key={i} className="space-card p-6 rounded-xl border border-border-default">
                <span className="text-[9px] font-mono font-bold text-accent-primary uppercase tracking-widest">{course.code}</span>
                <h3 className="text-lg font-bold tracking-tight text-text-primary mt-2 mb-1">{course.name}</h3>
                <p className="text-[11px] text-text-muted leading-normal font-medium">{course.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Students & Mentorship */}
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-accent-secondary uppercase tracking-[0.25em]">Mentorship</div>
            <h2 className="text-4xl font-display font-bold uppercase tracking-tight">Research Opportunities</h2>
            <p className="text-xs text-text-muted font-medium">Advising theses and open engineering challenges in LegalTech at Uttaranchal University.</p>
          </div>
          <div className="space-y-4">
            {studentOpportunities.map((op, i) => (
              <div key={i} className="space-card p-6 rounded-xl border border-border-default flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-text-primary">{op.title}</h3>
                  <p className="text-xs text-text-muted font-medium font-sans">{op.desc}</p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/10 whitespace-nowrap ml-4">
                  {op.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Startup Pipeline Roadmap Grid */}
      <section id="startup" className="py-28 px-8 max-w-7xl mx-auto border-t border-border-default">
        <div className="space-y-6 mb-20">
          <div className="text-[10px] font-bold text-accent-primary uppercase tracking-[0.25em]">Commercialization Pipeline</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">PhD to SaaS Roadmap</h2>
          <p className="text-sm text-text-muted font-medium max-w-2xl">
            Translating theoretical legal informatics and cryptographic verification into a commercial multi-tenant software application.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
          {startupRoadmap.map((item, i) => (
            <div key={i} className={`p-5 rounded-xl border flex flex-col justify-between h-40 transition-all ${item.status === 'Completed' ? 'border-accent-primary/40 bg-accent-primary/5' : item.status === 'Active' ? 'border-accent-secondary bg-accent-secondary/5' : 'border-border-default bg-bg-surface/30'}`}>
              <div className="flex justify-between items-start">
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${item.status === 'Completed' ? 'bg-accent-primary text-white' : item.status === 'Active' ? 'bg-accent-secondary text-white' : 'bg-border-default text-text-muted'}`}>
                  {item.step}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-text-muted">{item.status}</span>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{item.title}</h4>
                <p className="text-[10px] text-text-muted mt-1 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Contact Section */}
      <footer className="border-t border-border-default py-24 bg-bg-base relative px-8 overflow-hidden max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-24 items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl sunset-gradient flex items-center justify-center">
                <Brain className="text-white h-6 w-6" />
              </div>
              <span className="font-display text-3xl font-extrabold tracking-tight text-text-primary">DEEPAK BHATT</span>
            </div>
            <p className="text-text-muted text-lg font-medium max-w-sm leading-relaxed">
              Engineering secure, scalable, and decentralized legal solutions for the global digital economy.
            </p>
            <div className="flex flex-wrap gap-8 text-xs font-bold uppercase tracking-wider text-text-muted">
              <a href="https://linkedin.com" className="hover:text-accent-primary transition-colors flex items-center gap-1.5"><Globe className="w-4 h-4" /> LinkedIn</a>
              <a href="https://github.com" className="hover:text-accent-primary transition-colors flex items-center gap-1.5"><Code className="w-4 h-4" /> GitHub</a>
              <a href="mailto:hello@deepakbhatt.dev" className="hover:text-accent-primary transition-colors flex items-center gap-1.5"><Mail className="w-4 h-4" /> Email</a>
              <a href="#" className="hover:text-accent-primary transition-colors flex items-center gap-1.5"><FileText className="w-4 h-4" /> Scholar</a>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-8">
            <a href="mailto:hello@deepakbhatt.dev" className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tighter text-right hover:text-accent-primary transition-all leading-none text-text-primary">
              Launch <br /> Collaboration.
            </a>
            <p className="text-text-muted text-xs font-mono tracking-widest">&copy; 2026 Deepak Bhatt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioHome;

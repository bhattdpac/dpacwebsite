import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Upload, 
  ArrowRight, 
  Brain, 
  Database, 
  Zap, 
  ShieldCheck,
  Loader2,
  FileCheck,
  ChevronRight,
  History,
  Home,
  BookOpen,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { uploadResearchPaper, getResearchPapers } from '../api/api';

interface Paper {
  id: number;
  title: string;
  abstract?: string;
  methodology?: string;
  findings?: string;
  created_at: string;
}

const ResearchHub = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<Paper | null>(null);
  const [recentPapers, setRecentPapers] = useState<Paper[]>([]);
  const [recommendations, setRecommendations] = useState<{ papers: any[]; cases: any[] }>({ papers: [], cases: [] });
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const fetchRecommendations = useCallback(async (paperId: number) => {
    setLoadingRecommendations(true);
    try {
      const response = await api.get(`/research-papers/${paperId}/recommendations/`);
      setRecommendations(response.data || { papers: [], cases: [] });
    } catch {
      setRecommendations({ papers: [], cases: [] });
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);


  const loadRecentPapers = useCallback(async () => {
    try {
      const papers = await getResearchPapers();
      setRecentPapers(papers);
    } catch {
      // Error handled by interceptors or logged
    }
  }, []);

  useEffect(() => {
    loadRecentPapers();
  }, [loadRecentPapers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', selectedFile.name.replace('.pdf', ''));

    try {
      const data = await uploadResearchPaper(formData);
      setResults(data);
      fetchRecommendations(data.id);
      loadRecentPapers();
    } catch {
      alert("Analysis failed. Please ensure you are logged in as a Lawyer (Researcher).");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-secondary flex items-center justify-center shadow-lg shadow-accent-secondary/20">
              <Brain className="text-white h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">DPAC<span className="text-accent-secondary">.</span>RESEARCH</span>
          </Link>
          <div className="flex gap-8">
            <Link to="/academy" className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">Academy</Link>
            <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">Portfolio</Link>
          </div>
        </div>
      </nav>

      <section className="pt-48 pb-24 px-8 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-accent-secondary/5 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-start">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent-secondary text-[10px] font-bold uppercase tracking-[0.3em]">
              AI Literature Reviewer
            </div>
            <h1 className="text-6xl md:text-7xl font-display font-bold leading-tight tracking-tight">
              Decode <br />
              <span className="text-transparent bg-clip-text sunset-gradient">Academic Logic.</span>
            </h1>
            <p className="text-xl text-text-muted font-medium leading-relaxed max-w-lg">
              Upload complex research papers and let our specialized NLP models extract methodologies, findings, and structural logic in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link 
                to="/research/synopsis" 
                className="group p-6 space-card rounded-2xl border border-white/5 hover:border-accent-secondary/50 transition-all flex items-center gap-5 flex-1"
              >
                <div className="w-12 h-12 rounded-xl sunset-gradient flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                  <FileText className="text-white w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">PhD Thesis</p>
                  <p className="text-sm font-bold group-hover:text-accent-secondary transition-colors">Read Research Synopsis</p>
                </div>
              </Link>
            </div>

            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-4 text-sm font-medium text-text-muted">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary">
                  <Database className="w-5 h-5" />
                </div>
                <span>Automated Metadata Extraction</span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium text-text-muted">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span>Immutable Citation Integrity</span>
              </div>
            </div>
          </div>

          {/* Upload Card */}
          <div className="space-card rounded-[2.5rem] p-12 border border-white/5 relative">
            {!results ? (
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-display font-bold">Analysis Portal</h3>
                  <p className="text-text-muted text-sm font-medium">Supported formats: PDF (Max 20MB)</p>
                </div>

                <div className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center space-y-6 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-accent-secondary" />
                  </div>
                  <div className="space-y-2">
                    <label className="cursor-pointer block">
                      <span className="text-lg font-bold text-text-primary block mb-1">Click to browse</span>
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">or drag and drop here</span>
                      <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                    </label>
                  </div>
                </div>

                {selectedFile && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-6 h-6 text-accent-secondary" />
                      <div className="max-w-[200px] truncate">
                        <p className="text-sm font-bold text-text-primary truncate">{selectedFile.name}</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="sunset-gradient text-white px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze Paper"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <div>
                    <h3 className="text-2xl font-display font-bold mb-1 truncate max-w-[250px]">{results.title}</h3>
                    <p className="text-xs font-bold text-accent-secondary uppercase tracking-[0.2em]">Analysis Complete</p>
                  </div>
                  <button onClick={() => {setResults(null); setSelectedFile(null);}} className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors">
                    New Review
                  </button>
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-accent-tertiary uppercase tracking-widest">
                      <Zap className="w-3 h-3" /> Abstract
                    </div>
                    <p className="text-sm text-text-muted font-medium leading-relaxed italic">{results.abstract || "No abstract detected."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-accent-secondary uppercase tracking-widest">
                        <Brain className="w-3 h-3" /> Methodology
                      </div>
                      <p className="text-xs text-text-muted font-medium leading-relaxed">{results.methodology || "Section not found."}</p>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-accent-primary uppercase tracking-widest">
                        <FileCheck className="w-3 h-3" /> Key Findings
                      </div>
                      <p className="text-xs text-text-muted font-medium leading-relaxed">{results.findings || "Section not found."}</p>
                    </div>
                  </div>
                </div>

                {/* Recommendations Grid */}
                <div className="border-t border-white/5 pt-8 grid md:grid-cols-2 gap-6">
                  {/* arXiv Recommendations */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-accent-secondary uppercase tracking-widest flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Recommended Relevant Papers (arXiv)
                    </h4>
                    {loadingRecommendations ? (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-accent-secondary" /> Tracing similar publications...
                      </div>
                    ) : recommendations.papers && recommendations.papers.length > 0 ? (
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                        {recommendations.papers.map((rec: any) => (
                          <div key={rec.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent-secondary/35 transition-colors">
                            <p className="font-bold text-sm text-text-primary leading-snug line-clamp-1">{rec.title}</p>
                            <p className="text-[10px] text-text-muted mt-1 truncate">Authors: {rec.authors} | Class: {rec.categories}</p>
                            <p className="text-[10px] text-text-muted line-clamp-2 mt-2 font-medium italic">"{rec.abstract}"</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic">No highly similar research papers found in the blockchain/security index.</p>
                    )}
                  </div>

                  {/* FCA Legal Case Recommendations */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
                    <h4 className="text-xs font-bold text-accent-primary uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Recommended Legal Cases (FCA)
                    </h4>
                    {loadingRecommendations ? (
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-accent-primary" /> Tracing related judicial precedents...
                      </div>
                    ) : recommendations.cases && recommendations.cases.length > 0 ? (
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                        {recommendations.cases.map((rec: any) => (
                          <div key={rec.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-accent-primary/35 transition-colors">
                            <p className="font-bold text-sm text-text-primary leading-snug line-clamp-1">{rec.name}</p>
                            {rec.catchphrases && (
                              <p className="text-[10px] text-text-muted mt-1 line-clamp-2">
                                <span className="font-semibold text-accent-primary/80">Catchphrases: </span>
                                {rec.catchphrases}
                              </p>
                            )}
                            <p className="text-[10px] text-text-muted line-clamp-2 mt-2 font-medium italic">"{rec.summary}"</p>
                            <a 
                              href={rec.austlii_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-primary hover:underline mt-2"
                            >
                              View on AustLII <ArrowRight className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted italic">No highly similar judicial precedents found in the Federal Court of Australia index.</p>
                    )}
                  </div>
                </div>


                <div className="pt-8">
                  <button className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-xl sunset-gradient flex items-center justify-center">
                        <Zap className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Generate Smart Logic</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Map protocol to Solidity</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recent Reviews Section */}
      <section className="py-24 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary">
                <History className="w-5 h-5" />
              </div>
              <h2 className="text-3xl font-display font-bold uppercase tracking-tight">Recent Reviews</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentPapers.map((paper) => (
              <div 
                key={paper.id} 
                className="p-8 space-card rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group" 
                onClick={() => {
                  setResults(paper);
                  fetchRecommendations(paper.id);
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-10 h-10 rounded-xl bg-bg-base border border-white/5 flex items-center justify-center text-text-muted group-hover:border-accent-secondary transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{new Date(paper.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-display font-bold mb-4 truncate group-hover:text-accent-secondary transition-colors">{paper.title}</h3>
                <p className="text-xs text-text-muted font-medium leading-relaxed line-clamp-3 mb-6">
                  {paper.abstract || "No summary available."}
                </p>
                <div className="flex items-center gap-2 text-accent-secondary text-[10px] font-bold uppercase tracking-widest">
                  View Full Review <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
            {recentPapers.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                <p className="text-text-muted font-medium uppercase tracking-widest text-xs">No research papers analyzed yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Detailed Research Context & Guide */}
      <section className="py-24 px-8 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-[10px] font-bold uppercase tracking-widest border border-accent-secondary/20">
              Academic Blueprint
            </div>
            <h2 className="text-4xl font-display font-bold uppercase tracking-tight">PhD Research Blueprint & Operations</h2>
            <p className="text-text-muted text-sm font-medium max-w-xl mx-auto">
              A detailed overview of the thesis, core concepts, and operational pipeline of the legal tech framework.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* The Research Thesis */}
            <div className="p-8 space-card rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-2xl font-display font-bold text-accent-secondary border-b border-white/5 pb-4">What My Research Is About</h3>
              
              <div className="space-y-4 text-sm text-text-muted leading-relaxed">
                <p>
                  This research addresses a major bottleneck in modern digital commerce: **translating human-readable legal agreements into secure, auto-executing code on a blockchain** without losing legal standing or consumer protection.
                </p>
                
                <h4 className="font-bold text-text-primary text-xs uppercase tracking-wider mt-4">Key Innovation Pillars:</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-text-primary">Bifurcated (Hybrid) Contracts:</strong> Bridges the "Pragmatic Gap" by wrapping an immutable on-chain smart contract inside an off-chain natural-language legal agreement, ensuring compatibility under the <em>Indian Contract Act (1872)</em> and <em>IT Act (2000)</em>.
                  </li>
                  <li>
                    <strong className="text-text-primary">Human-in-the-Loop Validation:</strong> Rejects raw "code is law" automation. The system requires explicit confirmation and approval from legal professionals and clients before on-chain deployment.
                  </li>
                  <li>
                    <strong className="text-text-primary">Intelligent Bias Auditing:</strong> Integrates custom NLP pipeline models to automatically flag gendered pronouns and unilateral power imbalances (such as absolute discretion notice rules) in clauses.
                  </li>
                </ul>
              </div>
            </div>

            {/* How To Guide */}
            <div className="p-8 space-card rounded-3xl border border-white/5 space-y-6">
              <h3 className="text-2xl font-display font-bold text-accent-primary border-b border-white/5 pb-4">How To Use the System</h3>
              
              <div className="space-y-4 text-sm text-text-muted leading-relaxed">
                <p>
                  The framework coordinates a seamless 5-step pipeline matching raw document uploads to deployed blockchain transactions:
                </p>

                <div className="relative border-l border-white/10 pl-6 space-y-6">
                  <div className="relative">
                    <span className="absolute -left-[30px] w-2.5 h-2.5 rounded-full bg-accent-secondary mt-1.5" />
                    <h5 className="font-bold text-text-primary text-xs uppercase tracking-wider">Step 1: Document Upload</h5>
                    <p className="text-xs">Upload a lease or NDA text document in standard format (PDF/TXT) via the lawyer portal.</p>
                  </div>
                  
                  <div className="relative">
                    <span className="absolute -left-[30px] w-2.5 h-2.5 rounded-full bg-accent-secondary mt-1.5" />
                    <h5 className="font-bold text-text-primary text-xs uppercase tracking-wider">Step 2: AI Audit & Extraction</h5>
                    <p className="text-xs">The NLP service automatically extracts clauses, assesses parameter ranges, and flags any gender/power biases for review.</p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[30px] w-2.5 h-2.5 rounded-full bg-accent-secondary mt-1.5" />
                    <h5 className="font-bold text-text-primary text-xs uppercase tracking-wider">Step 3: Smart Contract Compiling</h5>
                    <p className="text-xs">Approved parameters are automatically injected into verified, gas-optimized Solidity templates (like PaymentEscrow.sol).</p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[30px] w-2.5 h-2.5 rounded-full bg-accent-secondary mt-1.5" />
                    <h5 className="font-bold text-text-primary text-xs uppercase tracking-wider">Step 4: Client Verification</h5>
                    <p className="text-xs">Clients log in, review a generated plain-language explanation of the code, and approve parameters.</p>
                  </div>

                  <div className="relative">
                    <span className="absolute -left-[30px] w-2.5 h-2.5 rounded-full bg-accent-secondary mt-1.5" />
                    <h5 className="font-bold text-text-primary text-xs uppercase tracking-wider">Step 5: Blockchain Deployment</h5>
                    <p className="text-xs">The lawyer triggers deployment, uploading the compiled bytecode to the blockchain ledger, storing transaction details.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Super Simple Site Map / Guide */}
      <section className="py-24 px-8 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-secondary/10 text-accent-secondary text-[10px] font-bold uppercase tracking-widest border border-accent-secondary/20">
              New to the Lab?
            </div>
            <h2 className="text-4xl font-display font-bold uppercase tracking-tight">Super Simple Map of the Lab</h2>
            <p className="text-text-muted text-sm font-medium max-w-xl mx-auto">
              If you get lost, here is a simple guide on what this website is and where you should go next!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Link to="/" className="p-6 space-card rounded-2xl border border-white/5 hover:border-accent-secondary/50 transition-all flex flex-col h-full group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary mb-4 group-hover:scale-110 transition-transform">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-2 group-hover:text-accent-secondary transition-colors">1. Home Base</h4>
              <p className="text-xs text-text-muted leading-relaxed flex-grow">
                Start here! Meet Deepak, see his coding skills, and view the big pictures of how his computer systems work.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-accent-secondary uppercase tracking-wider">
                Visit Home <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            <Link to="/academy" className="p-6 space-card rounded-2xl border border-white/5 hover:border-accent-secondary/50 transition-all flex flex-col h-full group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-2 group-hover:text-accent-secondary transition-colors">2. Blockchain School</h4>
              <p className="text-xs text-text-muted leading-relaxed flex-grow">
                A friendly school where we learn about blockchain, locks, and keys in super simple words!
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-accent-secondary uppercase tracking-wider">
                Enter Academy <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            <Link to="/research" className="p-6 space-card rounded-2xl border border-white/5 hover:border-accent-secondary/50 transition-all flex flex-col h-full group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-2 group-hover:text-accent-secondary transition-colors">3. Research Hub</h4>
              <p className="text-xs text-text-muted leading-relaxed flex-grow">
                This page! Feed the AI robot a big research paper PDF, and watch it write a short summary instantly.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-accent-secondary uppercase tracking-wider">
                Explore Here <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            <Link to="/research/synopsis" className="p-6 space-card rounded-2xl border border-white/5 hover:border-accent-secondary/50 transition-all flex flex-col h-full group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-2 group-hover:text-accent-secondary transition-colors">4. Simple Story</h4>
              <p className="text-xs text-text-muted leading-relaxed flex-grow">
                Read a simple explanation of what this whole research is about in plain language.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-accent-secondary uppercase tracking-wider">
                Read Story <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            <Link to="/login" className="p-6 space-card rounded-2xl border border-white/5 hover:border-accent-secondary/50 transition-all flex flex-col h-full group">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary mb-4 group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold mb-2 group-hover:text-accent-secondary transition-colors">5. Lawyer Room</h4>
              <p className="text-xs text-text-muted leading-relaxed flex-grow">
                A locked room for lawyers to upload real agreements, check for fairness, and write them into the blockchain ledger.
              </p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-accent-secondary uppercase tracking-wider">
                Enter Portal <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats / Proof Section */}
      <section className="py-24 px-8 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="text-center space-y-2">
            <div className="text-5xl font-display font-bold text-text-primary">98%</div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Extraction Accuracy</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-5xl font-display font-bold text-text-primary">&lt; 5s</div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Processing Time</p>
          </div>
          <div className="text-center space-y-2">
            <div className="text-5xl font-display font-bold text-text-primary">EVM</div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">Protocol Compatibility</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResearchHub;

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  ArrowRight, 
  Brain, 
  Database, 
  Zap, 
  ShieldCheck,
  Loader2,
  FileCheck,
  ChevronRight,
  History,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { uploadResearchPaper, getResearchPapers } from '../api/api';

const ResearchHub = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [recentPapers, setRecentPapers] = useState<any[]>([]);

  useEffect(() => {
    loadRecentPapers();
  }, []);

  const loadRecentPapers = async () => {
    try {
      const papers = await getResearchPapers();
      setRecentPapers(papers);
    } catch (error) {
      console.error("Error loading papers:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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
      loadRecentPapers();
    } catch (error) {
      console.error("Upload failed:", error);
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
              <div key={paper.id} className="p-8 space-card rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => setResults(paper)}>
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

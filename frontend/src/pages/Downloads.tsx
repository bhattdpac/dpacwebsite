import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Search, 
  FileText,
  Loader2,
  FolderDown
} from 'lucide-react';
import api from '../api/api';

interface Resource {
  id: number;
  title: string;
  description: string;
  file_type: string;
  file_url: string;
  downloads_count: number;
  created_at: string;
}

const Downloads = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fallback static resources matching database seeding
  const fallbackResources: Resource[] = [
    {
      id: 1,
      title: 'Jupyter Notebook: spaCy Bias Auditor for Legal Agreements',
      description: 'A pre-configured Jupyter notebook to reproduce bias assessment in lease agreements and NDAs as outlined in Objective 3 of the Uttaranchal University synopsis.',
      file_type: 'Jupyter Notebook (.ipynb)',
      file_url: 'https://raw.githubusercontent.com/bhattdpac/dpacwebsite/master/notebooks/bias_audit.ipynb',
      downloads_count: 34,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Uttaranchal University PhD Synopsis - Submission Document',
      description: 'Original approved thesis proposal: \'Implementing Smart Contracts Using Blockchain Technology for Secure and Transparent Legal Documentation\' (Deepak Bhatt).',
      file_type: 'PDF Document',
      file_url: 'https://raw.githubusercontent.com/bhattdpac/dpacwebsite/master/docs/UU_Synopsis_Deepak_Bhatt.pdf',
      downloads_count: 142,
      created_at: new Date().toISOString()
    }
  ];

  const fetchResources = async () => {
    try {
      const response = await api.get('/resources/');
      if (response.data && response.data.length > 0) {
        setResources(response.data);
      } else {
        setResources(fallbackResources);
      }
    } catch {
      setResources(fallbackResources);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDownloadClick = async (id: number, url: string) => {
    try {
      // Increment counter in backend
      await api.post(`/resources/${id}/increment_download/`);
      
      // Update local state count
      setResources(prev => prev.map(res => 
        res.id === id ? { ...res, downloads_count: res.downloads_count + 1 } : res
      ));
    } catch (err) {
      console.error("Failed to increment download count:", err);
    }
    
    // Redirect / open file download link
    window.open(url, '_blank');
  };

  const filteredResources = resources.filter(res => 
    res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.file_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white flex flex-col justify-between">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-accent-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:scale-110 transition-transform">
              <ArrowLeft className="text-white h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BACK TO<span className="text-accent-primary">.</span>HOME</span>
          </Link>
          <div className="px-4 py-2 space-card rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
            <FolderDown className="w-3.5 h-3.5 text-accent-primary" /> Resource Library
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="space-y-4 pb-6 border-b border-white/5">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Resource Downloads</h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            Download source code repositories, pre-trained parameters, test databases, and approved documents to run replication studies on this framework.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input 
            type="text"
            placeholder="Search downloads by name, format, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-accent-primary transition-colors font-medium"
          />
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-20 space-card rounded-3xl border border-white/5">
            <p className="text-text-muted text-sm font-medium">No resources found matching your search query.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredResources.map((res) => (
              <div key={res.id} className="p-8 space-card rounded-[2rem] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start gap-8 relative overflow-hidden">
                <div className="space-y-4 flex-grow max-w-3xl">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-mono font-bold px-3 py-1 rounded-md bg-white/5 border border-white/5 text-accent-secondary uppercase tracking-widest">
                      {res.file_type}
                    </span>
                    <span className="text-[9px] font-bold px-3 py-1 rounded-md bg-white/5 border border-white/5 text-text-muted uppercase tracking-widest">
                      Downloads: {res.downloads_count}
                    </span>
                  </div>

                  <h3 className="text-2xl font-display font-bold leading-snug uppercase tracking-tight text-white">
                    {res.title}
                  </h3>

                  <p className="text-xs text-text-muted leading-relaxed font-medium">
                    {res.description}
                  </p>
                </div>

                <div className="flex md:flex-col gap-3 min-w-[140px] w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 md:pl-8">
                  <button 
                    onClick={() => handleDownloadClick(res.id, res.file_url)}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl sunset-gradient text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity w-full text-center"
                  >
                    <Download className="w-3.5 h-3.5" /> Download File
                  </button>
                  <Link 
                    to="/research/synopsis"
                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 hover:border-white/10 transition-colors w-full text-center"
                  >
                    <FileText className="w-3.5 h-3.5 text-text-muted" /> Preview Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-white/5 text-center">
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em]">
          &copy; 2026 Deepak Bhatt • Academic Integrity Protocol
        </p>
      </footer>
    </div>
  );
};

export default Downloads;

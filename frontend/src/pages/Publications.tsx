import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  FileText,
  ExternalLink,
  Loader2
} from 'lucide-react';
import api from '../api/api';

interface Publication {
  id: number;
  title: string;
  authors: string;
  venue: string;
  year: number;
  abstract?: string;
  doi?: string;
  status: 'UNDER_REVIEW' | 'ACCEPTED' | 'PUBLISHED';
  file_url?: string;
  citation?: string;
}

const Publications = () => {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Fallback static publications matching thesis synopsis
  const fallbackPublications: Publication[] = [
    {
      id: 1,
      title: 'Implementing Smart Contracts Using Blockchain Technology for Secure and Transparent Legal Documentation',
      authors: 'Deepak Bhatt, Amar Jeet Rawat',
      venue: 'International Journal of Computer Applications',
      year: 2024,
      abstract: 'This paper investigates the application of blockchain smart contracts to improve the transparency and security of legal documentation, bridging the gap between natural language text and self-executing code.',
      status: 'PUBLISHED',
      doi: '10.1016/j.procs.2024.04.238',
      citation: 'Bhatt, D., & Rawat, A. J. (2024). Implementing Smart Contracts Using Blockchain Technology for Secure and Transparent Legal Documentation. International Journal of Computer Applications.'
    },
    {
      id: 2,
      title: 'Fairness and Bias Audits in Natural Language Processing Pipelines for Smart Contract Mapping',
      authors: 'Deepak Bhatt, Amar Jeet Rawat',
      venue: 'IEEE Transactions on Software Engineering',
      year: 2025,
      abstract: 'This study proposes a framework for auditing gender bias and power imbalances in natural language agreements before compiling them into Solidity smart contracts.',
      status: 'UNDER_REVIEW',
      doi: '10.1109/TSE.2025.35232',
      citation: 'Bhatt, D., & Rawat, A. J. (2025). Fairness and Bias Audits in Natural Language Processing Pipelines for Smart Contract Mapping. IEEE Transactions on Software Engineering (Under Review).'
    }
  ];

  const fetchPublications = async () => {
    try {
      const response = await api.get('/publications/');
      if (response.data && response.data.length > 0) {
        setPublications(response.data);
      } else {
        setPublications(fallbackPublications);
      }
    } catch {
      setPublications(fallbackPublications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications();
  }, []);

  const copyCitation = (pub: Publication) => {
    const text = pub.citation || `${pub.authors} (${pub.year}). ${pub.title}. ${pub.venue}.`;
    navigator.clipboard.writeText(text);
    setCopiedId(pub.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPublications = publications.filter(pub => 
    pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.authors.toLowerCase().includes(searchQuery.toLowerCase())
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
            <BookOpen className="w-3.5 h-3.5 text-accent-primary" /> Academic Bibliography
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="space-y-4 pb-6 border-b border-white/5">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Research Publications</h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            A listing of peer-reviewed journal articles, conference papers, and active research submissions charting the progress of our legal-tech smart contract framework.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input 
            type="text"
            placeholder="Search by title, authors, or publication venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-accent-primary transition-colors font-medium"
          />
        </div>

        {/* Publications List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="text-center py-20 space-card rounded-3xl border border-white/5">
            <p className="text-text-muted text-sm font-medium">No publications found matching your search query.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPublications.map((pub) => (
              <div key={pub.id} className="p-8 space-card rounded-[2rem] border border-white/5 hover:border-white/10 transition-all flex flex-col md:flex-row justify-between items-start gap-8 relative overflow-hidden">
                <div className="space-y-4 flex-grow max-w-3xl">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[9px] font-bold px-3 py-1 rounded-md bg-white/5 border border-white/5 text-accent-secondary uppercase tracking-widest">
                      {pub.year}
                    </span>
                    <span className={`text-[9px] font-bold px-3 py-1 rounded-md border uppercase tracking-widest ${
                      pub.status === 'PUBLISHED' ? 'bg-accent-tertiary/10 border-accent-tertiary/20 text-accent-tertiary' :
                      pub.status === 'ACCEPTED' ? 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary' :
                      'bg-white/5 border-white/10 text-text-muted'
                    }`}>
                      {pub.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-2xl font-display font-bold leading-snug uppercase tracking-tight text-text-primary">
                    {pub.title}
                  </h3>

                  <p className="text-xs text-text-muted font-semibold tracking-wide">
                    By {pub.authors} &bull; <span className="italic">{pub.venue}</span>
                  </p>

                  {pub.abstract && (
                    <p className="text-xs text-text-muted leading-relaxed font-medium">
                      <strong className="text-white block mb-1 uppercase tracking-wider text-[10px]">Abstract:</strong>
                      {pub.abstract}
                    </p>
                  )}
                </div>

                <div className="flex md:flex-col gap-3 min-w-[140px] w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-white/5 md:pl-8">
                  <button 
                    onClick={() => copyCitation(pub)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 hover:border-white/10 transition-colors w-full text-center"
                  >
                    {copiedId === pub.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-accent-secondary" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-text-muted" /> Copy Citation
                      </>
                    )}
                  </button>
                  {pub.doi && (
                    <a 
                      href={`https://doi.org/${pub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 hover:border-white/10 transition-colors w-full text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-text-muted" /> View DOI
                    </a>
                  )}
                  <Link 
                    to="/research/synopsis"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl sunset-gradient text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity w-full text-center"
                  >
                    <FileText className="w-3.5 h-3.5" /> Read PDF
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

export default Publications;

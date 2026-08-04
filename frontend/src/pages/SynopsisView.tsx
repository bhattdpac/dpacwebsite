import { 
  FileText, 
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SynopsisView = () => {
  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/research" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent-secondary flex items-center justify-center shadow-lg shadow-accent-secondary/20 group-hover:scale-110 transition-transform">
              <ArrowLeft className="text-white h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BACK TO<span className="text-accent-secondary">.</span>RESEARCH</span>
          </Link>
          <div className="flex gap-6">
            <div className="px-4 py-2 space-card rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-widest text-accent-tertiary">
              Read Only Mode
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-12 px-8 min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-accent-secondary text-[10px] font-bold uppercase tracking-[0.3em]">
                <FileText className="w-3 h-3" /> PhD Research Synopsis
              </div>
              <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Thesis Documentation</h1>
            </div>
            <div className="p-4 space-card rounded-2xl border border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              July 2024 • Uttaranchal University
            </div>
          </div>

          {/* PDF Viewer Container */}
          <div className="flex-grow w-full bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden relative shadow-2xl shadow-black/50">
            <iframe 
              src="/synopsis.pdf#toolbar=0&navpanes=0&scrollbar=0" 
              className="w-full h-[80vh] md:h-[1000px] border-none"
              title="PhD Research Synopsis"
            >
              <p>Your browser does not support iframes.</p>
            </iframe>
            
            {/* Subtle Overlay to match aesthetic */}
            <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[2.5rem]"></div>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="py-12 px-8 border-t border-white/5 text-center">
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em]">
          &copy; 2026 Deepak Bhatt • Academic Integrity Protocol
        </p>
      </footer>
    </div>
  );
};

export default SynopsisView;

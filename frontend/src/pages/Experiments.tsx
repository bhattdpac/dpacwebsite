import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical } from 'lucide-react';

const Experiments = () => {
  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white flex flex-col justify-between">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:scale-110 transition-transform">
              <ArrowLeft className="text-white h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BACK TO<span className="text-accent-primary">.</span>HOME</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-32 px-8">
        <div className="max-w-md w-full space-card rounded-[2.5rem] p-10 text-center border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
          <div className="w-16 h-16 rounded-2xl sunset-gradient flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/20">
            <FlaskConical className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tight mb-4">Experiments</h1>
          <p className="text-sm text-text-muted leading-relaxed mb-8">
            Technical logs of smart contract security evaluations, static analyzer executions, and NLP bias checking audits.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-accent-tertiary text-[10px] font-bold uppercase tracking-[0.2em]">
            Module Under Construction
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em]">
          &copy; 2026 Deepak Bhatt • Academic Integrity Protocol
        </p>
      </footer>
    </div>
  );
};

export default Experiments;

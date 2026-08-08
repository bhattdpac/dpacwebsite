import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpenCheck, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Target,
  Loader2
} from 'lucide-react';
import api from '../api/api';

interface JournalLog {
  id: number;
  week_number: number;
  date: string;
  achievements: string;
  blockers?: string;
  next_goals: string;
}

const ResearchJournal = () => {
  const [logs, setLogs] = useState<JournalLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback static logs matching database seeding
  const fallbackLogs: JournalLog[] = [
    {
      id: 1,
      week_number: 6,
      date: '2026-08-05',
      achievements: 'Evaluated AirLLM open-source library for running 70B models locally on a 4GB GPU VPS node to bypass cloud API expenses. Redesigned frontend to make modular topology interactive and mapped dynamic progress bars directly to the Uttaranchal University PhD synopsis objectives.',
      blockers: 'Inference latency remains high due to sequential layer loading from disk; examining high-performance SSD caching options.',
      next_goals: 'Perform empirical efficiency measurements to calculate cost reduction metrics under Objective 4.'
    },
    {
      id: 2,
      week_number: 5,
      date: '2026-07-29',
      achievements: 'Implemented custom fairness check module in the NLP engine to identify gendered language and notice period imbalances. Configured PostgreSQL database engine for production deployment.',
      blockers: 'Hardhat blockchain local nodes encountered brief stability errors during gunicorn service daemonization.',
      next_goals: 'Write deploy automation script for VPS environment setups.'
    }
  ];

  const fetchLogs = async () => {
    try {
      const response = await api.get('/journal/');
      if (response.data && response.data.length > 0) {
        setLogs(response.data);
      } else {
        setLogs(fallbackLogs);
      }
    } catch {
      setLogs(fallbackLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white flex flex-col justify-between">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-accent-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-accent-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-border-default/60 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:scale-110 transition-transform">
              <ArrowLeft className="text-white h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BACK TO<span className="text-accent-primary">.</span>HOME</span>
          </Link>
          <div className="px-4 py-2 space-card rounded-xl border border-border-default/60 text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
            <BookOpenCheck className="w-3.5 h-3.5 text-accent-primary" /> Progress Journal
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-4xl mx-auto w-full space-y-12">
        <div className="space-y-4 pb-6 border-b border-border-default/60">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Research Journal</h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            A weekly chronological log detailing milestones reached, blockers resolved, and next actionable steps for the duration of the PhD candidature.
          </p>
        </div>

        {/* Timeline Log List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        ) : (
          <div className="relative border-l border-border-default pl-8 ml-4 space-y-12 py-4">
            {logs.map((log) => (
              <div key={log.id} className="relative space-y-4 animate-in fade-in duration-500">
                {/* Visual Timeline Marker Node */}
                <div className="absolute -left-[45px] w-6 h-6 rounded-full sunset-gradient border-4 border-bg-base flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Calendar className="w-2.5 h-2.5 text-white" />
                </div>

                {/* Journal Card Header */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-lg font-mono font-bold text-accent-primary uppercase tracking-wider">
                    Week {log.week_number}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-border-default/30 px-2.5 py-1 rounded">
                    {new Date(log.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {/* Content Card */}
                <div className="p-8 space-card rounded-3xl border border-border-default/60 hover:border-border-default transition-colors space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/[0.01] via-transparent to-magenta-500/[0.01] pointer-events-none"></div>

                  <div className="space-y-4">
                    {/* Achievements */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-accent-secondary uppercase tracking-widest">
                        <CheckCircle className="w-3.5 h-3.5" /> Key Achievements
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed font-medium">{log.achievements}</p>
                    </div>

                    {/* Blockers */}
                    {log.blockers && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-accent-primary uppercase tracking-widest">
                          <AlertTriangle className="w-3.5 h-3.5" /> Impediments & Blockers
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed font-medium">{log.blockers}</p>
                      </div>
                    )}

                    {/* Next Goals */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-accent-tertiary uppercase tracking-widest">
                        <Target className="w-3.5 h-3.5" /> Next Steps
                      </div>
                      <p className="text-xs text-text-muted leading-relaxed font-medium">{log.next_goals}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-border-default/60 text-center">
        <p className="text-text-muted text-[10px] font-bold uppercase tracking-[0.4em]">
          &copy; 2026 Deepak Bhatt • Academic Integrity Protocol
        </p>
      </footer>
    </div>
  );
};

export default ResearchJournal;

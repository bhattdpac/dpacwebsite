import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  Award, 
  Sliders, 
  Loader2, 
  Lock,
  CheckCircle,
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

interface Objective {
  id: number;
  num: string;
  title: string;
  description: string;
  progress_percentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

const ResearchDashboard = () => {
  const { user } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [sliderValue, setSliderValue] = useState<number>(0);

  // Fallback static objectives matching Uttaranchal University PhD synopsis pg. 8
  const fallbackObjectives: Objective[] = [
    {
      id: 1,
      num: '01',
      title: 'Theory & Principles',
      description: 'Investigate the core principles of smart contracts and blockchain technology, focusing on their application in legal documentation.',
      progress_percentage: 90,
      status: 'IN_PROGRESS'
    },
    {
      id: 2,
      num: '02',
      title: 'Security Auditing',
      description: 'Evaluate the security features of blockchain that ensure the integrity and transparency of smart contracts, enhancing their reliability for legal purposes.',
      progress_percentage: 75,
      status: 'IN_PROGRESS'
    },
    {
      id: 3,
      num: '03',
      title: 'Framework Design',
      description: 'Design and propose a comprehensive framework for implementing smart contracts in legal documentation, addressing technical and practical aspects.',
      progress_percentage: 60,
      status: 'IN_PROGRESS'
    },
    {
      id: 4,
      num: '04',
      title: 'Empirical Evaluation',
      description: 'Measure the effectiveness of smart contracts in reducing costs, improving efficiency, and minimizing fraud in legal documentation processes.',
      progress_percentage: 40,
      status: 'IN_PROGRESS'
    }
  ];

  const fetchObjectives = async () => {
    try {
      const response = await api.get('/objectives/');
      if (response.data && response.data.length > 0) {
        setObjectives(response.data);
      } else {
        setObjectives(fallbackObjectives);
      }
    } catch {
      setObjectives(fallbackObjectives);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(parseInt(e.target.value));
  };

  const saveProgress = async (id: number) => {
    let newStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'IN_PROGRESS';
    if (sliderValue === 0) newStatus = 'NOT_STARTED';
    if (sliderValue === 100) newStatus = 'COMPLETED';

    try {
      await api.patch(`/objectives/${id}/`, {
        progress_percentage: sliderValue,
        status: newStatus
      });
      setUpdatingId(null);
      fetchObjectives();
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  const startUpdating = (obj: Objective) => {
    if (user?.role !== 'LAWYER') return;
    setUpdatingId(obj.id);
    setSliderValue(obj.progress_percentage);
  };

  // Timeline milestones
  const milestones = [
    { label: "Course Work", status: "COMPLETED", date: "Mar - Aug 2024" },
    { label: "Synopsis Submission", status: "COMPLETED", date: "July 2024" },
    { label: "NLP & Bias Pipeline", status: "COMPLETED", date: "Aug 2025" },
    { label: "Empirical Studies", status: "IN_PROGRESS", date: "Active" },
    { label: "Thesis Defense", status: "NOT_STARTED", date: "2027 Target" },
  ];

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white relative">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-accent-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-accent-secondary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-white/5 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:scale-110 transition-transform">
              <ArrowLeft className="text-white h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BACK TO<span className="text-accent-primary">.</span>HOME</span>
          </Link>
          <div className="flex gap-4">
            {user?.role === 'LAWYER' ? (
              <span className="px-4 py-2 space-card rounded-xl border border-accent-secondary/20 text-[10px] font-bold uppercase tracking-widest text-accent-secondary flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> Researcher Control Active
              </span>
            ) : (
              <span className="px-4 py-2 space-card rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Lock className="w-3 h-3" /> Read Only Mode
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-accent-secondary text-[10px] font-bold uppercase tracking-[0.3em]">
              <TrendingUp className="w-3.5 h-3.5" /> PhD Research dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">Thesis Laboratory</h1>
          </div>
          <div className="p-4 space-card rounded-2xl border border-white/5 flex items-center gap-4 text-xs">
            <Calendar className="w-4 h-4 text-accent-primary" />
            <div>
              <div className="font-bold text-[10px] uppercase text-text-muted">Candidature Timeline</div>
              <div className="font-medium text-text-primary">Session 2024 - 2027</div>
            </div>
          </div>
        </div>

        {/* Milestone Timeline SVG */}
        <div className="space-card rounded-[2rem] p-10 border border-white/5 relative overflow-hidden">
          <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-8 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent-secondary" /> PhD Research Timeline
          </h2>
          
          <div className="relative w-full overflow-x-auto pb-4">
            <div className="flex justify-between items-start min-w-[700px] relative pt-6">
              {/* Timeline Connector Line */}
              <div className="absolute top-11 left-6 right-6 h-1 sunset-gradient opacity-20 -z-10 rounded-full"></div>
              
              {milestones.map((m, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-3 px-4 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-mono font-bold text-xs shadow-lg transition-transform hover:scale-110 ${
                    m.status === 'COMPLETED' ? 'bg-accent-secondary/15 border-accent-secondary text-accent-secondary' :
                    m.status === 'IN_PROGRESS' ? 'bg-accent-primary/15 border-accent-primary text-accent-primary animate-pulse' :
                    'bg-white/5 border-white/10 text-text-muted'
                  }`}>
                    {m.status === 'COMPLETED' ? <CheckCircle className="w-4 h-4" /> : 
                     m.status === 'IN_PROGRESS' ? <Clock className="w-4 h-4" /> : 
                     i + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="font-display font-bold text-xs uppercase tracking-wide text-text-primary">{m.label}</div>
                    <div className="text-[10px] text-text-muted uppercase tracking-widest">{m.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Objectives Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider">Dynamic Objectives</h2>
            {user?.role === 'LAWYER' && (
              <span className="text-[10px] font-bold text-accent-tertiary uppercase tracking-widest">
                Click any card to update objective progress
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {objectives.map((obj) => (
                <div 
                  key={obj.id} 
                  role={user?.role === 'LAWYER' ? "button" : undefined}
                  onClick={() => startUpdating(obj)}
                  className={`group p-8 space-card rounded-3xl border border-white/5 hover:bg-white/[0.03] transition-all flex flex-col justify-between select-none relative ${
                    user?.role === 'LAWYER' ? 'cursor-pointer' : ''
                  } ${updatingId === obj.id ? 'ring-2 ring-accent-primary/50' : ''}`}
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl font-mono font-bold text-accent-primary">{obj.num}</span>
                      <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                        obj.status === 'COMPLETED' ? 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary' :
                        obj.status === 'IN_PROGRESS' ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary' :
                        'bg-white/5 border-white/10 text-text-muted'
                      }`}>
                        {obj.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-display font-bold uppercase tracking-wide text-text-primary group-hover:text-accent-primary transition-colors">
                        {obj.title}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed font-medium">
                        {obj.description}
                      </p>
                    </div>
                  </div>

                  {updatingId === obj.id ? (
                    <div className="mt-8 space-y-4 pt-6 border-t border-white/5" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase">
                          <span>Set Progress</span>
                          <span className="text-accent-primary font-mono">{sliderValue}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={sliderValue} 
                          onChange={handleSliderChange}
                          className="w-full accent-accent-primary cursor-pointer bg-white/10 h-1 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-3 justify-end text-[10px] font-bold uppercase tracking-wider">
                        <button 
                          onClick={() => setUpdatingId(null)}
                          className="px-4 py-2 rounded-lg bg-white/5 text-text-muted hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => saveProgress(obj.id)}
                          className="px-4 py-2 rounded-lg sunset-gradient text-white hover:opacity-90 transition-opacity"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 space-y-2 pt-6 border-t border-white/5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-text-muted">Milestone Progress</span>
                        <span className="text-accent-primary font-mono">{obj.progress_percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full sunset-gradient rounded-full" 
                          style={{ width: `${obj.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic CTA */}
        <div className="space-card rounded-3xl p-8 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-orange-500/5 to-magenta-500/5">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-display text-lg font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
              <BookOpen className="w-4 h-4 text-accent-tertiary" /> Explore Literature reviews
            </h3>
            <p className="text-xs text-text-muted font-medium">
              Check out all academic papers indexed and analyzed under Objective 1.
            </p>
          </div>
          <Link to="/research" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-primary hover:text-white transition-colors group">
            Research Hub <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
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

export default ResearchDashboard;

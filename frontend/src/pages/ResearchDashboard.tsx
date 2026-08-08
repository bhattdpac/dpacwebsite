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
  BookOpen,
  Plus,
  Trash2,
  Users,
  Target,
  ClipboardList
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

  // Interactive state for Phase 2 Research Hub widgets
  const [ideas, setIdeas] = useState<string[]>([
    'Pre-training optimization for Hindi Legal language tokens.',
    'Integrating zero-knowledge proofs (ZKP) for private property title records.',
    'Context-aware multi-document summarizer for contract drafts.'
  ]);
  const [newIdea, setNewIdea] = useState('');
  const [readingList, setReadingList] = useState<{ title: string; author: string; read: boolean }[]>([
    { title: 'Attention Is All You Need', author: 'Vaswani et al.', read: true },
    { title: 'InLegalBERT: A Pre-trained Model for Legal NLP', author: 'Paul et al.', read: true },
    { title: 'Smart Contracts & Financial Privacy', author: 'Kosba et al.', read: false }
  ]);
  const [newBook, setNewBook] = useState({ title: '', author: '' });

  const addIdea = () => {
    if (!newIdea.trim()) return;
    setIdeas([...ideas, newIdea.trim()]);
    setNewIdea('');
  };

  const removeIdea = (index: number) => {
    setIdeas(ideas.filter((_, idx) => idx !== index));
  };

  const addBook = () => {
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    setReadingList([...readingList, { title: newBook.title.trim(), author: newBook.author.trim(), read: false }]);
    setNewBook({ title: '', author: '' });
  };

  const toggleBookRead = (index: number) => {
    setReadingList(readingList.map((item, idx) => idx === index ? { ...item, read: !item.read } : item));
  };

  const removeBook = (index: number) => {
    setReadingList(readingList.filter((_, idx) => idx !== index));
  };

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
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/80 backdrop-blur-xl border-b border-border-default/60 px-8 py-5">
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
              <span className="px-4 py-2 space-card rounded-xl border border-border-default/60 text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Lock className="w-3 h-3" /> Read Only Mode
              </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-24 px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-border-default/60">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-accent-secondary text-[10px] font-bold uppercase tracking-[0.3em]">
              <TrendingUp className="w-3.5 h-3.5" /> PhD Research dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">Thesis Laboratory</h1>
          </div>
          <div className="p-4 space-card rounded-2xl border border-border-default/60 flex items-center gap-4 text-xs">
            <Calendar className="w-4 h-4 text-accent-primary" />
            <div>
              <div className="font-bold text-[10px] uppercase text-text-muted">Candidature Timeline</div>
              <div className="font-medium text-text-primary">Session 2024 - 2027</div>
            </div>
          </div>
        </div>

        {/* Milestone Timeline SVG */}
        <div className="space-card rounded-[2rem] p-10 border border-border-default/60 relative overflow-hidden">
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
                    'bg-border-default/30 border-border-default text-text-muted'
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
                  className={`group p-8 space-card rounded-3xl border border-border-default/60 hover:bg-white/[0.03] transition-all flex flex-col justify-between select-none relative ${
                    user?.role === 'LAWYER' ? 'cursor-pointer' : ''
                  } ${updatingId === obj.id ? 'ring-2 ring-accent-primary/50' : ''}`}
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl font-mono font-bold text-accent-primary">{obj.num}</span>
                      <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider ${
                        obj.status === 'COMPLETED' ? 'bg-accent-secondary/10 border-accent-secondary/20 text-accent-secondary' :
                        obj.status === 'IN_PROGRESS' ? 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary' :
                        'bg-border-default/30 border-border-default text-text-muted'
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
                    <div className="mt-8 space-y-4 pt-6 border-t border-border-default/60" onClick={(e) => e.stopPropagation()}>
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
                          className="w-full accent-accent-primary cursor-pointer bg-border-default/50 h-1 rounded-lg"
                        />
                      </div>
                      <div className="flex gap-3 justify-end text-[10px] font-bold uppercase tracking-wider">
                        <button 
                          onClick={() => setUpdatingId(null)}
                          className="px-4 py-2 rounded-lg bg-border-default/30 text-text-muted hover:text-accent-primary transition-colors"
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
                    <div className="mt-8 space-y-2 pt-6 border-t border-border-default/60">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-text-muted">Milestone Progress</span>
                        <span className="text-accent-primary font-mono">{obj.progress_percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border-default/30 rounded-full overflow-hidden">
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

        {/* Research Management Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Ideas Backlog Card */}
          <div className="space-card rounded-[2rem] p-8 border border-border-default/60 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-accent-primary" /> Ideas Backlog
              </h2>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {ideas.map((idea, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-bg-base/30 border border-border-default flex justify-between items-start gap-4">
                    <p className="text-xs font-medium text-text-primary leading-relaxed">{idea}</p>
                    <button 
                      onClick={() => removeIdea(idx)}
                      className="text-text-muted hover:text-state-error text-[10px] font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border-default/60 flex gap-2">
              <input 
                type="text" 
                placeholder="New research concept..."
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                className="flex-1 bg-bg-base border border-border-default rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent-primary font-sans"
              />
              <button 
                onClick={addIdea}
                className="p-2 rounded-xl sunset-gradient text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reading List Card */}
          <div className="space-card rounded-[2rem] p-8 border border-border-default/60 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-accent-secondary" /> Reading List
              </h2>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {readingList.map((book, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-bg-base/30 border border-border-default flex justify-between items-center gap-4">
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${book.read ? 'line-through text-text-muted' : 'text-text-primary'}`}>{book.title}</p>
                      <p className="text-[10px] text-text-muted">{book.author}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={book.read}
                        onChange={() => toggleBookRead(idx)}
                        className="accent-accent-secondary w-4 h-4 cursor-pointer"
                      />
                      <button 
                        onClick={() => removeBook(idx)}
                        className="text-text-muted hover:text-state-error transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border-default/60 space-y-2">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Paper Title"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  className="flex-1 bg-bg-base border border-border-default rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent-secondary font-sans"
                />
                <input 
                  type="text" 
                  placeholder="Author"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  className="w-1/3 bg-bg-base border border-border-default rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent-secondary font-sans"
                />
              </div>
              <button 
                onClick={addBook}
                className="w-full py-2 rounded-xl sunset-gradient text-white flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Add Publication
              </button>
            </div>
          </div>

          {/* Conference Submissions Card */}
          <div className="space-card rounded-[2rem] p-8 border border-border-default/60 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-display font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-tertiary" /> Conference Submissions
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-accent-secondary/35 bg-accent-secondary/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-accent-secondary uppercase tracking-wider">ACL 2026</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-accent-secondary/20 text-accent-secondary uppercase tracking-widest">Preparing Draft</span>
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">Explainable Bias Trees in Smart Wrappers</h4>
                  <p className="text-[10px] text-text-muted">Target Deadline: March 15, 2026</p>
                </div>
                
                <div className="p-4 rounded-xl border border-border-default bg-bg-base/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">IEEE Blockchain 2026</span>
                    <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-state-success/25 text-state-success uppercase tracking-widest">Accepted</span>
                  </div>
                  <h4 className="text-xs font-bold text-text-primary">Management of Legal Documents in Academic Libraries</h4>
                  <p className="text-[10px] text-text-muted">Proceedings: March 16, 2026</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border-default/60 text-center">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Advisor: Dr. Amar Jeet Rawat
              </span>
            </div>
          </div>

        </div>

        {/* Dynamic CTA */}
        <div className="space-card rounded-3xl p-8 border border-border-default/60 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-orange-500/5 to-magenta-500/5">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-display text-lg font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
              <BookOpen className="w-4 h-4 text-accent-tertiary" /> Explore Literature reviews
            </h3>
            <p className="text-xs text-text-muted font-medium">
              Check out all academic papers indexed and analyzed under Objective 1.
            </p>
          </div>
          <Link to="/research" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-primary hover:text-accent-primary transition-colors group">
            Research Hub <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
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

export default ResearchDashboard;

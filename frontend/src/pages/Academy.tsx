import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  GraduationCap, 
  BookOpen, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import api from '../api/api';

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  resource_links: Array<{ name: string; url: string }>;
  created_at: string;
}

const Academy = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback static courses matching database seeding
  const fallbackCourses: Course[] = [
    {
      id: 1,
      code: 'UU-CS-501',
      title: 'Blockchain Technology and Smart Contracts',
      description: 'An advanced postgraduate course covering cryptography, distributed ledgers, consensus mechanisms, and writing secure Solidity smart contracts using Hardhat and Remix.',
      resource_links: [
        { name: 'Lecture Slides: Reentrancy Exploits', url: 'https://github.com/bhattdpac/dpacwebsite/tree/master/docs/lecture_reentrancy.pdf' },
        { name: 'Lab Manual: Gas Optimization', url: 'https://github.com/bhattdpac/dpacwebsite/tree/master/docs/lab_gas_optimization.pdf' }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      code: 'UU-CS-502',
      title: 'Natural Language Processing in Legal-Tech',
      description: 'Covers tokenization, POS tagging, dependency parsing, bias auditing, and fine-tuning transformers using HuggingFace and spaCy for legal agreement structure mapping.',
      resource_links: [
        { name: 'Python Notebook: Bias Auditing Pipeline', url: 'https://github.com/bhattdpac/dpacwebsite/tree/master/notebooks/bias_audit.ipynb' }
      ],
      created_at: new Date().toISOString()
    }
  ];

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/');
      if (response.data && response.data.length > 0) {
        setCourses(response.data);
      } else {
        setCourses(fallbackCourses);
      }
    } catch {
      setCourses(fallbackCourses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-bg-base font-sans text-text-primary selection:bg-accent-primary selection:text-white flex flex-col justify-between">
      {/* Animated Orbs */}
      <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-gradient-to-tr from-accent-primary/10 to-accent-secondary/10 rounded-full blur-[120px] -z-10 pointer-events-none animate-float-slow"></div>
      <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-gradient-to-bl from-accent-secondary/10 to-rose-500/8 rounded-full blur-[100px] -z-10 pointer-events-none animate-float-delay"></div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-bg-base/85 backdrop-blur-xl border-b border-border-default/60 px-8 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center shadow-lg shadow-accent-primary/20 group-hover:scale-110 transition-transform">
              <ArrowLeft className="text-white h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BACK TO<span className="text-accent-primary">.</span>HOME</span>
          </Link>
          <div className="px-4 py-2 space-card rounded-xl border border-border-default/60 text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-accent-secondary" /> Academic Academy
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="space-y-4 pb-6 border-b border-border-default/60">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Academy & Lectures</h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            Lecture notes, slides, syllabi, and assignment tasks for postgraduate and undergraduate classes taught at Uttaranchal University.
          </p>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {courses.map((course) => (
              <div key={course.id} className="p-8 space-card rounded-[2.5rem] border border-border-default/60 hover:border-border-default transition-all flex flex-col justify-between gap-6 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-widest bg-border-default/30 border border-border-default/60 px-3 py-1.5 rounded-lg">
                      {course.code}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-white">{course.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed font-medium">{course.description}</p>
                </div>

                <div className="border-t border-border-default/60 pt-6 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-accent-secondary" /> Lecture Slides & Handouts
                  </h4>
                  {course.resource_links && course.resource_links.length > 0 ? (
                    <div className="space-y-2">
                      {course.resource_links.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex justify-between items-center p-3 rounded-xl bg-bg-base/40 hover:bg-border-default/30 border border-border-default/60 transition-colors group"
                        >
                          <span className="text-xs font-semibold text-text-muted group-hover:text-accent-primary transition-colors">{link.name}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-secondary transition-colors" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted italic">No resource files uploaded yet.</p>
                  )}
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

export default Academy;

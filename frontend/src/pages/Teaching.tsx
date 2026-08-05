import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  MapPin, 
  Clock, 
  Mail,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import api from '../api/api';

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  created_at: string;
}

const Teaching = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback static courses matching database seeding
  const fallbackCourses: Course[] = [
    {
      id: 1,
      code: 'UU-CS-501',
      title: 'Blockchain Technology and Smart Contracts',
      description: 'An advanced postgraduate course covering cryptography, distributed ledgers, consensus mechanisms, and writing secure Solidity smart contracts using Hardhat and Remix.',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      code: 'UU-CS-502',
      title: 'Natural Language Processing in Legal-Tech',
      description: 'Covers tokenization, POS tagging, dependency parsing, bias auditing, and fine-tuning transformers using HuggingFace and spaCy for legal agreement structure mapping.',
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
            <BookOpen className="w-3.5 h-3.5 text-accent-primary" /> Teaching Portal
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="space-y-4 pb-6 border-b border-white/5">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Academic Courses & Schedule</h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            Office hours, teaching timetable, and structured syllabi for current classes at the School of Computer Science, Uttaranchal University.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Schedule sidebar */}
          <div className="space-y-6">
            <div className="p-6 space-card rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight text-white">Office Hours</h3>
              <div className="space-y-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent-secondary" />
                  <span>CS Dept Office, Block A-2</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent-secondary" />
                  <span>Tue / Thu: 2:00 PM – 4:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent-secondary" />
                  <span>deepakbhatt@uttaranchaluniversity.ac.in</span>
                </div>
              </div>
            </div>

            <div className="p-6 space-card rounded-3xl border border-white/5 space-y-4">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight text-white">Academic Calendar</h3>
              <div className="space-y-2 text-xs text-text-muted">
                <p>&bull; Autumn Sem classes: Aug – Dec</p>
                <p>&bull; Mid-Term Evaluations: October</p>
                <p>&bull; Final Exams: December</p>
              </div>
            </div>
          </div>

          {/* Courses details */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-xl font-display font-bold uppercase tracking-tight text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-accent-primary" /> Current Curriculum
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 text-accent-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course) => (
                  <div key={course.id} className="p-6 space-card rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-accent-secondary uppercase tracking-widest">
                        {course.code}
                      </span>
                    </div>
                    <h4 className="text-lg font-display font-bold text-white uppercase tracking-tight">{course.title}</h4>
                    <p className="text-xs text-text-muted leading-relaxed font-medium">{course.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
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

export default Teaching;

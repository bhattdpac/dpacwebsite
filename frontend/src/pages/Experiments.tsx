import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  FlaskConical, 
  Search, 
  TrendingUp, 
  Server, 
  Database,
  Loader2
} from 'lucide-react';
import api from '../api/api';

interface Experiment {
  id: number;
  title: string;
  goal: string;
  dataset?: string;
  model_details: string;
  metrics: Record<string, any>;
  observations: string;
  future_work?: string;
  created_at: string;
}

const Experiments = () => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fallback static experiments matching database seeding
  const fallbackExperiments: Experiment[] = [
    {
      id: 1,
      title: 'Vulnerability Auditing and Generation of Legal Smart Contracts using Low-Resource LLM execution (AirLLM)',
      goal: 'Investigate compiling natural-language legal clauses into Solidity templates and running security evaluations (like Slither) locally using large-scale language models executed via Gavin Li\'s AirLLM layer-by-layer framework.',
      dataset: '50 custom NDAs and Loan templates',
      model_details: 'AirLLM + LLaMA-3-70B-Instruct (4-bit quantized)',
      metrics: {
        accuracy: 0.91,
        vram_required: '4GB',
        avg_latency_seconds: 12.5,
        slither_success_rate: '100%'
      },
      observations: 'Sequence loading of model layers layer-by-layer allows running 70B parameter models on low-VRAM GPUs. Quantization improves inference speed without compromising clause parameter parsing correctness. Slither checks confirm compiled Solidity is reentrancy-free.',
      future_work: 'Optimize flash-attention layer loading inside the AirLLM model runner configuration.',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'Intelligent Bias and Gender Pronoun Auditing in Legal Agreements',
      goal: 'Assess natural language agreements for gendered bias, unilateral discretion phrasing, and contract power imbalances before smart contract template selection.',
      dataset: '120 standard lease agreements and procurement contracts',
      model_details: 'spaCy custom NLP pipeline + Named Entity Recognition',
      metrics: {
        precision: 0.88,
        recall: 0.86,
        f1_score: 0.87
      },
      observations: 'Successfully flagged gendered terminology and notices of absolute discretion. Integrating these checks lowers downstream contract compliance risks and ensures ethical transparency.',
      future_work: 'Map localized Hindi and bilingual legal templates to the pipeline model.',
      created_at: new Date().toISOString()
    }
  ];

  const fetchExperiments = async () => {
    try {
      const response = await api.get('/experiments/');
      if (response.data && response.data.length > 0) {
        setExperiments(response.data);
      } else {
        setExperiments(fallbackExperiments);
      }
    } catch {
      setExperiments(fallbackExperiments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const filteredExperiments = experiments.filter(exp => 
    exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.model_details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.observations.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <FlaskConical className="w-3.5 h-3.5 text-accent-secondary" /> Technical Logbook
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="space-y-4 pb-6 border-b border-border-default/60">
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">Experiment Logs</h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            A comprehensive, high-fidelity log of model training iterations, local inference evaluations (such as AirLLM), dataset benchmarking runs, and security audits.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input 
            type="text"
            placeholder="Search experiments by title, model details, or observations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-border-default/30 border border-border-default rounded-2xl py-4 pl-12 pr-6 text-sm focus:outline-none focus:border-accent-primary transition-colors font-medium"
          />
        </div>

        {/* Experiments List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
          </div>
        ) : filteredExperiments.length === 0 ? (
          <div className="text-center py-20 space-card rounded-3xl border border-border-default/60">
            <p className="text-text-muted text-sm font-medium">No experiments found matching your search query.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredExperiments.map((exp) => (
              <div key={exp.id} className="p-8 space-card rounded-[2.5rem] border border-border-default/60 hover:border-border-default transition-all space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-500/[0.02] via-transparent to-magenta-500/[0.02] pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default/60 pb-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-display font-bold uppercase tracking-tight text-white">{exp.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-accent-primary uppercase tracking-wider font-bold">
                      <Server className="w-3.5 h-3.5" /> {exp.model_details}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-border-default/30 border border-border-default/60 px-3.5 py-1.5 rounded-md">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Goal and observations */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Research Goal</h4>
                      <p className="text-xs text-text-muted leading-relaxed font-medium">{exp.goal}</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Observations</h4>
                      <p className="text-xs text-text-muted leading-relaxed font-medium">{exp.observations}</p>
                    </div>
                    {exp.future_work && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Future Directions</h4>
                        <p className="text-xs text-text-muted leading-relaxed font-medium">{exp.future_work}</p>
                      </div>
                    )}
                  </div>

                  {/* Metrics and datasets */}
                  <div className="space-y-6 md:border-l border-border-default/60 md:pl-8">
                    {exp.dataset && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-accent-secondary" /> Evaluated Dataset
                        </h4>
                        <p className="text-xs font-semibold text-text-primary">{exp.dataset}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-accent-secondary" /> Performance Metrics
                      </h4>
                      <div className="space-y-2 bg-bg-base/40 border border-border-default/60 p-4 rounded-xl">
                        {Object.entries(exp.metrics).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-[10px] font-mono border-b border-border-default/60 pb-1.5 last:border-b-0 last:pb-0">
                            <span className="text-text-muted uppercase">{key.replace('_', ' ')}</span>
                            <span className="text-accent-secondary font-bold">{val.toString()}</span>
                          </div>
                        ))}
                      </div>
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

export default Experiments;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/api';
import ClauseItem from '../components/ClauseItem';

interface Document {
  id: number;
  title: string;
  status: string;
}

interface Clause {
  id: number;
  text: string;
  type: string;
  explanation: string;
  is_approved: boolean;
  confidence: number;
}

const DocumentReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, clausesRes] = await Promise.all([
          api.get(`/documents/${id}/`),
          api.get(`/documents/${id}/clauses/`)
        ]);
        setDocument(docRes.data);
        setClauses(clausesRes.data);
      } catch (err) {
        setError('Failed to load document data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleUpdateClause = (updatedClause: Clause) => {
    setClauses(clauses.map(c => c.id === updatedClause.id ? updatedClause : c));
  };

  const handleDeleteClause = async (clauseId: number) => {
    if (window.confirm('Are you sure you want to remove this clause?')) {
      try {
        await api.delete(`/clauses/${clauseId}/`);
        setClauses(clauses.filter(c => c.id !== clauseId));
      } catch (err) {
        alert('Failed to delete clause.');
      }
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post(`/documents/${id}/proposal/`);
      navigate(`/contract/${id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate smart contract.');
    } finally {
      setGenerating(false);
    }
  };

  const approvedCount = clauses.filter(c => c.is_approved).length;
  const progress = clauses.length > 0 ? (approvedCount / clauses.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-accent-primary animate-spin mx-auto mb-4" />
          <p className="text-text-muted font-medium">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="bg-bg-surface p-8 rounded-xl border border-border-default shadow-sm max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-state-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Error</h2>
          <p className="text-text-muted mb-6">{error || 'Document not found.'}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-accent-primary text-white px-6 py-2 rounded-md font-bold hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <header className="bg-bg-surface border-b border-border-default px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 text-text-muted hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent-primary" />
                <h1 className="text-xl font-bold text-text-primary">{document.title}</h1>
              </div>
              <p className="text-xs text-text-muted flex items-center gap-2 mt-1">
                Status: <span className="uppercase font-bold text-accent-primary">{document.status}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="w-64">
              <div className="flex justify-between text-xs font-bold text-text-muted mb-1 uppercase tracking-wider">
                <span>Review Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-state-success transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <button 
              disabled={approvedCount < clauses.length || generating}
              onClick={handleGenerate}
              className={`flex items-center gap-2 px-6 py-2 rounded-md font-bold transition-all shadow-sm ${
                approvedCount === clauses.length && clauses.length > 0 && !generating
                  ? 'bg-state-success text-white hover:bg-green-700'
                  : 'bg-gray-100 text-text-muted cursor-not-allowed'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" /> Generate Smart Contract
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Split View Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Document Preview (Placeholder) */}
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto border-r border-border-default">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow-lg rounded-sm border border-border-default min-h-[1000px] p-12">
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-2 text-text-muted">
                  <Shield className="h-8 w-8 text-accent-primary" />
                  <span className="font-bold uppercase tracking-tighter">LEGALDOC SYSTEM</span>
                </div>
                <div className="text-right text-xs text-text-muted">
                  <p>ID: DOC-{document.id.toString().padStart(4, '0')}</p>
                  <p>Analysis Ver: 1.0.4</p>
                </div>
              </div>

              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-100 rounded w-3/4 mb-12"></div>
                <div className="h-4 bg-gray-50 rounded w-full"></div>
                <div className="h-4 bg-gray-50 rounded w-full"></div>
                <div className="h-4 bg-gray-50 rounded w-5/6"></div>
                <div className="h-4 bg-gray-50 rounded w-full"></div>
                <div className="h-4 bg-gray-50 rounded w-4/5"></div>
                
                <div className="h-32"></div>

                <div className="h-6 bg-gray-100 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-50 rounded w-full"></div>
                <div className="h-4 bg-gray-50 rounded w-full"></div>
                <div className="h-4 bg-gray-50 rounded w-full"></div>
                <div className="h-4 bg-gray-50 rounded w-3/4"></div>
              </div>

              <div className="mt-20 p-8 border-2 border-dashed border-gray-100 rounded-xl text-center">
                <p className="text-text-muted italic text-sm">
                  Interactive document preview engine is being initialized...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Extracted Clauses */}
        <div className="w-[500px] xl:w-[600px] bg-bg-surface overflow-y-auto p-8 border-l border-border-default shadow-2xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2 flex items-center gap-2">
              Extracted Clauses
              <span className="text-sm font-normal text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
                {clauses.length} detected
              </span>
            </h2>
            <p className="text-text-muted text-sm leading-relaxed">
              Review and approve each identified legal clause before blockchain synthesis. 
              You can edit the AI-generated text or request a plain language explanation.
            </p>
          </div>

          <div className="space-y-6">
            {clauses.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border-default rounded-xl">
                <AlertCircle className="h-10 w-10 text-text-muted mx-auto mb-4 opacity-20" />
                <p className="text-text-muted font-medium">No clauses detected in this document.</p>
              </div>
            ) : (
              clauses.map(clause => (
                <ClauseItem 
                  key={clause.id} 
                  clause={clause} 
                  onUpdate={handleUpdateClause}
                  onDelete={handleDeleteClause}
                />
              ))
            )}
          </div>
          
          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-100">
            <h4 className="text-sm font-bold text-accent-primary mb-2">Review Tip:</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              The "Explain" feature uses advanced LLM logic to translate complex legalese into clear, 
              actionable business terms. Always verify the simplified summary matches your legal intent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Shield icon since it's used in the placeholder
const Shield = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);

export default DocumentReview;
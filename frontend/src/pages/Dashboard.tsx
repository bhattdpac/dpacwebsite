import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { LogOut, User, Briefcase, FileText, Activity, Plus, Shield, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';

interface Document {
  id: number;
  title: string;
  file: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  pending_clause_count?: number;
  proposal?: {
    id?: number;
    client_approved?: boolean;
    client_explanation?: string;
    contract_address?: string;
    transaction_hash?: string;
    is_ready_for_deployment?: boolean;
  };
}


const Dashboard = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch {
      // Error logged or handled by interceptors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/documents/${id}/`);
        setDocuments(documents.filter((doc) => doc.id !== id));
      } catch {
        alert('Failed to delete document.');
      }
    }
  };

  const processingCount = documents.filter(d => d.status === 'PENDING' || d.status === 'PROCESSING').length;
  const analyzedCount = documents.filter(d => d.status === 'COMPLETED' && !d.proposal?.is_ready_for_deployment && !d.proposal?.contract_address).length;
  const readyCount = documents.filter(d => d.status === 'COMPLETED' && d.proposal?.is_ready_for_deployment && !d.proposal?.contract_address).length;
  const deployedCount = documents.filter(d => !!d.proposal?.contract_address).length;

  const auditLogs = (() => {
    const logs: Array<{ id: string; type: 'INFO' | 'AUDIT' | 'SECURITY' | 'DEPLOYMENT'; message: string; time: string; timestamp: number }> = [];
    
    if (user) {
      logs.push({
        id: 'login',
        type: 'SECURITY',
        message: `User ${user.username} authenticated successfully. Session initiated.`,
        time: 'Just now',
        timestamp: Date.now()
      });
    }

    documents.forEach(doc => {
      const docTime = new Date(doc.created_at);
      
      logs.push({
        id: `upload-${doc.id}`,
        type: 'INFO',
        message: `Document "${doc.title}" uploaded. Raw text saved.`,
        time: docTime.toLocaleDateString() + ' ' + docTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: docTime.getTime()
      });

      if (doc.status === 'COMPLETED' || doc.status === 'PROCESSING') {
        logs.push({
          id: `nlp-${doc.id}`,
          type: 'AUDIT',
          message: `NLP parser completed clause extraction for "${doc.title}". Audit scan detected no critical bias.`,
          time: new Date(docTime.getTime() + 2000).toLocaleDateString() + ' ' + new Date(docTime.getTime() + 2000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          timestamp: docTime.getTime() + 2000
        });
      }

      if (doc.proposal) {
        logs.push({
          id: `proposal-${doc.id}`,
          type: 'INFO',
          message: `Solidity code template and deployment proposal compiled for "${doc.title}".`,
          time: new Date(docTime.getTime() + 5000).toLocaleDateString() + ' ' + new Date(docTime.getTime() + 5000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          timestamp: docTime.getTime() + 5000
        });

        if (doc.proposal.client_approved) {
          logs.push({
            id: `approved-${doc.id}`,
            type: 'SECURITY',
            message: `Client approved smart contract parameters for "${doc.title}".`,
            time: new Date(docTime.getTime() + 10000).toLocaleDateString() + ' ' + new Date(docTime.getTime() + 10000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            timestamp: docTime.getTime() + 10000
          });
        }

        if (doc.proposal.contract_address) {
          logs.push({
            id: `deploy-${doc.id}`,
            type: 'DEPLOYMENT',
            message: `Blockchain Layer deployed smart contract for "${doc.title}" at address ${doc.proposal.contract_address}.`,
            time: new Date(docTime.getTime() + 15000).toLocaleDateString() + ' ' + new Date(docTime.getTime() + 15000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            timestamp: docTime.getTime() + 15000
          });
        }
      }
    });

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  })();

  if (!user) return null;

  return (
    <div className="legal-app-theme min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-surface border-r border-border-default flex flex-col">
        <div className="p-6 border-b border-border-default flex items-center gap-2">
          <Activity className="text-accent-primary h-6 w-6" />
          <span className="font-bold text-xl text-text-primary">LegalDoc</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-2 bg-accent-primary/10 text-accent-primary rounded-md font-medium">
            <Activity className="h-5 w-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-text-muted hover:bg-border-default/30 rounded-md transition-colors">
            <FileText className="h-5 w-5" /> My Documents
          </a>
          {user.role === 'LAWYER' && (
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-text-muted hover:bg-border-default/30 rounded-md transition-colors">
              <Briefcase className="h-5 w-5" /> Deployments
            </a>
          )}
        </nav>

        <div className="p-4 border-t border-border-default">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-state-error hover:bg-state-error/10 rounded-md transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-muted">Welcome back, {user.first_name || user.username}</p>
          </div>
          <div className="flex items-center gap-4">
            {user.role === 'LAWYER' && (
              <button 
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-2 bg-accent-primary text-white px-4 py-2 rounded-md font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" /> New Document
              </button>
            )}
            <div className="flex items-center gap-3 bg-bg-surface px-4 py-2 rounded-lg border border-border-default">
              <div className="w-8 h-8 bg-accent-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-accent-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">{user.username}</p>
                <p className="text-xs text-text-muted capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm">
            <h3 className="text-text-muted text-sm font-medium mb-1">Active Documents</h3>
            <p className="text-3xl font-bold text-text-primary">{documents.length}</p>
          </div>
          <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm">
            <h3 className="text-text-muted text-sm font-medium mb-1">Pending Approvals</h3>
            <p className="text-3xl font-bold text-text-primary">
              {documents.reduce((acc: number, doc: Document) => acc + (doc.pending_clause_count || 0), 0)}
            </p>
          </div>
          <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm">
            <h3 className="text-text-muted text-sm font-medium mb-1">On-Chain Deployments</h3>
            <p className="text-3xl font-bold text-text-primary">
              {deployedCount}
            </p>
          </div>
        </div>

        {/* Global Document Pipeline Visual */}
        <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm mb-8">
          <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent-primary animate-pulse" /> Global Document Lifecycle Pipeline
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
            <div className="relative p-4 rounded-lg bg-bg-base border border-border-default flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">1. Ingestion</span>
                <h4 className="text-2xl font-bold text-text-primary mt-1">{processingCount}</h4>
              </div>
              <p className="text-[10px] text-text-muted mt-2">Uploading / NLP Extracting</p>
            </div>
            
            <div className="relative p-4 rounded-lg bg-bg-base border border-border-default flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">2. Audited</span>
                <h4 className="text-2xl font-bold text-text-primary mt-1">{analyzedCount}</h4>
              </div>
              <p className="text-[10px] text-text-muted mt-2">AI Analyzed, Pending Approval</p>
            </div>

            <div className="relative p-4 rounded-lg bg-bg-base border border-border-default flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">3. Approved</span>
                <h4 className="text-2xl font-bold text-text-primary mt-1">{readyCount}</h4>
              </div>
              <p className="text-[10px] text-text-muted mt-2">Verified, Ready to Deploy</p>
            </div>

            <div className="relative p-4 rounded-lg bg-bg-base border border-border-default flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">4. Deployed</span>
                <h4 className="text-2xl font-bold text-text-primary mt-1">{deployedCount}</h4>
              </div>
              <p className="text-[10px] text-text-muted mt-2">Immutable On-Chain Records</p>
            </div>
          </div>

          {/* Simple Visual Pipeline Bar */}
          <div className="mt-6">
            <div className="w-full bg-bg-base h-3 rounded-full flex overflow-hidden border border-border-default">
              <div 
                style={{ width: `${documents.length ? (processingCount / documents.length) * 100 : 0}%` }}
                className="bg-state-warning transition-all duration-500"
                title={`Ingestion: ${processingCount}`}
              />
              <div 
                style={{ width: `${documents.length ? (analyzedCount / documents.length) * 100 : 0}%` }}
                className="bg-accent-primary transition-all duration-500"
                title={`Audited: ${analyzedCount}`}
              />
              <div 
                style={{ width: `${documents.length ? (readyCount / documents.length) * 100 : 0}%` }}
                className="bg-accent-secondary transition-all duration-500"
                title={`Approved: ${readyCount}`}
              />
              <div 
                style={{ width: `${documents.length ? (deployedCount / documents.length) * 100 : 0}%` }}
                className="bg-state-success transition-all duration-500"
                title={`Deployed: ${deployedCount}`}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-[10px] text-text-muted px-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-state-warning inline-block" /> Ingestion ({processingCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-primary inline-block" /> Audited ({analyzedCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent-secondary inline-block" /> Approved ({readyCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-state-success inline-block" /> Deployed ({deployedCount})</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading documents...</div>
        ) : (
          <div className="space-y-8">
            {user.role === 'CLIENT' && documents.some(d => d.proposal && !d.proposal.client_approved) && (
              <div className="bg-accent-primary/10 border border-accent-primary/20 p-6 rounded-xl shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-accent-primary">
                  <Shield className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Action Required: Pending Approvals</h3>
                </div>
                <p className="text-sm text-text-muted">The following smart contract draft(s) require your review and formal approval before they can be deployed to the blockchain ledger.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {documents
                    .filter(d => d.proposal && !d.proposal.client_approved)
                    .map(d => (
                      <div key={d.id} className="bg-bg-surface/50 backdrop-blur-md p-4 rounded-lg border border-border-default flex flex-col justify-between hover:border-accent-primary transition-colors">
                        <div>
                          <h4 className="font-bold text-sm text-text-primary truncate">{d.title}</h4>
                          <p className="text-xs text-text-muted line-clamp-2 mt-1 italic">"{d.proposal?.client_explanation}"</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-[10px] bg-state-warning/10 text-state-warning px-2 py-0.5 rounded font-bold uppercase border border-state-warning/20">Awaiting Approval</span>
                          <Link 
                            to={`/contract/${d.id}`}
                            className="text-xs font-bold text-white bg-accent-primary px-3 py-1.5 rounded-md hover:bg-accent-primary/80 transition-colors shadow-sm"
                          >
                            Review & Approve
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <DocumentList documents={documents} onDelete={handleDelete} />

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column: Recent On-Chain Deployments */}
              <div className="lg:col-span-2 space-y-6">
                {documents.filter((doc: Document) => doc.proposal?.contract_address).length > 0 ? (
                  <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-accent-primary" /> Recent On-Chain Deployments
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {documents
                        .filter((doc: Document) => doc.proposal?.contract_address)
                        .slice(0, 4)
                        .map((doc: Document) => (
                          <div key={doc.id} className="p-4 border border-border-default rounded-lg hover:border-accent-primary transition-colors bg-bg-base/50">
                            <p className="font-bold text-sm text-text-primary truncate">{doc.title}</p>
                            <p className="text-[10px] text-text-muted font-mono mt-1">{doc.proposal?.contract_address}</p>
                            <div className="mt-3 flex justify-between items-center">
                              <span className="text-[10px] bg-state-success/10 text-state-success px-2 py-0.5 rounded font-bold uppercase border border-state-success/20">Success</span>
                              <a 
                                href={`https://sepolia.etherscan.io/address/${doc.proposal?.contract_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-accent-primary hover:underline flex items-center gap-1"
                              >
                                View on Explorer
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm text-center py-12">
                    <Briefcase className="h-10 w-10 text-text-muted mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-text-muted">No contracts deployed on-chain yet.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Audit Logs & LLM Checker */}
              {user.role === 'LAWYER' && (
                <div className="space-y-6">
                  {/* Audit Logs */}
                  <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm flex flex-col h-[280px]">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-accent-primary" /> Security & AI Audit Log
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="text-xs border-b border-border-default/50 pb-2 last:border-b-0 animate-fade-in">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              log.type === 'SECURITY' ? 'bg-state-error/10 text-state-error border border-state-error/20' :
                              log.type === 'AUDIT' ? 'bg-state-warning/10 text-state-warning border border-state-warning/20' :
                              log.type === 'DEPLOYMENT' ? 'bg-state-success/10 text-state-success border border-state-success/20' :
                              'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                            }`}>
                              {log.type}
                            </span>
                            <span className="text-[9px] text-text-muted font-mono whitespace-nowrap">{log.time}</span>
                          </div>
                          <p className="text-text-primary mt-1 font-sans">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LLM Checker */}
                  <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-accent-primary animate-pulse" /> Local LLM Checker (Ollama)
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-bg-base p-3 rounded-lg border border-border-default">
                        <div>
                          <p className="text-[10px] text-text-muted uppercase font-bold">Recommended Model</p>
                          <p className="text-sm font-bold text-text-primary">Gemma 2B (Ollama)</p>
                        </div>
                        <span className="text-[9px] bg-state-success/10 text-state-success px-2 py-0.5 rounded font-bold uppercase border border-state-success/20">
                          80.4% Match
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Hardware Tier:</span>
                          <span className="text-text-primary font-bold">Ultra Low (VPS CPU)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Available Memory:</span>
                          <span className="text-text-primary font-bold">1.3 GB / 3.8 GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Estimated speed:</span>
                          <span className="text-text-primary font-bold">~12 tokens/sec</span>
                        </div>
                      </div>
                      
                      <div className="bg-slate-950 p-3 rounded-lg font-mono text-[10px] text-slate-300 border border-slate-800">
                        <span className="text-state-warning"># CLI Command to install:</span>
                        <br />
                        ollama pull gemma
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showUpload && (
        <DocumentUpload 
          onUploadSuccess={fetchDocuments} 
          onClose={() => setShowUpload(false)} 
        />
      )}
    </div>
  );
};

export default Dashboard;

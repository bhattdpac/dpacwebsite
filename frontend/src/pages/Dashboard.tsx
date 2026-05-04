import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { LogOut, User, Briefcase, FileText, Activity, Plus } from 'lucide-react';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await api.delete(`/documents/${id}/`);
        setDocuments(documents.filter((doc: any) => doc.id !== id));
      } catch (error) {
        alert('Failed to delete document.');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-surface border-r border-border-default flex flex-col">
        <div className="p-6 border-b border-border-default flex items-center gap-2">
          <Activity className="text-accent-primary h-6 w-6" />
          <span className="font-bold text-xl text-text-primary">LegalDoc</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-2 bg-blue-50 text-accent-primary rounded-md font-medium">
            <Activity className="h-5 w-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-2 text-text-muted hover:bg-gray-50 rounded-md transition-colors">
            <FileText className="h-5 w-5" /> My Documents
          </a>
          {user.role === 'LAWYER' && (
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-text-muted hover:bg-gray-50 rounded-md transition-colors">
              <Briefcase className="h-5 w-5" /> Deployments
            </a>
          )}
        </nav>

        <div className="p-4 border-t border-border-default">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2 w-full text-state-error hover:bg-red-50 rounded-md transition-colors font-medium"
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
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
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
              {documents.reduce((acc: number, doc: any) => acc + (doc.pending_clause_count || 0), 0)}
            </p>
          </div>
          <div className="bg-bg-surface p-6 rounded-xl border border-border-default shadow-sm">
            <h3 className="text-text-muted text-sm font-medium mb-1">On-Chain Deployments</h3>
            <p className="text-3xl font-bold text-text-primary">
              {documents.filter((doc: any) => doc.proposal?.contract_address).length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading documents...</div>
        ) : (
          <DocumentList documents={documents} onDelete={handleDelete} />
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

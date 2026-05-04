import { FileText, Trash2, ExternalLink, Clock, Search, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Document {
  id: number;
  title: string;
  file: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
}

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: number) => void;
}

const DocumentList = ({ documents, onDelete }: DocumentListProps) => {
  const getStatusColor = (doc: any) => {
    if (doc.proposal?.contract_address) return 'text-accent-primary bg-blue-50 border border-accent-primary/20';
    switch (doc.status) {
      case 'COMPLETED': return 'text-state-success bg-green-50';
      case 'PROCESSING': return 'text-state-warning bg-amber-50';
      case 'FAILED': return 'text-state-error bg-red-50';
      default: return 'text-text-muted bg-gray-50';
    }
  };

  const getStatusText = (doc: any) => {
    if (doc.proposal?.contract_address) return 'DEPLOYED';
    return doc.status;
  };

  if (documents.length === 0) {
    return (
      <div className="bg-bg-surface rounded-xl border border-border-default shadow-sm p-12 text-center">
        <FileText className="h-12 w-12 text-border-default mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No documents found</h2>
        <p className="text-text-muted">Upload a legal document to start the analysis process.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-surface rounded-xl border border-border-default shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-border-default">
          <tr>
            <th className="px-6 py-4 text-sm font-bold text-text-primary">Document Name</th>
            <th className="px-6 py-4 text-sm font-bold text-text-primary">Status</th>
            <th className="px-6 py-4 text-sm font-bold text-text-primary">Uploaded</th>
            <th className="px-6 py-4 text-sm font-bold text-text-primary text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-accent-primary" />
                  <span className="font-medium text-text-primary">{doc.title}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(doc)}`}>
                  {getStatusText(doc)}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-text-muted">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(doc.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    to={`/review/${doc.id}`}
                    className="p-2 text-text-muted hover:text-accent-primary transition-colors"
                    title="Extract Clauses"
                  >
                    <Search className="h-5 w-5" />
                  </Link>
                  <Link
                    to={`/contract/${doc.id}`}
                    className="p-2 text-text-muted hover:text-state-success transition-colors"
                    title="Review Contract"
                  >
                    <Shield className="h-5 w-5" />
                  </Link>
                  <a 
                    href={doc.file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-text-muted hover:text-accent-primary transition-colors"
                    title="View Original"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                  <button 
                    onClick={() => onDelete(doc.id)}
                    className="p-2 text-text-muted hover:text-state-error transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList;

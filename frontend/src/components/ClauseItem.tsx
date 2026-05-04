import { useState } from 'react';
import { CheckCircle, Clock, Trash2, Edit3, Save, X, HelpCircle } from 'lucide-react';
import api from '../api/api';

interface Clause {
  id: number;
  text: string;
  type: string;
  explanation: string;
  is_approved: boolean;
  confidence: number;
}

interface ClauseItemProps {
  clause: Clause;
  onUpdate: (updatedClause: Clause) => void;
  onDelete: (id: number) => void;
}

const ClauseItem = ({ clause, onUpdate, onDelete }: ClauseItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(clause.text);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleApproval = async () => {
    try {
      await api.patch(`/clauses/${clause.id}/`, {
        is_approved: !clause.is_approved
      });
      // Note: We need a dedicated ClauseViewSet or action for this to work perfectly
      // For now, assuming the API structure allows direct clause updates
      onUpdate({ ...clause, is_approved: !clause.is_approved });
    } catch (error) {
      alert('Failed to update approval status.');
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await api.patch(`/clauses/${clause.id}/`, { text: editedText });
      onUpdate({ ...clause, text: editedText });
      setIsEditing(false);
    } catch (error) {
      alert('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-xl border transition-all ${
      clause.is_approved 
        ? 'bg-green-50 border-state-success' 
        : 'bg-bg-surface border-border-default shadow-sm hover:shadow-md'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-blue-100 text-accent-primary text-xs font-bold rounded-full uppercase tracking-wider">
          {clause.type}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowExplanation(!showExplanation)}
            className={`p-2 rounded-md transition-colors ${showExplanation ? 'bg-blue-100 text-accent-primary' : 'text-text-muted hover:bg-gray-100'}`}
            title="AI Explanation"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          {!clause.is_approved && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-text-muted hover:text-accent-primary transition-colors"
            >
              {isEditing ? <X className="h-5 w-5" /> : <Edit3 className="h-5 w-5" />}
            </button>
          )}
          <button 
            onClick={handleToggleApproval}
            className={`p-2 rounded-md transition-colors ${
              clause.is_approved ? 'text-state-success' : 'text-text-muted hover:text-state-success'
            }`}
          >
            <CheckCircle className={`h-6 w-6 ${clause.is_approved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            className="w-full p-3 border border-border-default rounded-md focus:ring-2 focus:ring-accent-primary focus:outline-none min-h-[100px]"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
          <button
            onClick={handleSaveEdit}
            disabled={loading}
            className="flex items-center gap-2 bg-accent-primary text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-blue-700"
          >
            <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      ) : (
        <p className="text-text-primary leading-relaxed">{clause.text}</p>
      )}

      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-bold text-accent-primary mb-1 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Plain Language Summary:
          </p>
          <p className="text-sm text-text-muted">{clause.explanation}</p>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-border-default flex justify-between items-center text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> Confidence: {(clause.confidence * 100).toFixed(0)}%
        </span>
        <button 
          onClick={() => onDelete(clause.id)}
          className="text-text-muted hover:text-state-error transition-colors flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
  );
};

export default ClauseItem;

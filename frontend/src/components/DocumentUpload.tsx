import { useState } from 'react';
import api from '../api/api';
import { Upload, X, FileText, CheckCircle, AlertCircle, Cpu } from 'lucide-react';
import axios from 'axios';

interface DocumentUploadProps {
  onUploadSuccess: () => void;
  onClose: () => void;
}

const DocumentUpload = ({ onUploadSuccess, onClose }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0 = idle, 1 = upload, 2 = nlp, 3 = audit, 4 = complete
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setCurrentStep(1);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    // Timers to simulate pipeline steps during upload
    const t1 = setTimeout(() => {
      setCurrentStep(2);
    }, 700);

    const t2 = setTimeout(() => {
      setCurrentStep(3);
    }, 1500);

    try {
      await api.post('/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearTimeout(t1);
      clearTimeout(t2);
      setCurrentStep(4);
      setSuccess(true);
      
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setCurrentStep(0);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.file?.[0] || err.response?.data?.title?.[0] || 'Failed to upload document.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-surface w-full max-w-md rounded-xl shadow-xl border border-border-default overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-border-default">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Upload className="h-5 w-5 text-accent-primary" /> Upload Document
          </h2>
          {!loading && (
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-6 py-4">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Cpu className="h-5 w-5 text-accent-primary animate-spin" /> Intelligent Processing Pipeline
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep > 1 ? 'bg-state-success text-white' : 
                    currentStep === 1 ? 'bg-accent-primary text-white animate-pulse' : 
                    'bg-bg-base border border-border-default text-text-muted'
                  }`}>
                    {currentStep > 1 ? '✓' : '1'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${currentStep >= 1 ? 'text-text-primary' : 'text-text-muted'}`}>Ingesting Legal Document</p>
                    <p className="text-[10px] text-text-muted">Uploading raw text file to secure cloud directory.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep > 2 ? 'bg-state-success text-white' : 
                    currentStep === 2 ? 'bg-accent-primary text-white animate-pulse' : 
                    'bg-bg-base border border-border-default text-text-muted'
                  }`}>
                    {currentStep > 2 ? '✓' : '2'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${currentStep >= 2 ? 'text-text-primary' : 'text-text-muted'}`}>NLP Clause Extraction</p>
                    <p className="text-[10px] text-text-muted">Identifying PAYMENT, TERMINATION, and GENERAL clauses.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep > 3 ? 'bg-state-success text-white' : 
                    currentStep === 3 ? 'bg-accent-primary text-white animate-pulse' : 
                    'bg-bg-base border border-border-default text-text-muted'
                  }`}>
                    {currentStep > 3 ? '✓' : '3'}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${currentStep >= 3 ? 'text-text-primary' : 'text-text-muted'}`}>Fairness & Bias Check</p>
                    <p className="text-[10px] text-text-muted">Auditing gendered pronouns and power dynamics.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-state-success mx-auto mb-4" />
              <p className="text-lg font-bold text-text-primary">Upload Successful!</p>
              <p className="text-text-muted">The document has been added to your library.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-state-error text-state-error px-4 py-3 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Document Title</label>
                <input
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="e.g. Service Agreement - 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="border-2 border-dashed border-border-default rounded-lg p-8 text-center hover:border-accent-primary transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.txt,.doc,.docx"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  {file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-accent-primary mb-2" />
                      <p className="text-sm font-medium text-text-primary truncate max-w-full">{file.name}</p>
                      <p className="text-xs text-text-muted mt-1">Click to change file</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-border-default mb-2" />
                      <p className="text-sm font-medium text-text-primary">Click to select a file</p>
                      <p className="text-xs text-text-muted mt-1">PDF, TXT, DOC up to 10MB</p>
                    </div>
                  )}
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-accent-primary text-white py-3 rounded-md font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Start Analysis
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;

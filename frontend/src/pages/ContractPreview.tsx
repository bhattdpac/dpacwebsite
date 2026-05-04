import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Cpu, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import DeploymentTimeline from '../components/DeploymentTimeline';

interface Proposal {
  id: number;
  generated_code: string;
  client_explanation: string;
  client_approved: boolean;
  contract_address: string;
  transaction_hash: string;
  parameters: any;
  document_status: string;
  pending_clause_count: number;
  template_details: {
    name: string;
    description: string;
  };
}

const ContractPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const response = await api.get(`/documents/${id}/proposal/`);
        setProposal(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load contract proposal.');
      } finally {
        setLoading(false);
      }
    };

    fetchProposal();
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await api.patch(`/proposals/${proposal?.id}/`, { client_approved: true });
      setProposal(prev => prev ? { ...prev, client_approved: true } : null);
    } catch (err) {
      alert('Failed to approve contract.');
    } finally {
      setApproving(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const response = await api.post(`/documents/${id}/deploy/`);
      setProposal(prev => prev ? { 
        ...prev, 
        contract_address: response.data.address,
        transaction_hash: response.data.txHash 
      } : null);
      alert('Contract deployed successfully to blockchain!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Deployment failed. Ensure local Hardhat node is running.');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <Loader2 className="h-10 w-10 text-accent-primary animate-spin" />
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="bg-bg-surface p-8 rounded-xl border border-border-default shadow-sm max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-state-error mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Proposal Not Ready</h2>
          <p className="text-text-muted mb-6">{error || 'The lawyer has not yet generated a smart contract for this document.'}</p>
          <button onClick={() => navigate('/dashboard')} className="bg-accent-primary text-white px-6 py-2 rounded-md font-bold hover:bg-blue-700">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="bg-bg-surface border-b border-border-default px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 text-text-muted hover:bg-gray-100 rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Contract Verification</h1>
              <p className="text-xs text-text-muted">Template: {proposal.template_details.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {proposal.contract_address ? (
              <div className="flex items-center gap-2 text-state-success font-bold bg-green-50 px-4 py-2 rounded-md border border-green-100">
                <CheckCircle className="h-5 w-5" /> Deployed: {proposal.contract_address.substring(0, 10)}...
              </div>
            ) : (
              <>
                {proposal.client_approved ? (
                  <>
                    <div className="flex items-center gap-2 text-state-success font-bold px-4 py-2">
                      <CheckCircle className="h-5 w-5" /> Client Approved
                    </div>
                    {user?.role === 'LAWYER' && (
                      <button 
                        onClick={handleDeploy}
                        disabled={deploying}
                        className="bg-state-success text-white px-8 py-2 rounded-md font-bold hover:bg-green-700 transition-all shadow-md flex items-center gap-2"
                      >
                        {deploying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                        Deploy to Blockchain
                      </button>
                    )}
                  </>
                ) : (
                  user?.role === 'CLIENT' && (
                    <button 
                      onClick={handleApprove}
                      disabled={approving}
                      className="bg-accent-primary text-white px-8 py-2 rounded-md font-bold hover:bg-blue-700 transition-all shadow-md flex items-center gap-2"
                    >
                      {approving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                      Confirm & Approve Contract
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid lg:grid-cols-2 gap-8 flex-1">
        {/* Left: Solidity Code */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 text-text-muted uppercase text-xs font-bold tracking-widest">
            <Cpu className="h-4 w-4" /> Technical Implementation (Solidity)
          </div>
          <div className="flex-1 bg-slate-900 rounded-xl p-6 overflow-auto shadow-inner border border-slate-800 text-sm font-mono text-slate-300">
            <pre className="leading-relaxed">
              {proposal.generated_code}
            </pre>
          </div>
        </div>

        {/* Right: Plain Language Explanation */}
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 text-text-muted uppercase text-xs font-bold tracking-widest">
            <Info className="h-4 w-4" /> Plain Language Summary
          </div>
          <div className="flex-1 bg-bg-surface rounded-xl p-8 border border-border-default shadow-sm">
            <div className="flex items-start gap-4 mb-8">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Shield className="h-8 w-8 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">Legal Intent Verification</h3>
                <p className="text-text-muted text-sm">We've translated the blockchain code into human terms.</p>
              </div>
            </div>

            <div className="prose prose-blue max-w-none">
              <p className="text-lg text-text-primary leading-relaxed bg-blue-50/30 p-6 rounded-lg border border-blue-100 italic">
                "{proposal.client_explanation}"
              </p>
              
              <div className="mt-8 space-y-6">
                <h4 className="font-bold text-text-primary border-b border-border-default pb-2">Extracted Parameters:</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(proposal.parameters).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-md border border-gray-100">
                      <p className="text-[10px] text-text-muted uppercase font-bold">{key}</p>
                      <p className="text-sm font-mono text-text-primary truncate" title={String(value)}>
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <DeploymentTimeline 
                status={proposal.document_status}
                isLawyerApproved={proposal.pending_clause_count === 0}
                isClientApproved={proposal.client_approved}
                contractAddress={proposal.contract_address}
              />
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3 mt-6">
                <AlertCircle className="h-5 w-5 text-state-warning flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>Notice:</strong> This summary is generated to help you understand the smart contract logic. 
                  By approving, you confirm that this digital implementation aligns with your legal agreement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContractPreview;
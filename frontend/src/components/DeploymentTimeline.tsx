import { FileText, Search, UserCheck, ShieldCheck, Globe } from 'lucide-react';

interface TimelineStepProps {
  label: string;
  description: string;
  isComplete: boolean;
  isLast?: boolean;
  icon: React.ReactNode;
}

const TimelineStep = ({ label, description, isComplete, isLast, icon }: TimelineStepProps) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className={`p-2 rounded-full border-2 ${isComplete ? 'bg-state-success border-state-success text-white' : 'bg-white border-border-default text-text-muted'}`}>
        {icon}
      </div>
      {!isLast && <div className={`w-0.5 h-12 ${isComplete ? 'bg-state-success' : 'bg-border-default'}`} />}
    </div>
    <div className="pb-8">
      <h4 className={`font-bold text-sm ${isComplete ? 'text-text-primary' : 'text-text-muted'}`}>{label}</h4>
      <p className="text-xs text-text-muted">{description}</p>
    </div>
  </div>
);

interface DeploymentTimelineProps {
  status: string;
  isLawyerApproved: boolean;
  isClientApproved: boolean;
  contractAddress: string | null;
}

const DeploymentTimeline = ({ status, isLawyerApproved, isClientApproved, contractAddress }: DeploymentTimelineProps) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-border-default shadow-sm mt-8">
      <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
        <Search className="h-4 w-4 text-accent-primary" /> Audit Trail & Lifecycle
      </h3>
      
      <div className="flex flex-col">
        <TimelineStep 
          label="Document Uploaded" 
          description="Source text saved and encrypted." 
          isComplete={status !== 'PENDING' && status !== 'FAILED'} 
          icon={<FileText className="h-4 w-4" />}
        />
        <TimelineStep 
          label="NLP Analysis" 
          description="Clauses extracted and types identified." 
          isComplete={status === 'COMPLETED'} 
          icon={<Search className="h-4 w-4" />}
        />
        <TimelineStep 
          label="Legal Review" 
          description="Lawyer verified AI interpretations." 
          isComplete={isLawyerApproved} 
          icon={<UserCheck className="h-4 w-4" />}
        />
        <TimelineStep 
          label="Client Approval" 
          description="Client verified plain-language summary." 
          isComplete={isClientApproved} 
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <TimelineStep 
          label="Blockchain Deployment" 
          description={contractAddress ? `Immutable record at ${contractAddress.substring(0, 10)}...` : "Pending on-chain execution."} 
          isComplete={!!contractAddress} 
          isLast={true}
          icon={<Globe className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};

export default DeploymentTimeline;

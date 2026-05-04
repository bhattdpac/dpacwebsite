import { Shield, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LegalFrameworkLanding = () => (
  <div className="min-h-screen bg-bg-base font-sans">
    {/* Navigation */}
    <nav className="bg-bg-surface border-b border-border-default px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Shield className="text-accent-primary h-6 w-6" />
          <span className="text-xl font-bold text-text-primary">LegalDocSystem</span>
        </div>
        <div className="hidden md:flex gap-6 text-text-muted">
          <Link to="/login" className="hover:text-accent-primary transition-colors">Dashboard</Link>
          <a href="#" className="hover:text-accent-primary transition-colors">Documents</a>
          <a href="#" className="hover:text-accent-primary transition-colors">Audit Trail</a>
          <Link to="/" className="hover:text-accent-primary transition-colors font-medium border-l pl-6 border-border-default">Portfolio Home</Link>
        </div>
        <Link to="/login" className="bg-accent-primary text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
          Lawyer Login
        </Link>
      </div>
    </nav>

    {/* Hero Section */}
    <main className="max-w-7xl mx-auto px-6 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-text-primary mb-6">
          Blockchain Smart Contract <br />
          <span className="text-accent-primary">Legal Documentation Framework</span>
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto">
          Transforming natural language legal texts into secure, transparent, and executable smart contracts with human oversight.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-bg-surface p-8 rounded-lg border border-border-default shadow-sm">
          <div className="bg-blue-50 w-12 h-12 rounded-md flex items-center justify-center mb-6">
            <FileText className="text-accent-primary h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Intelligent NLP</h3>
          <p className="text-text-muted">
            Advanced clause extraction and interpretation with explainable AI traces for professional review.
          </p>
        </div>

        <div className="bg-bg-surface p-8 rounded-lg border border-border-default shadow-sm">
          <div className="bg-green-50 w-12 h-12 rounded-md flex items-center justify-center mb-6">
            <Shield className="text-state-success h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Blockchain Integrity</h3>
          <p className="text-text-muted">
            Immutable audit trails and secure deployment using verified smart contract templates.
          </p>
        </div>

        <div className="bg-bg-surface p-8 rounded-lg border border-border-default shadow-sm">
          <div className="bg-amber-50 w-12 h-12 rounded-md flex items-center justify-center mb-6">
            <CheckCircle className="text-state-warning h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">Human-in-the-Loop</h3>
          <p className="text-text-muted">
            A collaborative interface ensuring legal professionals validate every step before on-chain deployment.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-bg-surface rounded-xl border border-border-default p-12 text-center shadow-md">
        <h2 className="text-3xl font-bold mb-4">Ready to start?</h2>
        <p className="text-text-muted mb-8 max-w-lg mx-auto">
          Experience the future of legal documentation. Upload your first contract and let our AI assist your workflow.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup" className="flex items-center justify-center gap-2 bg-accent-primary text-white px-8 py-3 rounded-md font-bold hover:bg-blue-700 transition-all">
            Initialize New Project <ArrowRight className="h-5 w-5" />
          </Link>
          <button className="border border-border-default px-8 py-3 rounded-md font-bold hover:bg-gray-50 transition-all">
            View Demo
          </button>
        </div>
      </div>
    </main>

    {/* Footer */}
    <footer className="border-t border-border-default py-8 mt-16 text-center text-text-muted">
      <p>&copy; 2026 dpacwebsite. Human-centered Legal Technology.</p>
    </footer>
  </div>
);

export default LegalFrameworkLanding;

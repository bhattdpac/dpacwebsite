import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import DocumentReview from './pages/DocumentReview';
import ContractPreview from './pages/ContractPreview';
import PortfolioHome from './pages/PortfolioHome';
import LegalFrameworkLanding from './pages/LegalFrameworkLanding';
import Academy from './pages/Academy';
import ResearchHub from './pages/ResearchHub';
import SynopsisView from './pages/SynopsisView';
import Publications from './pages/Publications';
import Experiments from './pages/Experiments';
import ResearchJournal from './pages/ResearchJournal';
import Teaching from './pages/Teaching';
import Downloads from './pages/Downloads';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PortfolioHome />} />
          <Route path="/legal-framework" element={<LegalFrameworkLanding />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/research" element={<ResearchHub />} />
          <Route path="/research/synopsis" element={<SynopsisView />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/journal" element={<ResearchJournal />} />
          <Route path="/teaching" element={<Teaching />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/review/:id" 
            element={
              <ProtectedRoute>
                <DocumentReview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/contract/:id" 
            element={
              <ProtectedRoute>
                <ContractPreview />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

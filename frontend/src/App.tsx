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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PortfolioHome />} />
          <Route path="/legal-framework" element={<LegalFrameworkLanding />} />
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

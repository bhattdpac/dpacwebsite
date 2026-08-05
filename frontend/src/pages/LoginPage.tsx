import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { Shield, Lock, User, X, Mail } from 'lucide-react';
import axios from 'axios';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login/', { username, password });
      await login(response.data.access, response.data.refresh);
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverySent(true);
    setTimeout(() => {
      // Simulate email dispatch
      setRecoverySent(false);
      setShowForgotModal(false);
      setRecoveryEmail('');
      alert(`Recovery instructions sent to ${recoveryEmail} (Simulated).`);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 relative overflow-hidden font-sans selection:bg-accent-primary selection:text-white">
      {/* Background blur */}
      <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-accent-secondary/5 rounded-full blur-[120px] -z-10"></div>
      
      <div className="max-w-md w-full bg-bg-surface rounded-3xl border border-white/5 shadow-2xl p-8 relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-xl mb-4">
            <Shield className="text-accent-secondary h-6 w-6" />
          </div>
          <h2 className="text-3xl font-display font-bold text-text-primary uppercase tracking-tight">Welcome Back</h2>
          <p className="text-text-muted text-sm mt-2">Sign in to your legal documentation dashboard</p>
        </div>

        {error && (
          <div className="bg-state-error/10 border border-state-error text-state-error px-4 py-3 rounded-xl mb-6 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-text-muted" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-accent-secondary transition-colors"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest">Password</label>
              <button 
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-accent-secondary hover:text-white transition-colors uppercase font-bold tracking-wider"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-text-muted" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-accent-secondary transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sunset-gradient text-white py-3 px-4 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 text-xs uppercase tracking-widest"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs">
          <span className="text-text-muted font-semibold">Don't have an account?</span>{' '}
          <Link to="/signup" className="text-accent-secondary font-bold hover:underline ml-1">
            Create an account
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-bg-surface border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-accent-secondary">
                <Mail className="h-5 w-5" />
              </div>
              <button 
                onClick={() => {setShowForgotModal(false); setRecoverySent(false);}}
                className="text-text-muted hover:text-white p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-display font-bold uppercase tracking-tight">Recover Password</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <input
                type="email"
                required
                className="block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-accent-secondary transition-colors"
                placeholder="Enter email address"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
              />
              <button
                type="submit"
                disabled={recoverySent}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                {recoverySent ? "Sending request..." : "Send Recovery Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

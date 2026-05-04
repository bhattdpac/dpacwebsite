import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { Shield, Lock, User } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-bg-surface rounded-xl border border-border-default shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-md mb-4">
            <Shield className="text-accent-primary h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
          <p className="text-text-muted mt-2">Sign in to your legal documentation dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-state-error text-state-error px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-10 pr-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-text-muted">Don't have an account?</span>{' '}
          <Link to="/signup" className="text-accent-primary font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

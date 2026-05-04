import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { Shield, User, Mail, Lock, Briefcase, Users } from 'lucide-react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'LAWYER',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/register/', formData);
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
    } catch (err: any) {
      const errors = err.response?.data;
      if (errors) {
        setError(Object.values(errors).flat().join(' '));
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-bg-surface rounded-xl border border-border-default shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-md mb-4">
            <Shield className="text-accent-primary h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Create Account</h2>
          <p className="text-text-muted mt-2">Join the legal documentation framework</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-state-error text-state-error px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">First Name</label>
              <input
                type="text"
                className="block w-full px-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Last Name</label>
              <input
                type="text"
                className="block w-full px-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-10 pr-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-text-muted" />
              </div>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-2 border border-border-default rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'LAWYER' })}
                className={`flex items-center justify-center gap-2 py-2 px-4 border rounded-md transition-all ${
                  formData.role === 'LAWYER'
                    ? 'bg-blue-50 border-accent-primary text-accent-primary font-bold'
                    : 'bg-white border-border-default text-text-muted'
                }`}
              >
                <Briefcase className="h-4 w-4" /> Lawyer
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'CLIENT' })}
                className={`flex items-center justify-center gap-2 py-2 px-4 border rounded-md transition-all ${
                  formData.role === 'CLIENT'
                    ? 'bg-green-50 border-state-success text-state-success font-bold'
                    : 'bg-white border-border-default text-text-muted'
                }`}
              >
                <Users className="h-4 w-4" /> Client
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-primary text-white py-2 px-4 rounded-md font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-text-muted">Already have an account?</span>{' '}
          <Link to="/login" className="text-accent-primary font-bold hover:underline">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;

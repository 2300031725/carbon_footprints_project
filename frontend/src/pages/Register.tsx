import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, User, Mail, Lock, Shield, AlertTriangle } from 'lucide-react';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await register({ name, email, password, role });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed. Try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-6 py-12 transition-colors duration-300">
      <div className="w-full max-w-md">
        
        {/* Header Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-eco-600 text-3xl mb-2">
            <Leaf className="w-8 h-8 fill-eco-500 text-eco-500" />
            <span>EcoTrack</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Begin tracking your sustainability actions today.</p>
        </div>

        {/* Panel Box */}
        <div className="glass-panel p-8 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none border border-white/60 dark:border-slate-800">
          
          {error && (
            <div className="mb-5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold p-4 rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-950/30">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                />
              </div>
            </div>

            {/* Developer Testing Role Option */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">System Role (Dev Testing)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Shield className="w-4 h-4" />
                </span>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors appearance-none"
                >
                  <option value="user">Eco User (Standard)</option>
                  <option value="admin">Platform Admin</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="eco-gradient text-white font-bold py-3.5 rounded-xl shadow-lg shadow-eco-600/10 hover:shadow-xl hover:shadow-eco-600/20 active:scale-98 transition-all flex items-center justify-center mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-xs text-slate-450 text-center font-medium mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-eco-600 font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-6 py-12 transition-colors duration-300">
      <div className="w-full max-w-md">
        
        {/* Logo and Greeting */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-eco-600 text-3xl mb-3">
            <Leaf className="w-8 h-8 fill-eco-500 text-eco-500" />
            <span>EcoTrack</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter your credentials to manage your carbon progress.</p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel p-8 rounded-3xl shadow-xl shadow-slate-100/50 dark:shadow-none border border-white/60 dark:border-slate-800">
          
          {error && (
            <div className="mb-5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold p-4 rounded-xl flex items-center gap-2 border border-rose-100 dark:border-rose-950/30">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold outline-none focus:border-eco-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="eco-gradient text-white font-bold py-3.5 rounded-xl shadow-lg shadow-eco-600/10 hover:shadow-xl hover:shadow-eco-600/20 active:scale-98 transition-all flex items-center justify-center mt-2 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-slate-450 text-center font-medium mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-eco-600 font-bold hover:underline">
              Sign Up
            </Link>
          </p>
          
          <div className="border-t border-slate-200/50 dark:border-slate-850 pt-4 mt-6 text-left">
            <p className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-2">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-2xs font-semibold text-slate-500">
              <div>
                <p className="text-slate-400">User Mode:</p>
                <p>jane@gmail.com / jane123</p>
              </div>
              <div>
                <p className="text-slate-400">Admin Mode:</p>
                <p>admin@ecotrack.com / admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Car, ShieldCheck, UserCheck, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageTransition from '../shared/PageTransition';

const Login: React.FC = () => {
  const authCtx = useContext(AuthContext);
  if (!authCtx) throw new Error('Login must be inside AuthProvider');
  const { unifiedLogin } = authCtx;
  const navigate = useNavigate();

  // Tab state for login: 'admin', 'security' or 'member'
  const [loginRole, setLoginRole] = useState<'admin' | 'security' | 'member'>('admin');

  // Input states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    const res = await unifiedLogin(email, password);
    setLoading(false);

    if (res.success) {
      toast.success(`Logged in successfully as ${res.role}!`);
      if (res.role === 'admin') {
        navigate('/');
      } else if (res.role === 'security') {
        navigate('/security');
      } else {
        navigate('/member');
      }
    } else {
      setError(res.message ?? 'Login failed. Please check your credentials.');
      toast.error(res.message ?? 'Login failed');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex transition-colors duration-300 bg-slate-50 dark:bg-darkBg font-sans overflow-x-hidden w-full">
        
        {/* Left Panel: App Tagline, Branding and Decorative Visuals */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-teal-950 via-slate-950 to-cyan-950 text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* Soft floating background lights / ambient glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>

          {/* Brand Header */}
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/30 ring-1 ring-white/20">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-teal-300 via-cyan-200 to-white bg-clip-text text-transparent leading-none">
                SPMS Console
              </span>
              <span className="text-[10px] tracking-[0.25em] font-extrabold text-slate-400 uppercase mt-1">
                Intelligent Surveillance
              </span>
            </div>
          </div>

          {/* Graphic & Slogan */}
          <div className="space-y-8 max-w-md relative z-10 my-auto">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-400">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                Secure Portal
              </div>
              <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Smart Security & Parking Redefined
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Real-time occupancy tracking, AI-powered ANPR lookup, resident databases, and central audit security controls unified under a secure surveillance center.
              </p>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
                <span>Real-time surveillance & automated gate logs</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
                <span>Instant alerts and visitor notification dispatch</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
                <span>Secure database access & member dashboard console</span>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="text-xs text-slate-500 relative z-10 flex justify-between border-t border-white/5 pt-4">
            <span>Console v2.4.1</span>
            <span>© 2026 Society Parking Management</span>
          </div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md space-y-8 relative z-10">
            
            {/* Header */}
            <div className="space-y-2.5">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Portal Log In
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Sign in to access your security guard console or member lookup services.
              </p>
            </div>

            {/* Validation Alert Box */}
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-450 text-xs font-semibold text-center animate-shake">
                {error}
              </div>
            )}

            {/* Role Tabs for Login */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/50 dark:border-white/5">
              <button
                type="button"
                onClick={() => setLoginRole('admin')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  loginRole === 'admin'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Admin Console
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('member')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  loginRole === 'member'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Member Dashboard
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('security')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  loginRole === 'security'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" /> Security Guard
              </button>
            </div>

            {/* Unified Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Login Fields */}
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer block w-full pt-5 pb-1.5 px-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent font-medium"
                  placeholder={loginRole === 'admin' ? 'Admin Email' : loginRole === 'security' ? 'Guard Email' : 'Phone Number or Email'}
                  id="login-id-input"
                />
                <label
                  htmlFor="login-id-input"
                  className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-550 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                >
                  {loginRole === 'admin' ? 'Admin Email Address' : loginRole === 'security' ? 'Guard Email Address' : 'Phone Number or Email Address'}
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer block w-full pt-5 pb-1.5 pl-4 pr-12 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent font-medium"
                  placeholder="Password"
                  id="login-pwd-input"
                />
                <label
                  htmlFor="login-pwd-input"
                  className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-550 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-550"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-scale w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </PageTransition>
  );
};

export default Login;

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Car, User, Phone, Home, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const authCtx = useContext(AuthContext);
  if (!authCtx) throw new Error('Login must be inside AuthProvider');
  const { unifiedLogin, memberRegister } = authCtx;
  const navigate = useNavigate();

  // Mode state: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Input states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [buildingNumber, setBuildingNumber] = useState<number>(28);
  const [flatNumber, setFlatNumber] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      setLoading(true);
      const res = await unifiedLogin(email, password);
      setLoading(false);

      if (res.success) {
        if (res.role === 'admin') {
          navigate('/');
        } else {
          navigate('/member');
        }
      } else {
        setError(res.message ?? 'Login failed');
      }
    } else {
      if (!name || !email || !password || !phone || !flatNumber) {
        setError('All fields are required for registration');
        return;
      }
      setLoading(true);
      const res = await memberRegister({
        name,
        email,
        password,
        phone,
        buildingNumber,
        flatNumber,
      });
      setLoading(false);

      if (res.success) {
        navigate('/member');
      } else {
        setError(res.message ?? 'Registration failed');
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950">
      {/* Background blobs for premium depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brandPurple-500/10 rounded-full blur-3xl animate-pulse-slow z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brandTeal-500/10 rounded-full blur-3xl animate-pulse-slow z-0"></div>

      <div className={`w-full ${mode === 'register' ? 'max-w-2xl' : 'max-w-md'} glass-card rounded-3xl p-6 shadow-2xl relative z-10 transition-all duration-300 border border-white/5 dark:border-white/5`}>

        {/* Header Title */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 bg-brandPurple-500/15 border border-brandPurple-500/25 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
            <Car className="w-6 h-6 text-brandPurple-500 dark:text-brandPurple-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'login' ? 'Society Parking Portal' : 'Resident Registration'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {mode === 'login' ? 'Sign in to access your security/member console' : 'Create your resident access account'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-450 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Unified Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {mode === 'register' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=""
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Phone Number (Username)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Phone className="w-5 h-5" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder=""
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Building */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Building
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Home className="w-5 h-5" />
                  </span>
                  <select
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  >
                    {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map((num) => (
                      <option key={num} value={num} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                        Bldg {num}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Flat */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Flat No.
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Home className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder=""
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder=""
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-350"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Email/Phone (Login Mode) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Number or Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Password (Login Mode) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-11 pr-11 py-2.5 bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brandPurple-500 transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-355"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brandPurple-600 hover:bg-brandPurple-700 disabled:bg-brandPurple-600/50 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-brandPurple-500/20 hover:shadow-brandPurple-600/35 flex justify-center items-center gap-2 text-sm mt-4 relative z-10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : mode === 'login' ? (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Mode Toggle Footer */}
        <div className="mt-4 text-center relative z-10">
          <button
            onClick={toggleMode}
            className="text-xs text-brandPurple-600 dark:text-brandPurple-400 hover:underline font-semibold"
          >
            {mode === 'login'
              ? "Are you a resident? Click here to Register"
              : "Already have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;

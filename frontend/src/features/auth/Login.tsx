import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, Car, User, Phone, Home, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
  const authCtx = useContext(AuthContext);
  if (!authCtx) throw new Error('Login must be inside AuthProvider');
  const { unifiedLogin, memberRegister } = authCtx;
  const navigate = useNavigate();

  // Mode state: 'login' or 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');
  // Tab state for login: 'admin' or 'member'
  const [loginRole, setLoginRole] = useState<'admin' | 'member'>('admin');

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
        toast.success(`Logged in successfully as ${res.role}!`);
        if (res.role === 'admin') {
          navigate('/');
        } else {
          navigate('/member');
        }
      } else {
        setError(res.message ?? 'Login failed. Please check your credentials.');
        toast.error(res.message ?? 'Login failed');
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
        toast.success('Registration successful! Welcome to SPMS.');
        navigate('/member');
      } else {
        setError(res.message ?? 'Registration failed. Occupant profile may already exist.');
        toast.error(res.message ?? 'Registration failed');
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-slate-50 dark:bg-darkBg font-sans overflow-x-hidden w-full">
      
      {/* Left Panel: App Tagline, Branding and Decorative Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Soft floating background lights */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent leading-none">
              SPMS Console
            </span>
            <span className="text-[9px] tracking-[0.2em] font-bold text-slate-500 uppercase mt-0.5">
              Intelligent Surveillance
            </span>
          </div>
        </div>

        {/* Graphic & Slogan */}
        <div className="space-y-6 max-w-md relative z-10">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Premium Security & Parking Redefined
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Real-time occupancy tracking, ANPR lookup, resident databases, and instant violation reports unified under a secure surveillance center.
          </p>

          {/* Stylized Parking Lot Mock Graphic */}
          <div className="border border-white/5 bg-slate-900/60 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Surveillance Zone #28</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="grid grid-cols-4 gap-3.5">
              {[
                { label: 'P-1', occupied: true, bg: 'bg-rose-500/20 border-rose-500/40 text-rose-400' },
                { label: 'P-2', occupied: true, bg: 'bg-rose-500/20 border-rose-500/40 text-rose-400' },
                { label: 'P-3', occupied: false, bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
                { label: 'P-4', occupied: false, bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' }
              ].map((spot, idx) => (
                <div key={idx} className={`h-16 rounded-xl border flex flex-col justify-center items-center text-xs font-bold font-mono transition-all ${spot.bg}`}>
                  <span>{spot.label}</span>
                  <span className="text-[8px] font-medium mt-1 uppercase tracking-widest">{spot.occupied ? 'Occupied' : 'Free'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-10 flex justify-between">
          <span>SPMS v2.4</span>
          <span>© 2026 Society Management System</span>
        </div>
      </div>

      {/* Right Panel: Login / Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Header */}
          <div className="space-y-2.5">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Portal Log In' : 'Create Occupant Account'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {mode === 'login' 
                ? 'Sign in to access your security guard console or member lookup services.' 
                : 'Register your vehicle and flat details with the central security database.'}
            </p>
          </div>

          {/* Validation Alert Box */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-semibold text-center animate-shake">
              {error}
            </div>
          )}

          {/* Role Tabs for Login Mode */}
          {mode === 'login' && (
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
            </div>
          )}

          {/* Unified Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Registration Fields */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="peer block w-full pt-5 pb-1.5 px-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent"
                    placeholder="Full Name"
                    id="name-input"
                  />
                  <label
                    htmlFor="name-input"
                    className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                  >
                    Full Name
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="peer block w-full pt-5 pb-1.5 px-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent"
                    placeholder="Phone Number"
                    id="phone-input"
                  />
                  <label
                    htmlFor="phone-input"
                    className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                  >
                    Phone Number
                  </label>
                </div>

                <div className="relative">
                  <select
                    value={buildingNumber}
                    onChange={(e) => setBuildingNumber(Number(e.target.value))}
                    className="peer block w-full pt-5 pb-1.5 px-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    id="building-input"
                  >
                    {[28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map((num) => (
                      <option key={num} value={num} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                        Building {num}
                      </option>
                    ))}
                  </select>
                  <label
                    htmlFor="building-input"
                    className="absolute left-4 top-1.5 text-blue-500 text-[10px] pointer-events-none"
                  >
                    Building Number
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="peer block w-full pt-5 pb-1.5 px-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent"
                    placeholder="Flat No."
                    id="flat-input"
                  />
                  <label
                    htmlFor="flat-input"
                    className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                  >
                    Flat No.
                  </label>
                </div>

                <div className="relative sm:col-span-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer block w-full pt-5 pb-1.5 px-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent"
                    placeholder="Email Address"
                    id="email-reg-input"
                  />
                  <label
                    htmlFor="email-reg-input"
                    className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                  >
                    Email Address (Optional)
                  </label>
                </div>

                <div className="relative sm:col-span-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer block w-full pt-5 pb-1.5 pl-4 pr-12 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent"
                    placeholder="Password"
                    id="password-reg-input"
                  />
                  <label
                    htmlFor="password-reg-input"
                    className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-655"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Login Fields */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer block w-full pt-5 pb-1.5 px-4 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent"
                    placeholder={loginRole === 'admin' ? 'Admin Email' : 'Phone Number or Email'}
                    id="login-id-input"
                  />
                  <label
                    htmlFor="login-id-input"
                    className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                  >
                    {loginRole === 'admin' ? 'Admin Email Address' : 'Phone Number or Email Address'}
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer block w-full pt-5 pb-1.5 pl-4 pr-12 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-transparent"
                    placeholder="Password"
                    id="login-pwd-input"
                  />
                  <label
                    htmlFor="login-pwd-input"
                    className="absolute left-4 top-3.5 text-slate-400 dark:text-slate-500 text-xs transition-all pointer-events-none peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-655"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-scale w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all duration-200 flex justify-center items-center gap-2 text-sm shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch Login / Registration link */}
          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500">
                Are you a resident occupant without an account?{' '}
                <button
                  onClick={toggleMode}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Register Here
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Already registered with the society portal?{' '}
                <button
                  onClick={toggleMode}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;

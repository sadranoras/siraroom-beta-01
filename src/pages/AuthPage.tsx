import { useState } from 'react';
import { Video, Mail, Lock, User, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
  onBack: () => void;
}

export default function AuthPage({ initialMode = 'login', onSuccess, onBack }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [form, setForm] = useState({ email: '', password: '', displayName: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!form.displayName.trim()) { setError('نام نمایشی الزامی است'); return; }
      if (form.password.length < 6) { setError('رمز عبور باید حداقل ۶ کاراکتر باشد'); return; }
      if (form.password !== form.confirmPassword) { setError('رمز عبور و تکرار آن یکسان نیستند'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(form.email, form.password);
        if (err) { setError('ایمیل یا رمز عبور اشتباه است'); return; }
      } else {
        const { error: err } = await signUp(form.email, form.password, form.displayName);
        if (err) {
          if (err.message.includes('already registered')) setError('این ایمیل قبلاً ثبت‌نام کرده است');
          else setError('خطا در ثبت‌نام: ' + err.message);
          return;
        }
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">SiraRoom</span>
          </button>
          <p className="text-slate-400 mt-3 text-sm">
            {mode === 'login' ? 'خوش آمدید! وارد حساب خود شوید' : 'ایجاد حساب کاربری جدید'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-slate-800/50 rounded-2xl p-1 mb-8">
            {[
              { key: 'login', label: 'ورود' },
              { key: 'register', label: 'ثبت‌نام' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setMode(tab.key as 'login' | 'register'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === tab.key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">نام نمایشی</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="displayName"
                    value={form.displayName}
                    onChange={handleChange}
                    placeholder="نام و نام خانوادگی"
                    required
                    className="w-full pr-10 pl-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">ایمیل</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                  className="w-full pr-10 pl-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="حداقل ۶ کاراکتر"
                  required
                  className="w-full pr-10 pl-10 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">تکرار رمز عبور</label>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="رمز عبور را تکرار کنید"
                    required
                    className="w-full pr-10 pl-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'ورود' : 'ایجاد حساب'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <button onClick={onBack} className="mt-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mx-auto w-fit">
          <ArrowLeft className="w-4 h-4" />
          <span>بازگشت به صفحه اصلی</span>
        </button>
      </div>
    </div>
  );
}

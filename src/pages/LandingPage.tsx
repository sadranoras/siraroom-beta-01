import { useState } from 'react';
import { Video, Users, Shield, Zap, Globe, Monitor, CircleCheck as CheckCircle, ArrowLeft, Play } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onJoinRoom: (code: string) => void;
  onLogin: () => void;
}

const features = [
  { icon: Video, title: 'تصویر و صدای با کیفیت', desc: 'جلسات آنلاین با کیفیت HD و اتصال پایدار' },
  { icon: Users, title: 'سیستم نقش پیشرفته', desc: 'میزبان، همکار میزبان، ارائه‌دهنده و شرکت‌کننده' },
  { icon: Shield, title: 'کنترل دسترسی کامل', desc: 'میزبان مجوز میکروفن، دوربین و اشتراک صفحه را کنترل می‌کند' },
  { icon: Zap, title: 'ورود سریع', desc: 'بدون نصب نرم‌افزار، مستقیماً از مرورگر وارد شوید' },
  { icon: Globe, title: 'نظرسنجی زنده', desc: 'برگزاری نظرسنجی‌های آنی در حین کلاس' },
  { icon: Monitor, title: 'ارائه فایل', desc: 'آپلود و نمایش تصویر، PDF و ویدیو برای همه' },
];

const plans = [
  {
    name: 'رایگان', price: '۰', period: 'ماهانه',
    features: ['تا ۵۰ شرکت‌کننده', 'جلسات ۴۰ دقیقه‌ای', 'اشتراک‌گذاری صفحه', 'چت گروهی'],
    cta: 'شروع رایگان', highlight: false,
  },
  {
    name: 'حرفه‌ای', price: '۱۵۰,۰۰۰', period: 'ماهانه',
    features: ['تا ۳۰۰ شرکت‌کننده', 'جلسات نامحدود', 'ضبط کلاس', 'نظرسنجی و ارائه فایل', 'کنترل نقش پیشرفته'],
    cta: 'شروع ۱۴ روز رایگان', highlight: true,
  },
  {
    name: 'سازمانی', price: 'تماس', period: '',
    features: ['تا ۱۰۰۰ شرکت‌کننده', 'لیست دسترسی اختصاصی', 'پشتیبانی ۲۴/۷', 'SLA ضمانت‌شده'],
    cta: 'مشاوره رایگان', highlight: false,
  },
];

export default function LandingPage({ onGetStarted, onJoinRoom, onLogin }: LandingPageProps) {
  const [joinCode, setJoinCode] = useState('');

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-slate-800">SiraRoom</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">ویژگی‌ها</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">قیمت‌گذاری</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors">
              ورود
            </button>
            <button
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              شروع رایگان
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-20 -right-40 w-80 h-80 bg-cyan-100 rounded-full blur-3xl opacity-50" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-blue-100">
            <Zap className="w-4 h-4" />
            <span>پلتفرم کلاس آنلاین حرفه‌ای</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
            کلاس آنلاین
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-cyan-500"> هوشمند</span>
            <br />
            با SiraRoom
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            سیستم مدیریت نقش پیشرفته، کنترل کامل دسترسی‌ها، نظرسنجی زنده و ارائه فایل — همه در یک پلتفرم فارسی
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="کد کلاس را وارد کنید..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinCode && onJoinRoom(joinCode)}
              className="flex-1 w-full px-5 py-3.5 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest text-lg font-mono bg-white shadow-sm"
            />
            <button
              onClick={() => joinCode && onJoinRoom(joinCode)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md whitespace-nowrap flex items-center gap-2 justify-center"
            >
              <span>ورود به کلاس</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium mx-auto"
          >
            <Play className="w-4 h-4" />
            <span>ایجاد کلاس جدید</span>
          </button>
        </div>

        {/* Mock UI */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-slate-400 text-xs font-mono">کلاس ریاضی - SiraRoom</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs">زنده</span>
              </div>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              {[
                { name: 'استاد احمدی', role: 'میزبان', speaking: true, color: 'bg-amber-600' },
                { name: 'علی رضایی', role: 'ارائه‌دهنده', speaking: false, color: 'bg-emerald-700' },
                { name: 'سارا کریمی', role: 'شرکت‌کننده', speaking: false, color: 'bg-slate-600' },
              ].map((p, i) => (
                <div key={i} className={`rounded-xl aspect-video flex flex-col items-center justify-center relative bg-slate-800 ${p.speaking ? 'ring-2 ring-emerald-500' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white mb-1.5 ${p.color}`}>
                    {p.name[0]}
                  </div>
                  <span className="text-xs text-slate-300">{p.name}</span>
                  <span className={`text-xs mt-0.5 ${p.role === 'میزبان' ? 'text-amber-400' : p.role === 'ارائه‌دهنده' ? 'text-emerald-400' : 'text-slate-500'}`}>{p.role}</span>
                  {p.speaking && (
                    <div className="absolute bottom-2 right-2 flex gap-0.5 items-end">
                      {[1, 2, 3].map(b => (
                        <div key={b} className="w-0.5 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${b * 4}px` }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 flex items-center justify-center gap-3">
              {['میکروفن', 'دوربین', 'اشتراک صفحه', 'نظرسنجی', 'چت'].map((btn, i) => (
                <div key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${i === 0 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {btn}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 bg-blue-600">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: '+۵۰۰,۰۰۰', label: 'کاربر فعال' },
            { value: '+۲۰,۰۰۰', label: 'کلاس روزانه' },
            { value: '۹۹.۹٪', label: 'آپتایم' },
            { value: 'RTL', label: 'طراحی کاملاً فارسی' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-4xl font-black mb-1">{s.value}</div>
              <div className="text-blue-100 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">همه چیز که نیاز دارید</h2>
            <p className="text-lg text-slate-500">ابزارهای حرفه‌ای برای تدریس آنلاین موفق</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-2xl p-7 transition-all group cursor-default">
                <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-5 transition-colors">
                  <f.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-4">قیمت‌گذاری شفاف</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-8 border-2 ${plan.highlight ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105' : 'bg-white border-slate-100 hover:border-blue-200'}`}>
                {plan.highlight && <div className="text-xs font-bold bg-white/20 text-white rounded-full px-3 py-1 inline-block mb-4">محبوب‌ترین</div>}
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm mr-1 ${plan.highlight ? 'text-blue-100' : 'text-slate-400'}`}>تومان / {plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? 'text-blue-50' : 'text-slate-600'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-blue-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${plan.highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">SiraRoom</span>
          </div>
          <div className="text-sm">© ۱۴۰۴ SiraRoom. تمامی حقوق محفوظ است.</div>
        </div>
      </footer>
    </div>
  );
}

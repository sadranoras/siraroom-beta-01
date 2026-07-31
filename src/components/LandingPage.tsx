import { useState } from 'react';
import { Video, Users, Shield, Zap, Globe, Monitor, CircleCheck as CheckCircle, ArrowLeft, Play, Star } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onJoinRoom: (code: string) => void;
}

const features = [
  {
    icon: Video,
    title: 'تصویر و صدای با کیفیت',
    desc: 'جلسات آنلاین با کیفیت HD و اتصال پایدار',
  },
  {
    icon: Users,
    title: 'تا ۱۰۰۰ شرکت‌کننده',
    desc: 'وبینار و کنفرانس‌های بزرگ را با ظرفیت بالا برگزار کنید',
  },
  {
    icon: Shield,
    title: 'امنیت پیشرفته',
    desc: 'رمزگذاری end-to-end و کنترل کامل دسترسی',
  },
  {
    icon: Zap,
    title: 'اتصال سریع',
    desc: 'بدون نصب نرم‌افزار، مستقیماً از مرورگر وارد شوید',
  },
  {
    icon: Globe,
    title: 'دسترسی از همه‌جا',
    desc: 'در موبایل، تبلت و کامپیوتر با تجربه یکسان',
  },
  {
    icon: Monitor,
    title: 'اشتراک‌گذاری صفحه',
    desc: 'ارائه و آموزش با اشتراک‌گذاری صفحه نمایش',
  },
];

const plans = [
  {
    name: 'رایگان',
    price: '۰',
    period: 'ماهانه',
    features: ['تا ۵۰ شرکت‌کننده', 'جلسات ۴۰ دقیقه‌ای', 'اشتراک‌گذاری صفحه', 'چت گروهی'],
    cta: 'شروع رایگان',
    highlight: false,
  },
  {
    name: 'حرفه‌ای',
    price: '۱۵۰,۰۰۰',
    period: 'ماهانه',
    features: ['تا ۳۰۰ شرکت‌کننده', 'جلسات نامحدود', 'ضبط جلسات', 'پشتیبانی اولویت‌دار', 'داشبورد آماری'],
    cta: 'شروع ۱۴ روز رایگان',
    highlight: true,
  },
  {
    name: 'سازمانی',
    price: 'تماس بگیرید',
    period: '',
    features: ['تا ۱۰۰۰ شرکت‌کننده', 'زیردامنه اختصاصی', 'SSO و LDAP', 'پشتیبانی ۲۴/۷', 'SLA ضمانت‌شده'],
    cta: 'مشاوره رایگان',
    highlight: false,
  },
];

const testimonials = [
  {
    name: 'دکتر علی محمدی',
    role: 'مدیر آموزش دانشگاه تهران',
    text: 'اسکای روم انقلابی در برگزاری کلاس‌های آنلاین ما ایجاد کرد. کیفیت تصویر فوق‌العاده است.',
    rating: 5,
  },
  {
    name: 'سارا رضایی',
    role: 'مدیرعامل استارتاپ نوآور',
    text: 'با اسکای روم جلسات تیمی ما بسیار روان‌تر برگزار می‌شود. رابط کاربری فارسی و ساده.',
    rating: 5,
  },
  {
    name: 'مهندس کریمی',
    role: 'مدیر فناوری اطلاعات',
    text: 'امنیت بالا و پشتیبانی عالی. بهترین انتخاب برای جلسات سازمانی ما بوده است.',
    rating: 5,
  },
];

export default function LandingPage({ onGetStarted, onJoinRoom }: LandingPageProps) {
  const [joinCode, setJoinCode] = useState('');
  

  const handleJoin = () => {
    if (joinCode.trim()) onJoinRoom(joinCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen bg-white font-vazir" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">اسکای روم</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">ویژگی‌ها</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">قیمت‌گذاری</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">نظرات</a>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            ورود به داشبورد
          </button>
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
            <span>بهترین پلتفرم ویدئوکنفرانس ایرانی</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
            جلسات آنلاین
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-600 to-cyan-500"> حرفه‌ای</span>
            <br />
            با اسکای روم
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            برگزاری جلسات، وبینارها و کلاس‌های آنلاین با کیفیت تصویر فوق‌العاده،
            امنیت بالا و رابط کاربری کاملاً فارسی
          </p>

          {/* Join Code Input */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="کد اتاق را وارد کنید..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              className="flex-1 w-full px-5 py-3.5 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest text-lg font-mono bg-white shadow-sm"
            />
            <button
              onClick={handleJoin}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md whitespace-nowrap flex items-center gap-2 justify-center"
            >
              <span>ورود به اتاق</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onGetStarted}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              <span>ایجاد اتاق جدید</span>
            </button>
          </div>
        </div>

        {/* Hero Preview */}
        <div className="mt-16 max-w-5xl mx-auto relative">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 bg-slate-700 rounded-md h-6 mx-4" />
            </div>
            <div className="p-6 grid grid-cols-3 gap-3">
              {[
                { name: 'مهندس احمدی', speaking: true },
                { name: 'خانم رضایی', speaking: false },
                { name: 'دکتر کریمی', speaking: false },
              ].map((p, i) => (
                <div key={i} className={`rounded-xl aspect-video flex flex-col items-center justify-center relative ${p.speaking ? 'bg-blue-900 ring-2 ring-blue-400' : 'bg-slate-700'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 ${p.speaking ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                    {p.name[0]}
                  </div>
                  <span className="text-xs text-slate-300">{p.name}</span>
                  {p.speaking && (
                    <div className="absolute bottom-2 right-2 flex gap-0.5">
                      {[1, 2, 3].map(b => (
                        <div key={b} className="w-1 bg-green-400 rounded-full animate-pulse" style={{ height: `${b * 4 + 4}px` }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 flex items-center justify-center gap-4">
              {['میکروفن', 'دوربین', 'اشتراک صفحه', 'چت'].map((btn, i) => (
                <div key={i} className={`px-4 py-2 rounded-lg text-xs font-medium ${i === 0 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {btn}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: '+۵۰۰,۰۰۰', label: 'کاربر فعال' },
            { value: '+۲۰,۰۰۰', label: 'جلسه روزانه' },
            { value: '۹۹.۹٪', label: 'آپتایم' },
            { value: '+۱۰۰', label: 'سرور در ایران' },
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
            <p className="text-lg text-slate-500 max-w-xl mx-auto">ابزارهای حرفه‌ای برای برگزاری جلسات آنلاین موفق</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">قیمت‌گذاری شفاف</h2>
            <p className="text-lg text-slate-500">بدون هزینه پنهان. لغو هر زمان.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 border-2 transition-all ${plan.highlight
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-105'
                  : 'bg-white border-slate-100 hover:border-blue-200'}`}
              >
                {plan.highlight && (
                  <div className="text-xs font-bold bg-white/20 text-white rounded-full px-3 py-1 inline-block mb-4">محبوب‌ترین</div>
                )}
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="mb-1">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm mr-1 ${plan.highlight ? 'text-blue-100' : 'text-slate-400'}`}>
                      تومان / {plan.period}
                    </span>
                  )}
                </div>
                <ul className="space-y-3 my-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2.5 text-sm ${plan.highlight ? 'text-blue-50' : 'text-slate-600'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-blue-200' : 'text-blue-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onGetStarted}
                  className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${plan.highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">چه می‌گویند؟</h2>
            <p className="text-lg text-slate-500">نظر کاربران ما</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{t.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-cyan-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-black mb-4">همین الان شروع کنید</h2>
          <p className="text-blue-100 text-lg mb-10">رایگان ثبت‌نام کنید و اولین جلسه آنلاین خود را برگزار کنید</p>
          <button
            onClick={onGetStarted}
            className="bg-white text-blue-600 font-bold px-10 py-4 rounded-2xl hover:bg-blue-50 transition-all text-lg shadow-lg hover:shadow-xl"
          >
            ایجاد اتاق رایگان
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">اسکای روم</span>
          </div>
          <div className="border-t border-slate-800 pt-6 text-sm text-center">
            © ۱۴۰۴ اسکای روم. تمامی حقوق محفوظ است.
          </div>
        </div>
      </footer>
    </div>
  );
}

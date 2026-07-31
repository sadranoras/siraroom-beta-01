import { useState } from 'react';
import { X, Video, Users, Lock, List, Globe, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface AllowedUserEntry { display_name: string; access_password: string; }

interface CreateRoomModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateRoomModal({ onClose, onCreated }: CreateRoomModalProps) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    max_participants: 100,
    access_type: 'open' as 'open' | 'password' | 'list',
    room_password: '',
  });
  const [allowedUsers, setAllowedUsers] = useState<AllowedUserEntry[]>([
    { display_name: '', access_password: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'max_participants' ? Number(value) : value }));
  };

  const updateAllowedUser = (i: number, field: keyof AllowedUserEntry, value: string) => {
    setAllowedUsers(prev => prev.map((u, idx) => idx === i ? { ...u, [field]: value } : u));
  };

  const addAllowedUser = () => {
    setAllowedUsers(prev => [...prev, { display_name: '', access_password: '' }]);
  };

  const removeAllowedUser = (i: number) => {
    setAllowedUsers(prev => prev.filter((_, idx) => idx !== i));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) { setError('عنوان اتاق الزامی است'); return; }
    if (form.access_type === 'password' && !form.room_password.trim()) {
      setError('رمز عبور اتاق الزامی است');
      return;
    }
    if (form.access_type === 'list') {
      const valid = allowedUsers.filter(u => u.display_name.trim() && u.access_password.trim());
      if (valid.length === 0) { setError('حداقل یک کاربر با نام و رمز عبور اضافه کنید'); return; }
    }

    setLoading(true);
    setError('');

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({
        title: form.title.trim(),
        description: form.description.trim(),
        host_name: profile?.display_name ?? 'میزبان',
        max_participants: form.max_participants,
        access_type: form.access_type,
        room_password: form.access_type === 'password' ? form.room_password : null,
        host_user_id: user.id,
        status: 'waiting_for_host',
        is_active: true,
      })
      .select()
      .single();

    if (roomErr || !room) {
      setError('خطا در ایجاد اتاق');
      setLoading(false);
      return;
    }

    if (form.access_type === 'list') {
      const validUsers = allowedUsers.filter(u => u.display_name.trim() && u.access_password.trim());
      await supabase.from('room_allowed_users').insert(
        validUsers.map(u => ({
          room_id: room.id,
          display_name: u.display_name.trim(),
          access_password: u.access_password.trim(),
        }))
      );
    }

    setLoading(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-slate-100 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">ایجاد اتاق جدید</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Basic info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">عنوان اتاق <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="مثال: کلاس ریاضی - گروه الف"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">توضیحات (اختیاری)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="توضیح مختصر..."
              rows={2}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Access type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">نوع دسترسی</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'open', label: 'آزاد', desc: 'هر کاربر', icon: Globe },
                { key: 'password', label: 'رمزدار', desc: 'با رمز عبور', icon: Lock },
                { key: 'list', label: 'لیست', desc: 'کاربران مشخص', icon: List },
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, access_type: opt.key as 'open' | 'password' | 'list' }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm transition-all ${
                    form.access_type === opt.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Password field */}
          {form.access_type === 'password' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">رمز عبور اتاق <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="room_password"
                value={form.room_password}
                onChange={handleChange}
                placeholder="رمز عبور اتاق را وارد کنید"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Allowed users list */}
          {form.access_type === 'list' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">لیست کاربران مجاز</label>
                <button type="button" onClick={addAllowedUser} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                  <Plus className="w-3.5 h-3.5" />
                  افزودن
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allowedUsers.map((u, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={u.display_name}
                      onChange={e => updateAllowedUser(i, 'display_name', e.target.value)}
                      placeholder="نام نمایشی"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={u.access_password}
                      onChange={e => updateAllowedUser(i, 'access_password', e.target.value)}
                      placeholder="رمز عبور"
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {allowedUsers.length > 1 && (
                      <button type="button" onClick={() => removeAllowedUser(i)} className="p-2 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">هر کاربر با نام نمایشی و رمز عبور خاص خود وارد می‌شود</p>
            </div>
          )}

          {/* Advanced */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 w-full"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            تنظیمات پیشرفته
          </button>

          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">حداکثر شرکت‌کنندگان</label>
              <div className="relative">
                <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  name="max_participants"
                  value={form.max_participants}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                >
                  {[10, 30, 50, 100, 200, 300, 500, 1000].map(n => (
                    <option key={n} value={n}>{n} نفر</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'ایجاد اتاق'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

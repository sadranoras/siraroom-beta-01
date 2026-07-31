import { useState } from 'react';
import { X, Video, Users, FileText, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateRoomModal({ onClose, onCreated }: CreateRoomModalProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    host_name: '',
    max_participants: 100,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'max_participants' ? Number(value) : value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.host_name.trim()) {
      setError('عنوان اتاق و نام مدیر الزامی است');
      return;
    }
    setLoading(true);
    setError('');

    const { error: err } = await supabase.from('rooms').insert([{
      title: form.title.trim(),
      description: form.description.trim(),
      host_name: form.host_name.trim(),
      max_participants: form.max_participants,
    }]);

    if (err) {
      setError('خطا در ایجاد اتاق. لطفاً دوباره تلاش کنید.');
      setLoading(false);
    } else {
      onCreated();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">ایجاد اتاق جدید</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              عنوان اتاق <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="مثال: جلسه هیئت مدیره"
                className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              نام مدیر جلسه <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="host_name"
                value={form.host_name}
                onChange={handleChange}
                placeholder="نام و نام خانوادگی"
                className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              توضیحات (اختیاری)
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="توضیح مختصر درباره این اتاق..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              حداکثر شرکت‌کنندگان
            </label>
            <div className="relative">
              <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                name="max_participants"
                value={form.max_participants}
                onChange={handleChange}
                className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value={10}>۱۰ نفر</option>
                <option value={50}>۵۰ نفر</option>
                <option value={100}>۱۰۰ نفر</option>
                <option value={300}>۳۰۰ نفر</option>
                <option value={500}>۵۰۰ نفر</option>
                <option value={1000}>۱۰۰۰ نفر</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  در حال ایجاد...
                </span>
              ) : 'ایجاد اتاق'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

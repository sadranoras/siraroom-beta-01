import { useState } from 'react';
import { X, User } from 'lucide-react';
import { supabase, RoomParticipant } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface NameChangeModalProps {
  me: RoomParticipant;
  onClose: () => void;
  onChanged: (newName: string) => void;
}

export default function NameChangeModal({ me, onClose, onChanged }: NameChangeModalProps) {
  const { user, updateDisplayName } = useAuth();
  const [name, setName] = useState(me.display_name);
  const [scope, setScope] = useState<'session' | 'permanent'>('session');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!name.trim()) { setError('نام نمایشی نمی‌تواند خالی باشد'); return; }
    setLoading(true);
    setError('');

    if (scope === 'permanent' && user) {
      const result = await updateDisplayName(name.trim());
      if (result?.error) { setError('خطا در بروزرسانی'); setLoading(false); return; }
    }

    // Always update session display name
    await supabase
      .from('room_participants')
      .update({ display_name: name.trim() })
      .eq('id', me.id);

    setLoading(false);
    onChanged(name.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold">تغییر نام نمایشی</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="نام نمایشی جدید"
              className="w-full pr-10 pl-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {user && (
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">اعمال تغییر برای:</p>
              {[
                { key: 'session', label: 'فقط این جلسه', desc: 'نام برای این کلاس تغییر می‌کند' },
                { key: 'permanent', label: 'همه جلسات', desc: 'نام حساب کاربری شما تغییر می‌کند' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setScope(opt.key as 'session' | 'permanent')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-right transition-colors ${
                    scope === opt.key ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    scope === opt.key ? 'border-blue-500 bg-blue-500' : 'border-slate-500'
                  }`} />
                  <div>
                    <div className="text-white text-sm font-medium">{opt.label}</div>
                    <div className="text-slate-400 text-xs">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-slate-600 rounded-xl text-slate-400 text-sm hover:bg-slate-700">
              انصراف
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {loading ? '...' : 'ذخیره'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

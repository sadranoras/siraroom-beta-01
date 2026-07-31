import { useState, useEffect } from 'react';
import { Video, Plus, Copy, Check, Users, Trash2, LogOut, Search, Clock, Lock, List, Globe, CirclePlay as PlayCircle } from 'lucide-react';
import { supabase, Room } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreateRoomModal from '../components/modals/CreateRoomModal';

interface DashboardPageProps {
  onJoinRoom: (code: string) => void;
  onSignOut: () => void;
}

export default function DashboardPage({ onJoinRoom, onSignOut }: DashboardPageProps) {
  const { user, profile, signOut } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => { fetchRooms(); }, [user]);

  async function fetchRooms() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('host_user_id', user.id)
      .order('created_at', { ascending: false });
    setRooms(data ?? []);
    setLoading(false);
  }

  async function deleteRoom(id: string) {
    if (!confirm('آیا از حذف این اتاق اطمینان دارید؟')) return;
    await supabase.from('rooms').delete().eq('id', id);
    setRooms(prev => prev.filter(r => r.id !== id));
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSignOut() {
    await signOut();
    onSignOut();
  }

  const filtered = rooms.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const accessIcon = (type: string) => {
    if (type === 'password') return <Lock className="w-3 h-3" />;
    if (type === 'list') return <List className="w-3 h-3" />;
    return <Globe className="w-3 h-3" />;
  };

  const accessLabel = (type: string) => {
    if (type === 'password') return 'رمزدار';
    if (type === 'list') return 'لیست کاربران';
    return 'آزاد';
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 bottom-0 w-64 bg-slate-900 flex flex-col z-40">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white">SiraRoom</span>
          </div>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{profile?.display_name}</div>
              <div className="text-slate-400 text-xs truncate">{profile?.email}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">منو</p>
          <div className="space-y-1">
            {[
              { icon: Video, label: 'اتاق‌های من' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium">
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-5 h-5" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="mr-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">داشبورد</h1>
            <p className="text-slate-500 text-sm mt-1">سلام، {profile?.display_name}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            اتاق جدید
          </button>
        </div>

        {/* Join by code */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-3">ورود با کد اتاق</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="کد اتاق را وارد کنید..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinCode && onJoinRoom(joinCode)}
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-center text-lg"
            />
            <button
              onClick={() => joinCode && onJoinRoom(joinCode)}
              disabled={!joinCode}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-40"
            >
              ورود
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در اتاق‌ها..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'کل اتاق‌ها', value: rooms.length, color: 'blue' },
            { label: 'فعال', value: rooms.filter(r => r.status === 'active').length, color: 'green' },
            { label: 'کل ظرفیت', value: rooms.reduce((a, r) => a + r.max_participants, 0), color: 'amber' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className={`text-3xl font-black mb-1 ${s.color === 'blue' ? 'text-blue-600' : s.color === 'green' ? 'text-emerald-600' : 'text-amber-600'}`}>{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Rooms */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Video className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 text-sm mb-4">هنوز اتاقی ایجاد نشده</p>
            <button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
              اولین اتاق را بسازید
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(room => (
              <div key={room.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{room.title}</h3>
                    {room.description && <p className="text-slate-500 text-sm mt-0.5 line-clamp-1">{room.description}</p>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                    room.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    room.status === 'closed' ? 'bg-slate-100 text-slate-500' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {room.status === 'active' ? 'در حال برگزاری' : room.status === 'closed' ? 'پایان یافته' : 'در انتظار'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">{accessIcon(room.access_type)}<span>{accessLabel(room.access_type)}</span></div>
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /><span>تا {room.max_participants} نفر</span></div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>{new Date(room.created_at).toLocaleDateString('fa-IR')}</span></div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-4 border border-slate-100">
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">کد اتاق</div>
                    <div className="font-mono font-bold text-slate-800 tracking-widest">{room.room_code}</div>
                  </div>
                  <button onClick={() => copyCode(room.room_code, room.id)} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    {copiedId === room.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onJoinRoom(room.room_code)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>ورود به اتاق</span>
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchRooms(); }}
        />
      )}
    </div>
  );
}

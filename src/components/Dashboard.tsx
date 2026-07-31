import { useState, useEffect } from 'react';
import { Video, Plus, Copy, Check, Users, Clock, Trash2, ArrowRight, LogOut, Calendar, ChartBar as BarChart3, Search } from 'lucide-react';
import { supabase, type Room } from '../lib/supabase';
import CreateRoomModal from './CreateRoomModal';

interface DashboardProps {
  onBack: () => void;
  onJoinRoom: (code: string) => void;
}

export default function Dashboard({ onBack, onJoinRoom }: DashboardProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setRooms(data);
    setLoading(false);
  }

  async function deleteRoom(id: string) {
    await supabase.from('rooms').delete().eq('id', id);
    setRooms(prev => prev.filter(r => r.id !== id));
  }

  async function toggleActive(room: Room) {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: !room.is_active })
      .eq('id', room.id);
    if (!error) {
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_active: !r.is_active } : r));
    }
  }

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filtered = rooms.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.host_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-vazir" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 bottom-0 w-64 bg-slate-900 flex flex-col z-40">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">اسکای روم</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: BarChart3, label: 'داشبورد', active: true },
            { icon: Video, label: 'اتاق‌های من', active: false },
            { icon: Calendar, label: 'جلسات برنامه‌ریزی‌شده', active: false },
          ].map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            بازگشت به صفحه اصلی
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">داشبورد</h1>
            <p className="text-slate-500 text-sm mt-1">مدیریت اتاق‌های جلسه آنلاین</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            اتاق جدید
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'کل اتاق‌ها', value: rooms.length, icon: Video, color: 'blue' },
            { label: 'اتاق‌های فعال', value: rooms.filter(r => r.is_active).length, icon: Users, color: 'green' },
            { label: 'ظرفیت کل', value: rooms.reduce((a, r) => a + r.max_participants, 0), icon: BarChart3, color: 'amber' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                stat.color === 'blue' ? 'bg-blue-100' : stat.color === 'green' ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                <stat.icon className={`w-5 h-5 ${
                  stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-emerald-600' : 'text-amber-600'
                }`} />
              </div>
              <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
              <div className="text-slate-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی اتاق..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Rooms List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Video className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-slate-600 font-medium mb-2">اتاقی یافت نشد</h3>
            <p className="text-slate-400 text-sm mb-6">اولین اتاق جلسه خود را ایجاد کنید</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              ایجاد اتاق
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(room => (
              <div key={room.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-lg truncate">{room.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        room.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {room.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                    {room.description && (
                      <p className="text-slate-500 text-sm line-clamp-1">{room.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>تا {room.max_participants} نفر</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(room.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>

                {/* Room Code */}
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between mb-4 border border-slate-100">
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">کد اتاق</div>
                    <div className="font-mono font-bold text-slate-800 tracking-widest text-lg">{room.room_code}</div>
                  </div>
                  <button
                    onClick={() => copyCode(room.room_code, room.id)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    title="کپی کد"
                  >
                    {copiedId === room.id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onJoinRoom(room.room_code)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                  >
                    <span>ورود به اتاق</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(room)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      room.is_active
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {room.is_active ? 'غیرفعال' : 'فعال'}
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="حذف اتاق"
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

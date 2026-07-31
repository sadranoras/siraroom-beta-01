import { useState, useEffect } from 'react';
import { Video, ArrowLeft, Lock, User, Key } from 'lucide-react';
import { supabase, Room, storeGuestSession } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface JoinRoomPageProps {
  initialCode?: string;
  onEntered: (roomId: string, roomCode: string, participantId: string, sessionToken?: string) => void;
  onBack: () => void;
  onAuthRequired: () => void;
}

export default function JoinRoomPage({ initialCode, onEntered, onBack, onAuthRequired }: JoinRoomPageProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [step, setStep] = useState<'code' | 'auth-check' | 'password' | 'list-login' | 'display-name'>('code');
  const [code, setCode] = useState(initialCode ?? '');
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [roomPassword, setRoomPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState('');

  // Wait for auth to finish loading before looking up the room
  useEffect(() => {
    if (!authLoading && initialCode) handleLookup(initialCode);
  }, [authLoading]);

  async function handleLookup(roomCode: string) {
    if (!roomCode.trim()) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode.trim().toUpperCase())
      .maybeSingle();

    if (err || !data) {
      setError('اتاقی با این کد یافت نشد');
      setLoading(false);
      return;
    }
    if (data.status === 'closed') {
      setError('این کلاس پایان یافته است');
      setLoading(false);
      return;
    }
    setRoom(data);
    setLoading(false);

    if (data.access_type === 'open') {
      if (!user) { onAuthRequired(); return; }
      setStep('display-name');
    } else if (data.access_type === 'password') {
      if (!user) { onAuthRequired(); return; }
      setStep('password');
    } else if (data.access_type === 'list') {
      setStep('list-login');
    }
  }

  async function joinAsAuthUser(displayName: string) {
    if (!user || !room) return;
    setLoading(true);

    // Check if already a participant
    const { data: existing } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing && existing.status !== 'removed') {
      // Re-join existing session
      await supabase.from('room_participants').update({ status: room.status === 'active' ? 'active' : 'waiting', display_name: displayName }).eq('id', existing.id);
      setLoading(false);
      onEntered(room.id, room.room_code, existing.id);
      return;
    }

    const isHost = room.host_user_id === user.id;

    const { data: participant, error: pErr } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: user.id,
        display_name: displayName,
        role: isHost ? 'host' : 'attendee',
        can_use_mic: isHost,
        can_use_webcam: isHost,
        can_share_screen: isHost,
        status: isHost || room.status === 'active' ? 'active' : 'waiting',
      })
      .select()
      .single();

    if (pErr || !participant) { setError('خطا در ورود به اتاق'); setLoading(false); return; }

    if (isHost && room.status === 'waiting_for_host') {
      // Host joins → activate room + all waiting participants
      await supabase.from('rooms').update({ status: 'active' }).eq('id', room.id);
      await supabase.from('room_participants')
        .update({ status: 'active' })
        .eq('room_id', room.id)
        .eq('status', 'waiting')
        .neq('id', participant.id);
    }

    setLoading(false);
    onEntered(room.id, room.room_code, participant.id);
  }

  async function handlePasswordSubmit() {
    if (!room) return;
    if (roomPassword !== room.room_password) {
      setError('رمز عبور اشتباه است');
      return;
    }
    setError('');
    setStep('display-name');
  }

  async function handleListLogin() {
    if (!room) return;
    setLoading(true);
    setError('');

    // Find matching allowed user
    const { data: allowedUser } = await supabase
      .from('room_allowed_users')
      .select('*')
      .eq('room_id', room.id)
      .eq('display_name', guestName.trim())
      .eq('access_password', guestPassword.trim())
      .maybeSingle();

    if (!allowedUser) {
      setError('نام کاربری یا رمز عبور اشتباه است');
      setLoading(false);
      return;
    }

    // Check if already joined as this allowed user
    const { data: existing } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room.id)
      .eq('allowed_user_id', allowedUser.id)
      .maybeSingle();

    const sessionToken = crypto.randomUUID();

    if (existing && existing.status !== 'removed') {
      await supabase.from('room_participants')
        .update({ status: room.status === 'active' ? 'active' : 'waiting', session_token: sessionToken })
        .eq('id', existing.id);
      storeGuestSession(existing.id, room.room_code, sessionToken);
      setLoading(false);
      onEntered(room.id, room.room_code, existing.id, sessionToken);
      return;
    }

    const { data: participant, error: pErr } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        allowed_user_id: allowedUser.id,
        session_token: sessionToken,
        display_name: allowedUser.display_name,
        role: 'attendee',
        can_use_mic: false,
        can_use_webcam: false,
        can_share_screen: false,
        status: room.status === 'active' ? 'active' : 'waiting',
      })
      .select()
      .single();

    if (pErr || !participant) { setError('خطا در ورود'); setLoading(false); return; }

    storeGuestSession(participant.id, room.room_code, sessionToken);
    setLoading(false);
    onEntered(room.id, room.room_code, participant.id, sessionToken);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">SiraRoom</span>
          </div>
          {room && <p className="text-slate-300 font-medium text-lg">{room.title}</p>}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Step: Code entry */}
          {step === 'code' && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg text-center">ورود به کلاس</h2>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleLookup(code)}
                placeholder="کد اتاق را وارد کنید"
                className="w-full px-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-center text-xl"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                onClick={() => handleLookup(code)}
                disabled={loading || !code}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'جستجوی اتاق'}
              </button>
            </div>
          )}

          {/* Step: Room password */}
          {step === 'password' && room && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg text-center">رمز عبور اتاق</h2>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={roomPassword}
                  onChange={e => setRoomPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                  placeholder="رمز عبور اتاق"
                  className="w-full pr-10 pl-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button onClick={handlePasswordSubmit} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
                تأیید
              </button>
            </div>
          )}

          {/* Step: List login (guest) */}
          {step === 'list-login' && room && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg text-center">ورود با اطلاعات کلاس</h2>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="نام کاربری (نام نمایشی)"
                  className="w-full pr-10 pl-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Key className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={guestPassword}
                  onChange={e => setGuestPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleListLogin()}
                  placeholder="رمز عبور"
                  className="w-full pr-10 pl-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                onClick={handleListLogin}
                disabled={loading || !guestName || !guestPassword}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'ورود به کلاس'}
              </button>
              {user && (
                <button
                  onClick={() => setStep('display-name')}
                  className="w-full py-2.5 border border-white/20 text-slate-300 rounded-xl text-sm hover:bg-white/5"
                >
                  ورود با حساب کاربری ({profile?.display_name})
                </button>
              )}
            </div>
          )}

          {/* Step: Display name confirmation */}
          {step === 'display-name' && room && user && (
            <div className="space-y-4">
              <h2 className="text-white font-bold text-lg text-center">تأیید نام نمایشی</h2>
              <p className="text-slate-400 text-sm text-center">نام شما در این کلاس چگونه نمایش داده شود؟</p>
              <div className="relative">
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={joinDisplayName || profile?.display_name || ''}
                  onChange={e => setJoinDisplayName(e.target.value)}
                  placeholder="نام نمایشی"
                  className="w-full pr-10 pl-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                onClick={() => joinAsAuthUser(joinDisplayName || profile?.display_name || 'کاربر')}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : 'ورود به کلاس'}
              </button>
            </div>
          )}
        </div>

        <button onClick={onBack} className="mt-6 flex items-center gap-2 text-slate-400 hover:text-white text-sm mx-auto w-fit transition-colors">
          <ArrowLeft className="w-4 h-4" />
          بازگشت
        </button>
      </div>
    </div>
  );
}

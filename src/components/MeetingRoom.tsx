import { useState, useEffect } from 'react';
import { useMedia } from '../hooks/useMedia';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Monitor,
  MessageSquare, Users, Copy, Check, Hand, Wifi, WifiOff
} from 'lucide-react';
import { supabase, type Room } from '../lib/supabase';

interface MeetingRoomProps {
  roomCode: string;
  onLeave: () => void;
}

const mockParticipants = [
  { id: '1', name: 'مهندس احمدی', isSpeaking: true, isMuted: false, hasVideo: true },
  { id: '2', name: 'خانم رضایی', isSpeaking: false, isMuted: true, hasVideo: false },
  { id: '3', name: 'دکتر کریمی', isSpeaking: false, isMuted: false, hasVideo: true },
];

export default function MeetingRoom({ roomCode, onLeave }: MeetingRoomProps) {
  // ۱. متدها و refهای دریافت رسانه از هوک
  const {
    micOn, camOn, screenOn,
    toggleMic, toggleCam, startScreenShare, stopScreenShare,
    camVideoRef, screenVideoRef
  } = useMedia();

  // ۲. استیت‌های عمومی جلسه
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // ۳. استیت‌های چت
  const [messages, setMessages] = useState([
    { id: '1', sender: 'دکتر کریمی', text: 'سلام، همه می‌شنوید؟', time: '۱۰:۳۲' },
    { id: '2', sender: 'خانم رضایی', text: 'بله، صدا واضح است', time: '۱۰:۳۳' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchRoom();
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [roomCode]);

  async function fetchRoom() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .maybeSingle();

    if (!error && data) {
      setRoom(data);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }

  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function sendMessage() {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'شما',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setNewMessage('');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">در حال ورود به اتاق...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">اتاق یافت نشد</h2>
          <p className="text-slate-400 mb-8">کد اتاق <span className="font-mono text-blue-400 font-bold">{roomCode}</span> معتبر نیست یا اتاق حذف شده است.</p>
          <button
            onClick={onLeave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      {/* Top Bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">زنده</span>
          </div>
          <div className="text-slate-400 text-xs font-mono">{formatTime(elapsed)}</div>
        </div>
        <div className="text-center">
          <h1 className="text-white font-bold">{room?.title}</h1>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <span className="text-slate-400 text-xs">{room?.host_name}</span>
            <span className="text-slate-600">•</span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
            >
              <span className="font-mono text-blue-400">{roomCode}</span>
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{mockParticipants.length + 1}</span>
          </div>
          <div className="flex items-center gap-1 text-green-400 text-xs">
            <Wifi className="w-4 h-4" />
            <span>عالی</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 content-start auto-rows-max overflow-y-auto">
          
          {/* تصویر دوربین خود کاربر */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-800 aspect-video flex items-center justify-center border-2 border-slate-700">
            <video
              ref={camVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
            />
            {!camOn && (
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400">
                شما
              </div>
            )}
            <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between pointer-events-none">
              <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-lg">شما</span>
              <div className="flex gap-1">
                {!micOn && (
                  <div className="bg-red-600/80 rounded-lg p-1">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
                {handRaised && (
                  <div className="bg-amber-500/80 rounded-lg p-1 text-xs">✋</div>
                )}
              </div>
            </div>
          </div>

          {/* اشتراک‌گذاری صفحه خود کاربر (در صورت فعال بودن) */}
          {screenOn && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-800 aspect-video border-2 border-blue-500">
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
              <span className="absolute bottom-3 right-3 text-white text-xs bg-black/50 px-2 py-1 rounded-lg">صفحه شما</span>
            </div>
          )}

          {/* سایر شرکت‌کنندگان */}
          {mockParticipants.map(p => (
            <div key={p.id} className={`relative rounded-2xl overflow-hidden aspect-video flex items-center justify-center border-2 ${p.isSpeaking ? 'border-blue-500 bg-blue-950' : 'border-transparent bg-slate-800'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${p.isSpeaking ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {p.name[0]}
                </div>
              </div>
              {p.isSpeaking && (
                <div className="absolute top-3 left-3 flex gap-0.5 items-end">
                  {[1, 2, 3, 2, 1].map((h, i) => (
                    <div key={i} className="w-1 bg-blue-400 rounded-full animate-pulse" style={{ height: `${h * 5}px` }} />
                  ))}
                </div>
              )}
              <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between">
                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-lg">{p.name}</span>
                {p.isMuted && (
                  <div className="bg-red-600/80 rounded-lg p-1">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Side Panel (چت و اعضا) */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
            <div className="flex border-b border-slate-700">
              {[
                { key: 'chat', label: 'چت', icon: MessageSquare },
                { key: 'participants', label: 'شرکت‌کنندگان', icon: Users },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setShowChat(tab.key === 'chat');
                    setShowParticipants(tab.key === 'participants');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                    (tab.key === 'chat' && showChat) || (tab.key === 'participants' && showParticipants)
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {showParticipants && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">ش</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">شما (مدیر)</div>
                  </div>
                  {!micOn && <MicOff className="w-4 h-4 text-red-400" />}
                </div>
                {mockParticipants.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-xl transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${p.isSpeaking ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{p.name}</div>
                    </div>
                    {p.isMuted && <MicOff className="w-4 h-4 text-red-400" />}
                  </div>
                ))}
              </div>
            )}

            {showChat && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => (
                    <div key={msg.id} className={`${msg.sender === 'شما' ? 'mr-auto' : 'ml-auto'} max-w-[85%]`}>
                      <div className="text-xs text-slate-500 mb-1">{msg.sender} · {msg.time}</div>
                      <div className={`px-3 py-2 rounded-xl text-sm ${msg.sender === 'شما' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="پیام..."
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      ارسال
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
        <div className="flex items-center justify-center gap-3">
          
          <button
            onClick={toggleMic}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${!micOn ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {!micOn ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
            <span className="text-xs text-slate-400">{!micOn ? 'میکروفن خاموش' : 'میکروفن'}</span>
          </button>

          <button
            onClick={toggleCam}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${!camOn ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            {!camOn ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
            <span className="text-xs text-slate-400">{!camOn ? 'دوربین خاموش' : 'دوربین'}</span>
          </button>

          <button
            onClick={screenOn ? stopScreenShare : startScreenShare}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${screenOn ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <Monitor className="w-5 h-5 text-white" />
            <span className="text-xs text-slate-400">{screenOn ? 'توقف اشتراک' : 'اشتراک صفحه'}</span>
          </button>

          <button
            onClick={() => setHandRaised(!handRaised)}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${handRaised ? 'bg-amber-500 hover:bg-amber-600' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <Hand className="w-5 h-5 text-white" />
            <span className="text-xs text-slate-400">دست بالا</span>
          </button>

          <button
            onClick={() => { setShowChat(!showChat); setShowParticipants(false); }}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="text-xs text-slate-400">چت</span>
          </button>

          <button
            onClick={() => { setShowParticipants(!showParticipants); setShowChat(false); }}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${showParticipants ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            <Users className="w-5 h-5 text-white" />
            <span className="text-xs text-slate-400">شرکت‌کنندگان</span>
          </button>

          <div className="w-px h-10 bg-slate-700 mx-1" />

          <button
            onClick={onLeave}
            className="flex flex-col items-center gap-1 bg-red-600 hover:bg-red-700 p-3 rounded-2xl transition-all"
          >
            <PhoneOff className="w-5 h-5 text-white" />
            <span className="text-xs text-white">خروج</span>
          </button>
        </div>
      </div>
    </div>
  );
}
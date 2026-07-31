import { useState, useEffect, useRef } from 'react';
import { Video, Copy, Check, Wifi, Pencil } from 'lucide-react';
import { supabase, Room, RoomParticipant, RoomFile, clearGuestSession } from '../lib/supabase';
import { useMedia } from '../hooks/useMedia';
import ControlBar from '../components/meeting/ControlBar';
import ParticipantsPanel from '../components/meeting/ParticipantsPanel';
import ChatPanel from '../components/meeting/ChatPanel';
import PollPanel from '../components/meeting/PollPanel';
import FilePanel from '../components/meeting/FilePanel';
import VideoGrid from '../components/meeting/VideoGrid';
import NameChangeModal from '../components/modals/NameChangeModal';
import { useWebRTC } from '../hooks/useWebRTC';

interface MeetingRoomPageProps {
  roomId: string;
  roomCode: string;
  participantId: string;
  sessionToken?: string;
  onLeave: () => void;
}

export default function MeetingRoomPage({ roomId, roomCode, participantId, onLeave }: MeetingRoomPageProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [me, setMe] = useState<RoomParticipant | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [kicked, setKicked] = useState(false);
  const [roomClosed, setRoomClosed] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>('chat');
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [presentingFile, setPresentingFile] = useState<RoomFile | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const media = useMedia();

  // 🟢 ارسال همزمان استریم وب‌کم و اسکرین به WebRTC
  const currentUserId = me?.id || '';
  const { remoteStreams, connectToUser } = useWebRTC(
  currentUserId,
  media.camStream,
  media.micStream,
  media.screenStream
);

  useEffect(() => {
    if (!currentUserId || participants.length === 0) return;
    participants.forEach(p => {
      if (p.id !== currentUserId) {
        connectToUser(p.id);
      }
    });
  }, [participants, currentUserId]);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    init();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (media.camOn && media.camStream && media.camVideoRef.current) {
      const videoElement = media.camVideoRef.current;
      if (videoElement.srcObject !== media.camStream) {
        videoElement.srcObject = media.camStream;
        videoElement.play().catch(err => console.error('Error playing camera stream:', err));
      }
    }
  }, [media.camOn, media.camStream]);

  async function init() {
    try {
      const [roomData, meData] = await Promise.all([
        supabase.from('rooms').select('*').eq('id', roomId).single(),
        supabase.from('room_participants').select('*').eq('id', participantId).single(),
      ]);

      if (roomData.error || !roomData.data || meData.error || !meData.data) {
        console.error('خطا در دریافت اطلاعات اولیه:', roomData.error || meData.error);
        onLeave();
        return;
      }

      setRoom(roomData.data);
      setMe(meData.data);

      if (meData.data.status === 'waiting') {
        setIsWaiting(true);
      }

      await fetchParticipants();
      setLoading(false);

      setupRealtime();

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } catch (err) {
      console.error('Fetch error during init:', err);
    }
  }

  async function fetchParticipants() {
    try {
      const { data } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .neq('status', 'removed')
        .order('joined_at');
      setParticipants(data ?? []);
    } catch (e) {
      console.error('خطا در دریافت لیست کاربران:', e);
    }
  }

  function setupRealtime() {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (broadcastChannelRef.current) {
      supabase.removeChannel(broadcastChannelRef.current);
      broadcastChannelRef.current = null;
    }

    const uniqueSubId = Math.random().toString(36).substring(7);

    const channel = supabase
      .channel(`meeting-db-${roomId}-${uniqueSubId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}`
      }, async payload => {
        const updatedRoom = payload.new as Room;
        setRoom(updatedRoom);
        if (updatedRoom.status === 'closed') {
          setRoomClosed(true);
          setTimeout(() => { cleanup(); onLeave(); }, 3000);
        }
        if (updatedRoom.status === 'active') {
          setIsWaiting(false);
          const { data } = await supabase.from('room_participants').select('*').eq('id', participantId).single();
          if (data) setMe(data);
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}`
      }, async payload => {
        if (payload.eventType === 'DELETE') {
          fetchParticipants();
          return;
        }
        const updated = payload.new as RoomParticipant;

        if (updated.id === participantId && updated.status === 'removed') {
          setKicked(true);
          setTimeout(() => { cleanup(); onLeave(); }, 3000);
          return;
        }

        if (updated.id === participantId) {
          setMe(prev => {
            if (!prev) return updated;
            const oldPerms = { can_use_mic: prev.can_use_mic, can_use_webcam: prev.can_use_webcam, can_share_screen: prev.can_share_screen };
            if (!updated.can_use_mic && oldPerms.can_use_mic) media.forceMicOff();
            if (!updated.can_use_webcam && oldPerms.can_use_webcam) media.forceCamOff();
            if (!updated.can_share_screen && oldPerms.can_share_screen) media.forceScreenOff();
            return updated;
          });
          if (updated.status === 'active') setIsWaiting(false);
        }

        fetchParticipants();
      });

    channel.subscribe((err) => {
      if (err) console.error('Realtime subscription error:', err);
    });

    channelRef.current = channel;

    const broadcastChannel = supabase
      .channel(`broadcast-${roomId}-${uniqueSubId}`)
      .on('broadcast', { event: 'hand' }, ({ payload }) => {
        const { participantId: pid, raised } = payload as { participantId: string; raised: boolean };
        setRaisedHands(prev => {
          const next = new Set(prev);
          if (raised) next.add(pid);
          else next.delete(pid);
          return next;
        });
      });

    broadcastChannel.subscribe();
    broadcastChannelRef.current = broadcastChannel;
  }

  function cleanup() {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    if (broadcastChannelRef.current) supabase.removeChannel(broadcastChannelRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    media.forceMicOff();
    media.forceCamOff();
    media.forceScreenOff();
  }

  async function handleLeave() {
    const isHost = me?.role === 'host';
    if (isHost) {
      if (!confirm('با خروج شما، کلاس بسته خواهد شد. آیا مطمئن هستید؟')) return;
      await supabase.from('rooms').update({ status: 'closed' }).eq('id', roomId);
      await supabase.from('room_participants').update({ status: 'removed' }).eq('room_id', roomId);
    }
    cleanup();
    clearGuestSession();
    onLeave();
  }

  async function handleToggleMic() {
    if (!me?.can_use_mic) return;
    await media.toggleMic();
    const newState = !media.micOn;
    await supabase.from('room_participants').update({ is_mic_on: newState }).eq('id', participantId);
    setMe(prev => prev ? { ...prev, is_mic_on: newState } : prev);
  }

  async function handleToggleCam() {
    if (!me?.can_use_webcam) return;
    await media.toggleCam();
    const newState = !media.camOn;
    await supabase.from('room_participants').update({ is_webcam_on: newState }).eq('id', participantId);
    setMe(prev => prev ? { ...prev, is_webcam_on: newState } : prev);
  }

  // 🟢 اصلاح تابع مدیریت اشتراک‌گذاری صفحه نمایش (اصلی)
  async function handleToggleScreen() {
    if (!me?.can_share_screen) return;

    if (media.screenOn) {
      // خاموش کردن اسکرین‌شیر
      media.stopScreenShare();
      await (supabase.from('room_participants') as any)
        .update({ is_screen_sharing: false })
        .eq('id', participantId);
      setMe(prev => prev ? { ...prev, is_screen_sharing: false } : prev);
    } else {
      // روشن کردن اسکرین‌شیر
      const stream = await media.startScreenShare();
      if (stream) {
        await (supabase.from('room_participants') as any)
          .update({ is_screen_sharing: true })
          .eq('id', participantId);
        setMe(prev => prev ? { ...prev, is_screen_sharing: true } : prev);

        // همگام‌سازی خاموش شدن از طریق دکمه مرورگر (Stop sharing)
        stream.getVideoTracks()[0].onended = async () => {
          media.stopScreenShare();
          await (supabase.from('room_participants') as any)
            .update({ is_screen_sharing: false })
            .eq('id', participantId);
          setMe(prev => prev ? { ...prev, is_screen_sharing: false } : prev);
        };
      }
    }
  }

  async function handleToggleHand() {
    const newState = !handRaised;
    setHandRaised(newState);
    setRaisedHands(prev => {
      const next = new Set(prev);
      if (newState) next.add(participantId);
      else next.delete(participantId);
      return next;
    });

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.send({
        type: 'broadcast',
        event: 'hand',
        payload: { participantId, raised: newState },
      });
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">در حال ورود به کلاس...</p>
        </div>
      </div>
    );
  }

  if (kicked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">از کلاس خارج شدید</h2>
          <p className="text-slate-400">میزبان شما را از کلاس خارج کرده است</p>
        </div>
      </div>
    );
  }

  if (roomClosed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">کلاس پایان یافت</h2>
          <p className="text-slate-400">میزبان کلاس را پایان داد</p>
        </div>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">در انتظار میزبان</h2>
          <p className="text-slate-400 mb-6">کلاس با ورود میزبان آغاز خواهد شد</p>
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">{room?.title}</p>
            <p className="text-white font-mono font-bold text-lg tracking-widest">{roomCode}</p>
          </div>
          <button
            onClick={() => { cleanup(); clearGuestSession(); onLeave(); }}
            className="mt-6 text-slate-500 hover:text-white text-sm"
          >
            خروج
          </button>
        </div>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" dir="rtl" style={{ fontFamily: "'Vazirmatn', 'Segoe UI', sans-serif" }}>
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">{room?.title}</h1>
            <div className="flex items-center gap-2">
              <button onClick={copyCode} className="flex items-center gap-1 text-slate-400 hover:text-blue-400 text-xs transition-colors">
                <span className="font-mono text-blue-400">{roomCode}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
            <Wifi className="w-4 h-4" />
            <span>آنلاین</span>
          </div>
          <div className="text-slate-400 text-xs font-mono">
            {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}
          </div>
          <button
            onClick={() => setShowNameModal(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs border border-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{me.display_name}</span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className="flex-1 overflow-hidden">
          <VideoGrid
            participants={participants}
            me={me}
            camOn={media.camOn}
            camVideoRef={media.camVideoRef}
            screenOn={media.screenOn}
            screenStream={media.screenStream}
            presentingFile={presentingFile}
            raisedHands={raisedHands}
            remoteStreams={remoteStreams}
          />
        </div>

        {/* Side panel */}
        {activePanel && (
          <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
            {activePanel === 'chat' && <ChatPanel roomId={roomId} me={me} />}
            {activePanel === 'participants' && (
              <ParticipantsPanel
                participants={participants}
                me={me}
                raisedHands={raisedHands}
                onParticipantUpdated={fetchParticipants}
              />
            )}
            {activePanel === 'polls' && <PollPanel roomId={roomId} me={me} />}
            {activePanel === 'files' && (
              <FilePanel
                roomId={roomId}
                me={me}
                presentingFile={presentingFile}
                onPresenting={setPresentingFile}
              />
            )}
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className="flex-shrink-0">
        <ControlBar
          me={me}
          micOn={media.micOn}
          camOn={media.camOn}
          screenOn={media.screenOn}
          isRecording={media.isRecording}
          handRaised={handRaised}
          activePanel={activePanel}
          onToggleMic={handleToggleMic}
          onToggleCam={handleToggleCam}
          onToggleScreen={handleToggleScreen}
          onStartRecording={media.startRecording}
          onStopRecording={media.stopRecording}
          onToggleHand={handleToggleHand}
          onLeave={handleLeave}
          onPanel={setActivePanel}
          elapsed={elapsed}
        />
      </div>

      {showNameModal && (
        <NameChangeModal
          me={me}
          onClose={() => setShowNameModal(false)}
          onChanged={newName => setMe(prev => prev ? { ...prev, display_name: newName } : prev)}
        />
      )}
    </div>
  );
}

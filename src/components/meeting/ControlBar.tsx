import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, MessageSquare, Users, ChartBar as BarChart2, Paperclip, Circle, Square, Hand } from 'lucide-react';
import { RoomParticipant } from '../../lib/supabase';

interface ControlBarProps {
  me: RoomParticipant;
  micOn: boolean;
  camOn: boolean;
  screenOn: boolean;
  isRecording: boolean;
  handRaised: boolean;
  activePanel: string | null;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleScreen: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onToggleHand: () => void;
  onLeave: () => void;
  onPanel: (panel: string | null) => void;
  elapsed: number;
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ControlBtn = ({
  onClick, active, danger, disabled, title, children
}: {
  onClick: () => void; active?: boolean; danger?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
      danger ? 'bg-red-600 hover:bg-red-700 text-white' :
      active ? 'bg-blue-600 hover:bg-blue-700 text-white' :
      'bg-slate-700 hover:bg-slate-600 text-slate-300'
    }`}
  >
    {children}
  </button>
);

export default function ControlBar({
  me, micOn, camOn, screenOn, isRecording, handRaised, activePanel,
  onToggleMic, onToggleCam, onToggleScreen, onStartRecording, onStopRecording,
  onToggleHand, onLeave, onPanel, elapsed
}: ControlBarProps) {
  const canMic = me.can_use_mic;
  const canCam = me.can_use_webcam;
  const canScreen = me.can_share_screen;
  const isHost = me.role === 'host' || me.role === 'co_host';

  return (
    <div className="bg-slate-800 border-t border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        {/* Left: timer + recording */}
        <div className="flex items-center gap-3 min-w-[140px]">
          {isRecording && (
            <div className="flex items-center gap-2 bg-red-900/50 border border-red-700 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-mono">در حال ضبط</span>
            </div>
          )}
          {!isRecording && (
            <div className="text-slate-500 text-xs font-mono">{formatTime(elapsed)}</div>
          )}
        </div>

        {/* Center: main controls */}
        <div className="flex items-center gap-2">
          <ControlBtn
            onClick={onToggleMic}
            active={micOn}
            disabled={!canMic}
            title={!canMic ? 'میزبان دسترسی میکروفن ندارید' : micOn ? 'خاموش کردن میکروفن' : 'روشن کردن میکروفن'}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-xs">{micOn ? 'میکروفن' : 'بی‌صدا'}</span>
          </ControlBtn>

          <ControlBtn
            onClick={onToggleCam}
            active={camOn}
            disabled={!canCam}
            title={!canCam ? 'میزبان دسترسی دوربین ندارید' : camOn ? 'خاموش کردن دوربین' : 'روشن کردن دوربین'}
          >
            {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            <span className="text-xs">{camOn ? 'دوربین' : 'دوربین خاموش'}</span>
          </ControlBtn>

          <ControlBtn
            onClick={screenOn ? onToggleScreen : onToggleScreen}
            active={screenOn}
            disabled={!canScreen}
            title={!canScreen ? 'میزبان دسترسی اشتراک صفحه ندارید' : screenOn ? 'پایان اشتراک' : 'اشتراک صفحه'}
          >
            {screenOn ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            <span className="text-xs">{screenOn ? 'پایان اشتراک' : 'اشتراک صفحه'}</span>
          </ControlBtn>

          <ControlBtn
            onClick={onToggleHand}
            active={handRaised}
            title={handRaised ? 'پایین آوردن دست' : 'بالا بردن دست'}
          >
            <Hand className="w-5 h-5" />
            <span className="text-xs">{handRaised ? 'دست پایین' : 'دست بالا'}</span>
          </ControlBtn>

          {isHost && (
            <ControlBtn
              onClick={isRecording ? onStopRecording : onStartRecording}
              active={isRecording}
              danger={isRecording}
              title={isRecording ? 'پایان ضبط' : 'شروع ضبط'}
            >
              {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Circle className="w-5 h-5" />}
              <span className="text-xs">{isRecording ? 'پایان ضبط' : 'ضبط'}</span>
            </ControlBtn>
          )}

          <div className="w-px h-10 bg-slate-600 mx-1" />

          {/* Panel buttons */}
          {[
            { key: 'chat', icon: MessageSquare, label: 'چت' },
            { key: 'participants', icon: Users, label: 'اعضا' },
            { key: 'polls', icon: BarChart2, label: 'نظرسنجی' },
            { key: 'files', icon: Paperclip, label: 'فایل' },
          ].map(btn => (
            <ControlBtn
              key={btn.key}
              onClick={() => onPanel(activePanel === btn.key ? null : btn.key)}
              active={activePanel === btn.key}
              title={btn.label}
            >
              <btn.icon className="w-5 h-5" />
              <span className="text-xs">{btn.label}</span>
            </ControlBtn>
          ))}

          <div className="w-px h-10 bg-slate-600 mx-1" />

          <button
            onClick={onLeave}
            className="flex flex-col items-center gap-1 bg-red-600 hover:bg-red-700 p-3 rounded-2xl transition-all"
            title="خروج از کلاس"
          >
            <PhoneOff className="w-5 h-5 text-white" />
            <span className="text-xs text-white">خروج</span>
          </button>
        </div>

        {/* Right: role badge */}
        <div className="min-w-[140px] flex justify-end">
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            me.role === 'host' ? 'bg-amber-900/50 text-amber-400 border border-amber-700' :
            me.role === 'co_host' ? 'bg-blue-900/50 text-blue-400 border border-blue-700' :
            me.role === 'presenter' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700' :
            'bg-slate-700 text-slate-400'
          }`}>
            {me.role === 'host' ? 'میزبان' : me.role === 'co_host' ? 'همکار میزبان' : me.role === 'presenter' ? 'ارائه‌دهنده' : 'شرکت‌کننده'}
          </span>
        </div>
      </div>
    </div>
  );
}

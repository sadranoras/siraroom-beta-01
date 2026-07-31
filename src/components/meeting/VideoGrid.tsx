import { useEffect, useRef } from 'react';
import { User, MicOff, Hand, Monitor } from 'lucide-react';
import { RoomParticipant, RoomFile } from '../../lib/supabase';

interface VideoGridProps {
  participants: RoomParticipant[];
  me: RoomParticipant;
  camOn: boolean;
  camVideoRef: React.RefObject<HTMLVideoElement | null>;
  screenOn?: boolean;
  screenStream?: MediaStream | null;
  presentingFile?: RoomFile | null;
  raisedHands?: Set<string>;
  remoteStreams?: Record<string, MediaStream>;
}

export default function VideoGrid({
  participants,
  me,
  camOn,
  camVideoRef,
  screenOn,
  screenStream,
  raisedHands,
  remoteStreams = {},
}: VideoGridProps) {
  const localScreenVideoRef = useRef<HTMLVideoElement | null>(null);

  // پیدا کردن کسی که در حال شیر کردن صفحه است (از طریق دیتابیس یا وضعیت محلی)
  const presenter = participants.find((p: any) => p.is_screen_sharing) || (screenOn ? me : null);
  const isSomeoneSharing = !!presenter || screenOn;
  const isMeSharing = screenOn || (presenter?.id === me.id);

  useEffect(() => {
    if (isMeSharing && screenStream && localScreenVideoRef.current) {
      localScreenVideoRef.current.srcObject = screenStream;
    }
  }, [isMeSharing, screenStream]);

  return (
    <div className="w-full h-full p-3 bg-slate-950 flex flex-col gap-3 overflow-hidden">
      
      {/* کادر اصلی و بزرگ اشتراک گذاری صفحه */}
      {isSomeoneSharing && (
        <div className="relative w-full flex-1 bg-black rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-2xl flex items-center justify-center min-h-0">
          {isMeSharing ? (
            <video
  ref={videoRef}
  autoPlay
  playsInline
  controls={false}
  className="w-full h-full object-cover"
/>
          ) : (
            <RemoteScreenVideo
              stream={remoteStreams[`${presenter?.id}-screen`] || remoteStreams[presenter?.id || '']}
            />
          )}

          <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>
              {isMeSharing ? 'صفحه نمایش شما' : `صفحه نمایش ${presenter?.display_name || 'کاربر'}`}
            </span>
          </div>
        </div>
      )}

      {/* نوار وب‌کم‌ها */}
      <div
        className={`w-full transition-all duration-300 ${
          isSomeoneSharing
            ? 'h-36 flex-shrink-0 flex items-center gap-3 overflow-x-auto py-1'
            : 'h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto'
        }`}
      >
        <div className={isSomeoneSharing ? 'w-52 h-full flex-shrink-0' : 'w-full h-full'}>
          <UserCamTile me={me} camOn={camOn} camVideoRef={camVideoRef} raisedHands={raisedHands} />
        </div>

        {participants
          .filter(p => p.id !== me.id)
          .map(participant => (
            <div
              key={participant.id}
              className={isSomeoneSharing ? 'w-52 h-full flex-shrink-0' : 'w-full h-full'}
            >
              <RemoteVideoTile
                participant={participant}
                stream={remoteStreams[participant.id]}
                isHandRaised={raisedHands?.has(participant.id)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}

function RemoteScreenVideo({ stream }: { stream?: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">در حال دریافت تصویر صفحه از طریق شبکه...</span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-contain aspect-video"
    />
  );
}

function UserCamTile({ me, camOn, camVideoRef, raisedHands }: any) {
  return (
    <div className="relative w-full h-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
      {camOn ? (
        <video
          ref={camVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform -scale-x-100"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-slate-300 text-xs font-medium">{me.display_name}</span>
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded">
        {me.display_name} (شما)
      </div>
      {!me.is_mic_on && (
        <div className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full text-white">
          <MicOff className="w-3 h-3" />
        </div>
      )}
      {raisedHands?.has(me.id) && (
        <div className="absolute top-2 left-2 bg-amber-500/80 p-1 rounded-full text-white animate-bounce">
          <Hand className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

function RemoteVideoTile({ participant, stream, isHandRaised }: { participant: RoomParticipant; stream?: MediaStream; isHandRaised?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-slate-300 text-xs font-medium">{participant.display_name}</span>
        </div>
      )}
      <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded">
        {participant.display_name}
      </div>
      {!participant.is_mic_on && (
        <div className="absolute top-2 right-2 bg-red-500/80 p-1 rounded-full text-white">
          <MicOff className="w-3 h-3" />
        </div>
      )}
      {isHandRaised && (
        <div className="absolute top-2 left-2 bg-amber-500/80 p-1 rounded-full text-white animate-bounce">
          <Hand className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}


import { useEffect, useRef, useState } from 'react';

export function useWebRTC(
  userId: string,
  camStream: MediaStream | null,
  screenStream: MediaStream | null
) {
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const peerCamRef = useRef<any>(null);
  const peerScreenRef = useRef<any>(null);

  // ۱. مدیریت اتصال دوربین (Peer اصلی)
  useEffect(() => {
    if (!userId) return;

    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer(userId);
      peerCamRef.current = peer;

      peer.on('call', (call: any) => {
        const answerStream = new MediaStream();

if (camStream) {
  camStream.getTracks().forEach(track => {
    answerStream.addTrack(track);
  });
}

if (micStream) {
  micStream.getTracks().forEach(track => {
    answerStream.addTrack(track);
  });
}

call.answer(answerStream);
        call.on('stream', (remoteStream: MediaStream) => {
          setRemoteStreams(prev => ({ ...prev, [call.peer]: remoteStream }));
        });
      });
    });

    return () => {
      peerCamRef.current?.destroy();
    };
  }, [userId]);

  // ۲. مدیریت اتصال اختصاصی اسکرین‌شیر (Peer ثانویه با پسوند -screen)
  useEffect(() => {
    if (!userId) return;
    const screenPeerId = `${userId}-screen`;

    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer(screenPeerId);
      peerScreenRef.current = peer;

      peer.on('call', (call: any) => {
        // پاسخ به درخواست اسکرین‌شیر با استریم اسکرین خودمان
call.answer(screenStream ?? new MediaStream());        
        call.on('stream', (remoteStream: MediaStream) => {
          // استخراج شناسه کاربری اصلی از روی پرشین‌کال یا PeerID
          const rawPeerId = call.peer.includes('-screen') ? call.peer.replace('-screen', '') : call.peer;
          setRemoteStreams(prev => ({ ...prev, [`${rawPeerId}-screen`]: remoteStream }));
        });
      });
    });

    return () => {
      peerScreenRef.current?.destroy();
    };
  }, [userId, screenStream]);

  // ۳. متد برقراری ارتباط با سایر کاربران حاضر در اتاق
  const connectToUser = (remoteUserId: string) => {
    if (!peerCamRef.current || remoteUserId === userId) return;

    // اتصال و دریافت استریم دوربین کاربر مقابل
    if (camStream) {
      const call = peerCamRef.current.call(remoteUserId, camStream);
      call?.on('stream', (remoteStream: MediaStream) => {
        setRemoteStreams(prev => ({ ...prev, [remoteUserId]: remoteStream }));
      });
    }

    // اتصال و دریافت استریم اسکرین‌شیر کاربر مقابل (با پسوند -screen)
    if (peerScreenRef.current) {
      const screenTargetId = `${remoteUserId}-screen`;
const screenCall = peerScreenRef.current.call(
  screenTargetId,
  screenStream ?? new MediaStream()
);      
      screenCall?.on('stream', (remoteStream: MediaStream) => {
        setRemoteStreams(prev => ({ ...prev, [`${remoteUserId}-screen`]: remoteStream }));
      });
    }
  };

  return { remoteStreams, connectToUser };
}

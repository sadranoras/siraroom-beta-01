import { useState, useRef } from 'react';

export function useMedia() {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const camVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // 🟢 مدیریت میکروفون
  const toggleMic = async () => {
    if (micOn) {
      forceMicOff();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setMicStream(stream);
        setMicOn(true);
      } catch (err) {
        console.error('خطا در دریافت استریم میکروفون:', err);
      }
    }
  };

  const forceMicOff = () => {
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    setMicOn(false);
  };

  // 🟢 مدیریت وب‌کم (اصلاح‌شده برای آزاد کردن سخت‌افزار)
  const toggleCam = async () => {
    if (camOn) {
      forceCamOff();
    } else {
      // 1. ابتدا اگر تراک متصل مانده بود کاملاً متوقفش کن تا قفل نکنه
      if (camStream) {
        camStream.getTracks().forEach(track => track.stop());
      }

      try {
        // 2. دریافت استریم جدید دوربین
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCamStream(stream);
        setCamOn(true);
      } catch (err: any) {
        console.error('خطا در دریافت استریم دوربین:', err);
        setCamOn(false);
        setCamStream(null);

        if (err.name === 'NotReadableError') {
          alert('دوربین سیستم شما در حال حاضر توسط نرم‌افزار دیگری (مثل Zoom، OBS یا تب دیگر) در حال استفاده است. لطفا آن را ببندید.');
        } else if (err.name === 'NotAllowedError') {
          alert('دسترسی به دوربین توسط مرورگر مسدود شده است. لطفا از بالای مرورگر اجازه دسترسی بدهید.');
        }
      }
    }
  };

  const forceCamOff = () => {
    if (camStream) {
      camStream.getTracks().forEach(track => track.stop());
      setCamStream(null);
    }
    if (camVideoRef.current) {
      camVideoRef.current.srcObject = null;
    }
    setCamOn(false);
  };

  const startScreenShare = async () => {
  try {
    // اگر قبلاً استریمی وجود داشت، آن را متوقف کن.
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    setScreenStream(stream);
    setScreenOn(true);

    const videoTrack = stream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.onended = () => {
        forceScreenOff();
      };
    }

    return stream;
  } catch (err) {
    console.error("خطا در اشتراک صفحه:", err);
    return null;
  }
};

const stopScreenShare = () => {
  forceScreenOff();
};

  const forceScreenOff = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setScreenOn(false);
  };

  // 🟢 مدیریت ضبط جلسه
  const startRecording = () => {
    try {
      const streamsToRecord: MediaStreamTrack[] = [];
      if (camStream) camStream.getVideoTracks().forEach(t => streamsToRecord.push(t));
      if (micStream) micStream.getAudioTracks().forEach(t => streamsToRecord.push(t));

      if (streamsToRecord.length === 0) {
        alert('برای ضبط، حداقل باید میکروفون یا دوربین شما روشن باشد.');
        return;
      }

      const combinedStream = new MediaStream(streamsToRecord);
      const mediaRecorder = new MediaRecorder(combinedStream);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error('خطا در شروع ضبط:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return {
    micOn,
    camOn,
    screenOn,
    isRecording,
    micStream,
    camStream,
    screenStream,
    camVideoRef,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    forceMicOff,
    forceCamOff,
    forceScreenOff,
    startRecording,
    stopRecording,
  };
}
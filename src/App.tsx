import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import JoinRoomPage from './pages/JoinRoomPage';
import MeetingRoomPage from './pages/MeetingRoomPage';

export type AppView =
  | { type: 'landing' }
  | { type: 'auth'; mode?: 'login' | 'register' }
  | { type: 'dashboard' }
  | { type: 'join'; code?: string }
  | { type: 'meeting'; roomId: string; roomCode: string; participantId: string; sessionToken?: string };

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>({ type: 'landing' });

  useEffect(() => {
    if (!loading && user && view.type === 'auth') {
      setView({ type: 'dashboard' });
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const goToMeeting = (roomId: string, roomCode: string, participantId: string, sessionToken?: string) => {
    setView({ type: 'meeting', roomId, roomCode, participantId, sessionToken });
  };

  if (view.type === 'meeting') {
    return (
      <MeetingRoomPage
        roomId={view.roomId}
        roomCode={view.roomCode}
        participantId={view.participantId}
        sessionToken={view.sessionToken}
        onLeave={() => setView(user ? { type: 'dashboard' } : { type: 'landing' })}
      />
    );
  }

  if (view.type === 'join') {
    return (
      <JoinRoomPage
        initialCode={view.code}
        onEntered={goToMeeting}
        onBack={() => setView(user ? { type: 'dashboard' } : { type: 'landing' })}
        onAuthRequired={() => setView({ type: 'auth' })}
      />
    );
  }

  if (view.type === 'auth') {
    return (
      <AuthPage
        initialMode={view.mode}
        onSuccess={() => setView({ type: 'dashboard' })}
        onBack={() => setView({ type: 'landing' })}
      />
    );
  }

  if (view.type === 'dashboard') {
    if (!user) { setView({ type: 'landing' }); return null; }
    return (
      <DashboardPage
        onJoinRoom={(code) => setView({ type: 'join', code })}
        onSignOut={() => setView({ type: 'landing' })}

      />
    );
  }

  return (
    <LandingPage
      onGetStarted={() => setView(user ? { type: 'dashboard' } : { type: 'auth' })}
      onJoinRoom={(code) => setView({ type: 'join', code })}
      onLogin={() => setView({ type: 'auth', mode: 'login' })}
    />
  );
}

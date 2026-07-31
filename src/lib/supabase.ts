import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
}

export interface Room {
  id: string;
  title: string;
  description: string;
  host_name: string;
  room_code: string;
  is_active: boolean;
  max_participants: number;
  created_at: string;
  host_user_id: string | null;
  status: 'waiting_for_host' | 'active' | 'closed';
  access_type: 'open' | 'password' | 'list';
  room_password: string | null;
}

export interface RoomAllowedUser {
  id: string;
  room_id: string;
  display_name: string;
  access_password: string;
  created_at: string;
}

export type ParticipantRole = 'host' | 'co_host' | 'presenter' | 'attendee';
export type ParticipantStatus = 'waiting' | 'active' | 'removed';

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string | null;
  allowed_user_id: string | null;
  session_token: string | null;
  display_name: string;
  role: ParticipantRole;
  can_use_mic: boolean;
  can_use_webcam: boolean;
  can_share_screen: boolean;
  is_mic_on: boolean;
  is_webcam_on: boolean;
  is_screen_sharing: boolean;
  status: ParticipantStatus;
  joined_at: string;
}

export interface RoomMessage {
  id: string;
  room_id: string;
  participant_id: string | null;
  display_name: string;
  message: string;
  created_at: string;
}

export interface Poll {
  id: string;
  room_id: string;
  creator_participant_id: string | null;
  question: string;
  is_active: boolean;
  created_at: string;
  options?: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  vote_count: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  participant_id: string;
  created_at: string;
}

export interface RoomFile {
  id: string;
  room_id: string;
  uploader_participant_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  is_presenting: boolean;
  uploaded_at: string;
}

const GUEST_SESSION_KEY = 'siraroom_guest_session';

export function storeGuestSession(participantId: string, roomCode: string, sessionToken: string) {
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({ participantId, roomCode, sessionToken }));
}

export function getGuestSession(): { participantId: string; roomCode: string; sessionToken: string } | null {
  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearGuestSession() {
  localStorage.removeItem(GUEST_SESSION_KEY);
}

export function roleLabel(role: ParticipantRole): string {
  const labels: Record<ParticipantRole, string> = {
    host: 'میزبان',
    co_host: 'همکار میزبان',
    presenter: 'ارائه‌دهنده',
    attendee: 'شرکت‌کننده',
  };
  return labels[role];
}

export function defaultPermissionsForRole(role: ParticipantRole) {
  return {
    can_use_mic: role === 'host' || role === 'co_host' || role === 'presenter',
    can_use_webcam: role === 'host' || role === 'co_host' || role === 'presenter',
    can_share_screen: role === 'host' || role === 'co_host' || role === 'presenter',
  };
}

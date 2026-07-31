/*
# سیراروم - طرح کامل پایگاه داده

1. جداول جدید:
   - user_profiles: پروفایل کاربران (نام نمایشی، ایمیل)
   - room_allowed_users: لیست کاربران مجاز با رمز عبور جداگانه برای هر کلاس
   - room_participants: شرکت‌کنندگان فعال در اتاق با نقش و مجوزها
   - room_messages: پیام‌های چت اتاق
   - polls: نظرسنجی‌های اتاق
   - poll_options: گزینه‌های نظرسنجی
   - poll_votes: آرای نظرسنجی
   - room_files: فایل‌های آپلودشده در اتاق

2. تغییرات جدول rooms:
   - host_user_id: شناسه کاربر میزبان
   - status: وضعیت اتاق (waiting_for_host, active, closed)
   - access_type: نوع دسترسی (open, password, list)
   - room_password: رمز عبور اتاق (برای نوع password)

3. امنیت:
   - RLS روی همه جداول
   - دسترسی عمومی برای کاربران احراز هویت‌شده و مهمان (برای محیط کلاس)

4. توجه:
   - room_participants شامل هم کاربران احراز هویت‌شده (user_id) و هم مهمانان (session_token) است
   - نقش‌ها: host, co_host, presenter, attendee
   - مجوزها جداگانه از نقش کنترل می‌شوند
*/

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_user_id uuid REFERENCES auth.users(id);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'waiting_for_host';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS access_type text NOT NULL DEFAULT 'open';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_password text;

-- Room allowed users (class-specific credentials)
CREATE TABLE IF NOT EXISTS room_allowed_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  access_password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Room participants (everyone in a room session)
CREATE TABLE IF NOT EXISTS room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  allowed_user_id uuid REFERENCES room_allowed_users(id) ON DELETE SET NULL,
  session_token text,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'attendee',
  can_use_mic boolean NOT NULL DEFAULT false,
  can_use_webcam boolean NOT NULL DEFAULT false,
  can_share_screen boolean NOT NULL DEFAULT false,
  is_mic_on boolean NOT NULL DEFAULT false,
  is_webcam_on boolean NOT NULL DEFAULT false,
  is_screen_sharing boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'waiting',
  joined_at timestamptz DEFAULT now()
);

-- Room messages (chat)
CREATE TABLE IF NOT EXISTS room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES room_participants(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Polls
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  creator_participant_id uuid REFERENCES room_participants(id) ON DELETE SET NULL,
  question text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Poll options
CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  vote_count integer NOT NULL DEFAULT 0
);

-- Poll votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid REFERENCES poll_options(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES room_participants(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, participant_id)
);

-- Room files (uploaded for presentation)
CREATE TABLE IF NOT EXISTS room_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  uploader_participant_id uuid REFERENCES room_participants(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  is_presenting boolean NOT NULL DEFAULT false,
  uploaded_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_session_token ON room_participants(session_token);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_polls_room_id ON polls(room_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_room_files_room_id ON room_files(room_id);

-- Replica identity for realtime change tracking
ALTER TABLE rooms REPLICA IDENTITY FULL;
ALTER TABLE room_participants REPLICA IDENTITY FULL;
ALTER TABLE room_messages REPLICA IDENTITY FULL;
ALTER TABLE polls REPLICA IDENTITY FULL;
ALTER TABLE poll_options REPLICA IDENTITY FULL;
ALTER TABLE room_files REPLICA IDENTITY FULL;

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_files ENABLE ROW LEVEL SECURITY;

-- user_profiles policies
DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update" ON user_profiles;
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_delete" ON user_profiles;
CREATE POLICY "profiles_delete" ON user_profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- room_allowed_users policies (permissive - app-level access control)
DROP POLICY IF EXISTS "allowed_users_select" ON room_allowed_users;
CREATE POLICY "allowed_users_select" ON room_allowed_users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "allowed_users_insert" ON room_allowed_users;
CREATE POLICY "allowed_users_insert" ON room_allowed_users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "allowed_users_update" ON room_allowed_users;
CREATE POLICY "allowed_users_update" ON room_allowed_users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "allowed_users_delete" ON room_allowed_users;
CREATE POLICY "allowed_users_delete" ON room_allowed_users FOR DELETE TO anon, authenticated USING (true);

-- room_participants policies
DROP POLICY IF EXISTS "participants_select" ON room_participants;
CREATE POLICY "participants_select" ON room_participants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "participants_insert" ON room_participants;
CREATE POLICY "participants_insert" ON room_participants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "participants_update" ON room_participants;
CREATE POLICY "participants_update" ON room_participants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "participants_delete" ON room_participants;
CREATE POLICY "participants_delete" ON room_participants FOR DELETE TO anon, authenticated USING (true);

-- room_messages policies
DROP POLICY IF EXISTS "messages_select" ON room_messages;
CREATE POLICY "messages_select" ON room_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "messages_insert" ON room_messages;
CREATE POLICY "messages_insert" ON room_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "messages_update" ON room_messages;
CREATE POLICY "messages_update" ON room_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "messages_delete" ON room_messages;
CREATE POLICY "messages_delete" ON room_messages FOR DELETE TO anon, authenticated USING (true);

-- polls policies
DROP POLICY IF EXISTS "polls_select" ON polls;
CREATE POLICY "polls_select" ON polls FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "polls_insert" ON polls;
CREATE POLICY "polls_insert" ON polls FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "polls_update" ON polls;
CREATE POLICY "polls_update" ON polls FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "polls_delete" ON polls;
CREATE POLICY "polls_delete" ON polls FOR DELETE TO anon, authenticated USING (true);

-- poll_options policies
DROP POLICY IF EXISTS "poll_options_select" ON poll_options;
CREATE POLICY "poll_options_select" ON poll_options FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "poll_options_insert" ON poll_options;
CREATE POLICY "poll_options_insert" ON poll_options FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "poll_options_update" ON poll_options;
CREATE POLICY "poll_options_update" ON poll_options FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "poll_options_delete" ON poll_options;
CREATE POLICY "poll_options_delete" ON poll_options FOR DELETE TO anon, authenticated USING (true);

-- poll_votes policies
DROP POLICY IF EXISTS "poll_votes_select" ON poll_votes;
CREATE POLICY "poll_votes_select" ON poll_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "poll_votes_insert" ON poll_votes;
CREATE POLICY "poll_votes_insert" ON poll_votes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "poll_votes_update" ON poll_votes;
CREATE POLICY "poll_votes_update" ON poll_votes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "poll_votes_delete" ON poll_votes;
CREATE POLICY "poll_votes_delete" ON poll_votes FOR DELETE TO anon, authenticated USING (true);

-- room_files policies
DROP POLICY IF EXISTS "files_select" ON room_files;
CREATE POLICY "files_select" ON room_files FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "files_insert" ON room_files;
CREATE POLICY "files_insert" ON room_files FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "files_update" ON room_files;
CREATE POLICY "files_update" ON room_files FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "files_delete" ON room_files;
CREATE POLICY "files_delete" ON room_files FOR DELETE TO anon, authenticated USING (true);

-- Storage bucket for room files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('room-files', 'room-files', true, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "room_files_storage_select" ON storage.objects;
CREATE POLICY "room_files_storage_select" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'room-files');
DROP POLICY IF EXISTS "room_files_storage_insert" ON storage.objects;
CREATE POLICY "room_files_storage_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'room-files');
DROP POLICY IF EXISTS "room_files_storage_delete" ON storage.objects;
CREATE POLICY "room_files_storage_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'room-files');

-- Add tables to realtime publication
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE room_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE polls;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE room_files;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

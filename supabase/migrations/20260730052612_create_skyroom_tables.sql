
/*
# اسکای روم - ایجاد جداول پایه

1. جداول جدید
   - `rooms` - اتاق‌های جلسات
     - `id` (uuid, کلید اصلی)
     - `title` (text, عنوان اتاق)
     - `description` (text, توضیحات)
     - `host_name` (text, نام مدیر)
     - `room_code` (text, کد منحصربه‌فرد اتاق)
     - `is_active` (boolean, وضعیت اتاق)
     - `max_participants` (integer, حداکثر شرکت‌کنندگان)
     - `created_at` (timestamp)
   - `meetings` - جلسات برنامه‌ریزی شده
     - `id` (uuid, کلید اصلی)
     - `room_id` (uuid, ارجاع به اتاق)
     - `title` (text, عنوان جلسه)
     - `scheduled_at` (timestamp, زمان برگزاری)
     - `duration_minutes` (integer, مدت زمان)
     - `created_at` (timestamp)

2. امنیت
   - فعال‌سازی RLS روی همه جداول
   - دسترسی عمومی برای خواندن و نوشتن (بدون سیستم ورود)
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  host_name text NOT NULL,
  room_code text UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  is_active boolean NOT NULL DEFAULT true,
  max_participants integer NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  title text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rooms" ON rooms;
CREATE POLICY "anon_select_rooms" ON rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rooms" ON rooms;
CREATE POLICY "anon_insert_rooms" ON rooms FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rooms" ON rooms;
CREATE POLICY "anon_update_rooms" ON rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rooms" ON rooms;
CREATE POLICY "anon_delete_rooms" ON rooms FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
CREATE POLICY "anon_select_meetings" ON meetings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
CREATE POLICY "anon_insert_meetings" ON meetings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
CREATE POLICY "anon_update_meetings" ON meetings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;
CREATE POLICY "anon_delete_meetings" ON meetings FOR DELETE TO anon, authenticated USING (true);

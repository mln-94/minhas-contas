CREATE TABLE IF NOT EXISTS club_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  meet_link TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_bookings_date ON club_bookings (booking_date, status);

ALTER TABLE club_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert" ON club_bookings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public_select" ON club_bookings FOR SELECT TO anon USING (true);
CREATE POLICY "auth_all" ON club_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- RosterAI Database Schema for Supabase
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TEAMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3A5A7A',
  min_staffing INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default teams
INSERT INTO teams (team_key, name, description, color, min_staffing) VALUES
  ('NES', 'NES', 'Neurosurgery', '#3A5A7A', 2),
  ('VAS', 'VAS', 'Vascular', '#5A8A9A', 2),
  ('CLR', 'CLR', 'Colorectal', '#7FAE9A', 2),
  ('ESU', 'ESU', 'Emergency Surgical Unit', '#8A7A9A', 3),
  ('PRAS', 'PRAS', 'Plastic Surgery', '#C48A9A', 1),
  ('HPB', 'HPB', 'Hepatobiliary', '#6A8A9A', 1),
  ('UGI', 'UGI', 'Upper GI', '#9AAE7A', 2),
  ('BES', 'BES', 'Breast/Endocrine', '#D6B656', 1),
  ('URO', 'URO', 'Urology', '#B08A9A', 2)
ON CONFLICT (team_key) DO NOTHING;

-- ============================================
-- 2. HO TIERS CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ho_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  post_call BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#6B7280',
  emoji TEXT DEFAULT '⚪',
  point_multiplier DECIMAL(3,2) DEFAULT 1.0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default HO tiers
INSERT INTO ho_tiers (tier_key, label, description, enabled, post_call, color, emoji, sort_order) VALUES
  ('HO1', 'HO1', 'Active On-Call', true, true, '#C46A6A', '🔴', 1),
  ('HO2', 'HO2', 'Passive On-Call', true, true, '#B8866B', '🟠', 2),
  ('HO3', 'HO3', 'Handover HO', true, false, '#D6B656', '🟡', 3),
  ('HO4', 'HO4', 'Additional Coverage', true, false, '#7FAE9A', '🟢', 4),
  ('HO5', 'HO5', 'Custom Role 5', false, false, '#8AA1B4', '🔵', 5),
  ('HO6', 'HO6', 'Custom Role 6', false, false, '#9A8ABF', '🟣', 6),
  ('HO7', 'HO7', 'Custom Role 7', false, false, '#C48A9A', '💗', 7),
  ('HO8', 'HO8', 'Custom Role 8', false, false, '#6B9A8A', '💚', 8),
  ('HO9', 'HO9', 'Custom Role 9', false, false, '#B07A7A', '❤️', 9),
  ('HO10', 'HO10', 'Custom Role 10', false, false, '#7A7AAE', '💜', 10),
  ('HO11', 'HO11', 'Custom Role 11', false, false, '#5A8A9A', '💙', 11)
ON CONFLICT (tier_key) DO NOTHING;

-- ============================================
-- 3. DOCTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  team_key TEXT REFERENCES teams(team_key),
  role TEXT DEFAULT 'doctor' CHECK (role IN ('doctor', 'roster_admin', 'admin')),
  cumulative_points DECIMAL(10,2) DEFAULT 0,
  posting_start_date DATE,
  posting_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample doctors
INSERT INTO doctors (name, email, team_key, cumulative_points) VALUES
  ('Sarah Chen', 'sarah.chen@hospital.com', 'ESU', 17.5),
  ('Marcus Wong', 'marcus.wong@hospital.com', 'ESU', 16.0),
  ('Emily Tan', 'emily.tan@hospital.com', 'CLR', 15.0),
  ('Raj Sharma', 'raj.sharma@hospital.com', 'CLR', 17.0),
  ('Jessica Lim', 'jessica.lim@hospital.com', 'VAS', 15.5)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 4. REQUESTS TABLE (AL, CB, CR)
-- ============================================
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('AL', 'CB', 'CR', 'BL')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  approved_by UUID REFERENCES doctors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, date)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_requests_date ON requests(date);
CREATE INDEX IF NOT EXISTS idx_requests_doctor ON requests(doctor_id);

-- ============================================
-- 5. ROSTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rosters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  allocation JSONB NOT NULL DEFAULT '{}',
  call_points JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  generated_by UUID REFERENCES doctors(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_rosters_year_month ON rosters(year, month);
CREATE INDEX IF NOT EXISTS idx_rosters_status ON rosters(status);

-- ============================================
-- 6. PUBLIC HOLIDAYS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public_holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some default holidays
INSERT INTO public_holidays (date, name) VALUES
  ('2025-08-09', 'National Day'),
  ('2025-12-25', 'Christmas'),
  ('2026-01-01', 'New Year'),
  ('2026-01-29', 'Chinese New Year'),
  ('2026-01-30', 'Chinese New Year')
ON CONFLICT (date) DO NOTHING;

-- ============================================
-- 7. AUDIT LOG TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE ho_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;

-- Doctors: Everyone can read, only admins can write
CREATE POLICY "Doctors are viewable by everyone" ON doctors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage doctors" ON doctors
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM doctors WHERE role IN ('admin', 'roster_admin')
    )
  );

-- Requests: Doctors can manage their own, admins can manage all
CREATE POLICY "Doctors can view all requests" ON requests
  FOR SELECT USING (true);

CREATE POLICY "Doctors can manage their own requests" ON requests
  FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Doctors can update their own requests" ON requests
  FOR UPDATE USING (
    doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all requests" ON requests
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM doctors WHERE role IN ('admin', 'roster_admin')
    )
  );

-- Rosters: Everyone can read published, only roster_admin/admin can write
CREATE POLICY "Published rosters are viewable by everyone" ON rosters
  FOR SELECT USING (status = 'published' OR auth.uid() IN (
    SELECT user_id FROM doctors WHERE role IN ('admin', 'roster_admin')
  ));

CREATE POLICY "Admins can manage rosters" ON rosters
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM doctors WHERE role IN ('admin', 'roster_admin')
    )
  );

-- Teams: Everyone can read, only admins can write
CREATE POLICY "Teams are viewable by everyone" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage teams" ON teams
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM doctors WHERE role = 'admin'
    )
  );

-- HO Tiers: Everyone can read, only admins can write
CREATE POLICY "HO tiers are viewable by everyone" ON ho_tiers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage HO tiers" ON ho_tiers
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM doctors WHERE role = 'admin'
    )
  );

-- Public Holidays: Everyone can read, only admins can write
CREATE POLICY "Public holidays are viewable by everyone" ON public_holidays
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage public holidays" ON public_holidays
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM doctors WHERE role = 'admin'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rosters_updated_at
  BEFORE UPDATE ON rosters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ho_tiers_updated_at
  BEFORE UPDATE ON ho_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (Optional - for convenience)
-- ============================================

-- View: Doctor schedule for current month
CREATE OR REPLACE VIEW doctor_schedule AS
SELECT 
  d.id as doctor_id,
  d.name as doctor_name,
  d.team_key,
  r.date,
  r.request_type,
  r.status
FROM doctors d
LEFT JOIN requests r ON d.id = r.doctor_id
WHERE d.is_active = true;

-- View: Current month roster with doctor details
CREATE OR REPLACE VIEW current_roster AS
SELECT 
  r.year,
  r.month,
  r.allocation,
  r.call_points,
  r.status,
  r.published_at
FROM rosters r
WHERE r.year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND r.month = EXTRACT(MONTH FROM CURRENT_DATE) - 1;

-- ============================================
-- DONE! Your database is ready.
-- ============================================

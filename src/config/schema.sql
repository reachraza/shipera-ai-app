-- ============================================================
-- Shipera.AI Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Organizations ──────────────────────────────────────────
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users ──────────────────────────────────────────────────
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator')) DEFAULT 'coordinator',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Carriers ───────────────────────────────────────────────
CREATE TABLE carriers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mc_number TEXT,
  dot_number TEXT,
  equipment_types TEXT[] DEFAULT '{}',
  email TEXT,
  phone TEXT,
  insurance_expiration DATE,
  status TEXT NOT NULL CHECK (status IN ('approved', 'pending', 'suspended')) DEFAULT 'pending',
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RFPs ───────────────────────────────────────────────────
CREATE TABLE rfps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'full_truckload',
  deadline DATE,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RFP Lanes ──────────────────────────────────────────────
CREATE TABLE rfp_lanes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE NOT NULL,
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  equipment_type TEXT,
  frequency TEXT
);

-- ─── RFP Invites ────────────────────────────────────────────
CREATE TABLE rfp_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('invited', 'opened', 'submitted')) DEFAULT 'invited',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rfp_id, carrier_id)
);

-- ─── Bids ───────────────────────────────────────────────────
CREATE TABLE bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rfp_lane_id UUID REFERENCES rfp_lanes(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  rate NUMERIC(10, 2),
  transit_time TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Activity Log ───────────────────────────────────────────
CREATE TABLE activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_carriers_org ON carriers(org_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_rfps_org ON rfps(org_id);
CREATE INDEX idx_rfp_lanes_rfp ON rfp_lanes(rfp_id);
CREATE INDEX idx_rfp_invites_rfp ON rfp_invites(rfp_id);
CREATE INDEX idx_rfp_invites_carrier ON rfp_invites(carrier_id);
CREATE INDEX idx_bids_lane ON bids(rfp_lane_id);
CREATE INDEX idx_activity_log_org ON activity_log(org_id);

-- ─── Helper Functions ───────────────────────────────────────
-- Security definer function bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ─── Trigger: Auto-create Org + User on Signup ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_name_val text;
BEGIN
  -- Read the organization name from signup metadata
  org_name_val := NEW.raw_user_meta_data ->> 'org_name';

  -- Only proceed if an org_name was provided
  IF org_name_val IS NOT NULL AND org_name_val <> '' THEN
    -- Create the organization
    INSERT INTO public.organizations (name)
    VALUES (org_name_val)
    RETURNING id INTO new_org_id;

    -- Create the user profile linked to the new org
    INSERT INTO public.users (id, org_id, role, email)
    VALUES (NEW.id, new_org_id, 'admin', NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

-- Fire the trigger after a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy: users can only see data from their org
CREATE POLICY "Users can view own org" ON organizations
  FOR SELECT USING (id = public.get_user_org_id());

CREATE POLICY "Anyone can create org" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own org members" ON users
  FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can insert profile" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can manage carriers in their org" ON carriers
  FOR ALL USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can manage rfps in their org" ON rfps
  FOR ALL USING (org_id = public.get_user_org_id());

CREATE POLICY "Users can manage rfp_lanes in their org rfps" ON rfp_lanes
  FOR ALL USING (rfp_id IN (
    SELECT id FROM rfps WHERE org_id = public.get_user_org_id()
  ));

CREATE POLICY "Users can manage invites in their org rfps" ON rfp_invites
  FOR ALL USING (rfp_id IN (
    SELECT id FROM rfps WHERE org_id = public.get_user_org_id()
  ));

CREATE POLICY "Users can manage bids in their org" ON bids
  FOR ALL USING (rfp_lane_id IN (
    SELECT rl.id FROM rfp_lanes rl
    JOIN rfps r ON r.id = rl.rfp_id
    WHERE r.org_id = public.get_user_org_id()
  ));

CREATE POLICY "Users can view activity in their org" ON activity_log
  FOR ALL USING (org_id = public.get_user_org_id());

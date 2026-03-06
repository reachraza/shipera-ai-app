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
  role TEXT NOT NULL CHECK (role IN ('admin', 'coordinator', 'supervisor')) DEFAULT 'coordinator',
  email TEXT,
  full_name TEXT,
  needs_password_change BOOLEAN DEFAULT FALSE,
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

-- ─── Carrier FMCSA Data ─────────────────────────────────────
CREATE TABLE carrier_fmcsa (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL UNIQUE,
  legal_name TEXT,
  phone TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  common_authority TEXT,
  contract_authority TEXT,
  broker_authority TEXT,
  vehicle_oos_rate NUMERIC,
  driver_oos_rate NUMERIC,
  allowed_to_operate TEXT,
  raw_data JSONB DEFAULT '{}',
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
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
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed', 'awarded')) DEFAULT 'draft',
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
  frequency TEXT,
  total_hours TEXT,
  total_time TEXT
);

-- ─── RFP Invites ────────────────────────────────────────────
CREATE TABLE rfp_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rfp_id UUID REFERENCES rfps(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  access_token UUID DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL CHECK (status IN ('invited', 'opened', 'submitted')) DEFAULT 'invited',
  last_message_id TEXT, -- Stores the Message-ID of the last invitation email sent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rfp_id, carrier_id)
);

-- ─── Bids ───────────────────────────────────────────────────
CREATE TABLE bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rfp_lane_id UUID REFERENCES rfp_lanes(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID REFERENCES carriers(id) ON DELETE CASCADE NOT NULL,
  rate NUMERIC(10, 2) CHECK (rate > 0),
  transit_time TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rfp_lane_id, carrier_id)
);

-- ─── Inbound Emails ─────────────────────────────────────────
CREATE TABLE inbound_emails (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  raw_headers JSONB DEFAULT '{}',
  matched_carrier_id UUID REFERENCES carriers(id) ON DELETE SET NULL,
  rfp_id UUID REFERENCES rfps(id) ON DELETE SET NULL,
  rfp_invite_id UUID REFERENCES rfp_invites(id) ON DELETE SET NULL,
  processed BOOLEAN DEFAULT FALSE,
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
CREATE INDEX idx_carrier_fmcsa_carrier ON carrier_fmcsa(carrier_id);
CREATE INDEX idx_rfps_org ON rfps(org_id);
CREATE INDEX idx_rfp_lanes_rfp ON rfp_lanes(rfp_id);
CREATE INDEX idx_rfp_invites_rfp ON rfp_invites(rfp_id);
CREATE INDEX idx_rfp_invites_carrier ON rfp_invites(carrier_id);
CREATE UNIQUE INDEX idx_rfp_invites_access_token ON rfp_invites(access_token);
CREATE INDEX idx_bids_lane ON bids(rfp_lane_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_inbound_emails_from ON inbound_emails(from_email);
CREATE INDEX idx_inbound_emails_org ON inbound_emails(org_id);
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

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- ─── Trigger: Auto-create Org + User on Signup ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id UUID;
  org_name_val TEXT;
  invited_org_id_val UUID;
  invited_role_val TEXT;
  full_name_val TEXT;
BEGIN
  -- Extract values from user_metadata
  org_name_val := new.raw_user_meta_data->>'org_name';
  full_name_val := new.raw_user_meta_data->>'full_name';
  
  -- Attempt to CAST invited_org_id, wrap in blocks to catch JSON casting errors if null
  BEGIN
    invited_org_id_val := (new.raw_user_meta_data->>'invited_org_id')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    invited_org_id_val := NULL;
  END;
  
  invited_role_val := new.raw_user_meta_data->>'invited_role';

  -- If this is an invited user, they already belong to an org
  IF invited_org_id_val IS NOT NULL THEN
     -- Insert the user profile linked to the existing org
     -- We set needs_password_change to TRUE because we generated a random password for them
     INSERT INTO public.users (id, org_id, role, email, full_name, needs_password_change)
     VALUES (NEW.id, invited_org_id_val, COALESCE(invited_role_val, 'coordinator'), NEW.email, full_name_val, TRUE);
  
  -- Otherwise, it's a completely new signup creating their own org
  ELSIF org_name_val IS NOT NULL AND org_name_val <> '' THEN
     -- Create the new organization
     INSERT INTO public.organizations (name)
     VALUES (org_name_val)
     RETURNING id INTO new_org_id;

     -- Create the user profile linked to the new org as an admin
     -- They chose their own password so they don't need a forced reset
     INSERT INTO public.users (id, org_id, role, email, full_name, needs_password_change)
     VALUES (NEW.id, new_org_id, 'admin', NEW.email, full_name_val, FALSE);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire the trigger after a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_fmcsa ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfps ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies: Organizations
CREATE POLICY "Authenticated users can create org" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view own org" ON organizations
  FOR SELECT USING (id = public.get_user_org_id());

-- ─── RLS Policies: Users
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own org members" ON users
  FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can update user roles in org" ON users
  FOR UPDATE USING (
    org_id = public.get_user_org_id() AND 
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Admins can delete users in org" ON users
  FOR DELETE USING (
    org_id = public.get_user_org_id() AND 
    public.get_user_role() = 'admin'
  );

-- ─── RLS Policies: Carriers
CREATE POLICY "Users can view carriers in their org" ON carriers
  FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can manage carriers in their org" ON carriers
  FOR ALL USING (
    org_id = public.get_user_org_id() AND 
    public.get_user_role() = 'admin'
  );

-- ─── RLS Policies: Carrier FMCSA
CREATE POLICY "Users can view FMCSA data for their org's carriers" ON carrier_fmcsa
  FOR SELECT USING (
    carrier_id IN (
      SELECT id FROM carriers WHERE org_id = public.get_user_org_id()
    )
  );

CREATE POLICY "Admins can manage FMCSA data for their org's carriers" ON carrier_fmcsa
  FOR ALL USING (
    carrier_id IN (
      SELECT id FROM carriers WHERE org_id = public.get_user_org_id()
    ) AND public.get_user_role() = 'admin'
  );

-- ─── RLS Policies: RFPs
CREATE POLICY "Users can manage rfps in their org" ON rfps
  FOR ALL USING (org_id = public.get_user_org_id());

-- ─── RLS Policies: RFP Lanes
CREATE POLICY "Users can manage rfp_lanes in their org rfps" ON rfp_lanes
  FOR ALL USING (rfp_id IN (
    SELECT id FROM rfps WHERE org_id = public.get_user_org_id()
  ));

-- ─── RLS Policies: RFP Invites
CREATE POLICY "Users can manage invites in their org rfps" ON rfp_invites
  FOR ALL USING (rfp_id IN (
    SELECT id FROM rfps WHERE org_id = public.get_user_org_id()
  ));

-- ─── RLS Policies: Bids
CREATE POLICY "Users can manage bids in their org" ON bids
  FOR ALL USING (rfp_lane_id IN (
    SELECT rl.id FROM rfp_lanes rl
    JOIN rfps r ON r.id = rl.rfp_id
    WHERE r.org_id = public.get_user_org_id()
  ));

-- ─── RLS Policies: Inbound Emails
CREATE POLICY "Users can view inbound emails in their org" ON inbound_emails
  FOR SELECT USING (org_id = public.get_user_org_id());

-- ─── RLS Policies: Activity Log
CREATE POLICY "Users can view activity in their org" ON activity_log
  FOR ALL USING (org_id = public.get_user_org_id());

-- ─── Final Setup ────────────────────────────────────────────
-- Force PostgREST schema cache reload to ensure all types apply
NOTIFY pgrst, 'reload schema';
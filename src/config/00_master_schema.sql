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

CREATE POLICY "Users can view carriers in their org" ON carriers
  FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can manage carriers in their org" ON carriers
  FOR ALL USING (
    org_id = public.get_user_org_id() AND 
    public.get_user_role() = 'admin'
  );

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
-- 1. Create the helper function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Drop the existing general management policy
DROP POLICY IF EXISTS "Users can manage carriers in their org" ON carriers;

-- 3. Add the new separated policies for viewing and managing carriers
CREATE POLICY "Users can view carriers in their org" ON carriers
  FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY "Admins can manage carriers in their org" ON carriers
  FOR ALL USING (
    org_id = public.get_user_org_id() AND 
    public.get_user_role() = 'admin'
  );
-- ============================================================
-- Add missing Role to the check constraint if we want 'supervisor'
-- Right now role is 'admin' | 'coordinator'
-- ============================================================

-- First, drop the the role restriction temporarily to modify it
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add 'supervisor' as a valid role alongside 'admin' and 'coordinator'
ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'coordinator', 'supervisor'));

-- Enable Admins to see users in their org
DROP POLICY IF EXISTS "Users can view own org members" ON users;
CREATE POLICY "Users can view own org members" ON users
  FOR SELECT USING (org_id = public.get_user_org_id());

-- Enable Admins to update user roles in their org
DROP POLICY IF EXISTS "Admins can update user roles in org" ON users;
CREATE POLICY "Admins can update user roles in org" ON users
  FOR UPDATE USING (
    org_id = public.get_user_org_id() AND 
    public.get_user_role() = 'admin'
  );

-- Enable Admins to delete/remove users in their org
DROP POLICY IF EXISTS "Admins can delete users in org" ON users;
CREATE POLICY "Admins can delete users in org" ON users
  FOR DELETE USING (
    org_id = public.get_user_org_id() AND 
    public.get_user_role() = 'admin'
  );

-- (To create a user we use Supabase Auth API, which handles insertions)
-- ============================================================
-- Supabase Auth Trigger for Automatic Profile Creation
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures this runs with elevated privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
BEGIN
  -- Extract organization name from the raw user meta data.
  -- The AuthProvider will pass this in the signUp call: { data: { org_name: "..." } }
  -- If not provided, fallback to "My Organization"
  org_name := COALESCE(new.raw_user_meta_data->>'org_name', 'My Organization');

  -- 2. Create the organization for this new user
  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;

  -- 3. Create the user profile linked to the new organization
  INSERT INTO public.users (id, org_id, role, email)
  VALUES (new.id, new_org_id, 'admin', new.email);

  RETURN new;
END;
$$;

-- 4. Create the trigger on the built-in auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Now that the trigger handles creation securely on the backend, 
-- we can safely restore the strict RLS policies on our public tables.
DROP POLICY IF EXISTS "Anyone can create org" ON organizations;
CREATE POLICY "Authenticated users can create org" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
-- ============================================================
-- Update Auth Trigger to support Invite Links
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_name_val text;
  invited_org_id_val uuid;
  invited_role_val text;
BEGIN
  -- Read from metadata
  org_name_val := NEW.raw_user_meta_data ->> 'org_name';
  invited_org_id_val := (NEW.raw_user_meta_data ->> 'invited_org_id')::uuid;
  invited_role_val := NEW.raw_user_meta_data ->> 'invited_role';

  -- If this is an invited user, they already belong to an org
  IF invited_org_id_val IS NOT NULL THEN
     -- Insert the user profile linked to the existing org
     INSERT INTO public.users (id, org_id, role, email)
     VALUES (NEW.id, invited_org_id_val, invited_role_val, NEW.email);
  
  -- Otherwise, it's a completely new signup creating their own org
  ELSIF org_name_val IS NOT NULL AND org_name_val <> '' THEN
     -- Create the new organization
     INSERT INTO public.organizations (name)
     VALUES (org_name_val)
     RETURNING id INTO new_org_id;

     -- Create the user profile linked to the new org as an admin
     INSERT INTO public.users (id, org_id, role, email)
     VALUES (NEW.id, new_org_id, 'admin', NEW.email);
  END IF;

  RETURN NEW;
END;
$$;
-- Add the needs_password_change column to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;

-- Update the Auth Trigger to flag invited users as needing a password change
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  org_name_val text;
  invited_org_id_val uuid;
  invited_role_val text;
BEGIN
  -- Read from metadata
  org_name_val := NEW.raw_user_meta_data ->> 'org_name';
  invited_org_id_val := (NEW.raw_user_meta_data ->> 'invited_org_id')::uuid;
  invited_role_val := NEW.raw_user_meta_data ->> 'invited_role';

  -- If this is an invited user, they already belong to an org
  IF invited_org_id_val IS NOT NULL THEN
     -- Insert the user profile linked to the existing org
     -- We set needs_password_change to TRUE because we generated a random password for them
     INSERT INTO public.users (id, org_id, role, email, needs_password_change)
     VALUES (NEW.id, invited_org_id_val, invited_role_val, NEW.email, TRUE);
  
  -- Otherwise, it's a completely new signup creating their own org
  ELSIF org_name_val IS NOT NULL AND org_name_val <> '' THEN
     -- Create the new organization
     INSERT INTO public.organizations (name)
     VALUES (org_name_val)
     RETURNING id INTO new_org_id;

     -- Create the user profile linked to the new org as an admin
     -- They chose their own password so they don't need a forced reset
     INSERT INTO public.users (id, org_id, role, email, needs_password_change)
     VALUES (NEW.id, new_org_id, 'admin', NEW.email, FALSE);
  END IF;

  RETURN NEW;
END;
$$;
-- Migration to add full_name to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update the handle_new_user function to extract full_name from metadata
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
     VALUES (NEW.id, invited_org_id_val, invited_role_val, NEW.email, full_name_val, TRUE);
  
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
-- ============================================================
-- Carrier Bidding Portal Additions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add unique access token to RFP Invites
ALTER TABLE rfp_invites ADD COLUMN access_token UUID DEFAULT uuid_generate_v4();

-- Add uniquely indexed constraint so we can lookup invites by token quickly
CREATE UNIQUE INDEX idx_rfp_invites_access_token ON rfp_invites(access_token);

-- 2. Update Bids RLS to allow public inserting IF they have the right token
-- Actually, a better approach for Bids without Auth is to use a Server Action with Service Role key,
-- but we can also permit anonymous inserts if we want. Let's stick to restricting via Server Action
-- for security, so no public RLS changes on `bids` are strictly needed. 
-- However, we should ensure the existing `bids` policies don't block service role. Service role bypasses RLS anyway.

-- 3. Enhance RFP Invites RLS (if needed) to ensure the service role can update the status to 'submitted'.
-- Service Role bypasses RLS, so again, no strict RLS changes needed for the backend action.
-- Shipera.AI - FMCSA Data Refactor
-- This migration moves FMCSA-specific fields from 'carriers' to a new 'carrier_fmcsa' table.

-- 1. Create the new carrier_fmcsa table
CREATE TABLE IF NOT EXISTS carrier_fmcsa (
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

-- 1b. Ensure raw_data column exists (in case the table was created previously without it)
ALTER TABLE carrier_fmcsa ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}';

-- 2 & 3. Migrate existing data and remove fields from carriers table (Safe implementation)
DO $$
BEGIN
  -- Check if one of the old columns exists before trying to migrate
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'carriers' AND column_name = 'fmcsa_street') THEN
    
    -- Use dynamic SQL to avoid parse errors if columns are missing
    EXECUTE 'INSERT INTO carrier_fmcsa (
      carrier_id,
      street,
      city,
      state,
      zip,
      common_authority,
      contract_authority,
      broker_authority,
      vehicle_oos_rate,
      driver_oos_rate
    )
    SELECT 
      id,
      fmcsa_street,
      fmcsa_city,
      fmcsa_state,
      fmcsa_zip,
      common_authority,
      contract_authority,
      broker_authority,
      vehicle_oos_rate,
      driver_oos_rate
    FROM carriers
    ON CONFLICT (carrier_id) DO NOTHING';

    -- Now drop the columns after successful migration
    ALTER TABLE carriers
    DROP COLUMN IF EXISTS fmcsa_street,
    DROP COLUMN IF EXISTS fmcsa_city,
    DROP COLUMN IF EXISTS fmcsa_state,
    DROP COLUMN IF EXISTS fmcsa_zip,
    DROP COLUMN IF EXISTS common_authority,
    DROP COLUMN IF EXISTS contract_authority,
    DROP COLUMN IF EXISTS broker_authority,
    DROP COLUMN IF EXISTS vehicle_oos_rate,
    DROP COLUMN IF EXISTS driver_oos_rate;
    
  END IF;
END $$;

-- 4. Enable RLS on carrier_fmcsa
ALTER TABLE carrier_fmcsa ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS policies (using DO block to avoid static parser errors in Supabase)
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view FMCSA data for their org's carriers" ON carrier_fmcsa;
  DROP POLICY IF EXISTS "Admins can manage FMCSA data for their org's carriers" ON carrier_fmcsa;
  
  -- Recreate policies using dynamic SQL
  EXECUTE '
    CREATE POLICY "Users can view FMCSA data for their org''s carriers" ON carrier_fmcsa
      FOR SELECT USING (
        carrier_id IN (
          SELECT id FROM carriers WHERE org_id = public.get_user_org_id()
        )
      );
  ';

  EXECUTE '
    CREATE POLICY "Admins can manage FMCSA data for their org''s carriers" ON carrier_fmcsa
      FOR ALL USING (
        carrier_id IN (
          SELECT id FROM carriers WHERE org_id = public.get_user_org_id()
        ) AND public.get_user_role() = ''admin''
      );
  ';
END $$;

-- 6. Add index for performance
CREATE INDEX IF NOT EXISTS idx_carrier_fmcsa_carrier ON carrier_fmcsa(carrier_id);

-- 7. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
-- ============================================================
-- Inbound Emails Table
-- Stores raw emails received from carriers via webhook
-- ============================================================

CREATE TABLE IF NOT EXISTS inbound_emails (
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
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by sender email
CREATE INDEX IF NOT EXISTS idx_inbound_emails_from ON inbound_emails(from_email);

-- Index for org scoping
CREATE INDEX IF NOT EXISTS idx_inbound_emails_org ON inbound_emails(org_id);

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view inbound emails in their org" ON inbound_emails
  FOR SELECT USING (org_id = public.get_user_org_id());

-- Allow service role to insert (webhook writes bypass RLS)
-- No insert policy needed for authenticated users — only the webhook inserts.
-- ============================================================
-- Enforce Positive Bid Rates
-- ============================================================

-- Add a check constraint to ensure the rate is always greater than 0
ALTER TABLE bids ADD CONSTRAINT bids_rate_positive CHECK (rate > 0);
-- ============================================================
-- Add Total Hours and Total Time to RFPLanes
-- ============================================================

ALTER TABLE rfp_lanes ADD COLUMN total_hours TEXT;
ALTER TABLE rfp_lanes ADD COLUMN total_time TEXT;
-- ============================================================
-- Add Status to Bids
-- ============================================================

-- Add status column with check constraint
ALTER TABLE bids ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Index for faster status lookups
CREATE INDEX idx_bids_status ON bids(status);
-- ============================================================
-- Add Awarded Status to RFPs
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the existing check constraint on the status column
ALTER TABLE rfps DROP CONSTRAINT IF EXISTS rfps_status_check;

-- Add the new check constraint including 'awarded'
ALTER TABLE rfps ADD CONSTRAINT rfps_status_check CHECK (status IN ('draft', 'active', 'closed', 'awarded'));

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

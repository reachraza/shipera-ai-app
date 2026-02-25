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

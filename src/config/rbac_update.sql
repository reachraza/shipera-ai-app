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

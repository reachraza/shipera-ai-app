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

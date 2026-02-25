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

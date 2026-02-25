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

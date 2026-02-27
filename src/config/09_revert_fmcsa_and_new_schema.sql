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

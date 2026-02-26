-- Shipera.AI - FMCSA Extended Field Definitions
-- These fields store the official data verified from the FMCSA Registry

ALTER TABLE carriers
ADD COLUMN IF NOT EXISTS fmcsa_street TEXT,
ADD COLUMN IF NOT EXISTS fmcsa_city TEXT,
ADD COLUMN IF NOT EXISTS fmcsa_state TEXT,
ADD COLUMN IF NOT EXISTS fmcsa_zip TEXT,
ADD COLUMN IF NOT EXISTS common_authority TEXT,
ADD COLUMN IF NOT EXISTS contract_authority TEXT,
ADD COLUMN IF NOT EXISTS broker_authority TEXT,
ADD COLUMN IF NOT EXISTS vehicle_oos_rate NUMERIC,
ADD COLUMN IF NOT EXISTS driver_oos_rate NUMERIC;

-- ============================================================
-- Enforce Unique Bids per Lane per Carrier
-- ============================================================

-- Add a unique constraint to prevent a carrier from submitting multiple bids for the same lane
ALTER TABLE bids ADD CONSTRAINT bids_rfp_lane_id_carrier_id_key UNIQUE (rfp_lane_id, carrier_id);

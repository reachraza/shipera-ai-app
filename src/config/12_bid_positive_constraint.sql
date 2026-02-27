-- ============================================================
-- Enforce Positive Bid Rates
-- ============================================================

-- Add a check constraint to ensure the rate is always greater than 0
ALTER TABLE bids ADD CONSTRAINT bids_rate_positive CHECK (rate > 0);

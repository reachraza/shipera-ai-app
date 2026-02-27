-- ============================================================
-- Add Status to Bids
-- ============================================================

-- Add status column with check constraint
ALTER TABLE bids ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Index for faster status lookups
CREATE INDEX idx_bids_status ON bids(status);

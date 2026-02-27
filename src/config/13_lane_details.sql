-- ============================================================
-- Add Total Hours and Total Time to RFPLanes
-- ============================================================

ALTER TABLE rfp_lanes ADD COLUMN total_hours TEXT;
ALTER TABLE rfp_lanes ADD COLUMN total_time TEXT;

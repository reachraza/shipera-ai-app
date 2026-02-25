-- ============================================================
-- Carrier Bidding Portal Additions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add unique access token to RFP Invites
ALTER TABLE rfp_invites ADD COLUMN access_token UUID DEFAULT uuid_generate_v4();

-- Add uniquely indexed constraint so we can lookup invites by token quickly
CREATE UNIQUE INDEX idx_rfp_invites_access_token ON rfp_invites(access_token);

-- 2. Update Bids RLS to allow public inserting IF they have the right token
-- Actually, a better approach for Bids without Auth is to use a Server Action with Service Role key,
-- but we can also permit anonymous inserts if we want. Let's stick to restricting via Server Action
-- for security, so no public RLS changes on `bids` are strictly needed. 
-- However, we should ensure the existing `bids` policies don't block service role. Service role bypasses RLS anyway.

-- 3. Enhance RFP Invites RLS (if needed) to ensure the service role can update the status to 'submitted'.
-- Service Role bypasses RLS, so again, no strict RLS changes needed for the backend action.

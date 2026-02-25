import { createClient } from '@/config/supabase';
import { Bid, RFPInvite } from '@/constants/types';

// ============================================================================
// CARRIER-FACING BIDDING SERVICES (Uses Service Role or public access)
// ============================================================================

/**
 * Validates a bidding access token and returns the associated RFP Invite details.
 * Used by the public bidding page to authenticate the carrier without a login.
 */
export async function getInviteByToken(token: string): Promise<RFPInvite | null> {
    const supabase = createClient();

    // Note: We use the anon client here, so RLS must allow selecting rfp_invites
    // based on the access_token. If RLS blocks it, we would need to use a 
    // service role client on the server side (Server Action).
    const { data, error } = await supabase
        .from('rfp_invites')
        .select('*, carrier:carriers(*)')
        .eq('access_token', token)
        .single();

    if (error || !data) {
        console.error('Error fetching invite by token:', error);
        return null;
    }

    return data as RFPInvite;
}

/**
 * Submits bids for a carrier for specific RFP lanes.
 */
export async function submitBids(
    inviteId: string,
    carrierId: string,
    bids: Omit<Bid, 'id' | 'created_at'>[]
) {
    const supabase = createClient();

    // 1. Insert all bids
    const { error: bidsError } = await supabase
        .from('bids')
        .upsert(
            bids.map(bid => ({
                ...bid,
                carrier_id: carrierId
            })),
            { onConflict: 'rfp_lane_id,carrier_id' } // Assuming we add a unique constraint or just insert
        );

    if (bidsError) {
        throw new Error(`Failed to submit bids: ${bidsError.message}`);
    }

    // 2. Update invite status to 'submitted'
    const { error: inviteError } = await supabase
        .from('rfp_invites')
        .update({ status: 'submitted' })
        .eq('id', inviteId);

    if (inviteError) {
        console.error('Failed to update invite status:', inviteError);
    }

    return true;
}

// ============================================================================
// SHIPPER-FACING BIDDING SERVICES (Uses standard authenticated client)
// ============================================================================

/**
 * Fetches all bids submitted against a specific RFP.
 * Returns the bids joined with carrier details and lane details.
 */
export async function getBidsForRFP(rfpId: string): Promise<any[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('bids')
        .select(`
      *,
      carrier:carriers(id, name, mc_number, contact_email, contact_phone),
      lane:rfp_lanes(id, origin_city, origin_state, destination_city, destination_state, equipment_type)
    `)
        .eq('lane.rfp_id', rfpId);

    if (error) {
        throw new Error(`Failed to fetch bids: ${error.message}`);
    }

    // Supabase inner join filtering quirk workaround
    // It returns all bids, but if the lane.rfp_id doesn't match, `lane` is null
    return (data || []).filter((bid: any) => bid.lane !== null);
}

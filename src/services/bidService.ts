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

    // 3. Fetch org_id and rfp_id from invite to log activity
    const { data: inviteData } = await supabase
        .from('rfp_invites')
        .select('rfp_id, rfps(org_id, title), carrier:carriers(name)')
        .eq('id', inviteId)
        .single();

    if (inviteData && inviteData.rfps && inviteData.carrier) {
        try {
            const { logActivity } = await import('./activityService');
            // Since this is a public endpoint, we don't have a user_id.
            // We'll pass the carrier_id as the user_id for tracking, or a system placeholder.
            // But logActivity might require a valid UUID matching a user. 
            // In Shipera, activity_log user_id might be nullable or we can just pass the carrier ID
            // Let's pass the carrier_ids since it's a UUID, it will just not resolve to an admin user in UI.
            await logActivity(
                (inviteData.rfps as any).org_id,
                carrierId,
                'create',
                'bid',
                bids[0].rfp_lane_id, // entity_id
                {
                    rfp_id: inviteData.rfp_id,
                    rfp_title: (inviteData.rfps as any).title,
                    carrier_name: (inviteData.carrier as any).name
                }
            );
        } catch (err) {
            console.error('Failed to log bid submission activity:', err);
        }
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
export async function getBidsForRFP(rfpId: string): Promise<Bid[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('bids')
        .select(`
      *,
      carrier:carriers(id, name, mc_number, contact_email:email, contact_phone:phone),
      lane:rfp_lanes(id, origin_city, origin_state, destination_city, destination_state, equipment_type)
    `)
        .eq('lane.rfp_id', rfpId);

    if (error) {
        throw new Error(`Failed to fetch bids: ${error.message}`);
    }

    // Supabase inner join filtering quirk workaround
    // It returns all bids, but if the lane.rfp_id doesn't match, `lane` is null
    return (data || []).filter((bid) => bid.lane !== null) as unknown as Bid[];
}

/**
 * Accepts a specific bid and rejects all other bids for that same lane.
 */
export async function acceptBid(bidId: string, laneId: string): Promise<boolean> {
    const supabase = createClient();

    // 1. Mark the selected bid as 'accepted'
    const { error: acceptError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId);

    if (acceptError) throw new Error(`Failed to accept bid: ${acceptError.message}`);

    // 2. Mark all other bids for the SAME LANE as 'rejected'
    const { error: rejectError } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('rfp_lane_id', laneId)
        .neq('id', bidId);

    if (rejectError) {
        console.error('Error rejecting other bids:', rejectError);
    }

    return true;
}

/**
 * Accepts ALL bids from a carrier for a specific RFP and rejects competitors for those lanes.
 */
export async function acceptAllCarrierBids(rfpId: string, carrierId: string): Promise<boolean> {
    const supabase = createClient();

    // 1. Fetch all bids from this carrier for this RFP to identify the lanes
    const { data: carrierBids, error: fetchError } = await supabase
        .from('bids')
        .select('id, rfp_lane_id, lane:rfp_lanes!inner(rfp_id)')
        .eq('carrier_id', carrierId)
        .eq('lane.rfp_id', rfpId);

    if (fetchError || !carrierBids) {
        throw new Error(`Failed to fetch carrier bids: ${fetchError?.message}`);
    }

    if (carrierBids.length === 0) return true;

    const bidIds = carrierBids.map(b => b.id);
    const laneIds = carrierBids.map(b => b.rfp_lane_id);

    // 2. Mark all of this carrier's bids as 'accepted'
    const { error: acceptError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .in('id', bidIds);

    if (acceptError) throw new Error(`Failed to accept bids: ${acceptError.message}`);

    // 3. Mark all OTHER bids for these lanes as 'rejected'
    const { error: rejectError } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .in('rfp_lane_id', laneIds)
        .neq('carrier_id', carrierId);

    if (rejectError) {
        console.error('Error rejecting competitor bids:', rejectError);
    }

    return true;
}

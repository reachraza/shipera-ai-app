import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    // Initialize a Server-Side ONLY client inside the handler
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { token } = await params;

        // 1. Fetch the Invite along with Carrier and RFP details
        const { data: invite, error: inviteError } = await supabase
            .from('rfp_invites')
            .select(`
        *,
        carrier:carriers(*),
        rfp:rfps(*)
      `)
            .eq('access_token', token)
            .single();

        if (inviteError || !invite) {
            return NextResponse.json(
                { error: 'Invalid or expired bidding link' },
                { status: 404 }
            );
        }

        // Check if RFP deadline has passed
        if (invite.rfp?.deadline) {
            const deadlineDate = new Date(invite.rfp.deadline);
            // End of the day for the deadline (if it's just a date, let's treat it as EOD UTC or let strict comparison happen)
            // For safety, let's just do a direct time comparison. If they want EOD, they should set the time in the DB.
            if (new Date() > deadlineDate) {
                return NextResponse.json(
                    { error: 'The submission deadline for this RFP has passed.' },
                    { status: 403 }
                );
            }
        }

        // Check if RFP is already awarded
        if (invite.rfp?.status === 'awarded') {
            return NextResponse.json(
                { error: 'This RFP has already been awarded and is closed to new bids.' },
                { status: 403 }
            );
        }

        // 2. Fetch the Lanes for this RFP
        const { data: lanes, error: lanesError } = await supabase
            .from('rfp_lanes')
            .select('*')
            .eq('rfp_id', invite.rfp_id);

        if (lanesError) {
            return NextResponse.json(
                { error: 'Failed to fetch lanes' },
                { status: 500 }
            );
        }

        // Return the combined payload
        return NextResponse.json({
            invite,
            lanes: lanes || [],
        });
    } catch (error) {
        console.error('Server error fetching bidding context:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const { token } = await params;
        const body = await request.json();
        const { bids } = body;

        if (!Array.isArray(bids) || bids.length === 0) {
            return NextResponse.json(
                { error: 'No bids provided' },
                { status: 400 }
            );
        }

        // 1. Verify token and get invite details along with RFP deadline and status
        const { data: invite, error: inviteError } = await supabase
            .from('rfp_invites')
            .select(`
                *,
                rfp:rfps(deadline, status)
            `)
            .eq('access_token', token)
            .single();

        if (inviteError || !invite) {
            return NextResponse.json(
                { error: 'Invalid or expired bidding link' },
                { status: 404 }
            );
        }

        // 1.5. Validate Deadline and Status
        const rfpData = invite.rfp as any;

        if (rfpData?.status === 'awarded') {
            return NextResponse.json(
                { error: 'This RFP has already been awarded and is closed to new bids.' },
                { status: 403 }
            );
        }

        if (rfpData?.deadline) {
            const deadlineDate = new Date(rfpData.deadline);
            if (new Date() > deadlineDate) {
                return NextResponse.json(
                    { error: 'The submission deadline for this RFP has passed.' },
                    { status: 403 }
                );
            }
        }

        // 2. Validate all bids are positive numbers
        const allPositive = bids.every((bid: { rate: number }) => bid.rate > 0);
        if (!allPositive) {
            return NextResponse.json(
                { error: 'All bid rates must be positive numbers' },
                { status: 400 }
            );
        }

        // 3. Insert Bids using Service Role (Bypasses RLS)
        const { error: bidsError } = await supabase
            .from('bids')
            .upsert(
                bids.map((bid: { rfp_lane_id: string, rate: number, transit_time: string, notes: string }) => ({
                    ...bid,
                    carrier_id: invite.carrier_id
                }))
            );

        if (bidsError) {
            console.error('Error saving bids:', bidsError);
            return NextResponse.json(
                { error: 'Failed to save bids' },
                { status: 500 }
            );
        }

        // 3. Update Invite Status
        await supabase
            .from('rfp_invites')
            .update({ status: 'submitted' })
            .eq('id', invite.id);

        // 4. Activity Logging (Notify the Organization that bids were received)
        const { data: routeData } = await supabase
            .from('rfp_lanes')
            .select(`
                rfp:rfps (
                    org_id,
                    title
                ),
                carrier:carriers!inner(name)
            `)
            .eq('id', bids[0].rfp_lane_id)
            .eq('carrier.id', invite.carrier_id)
            .single();

        // Check if data shaped correctly, supabase type mappings can be tricky on joined queries
        const orgId = routeData?.rfp && (routeData.rfp as any).org_id;

        if (orgId) {
            try {
                // Determine base carrier name
                const { data: carrierInfo } = await supabase
                    .from('carriers')
                    .select('name')
                    .eq('id', invite.carrier_id)
                    .single();

                const { logActivity } = await import('@/services/activityService');

                // Since this is a public endpoint, we pass the carrier_id as the user_id (it's legally allowed by DB schema to be UUID)
                await logActivity(
                    orgId,
                    invite.carrier_id, // Who did the action
                    'create',
                    'bid',
                    invite.rfp_id, // The entity being acted upon (The RFP)
                    {
                        rfp_title: (routeData.rfp as any).title,
                        carrier_name: carrierInfo?.name || 'A Carrier',
                        lanes_bid: bids.length
                    }
                );
            } catch (err) {
                console.error('Failed to log bid submission activity:', err);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Server error submitting bids:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

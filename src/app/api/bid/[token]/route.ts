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

        // 1. Verify token and get invite details
        const { data: invite, error: inviteError } = await supabase
            .from('rfp_invites')
            .select('*')
            .eq('access_token', token)
            .single();

        if (inviteError || !invite) {
            return NextResponse.json(
                { error: 'Invalid or expired bidding link' },
                { status: 404 }
            );
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

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Server error submitting bids:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { extractBidFromEmail } from '@/services/aiService';
import { createClient } from '@/config/supabase';

/**
 * Endpoint for the Frontend to request an on-demand AI extraction
 * when a user clicks "Auto-Fill with AI" inside the Email-to-Bid Modal.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { emailSubject, emailBody, rfpId } = body;

        if (!emailSubject || !rfpId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch the lanes for this RFP to give the AI context
        const supabase = createClient();
        const { data: lanes, error: lanesError } = await supabase
            .from('rfp_lanes')
            .select('*')
            .eq('rfp_id', rfpId);

        if (lanesError || !lanes || lanes.length === 0) {
            return NextResponse.json({ error: 'No lanes found for this RFP' }, { status: 404 });
        }

        // 2. We don't have attachments stored currently for manual review (they are just in Gmail),
        // but the plain text body is usually enough for a "best guess".
        // In the future we can link the raw attachments table to the UI.
        const extractResult = await extractBidFromEmail(emailSubject, emailBody || '', null, lanes);

        if (!extractResult) {
            return NextResponse.json({ error: 'AI Extractor unavailable or failed.' }, { status: 500 });
        }

        // 3. Keep in mind that we want the AI's "best guess" even if confidence is low,
        // because the user is going to manually review it in the UI anyway.
        return NextResponse.json({ result: extractResult });

    } catch (error: any) {
        console.error('[AI Extract API] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

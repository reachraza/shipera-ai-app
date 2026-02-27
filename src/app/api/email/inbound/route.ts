import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Inbound Email Webhook
 *
 * Receives inbound email payloads (from Resend, SendGrid, or similar)
 * and stores them in the inbound_emails table.
 *
 * Payload shape (flexible — handles Resend and generic formats):
 * {
 *   from: "sender@example.com" | { email: "...", name: "..." },
 *   to: "recipient@shipera.ai",
 *   subject: "Re: RFP Invitation",
 *   text: "Plain text body",
 *   html: "<p>HTML body</p>",
 *   attachments: [...],
 *   headers: {...}
 * }
 */
export async function POST(request: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const body = await request.json();

        // Normalize "from" field — could be string or object
        let fromEmail = '';
        let fromName = '';

        if (typeof body.from === 'string') {
            // Parse "Name <email>" format or plain email
            const match = body.from.match(/^(?:(.+?)\s*)?<?([^\s<>]+@[^\s<>]+)>?$/);
            if (match) {
                fromName = match[1]?.trim() || '';
                fromEmail = match[2]?.trim() || body.from;
            } else {
                fromEmail = body.from;
            }
        } else if (body.from?.email) {
            fromEmail = body.from.email;
            fromName = body.from.name || '';
        }

        if (!fromEmail) {
            return NextResponse.json({ error: 'Missing sender email' }, { status: 400 });
        }

        // Attempt to match sender to a known carrier
        let matchedCarrierId: string | null = null;
        let matchedOrgId: string | null = null;

        const { data: carrierMatch } = await supabase
            .from('carriers')
            .select('id, org_id')
            .eq('email', fromEmail)
            .eq('is_deleted', false)
            .limit(1)
            .maybeSingle();

        if (carrierMatch) {
            matchedCarrierId = carrierMatch.id;
            matchedOrgId = carrierMatch.org_id;
        }

        // Store the inbound email
        const { error: insertError } = await supabase
            .from('inbound_emails')
            .insert({
                org_id: matchedOrgId,
                from_email: fromEmail,
                from_name: fromName,
                to_email: typeof body.to === 'string' ? body.to : body.to?.email || null,
                subject: body.subject || '(no subject)',
                body_text: body.text || body.body_text || null,
                body_html: body.html || body.body_html || null,
                attachments: body.attachments || [],
                raw_headers: body.headers || {},
                matched_carrier_id: matchedCarrierId,
                processed: false,
            });

        if (insertError) {
            console.error('[Inbound Email] DB insert error:', insertError);
            return NextResponse.json({ error: 'Failed to store email' }, { status: 500 });
        }

        console.log(`[Inbound Email] Stored email from ${fromEmail}, carrier match: ${matchedCarrierId ? 'yes' : 'no'}`);

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('[Inbound Email] Webhook error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

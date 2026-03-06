import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchUnreadGmailMessages, markAsRead } from '@/services/gmailService';
import { extractBidFromEmail } from '@/services/aiService';
import { extractTextFromAttachment } from '@/services/attachmentService';
import { createBidFromAdmin } from '@/services/bidService';

export async function GET(request: NextRequest) {
    // Use service role key to bypass RLS (this is a backend cron job, not a user request)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        console.log('[Gmail Fetch] Starting fetch...');
        const messages = await fetchUnreadGmailMessages(20);
        console.log(`[Gmail Fetch] Found ${messages.length} unread messages.`);

        const results = {
            fetched: messages.length,
            matched: 0,
            stored: 0,
            errors: [] as string[],
        };

        for (const msg of messages) {
            console.log(`[Gmail Fetch] Processing message from: ${msg.from}, subject: ${msg.subject}`);
            try {
                // 0. Skip if we already saved this email
                if (msg.messageId) {
                    const { data: existing } = await supabase
                        .from('inbound_emails')
                        .select('id')
                        .contains('raw_headers', { messageId: msg.messageId })
                        .limit(1)
                        .maybeSingle();

                    if (existing) {
                        console.log(`[Gmail Fetch] Skipping duplicate message ${msg.id}`);
                        await markAsRead(msg.id); // Ensure it is marked as read
                        continue;
                    }
                }

                // 1. Try to find a matching RFP Invite by Message-ID references
                const allReferences = [...(msg.references || [])];
                if (msg.inReplyTo) allReferences.push(msg.inReplyTo);

                let matchedInvite = null;

                if (allReferences.length > 0) {
                    const { data: inviteMatch } = await supabase
                        .from('rfp_invites')
                        .select('id, rfp_id, carrier_id, rfps(org_id)')
                        .in('last_message_id', allReferences)
                        .limit(1)
                        .maybeSingle();

                    if (inviteMatch) {
                        matchedInvite = inviteMatch;
                        results.matched++;
                    }
                }

                // 2. Fallback: Search for Invite Access Token in the email body
                if (!matchedInvite) {
                    const tokenRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
                    const tokensInBody = msg.bodyText.match(tokenRegex) || [];
                    const tokensInHtml = msg.bodyHtml.match(tokenRegex) || [];
                    const allTokens = Array.from(new Set([...tokensInBody, ...tokensInHtml]));

                    if (allTokens.length > 0) {
                        const { data: tokenMatch } = await supabase
                            .from('rfp_invites')
                            .select('id, rfp_id, carrier_id, rfps(org_id)')
                            .in('access_token', allTokens)
                            .limit(1)
                            .maybeSingle();

                        if (tokenMatch) {
                            matchedInvite = tokenMatch;
                            results.matched++;
                        }
                    }
                }

                // 3. Fallback: Match by sender + RFP title in subject
                if (!matchedInvite) {
                    // Basic subject matching for "Re: RFP Invitation - [Title]"
                    const subjectMatch = msg.subject.match(/Re:.*—\s*(.*)/i);
                    const rfpTitle = subjectMatch ? subjectMatch[1].trim() : null;

                    if (rfpTitle) {
                        // Find carrier by email
                        const { data: carrier } = await supabase
                            .from('carriers')
                            .select('id, org_id')
                            .eq('email', msg.from.match(/<(.+?)>/)?.[1] || msg.from)
                            .limit(1)
                            .maybeSingle();

                        if (carrier) {
                            const { data: inviteByTitle } = await supabase
                                .from('rfp_invites')
                                .select('id, rfp_id, carrier_id, rfps!inner(title, org_id)')
                                .eq('carrier_id', carrier.id)
                                .ilike('rfps.title', `%${rfpTitle}%`)
                                .limit(1)
                                .maybeSingle();

                            if (inviteByTitle) {
                                matchedInvite = inviteByTitle;
                                results.matched++;
                            }
                        }
                    }
                }

                // 3. Store the email
                const { error: insertError } = await supabase
                    .from('inbound_emails')
                    .insert({
                        org_id: (matchedInvite as any)?.rfps?.org_id || null,
                        from_email: msg.from,
                        from_name: msg.from.split('<')[0]?.trim() || null,
                        to_email: msg.to,
                        subject: msg.subject,
                        body_text: msg.bodyText,
                        body_html: msg.bodyHtml,
                        matched_carrier_id: matchedInvite?.carrier_id || null,
                        rfp_id: matchedInvite?.rfp_id || null,
                        rfp_invite_id: matchedInvite?.id || null,
                        raw_headers: {
                            messageId: msg.messageId,
                            inReplyTo: msg.inReplyTo,
                            references: msg.references
                        },
                        processed: false,
                    });

                if (insertError) {
                    console.error(`[Gmail Fetch] Error storing msg ${msg.id}:`, insertError);
                    results.errors.push(`Store failed for ${msg.id}: ${insertError.message}`);
                } else {
                    console.log(`[Gmail Fetch] Successfully stored message ${msg.id}`);
                    results.stored++;

                    // --- AI AUTO-EXTRACTION ---
                    if (matchedInvite && matchedInvite.rfp_id && matchedInvite.carrier_id) {
                        try {
                            console.log(`[Gmail AI] Attempting auto-extraction for ${msg.id}`);

                            // 1. Fetch available lanes
                            const { data: lanes } = await supabase
                                .from('rfp_lanes')
                                .select('*')
                                .eq('rfp_id', matchedInvite.rfp_id);

                            if (lanes && lanes.length > 0) {
                                // 2. Parse attachments
                                let fullAttachmentText = '';
                                for (const att of msg.attachments) {
                                    if (att.data) {
                                        const buffer = Buffer.from(att.data, 'base64');
                                        const text = await extractTextFromAttachment(att.filename, att.mimeType, buffer);
                                        if (text) fullAttachmentText += `\n--- FILE: ${att.filename} ---\n${text}\n`;
                                    }
                                }

                                // 3. Run AI Extraction
                                const aiResult = await extractBidFromEmail(
                                    msg.subject,
                                    msg.bodyText || '',
                                    fullAttachmentText || null,
                                    lanes
                                );

                                if (aiResult && aiResult.confidence === 'high') {
                                    console.log(`[Gmail AI] High confidence bid extracted:`, aiResult);

                                    // 4. Create formal bid
                                    await createBidFromAdmin(
                                        matchedInvite.rfp_id,
                                        matchedInvite.carrier_id,
                                        {
                                            rfp_lane_id: aiResult.laneId,
                                            carrier_id: matchedInvite.carrier_id,
                                            rate: aiResult.rate,
                                            transit_time: aiResult.transitTime,
                                            status: 'pending',
                                            notes: aiResult.notes
                                        }
                                    );

                                    // Mark the email as "processed" since it resulted in a bid
                                    await supabase
                                        .from('inbound_emails')
                                        .update({ processed: true })
                                        .eq('raw_headers->messageId', `"${msg.messageId}"`); // JSONB queries wrap string in quotes

                                    console.log(`[Gmail AI] Successfully auto-converted email ${msg.id} to Bid!`);
                                } else {
                                    console.log(`[Gmail AI] Low confidence or no bid detected. Left for manual review.`);
                                }
                            }
                        } catch (aiErr) {
                            console.error(`[Gmail AI] Auto-extraction failed for ${msg.id}:`, aiErr);
                            // We don't fail the whole request, we just leave it for manual review
                        }
                    }
                    // --------------------------

                    // 4. Mark as read in Gmail so we don't fetch it again
                    await markAsRead(msg.id);
                }

            } catch (msgError) {
                console.error(`[Gmail Fetch] Error processing msg ${msg.id}:`, msgError);
                results.errors.push(`Processing failed for ${msg.id}: ${(msgError as Error).message}`);
            }
        }

        // 5. Cleanup unlinked emails older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { error: cleanupError } = await supabase
            .from('inbound_emails')
            .delete()
            .is('rfp_id', null)
            .lt('created_at', oneHourAgo);

        if (cleanupError) {
            console.error('[Gmail Fetch] Error during cleanup:', cleanupError);
            results.errors.push(`Cleanup failed: ${cleanupError.message}`);
        } else {
            console.log('[Gmail Fetch] Cleanup completed for unlinked emails older than 1 hour.');
        }

        return NextResponse.json(results);

    } catch (error) {
        console.error('[Gmail Fetch] Global error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

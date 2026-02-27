import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { buildInviteEmailHtml, InviteEmailPayload } from '@/services/emailService';

/**
 * Create a reusable SMTP transporter from environment variables.
 */
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

const FROM_ADDRESS = `${process.env.SMTP_FROM_NAME || 'Shipera.AI'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@shipera.ai'}>`;

export async function POST(request: NextRequest) {
    try {
        const { invites } = await request.json() as { invites: InviteEmailPayload[] };

        if (!invites || !Array.isArray(invites) || invites.length === 0) {
            return NextResponse.json({ error: 'No invite payloads provided' }, { status: 400 });
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('[Email] SMTP credentials not configured — skipping email send.');
            return NextResponse.json({
                warning: 'SMTP not configured. Invites were created but emails were not sent.',
                sent: 0,
            });
        }

        const transporter = createTransporter();

        // Verify SMTP connection before sending
        try {
            await transporter.verify();
        } catch (verifyError) {
            console.error('[Email] SMTP connection failed:', verifyError);
            return NextResponse.json(
                { error: 'SMTP connection failed. Check your SMTP credentials.' },
                { status: 503 }
            );
        }

        const results = await Promise.allSettled(
            invites.map(async (payload) => {
                const html = buildInviteEmailHtml(payload);

                const info = await transporter.sendMail({
                    from: FROM_ADDRESS,
                    to: payload.carrierEmail,
                    subject: `You're Invited to Bid — ${payload.rfpTitle}`,
                    html,
                });

                console.log(`[Email] Sent invite to ${payload.carrierEmail}, messageId: ${info.messageId}`);
                return info;
            })
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        const errors = results
            .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
            .map(r => r.reason?.message || 'Unknown error');

        return NextResponse.json({ sent, failed, errors: errors.length > 0 ? errors : undefined });

    } catch (error) {
        console.error('[Email] Server error:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Email Service — SMTP-based transactional email via Nodemailer
 *
 * Configure via .env.local:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, SMTP_FROM_NAME
 */

export interface InviteEmailPayload {
    carrierEmail: string;
    carrierName: string;
    rfpTitle: string;
    biddingUrl: string;
}

/**
 * Generates the HTML for an RFP invitation email.
 */
export function buildInviteEmailHtml(payload: InviteEmailPayload): string {
    const { carrierName, rfpTitle, biddingUrl } = payload;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RFP Invitation — Shipera.AI</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                Shipera.AI
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">
                Request for Proposal — Invitation to Bid
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#1a1a2e;font-size:16px;line-height:1.6;">
                Hello <strong>${carrierName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#4a4a6a;font-size:15px;line-height:1.7;">
                You have been invited to submit a bid for the following RFP on Shipera.AI:
              </p>

              <!-- RFP Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f7ff;border:1px solid #e8e5ff;border-radius:12px;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 4px;color:#6366f1;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">
                      RFP Title
                    </p>
                    <p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:700;">
                      ${rfpTitle}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px;color:#4a4a6a;font-size:15px;line-height:1.7;">
                Please click the button below to view the available lanes and submit your bid. You do not need an account — the link below is unique to your invitation.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${biddingUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(99,102,241,0.3);">
                      Submit Your Bid →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;color:#9ca3af;font-size:13px;line-height:1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br />
                <a href="${biddingUrl}" style="color:#6366f1;word-break:break-all;">${biddingUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #f0f0f5;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                This email was sent by Shipera.AI on behalf of the shipper. If you received this in error, please disregard.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Sends invitation emails via the server-side API route.
 * Called from the client side — hits our API which then sends via SMTP.
 */
export async function sendInviteEmails(payloads: InviteEmailPayload[]): Promise<{ success: boolean; errors?: string[] }> {
    try {
        const response = await fetch('/api/email/send-invites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ invites: payloads }),
        });

        const result = await response.json();

        if (!response.ok) {
            return { success: false, errors: [result.error || 'Failed to send emails'] };
        }

        return { success: true };
    } catch (error) {
        console.error('Error sending invite emails:', error);
        return { success: false, errors: [(error as Error).message] };
    }
}

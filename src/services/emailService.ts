/**
 * Email Service — SMTP-based transactional email via Nodemailer
 *
 * Configure via .env.local:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL, SMTP_FROM_NAME
 */

export interface InviteEmailPayload {
  inviteId: string;
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
<body style="margin:0;padding:24px 0;background-color:#09090b;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.2);border:1px solid #e2e8f0;">
          
          <!-- Header Area with Primary Brand Color -->
          <tr>
            <td style="background-color: #eab308; padding: 48px 40px; text-align: center; border-bottom: 4px solid #ca8a04;">
              <!-- Logo / Brand -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="background: #09090b; padding: 12px 24px; border-radius: 999px; display: inline-block; border: 1px solid #27272a;">
                      <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                        <span style="color:#ffffff;">Shipera</span><span style="color:#eab308;">.AI</span>
                      </h1>
                    </div>
                  </td>
                </tr>
              </table>
              <h2 style="margin:24px 0 0;color:#09090b;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                You've Been Invited to Bid
              </h2>
              <p style="margin:12px 0 0;color:#171717;font-size:15px;font-weight:600;max-width:400px;display:inline-block;">
                A new Request for Proposal (RFP) is waiting for your attention on Shipera.AI's advanced freight platform.
              </p>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding:48px 40px;background-color:#ffffff;">
              <p style="margin:0 0 20px;color:#09090b;font-size:17px;line-height:1.6;font-weight:600;">
                Hello ${carrierName},
              </p>
              <p style="margin:0 0 32px;color:#64748b;font-size:16px;line-height:1.7;">
                You are explicitly invited to participate and submit your rates for the upcoming freight requirements. Let's move freight forward together!
              </p>

              <!-- Highlighted RFP Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;margin-bottom:36px;">
                <tr>
                  <td style="padding:28px 32px;border-left:6px solid #eab308;border-radius:16px;">
                    <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">
                      Requested Proposal Title
                    </p>
                    <p style="margin:0;color:#09090b;font-size:20px;font-weight:800;line-height:1.4;">
                      ${rfpTitle}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Action Steps -->
              <p style="margin:0 0 20px;color:#09090b;font-size:16px;font-weight:700;">
                How to participate:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td width="40" valign="top" style="padding-bottom:16px;">
                    <div style="background-color:#fefce8;color:#ca8a04;width:28px;height:28px;border-radius:14px;text-align:center;line-height:28px;font-size:14px;font-weight:800;border:1px solid #fef08a;">1</div>
                  </td>
                  <td valign="top" style="padding-bottom:16px;color:#64748b;font-size:15px;line-height:1.6;">
                    <strong style="color:#09090b;">Review Lanes:</strong> Check specific origins, destinations, and volumes.
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top" style="padding-bottom:16px;">
                    <div style="background-color:#fefce8;color:#ca8a04;width:28px;height:28px;border-radius:14px;text-align:center;line-height:28px;font-size:14px;font-weight:800;border:1px solid #fef08a;">2</div>
                  </td>
                  <td valign="top" style="padding-bottom:16px;color:#64748b;font-size:15px;line-height:1.6;">
                    <strong style="color:#09090b;">Submit Rates:</strong> Provide your competitive bids on preferred routes.
                  </td>
                </tr>
                <tr>
                  <td width="40" valign="top">
                    <div style="background-color:#fefce8;color:#ca8a04;width:28px;height:28px;border-radius:14px;text-align:center;line-height:28px;font-size:14px;font-weight:800;border:1px solid #fef08a;">3</div>
                  </td>
                  <td valign="top" style="color:#64748b;font-size:15px;line-height:1.6;">
                    <strong style="color:#09090b;">Win Freight:</strong> Get awarded and start moving loads!
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                <tr>
                  <td align="center">
                    <a href="${biddingUrl}" style="display:inline-block;background-color:#eab308;color:#09090b;text-decoration:none;padding:18px 48px;border-radius:999px;font-size:16px;font-weight:800;letter-spacing:0.5px;box-shadow:0 8px 20px rgba(234,179,8,0.25);transition:all 0.3s ease;border:1px solid #ca8a04;">
                      Access Bidding Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:24px 0 0;color:#64748b;font-size:13px;">
                      No account setup required. Access link is secure and exclusive to you.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color:#f8fafc;padding:32px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:1.6;word-break:break-all;">
                Link not working? Copy & paste this URL:<br/>
                <a href="${biddingUrl}" style="color:#ca8a04;text-decoration:underline;">${biddingUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px 0;" />
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
                    &copy; ${new Date().getFullYear()} Shipera.AI. All rights reserved.<br/>
                    This document was securely generated and transmitted via the Shipera.AI platform.<br/>
                    If you received this in error, please disregard and delete immediately.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Bottom spacing -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td height="40"></td></tr>
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

/**
 * Fetches inbound emails related to a specific RFP.
 */
export async function getInboundEmailsByRFP(rfpId: string) {
  const { createClient } = await import('@/config/supabase');
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inbound_emails')
    .select('*')
    .eq('rfp_id', rfpId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

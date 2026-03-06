import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            return NextResponse.json({
                error: 'No refresh token returned. Try removing the app from your Google account and trying again.',
                tokens
            });
        }

        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                    <h1>Google Auth Successful!</h1>
                    <p>Copy this Refresh Token and add it to your <code>.env.local</code> as <code>GOOGLE_REFRESH_TOKEN</code>:</p>
                    <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; font-family: monospace; word-break: break-all; margin: 20px 0;">
                        ${tokens.refresh_token}
                    </div>
                    <p>After adding it, restart your <code>npm run dev</code> server.</p>
                </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

# Automated Email Fetching (Cron Job)

Since you don't want to manually trigger the email sync from the UI, we rely on **Cron Jobs** to automatically pull new emails from Gmail and save them to your database.

This project is configured to work perfectly with **Vercel Cron Jobs**.

## 1. How it works
There is a file in the root of your project called `vercel.json` which contains:
```json
{
  "crons": [
    {
      "path": "/api/email/fetch-gmail",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
This tells Vercel: *"Every 5 minutes, send a GET request to `/api/email/fetch-gmail`"*.

## 2. Setting it up on Vercel
1.  **Deploy your app** to Vercel (push your code to GitHub and connect it to Vercel).
2.  **Add Environment Variables**: In your Vercel project settings, go to the **Environment Variables** tab and make sure you add the following:
    *   `GOOGLE_CLIENT_ID`
    *   `GOOGLE_CLIENT_SECRET`
    *   `GOOGLE_REDIRECT_URI` (Use your production Vercel URL, e.g., `https://shipera-ai-app.vercel.app/api/auth/callback/google`)
    *   `GOOGLE_REFRESH_TOKEN` (The token we generated earlier)
3.  **Vercel automatically detects** the `vercel.json` file. You don't need to do anything else!

## 3. Security Note
Currently, anyone can visit `/api/email/fetch-gmail` to trigger the sync. If you want to secure this so *only Vercel* can trigger it, you can check for the `CRON_SECRET` environment variable (which Vercel provides automatically) inside your `route.ts`.

Example security check (optional, but recommended for production):
```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
  return new Response('Unauthorized', { status: 401 });
}
```

## 4. How this applies to RFPs
Once this cron job is running every 5 minutes:
1.  A carrier replies to an email.
2.  Within 5 minutes, Vercel hits the API.
3.  The API downloads the email, finds the `Message-ID` or `access_token`, and correctly links it to the specific RFP record in the `inbound_emails` database table.
4.  The next time you check the app or your database, the carrier's reply will automatically be there!

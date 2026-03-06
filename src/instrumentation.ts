import cron from 'node-cron';

/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js on server startup.
 * We use it to schedule a self-hosted cron job that polls the Gmail
 * inbox for new carrier replies every 5 minutes, completely replacing
 * the need for Vercel's managed Cron infrastructure.
 */
export async function register() {
    // Only run cron jobs on the server, not during build or in the browser
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log('[Cron] Registering email sync cron job (every 5 minutes)...');

        // Schedule: runs at minute 0, 5, 10, 15, ... of every hour
        cron.schedule('*/5 * * * *', async () => {
            console.log(`[Cron] Triggering email sync at ${new Date().toISOString()}`);
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const res = await fetch(`${appUrl}/api/email/fetch-gmail`);
                const data = await res.json();
                console.log('[Cron] Email sync result:', data);
            } catch (err) {
                console.error('[Cron] Email sync failed:', err);
            }
        });

        console.log('[Cron] Email sync cron job registered successfully.');
    }
}

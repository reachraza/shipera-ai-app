/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js on server startup.
 * We use it to schedule a self-hosted cron job that polls the Gmail
 * inbox for new carrier replies every 5 minutes, completely replacing
 * the need for Vercel's managed Cron infrastructure.
 *
 * Runs every 5 minutes to check for new carrier email replies.
 */

// Every 5 minutes
const CRON_SCHEDULE = '0,5,10,15,20,25,30,35,40,45,50,55 * * * *';

export async function register() {
    // Only run cron jobs on the Node.js server runtime
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Dynamic import to avoid bundling node-cron in edge/client
        const cron = (await import('node-cron')).default;
        const { markRegistered, markRunSuccess, markRunError } = await import('./lib/cronStatus');

        console.log('[Cron] Registering email sync cron job...');
        markRegistered(CRON_SCHEDULE);

        cron.schedule(CRON_SCHEDULE, async () => {
            const now = new Date().toISOString();
            const start = Date.now();
            console.log(`[Cron] Triggering email sync at ${now}`);
            try {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const res = await fetch(`${appUrl}/api/email/fetch-gmail`);
                const data = await res.json();
                const durationMs = Date.now() - start;
                console.log('[Cron] Email sync completed:', JSON.stringify(data));
                markRunSuccess(data, durationMs);
            } catch (err) {
                const durationMs = Date.now() - start;
                console.error('[Cron] Email sync failed:', err);
                markRunError(err instanceof Error ? err.message : String(err), durationMs);
            }
        });

        console.log('[Cron] Cron job registered. Runs every 5 minutes.');
    }
}

import { NextResponse } from 'next/server';
import { getCronStatus } from '@/lib/cronStatus';

/**
 * GET /api/cron/status
 *
 * Returns the current status of the self-hosted email sync cron job.
 * Useful for monitoring whether the background job is alive and healthy.
 */
export async function GET() {
    const status = getCronStatus();

    // Calculate uptime since registration
    const uptimeMs = status.registeredAt
        ? Date.now() - new Date(status.registeredAt).getTime()
        : null;

    return NextResponse.json({
        ...status,
        uptimeMs,
        uptimeHuman: uptimeMs ? formatDuration(uptimeMs) : null,
        serverTime: new Date().toISOString(),
    });
}

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

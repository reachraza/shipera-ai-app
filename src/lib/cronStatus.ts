/**
 * Global cron job status tracker.
 * This module is imported by both the instrumentation hook (to write status)
 * and the API route (to read status).
 */

export interface CronStatus {
    isRegistered: boolean;
    schedule: string;
    lastRunAt: string | null;
    lastRunResult: 'success' | 'error' | null;
    lastRunDurationMs: number | null;
    lastRunDetails: Record<string, unknown> | null;
    lastError: string | null;
    totalRuns: number;
    totalErrors: number;
    registeredAt: string | null;
}

// In-memory singleton — persists as long as the Node.js process is alive
const cronStatus: CronStatus = {
    isRegistered: false,
    schedule: '',
    lastRunAt: null,
    lastRunResult: null,
    lastRunDurationMs: null,
    lastRunDetails: null,
    lastError: null,
    totalRuns: 0,
    totalErrors: 0,
    registeredAt: null,
};

export function getCronStatus(): CronStatus {
    return { ...cronStatus };
}

export function markRegistered(schedule: string) {
    cronStatus.isRegistered = true;
    cronStatus.schedule = schedule;
    cronStatus.registeredAt = new Date().toISOString();
}

export function markRunSuccess(details: Record<string, unknown>, durationMs: number) {
    cronStatus.lastRunAt = new Date().toISOString();
    cronStatus.lastRunResult = 'success';
    cronStatus.lastRunDurationMs = durationMs;
    cronStatus.lastRunDetails = details;
    cronStatus.lastError = null;
    cronStatus.totalRuns++;
}

export function markRunError(error: string, durationMs: number) {
    cronStatus.lastRunAt = new Date().toISOString();
    cronStatus.lastRunResult = 'error';
    cronStatus.lastRunDurationMs = durationMs;
    cronStatus.lastRunDetails = null;
    cronStatus.lastError = error;
    cronStatus.totalRuns++;
    cronStatus.totalErrors++;
}

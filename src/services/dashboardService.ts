import { createClient } from '@/config/supabase';

export interface DashboardStats {
    totalRfps: number;
    activeCarriers: number;
    totalLanes: number;
    totalInvites: number;
}

export async function getDashboardStats(orgId: string, days?: number): Promise<DashboardStats> {
    const supabase = createClient();

    let cutoffDate: string | null = null;
    if (days) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        cutoffDate = d.toISOString();
    }

    // Build base queries
    let rfpsQuery = supabase.from('rfps').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
    let carriersQuery = supabase.from('carriers').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_deleted', false);
    let lanesQuery = supabase.from('rfp_lanes').select('*, rfps!inner(org_id, created_at)', { count: 'exact', head: true }).eq('rfps.org_id', orgId);
    let invitesQuery = supabase.from('rfp_invites').select('*, rfps!inner(org_id)', { count: 'exact', head: true }).eq('rfps.org_id', orgId);

    // Apply time filter if provided
    if (cutoffDate) {
        rfpsQuery = rfpsQuery.gte('created_at', cutoffDate);
        carriersQuery = carriersQuery.gte('created_at', cutoffDate);
        lanesQuery = lanesQuery.gte('rfps.created_at', cutoffDate);
        invitesQuery = invitesQuery.gte('created_at', cutoffDate);
    }

    // Execute queries in parallel
    const [rfpsRes, carriersRes, lanesRes, invitesRes] = await Promise.all([
        rfpsQuery,
        carriersQuery,
        lanesQuery,
        invitesQuery,
    ]);

    return {
        totalRfps: rfpsRes.count || 0,
        activeCarriers: carriersRes.count || 0,
        totalLanes: lanesRes.count || 0,
        totalInvites: invitesRes.count || 0,
    };
}

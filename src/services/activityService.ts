import { createClient } from '@/config/supabase';
import { ActivityLog } from '@/constants/types';

export async function getRecentActivity(orgId: string, limit: number = 5, days?: number): Promise<ActivityLog[]> {
    const supabase = createClient();

    let query = supabase
        .from('activity_log')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (days) {
        const d = new Date();
        d.setDate(d.getDate() - days);
        query = query.gte('created_at', d.toISOString());
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching activity log:', error);
        return [];
    }

    return data as ActivityLog[];
}

export async function logActivity(
    orgId: string,
    userId: string,
    actionType: ActivityLog['action_type'],
    entityType: ActivityLog['entity_type'],
    entityId: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('activity_log')
        .insert({
            org_id: orgId,
            user_id: userId,
            action_type: actionType,
            entity_type: entityType,
            entity_id: entityId,
            metadata: metadata || {}
        });

    if (error) {
        console.error('Failed to write activity log:', error);
    }
}

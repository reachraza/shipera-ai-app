import { createClient } from '@/config/supabase';
import { User, UserRole } from '@/constants/types';

export async function getOrganizationUsers(orgId: string): Promise<User[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as User[];
}

export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) throw error;
}

export async function removeUserFromOrg(userId: string): Promise<void> {
    const supabase = createClient();
    // Simply deletes the user profile; they effectively lose access to the org.
    // We leave the auth.users record intact for now, as deleting that requires Service Role.
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) throw error;
}

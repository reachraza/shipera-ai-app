import { createClient } from '@/config/supabase';
import { RFP, RFPFormData } from '@/constants/types';

export async function getRFPs(orgId: string): Promise<RFP[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('rfps')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as RFP[];
}

export async function getRFP(id: string): Promise<RFP> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('rfps')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as RFP;
}

export async function createRFP(orgId: string, rfp: RFPFormData): Promise<RFP> {
  const supabase = createClient();

  const payload = {
    ...rfp,
    org_id: orgId,
    status: 'draft',
    deadline: rfp.deadline || null,
  };

  const { data, error } = await supabase
    .from('rfps')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { logActivity } = await import('./activityService');
    await logActivity(orgId, user.id, 'create', 'rfp', data.id, { title: data.title });
  }

  return data as RFP;
}

export async function updateRFP(id: string, rfp: Partial<RFPFormData>): Promise<RFP> {
  const supabase = createClient();

  const payload: Partial<RFPFormData> = { ...rfp };
  if (payload.deadline === '') {
    payload.deadline = null;
  }

  const { data, error } = await supabase
    .from('rfps')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { logActivity } = await import('./activityService');
    await logActivity(data.org_id, user.id, 'update', 'rfp', data.id, { title: data.title });
  }

  return data as RFP;
}

export async function updateRFPStatus(id: string, status: RFP['status']): Promise<RFP> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('rfps')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { logActivity } = await import('./activityService');
    await logActivity(data.org_id, user.id, 'update', 'rfp', data.id, {
      title: data.title,
      new_status: status
    });
  }

  return data as RFP;
}

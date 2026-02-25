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
  return data as RFP;
}

export async function updateRFP(id: string, rfp: Partial<RFPFormData>): Promise<RFP> {
  const supabase = createClient();
  
  const payload = { ...rfp };
  if (payload.deadline === '') {
    payload.deadline = null as any;
  }

  const { data, error } = await supabase
    .from('rfps')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RFP;
}

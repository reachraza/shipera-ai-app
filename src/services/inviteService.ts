import { createClient } from '@/config/supabase';
import { RFPInvite } from '@/constants/types';

export async function getInvitesByRFP(rfpId: string): Promise<RFPInvite[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('rfp_invites')
    .select('*, carrier:carriers(*)')
    .eq('rfp_id', rfpId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as RFPInvite[];
}

export async function createInvites(rfpId: string, carrierIds: string[]): Promise<RFPInvite[]> {
  const supabase = createClient();
  const rows = carrierIds.map((carrierId) => ({
    rfp_id: rfpId,
    carrier_id: carrierId,
    status: 'invited' as const,
  }));

  const { data, error } = await supabase
    .from('rfp_invites')
    .insert(rows)
    .select('*, carrier:carriers(*)');

  if (error) throw error;
  return data as RFPInvite[];
}

export async function removeInvite(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('rfp_invites')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

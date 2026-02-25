import { createClient } from '@/config/supabase';
import { Carrier, CarrierFormData } from '@/constants/types';

export async function getCarriers(orgId: string): Promise<Carrier[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('carriers')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Carrier[];
}

export async function getCarrier(id: string): Promise<Carrier> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('carriers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Carrier;
}

export async function createCarrier(orgId: string, carrier: CarrierFormData): Promise<Carrier> {
  const supabase = createClient();

  const payload = {
    ...carrier,
    org_id: orgId,
    insurance_expiration: carrier.insurance_expiration || null,
  };

  const { data, error } = await supabase
    .from('carriers')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Import this at the top of the file: import { logActivity } from './activityService';
    // We'll add the import via another chunk but for now assume it's there
    const { logActivity } = await import('./activityService');
    await logActivity(orgId, user.id, 'create', 'carrier', data.id, { name: data.name });
  }

  return data as Carrier;
}

export async function updateCarrier(id: string, carrier: Partial<CarrierFormData>): Promise<Carrier> {
  const supabase = createClient();

  const payload: Partial<CarrierFormData> = { ...carrier };
  if (payload.insurance_expiration === '') {
    payload.insurance_expiration = null;
  }

  const { data, error } = await supabase
    .from('carriers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { logActivity } = await import('./activityService');
    await logActivity(data.org_id, user.id, 'update', 'carrier', data.id, { name: data.name });
  }

  return data as Carrier;
}

export async function softDeleteCarrier(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('carriers')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw error;
}

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
  return data as Carrier;
}

export async function updateCarrier(id: string, carrier: Partial<CarrierFormData>): Promise<Carrier> {
  const supabase = createClient();

  const payload = { ...carrier };
  if (payload.insurance_expiration === '') {
    payload.insurance_expiration = null as any;
  }

  const { data, error } = await supabase
    .from('carriers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
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

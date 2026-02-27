import { createClient } from '@/config/supabase';
import { Carrier, CarrierFormData } from '@/constants/types';
import { FMCSACarrier } from './fmcsaService';

export async function getExistingFMCSA(dotNumber?: string, mcNumber?: string): Promise<FMCSACarrier | null> {
  const supabase = createClient();

  // Try to find a carrier that matches the DOT or MC number
  let query = supabase
    .from('carriers')
    .select(`
      *,
      fmcsa_data:carrier_fmcsa(*)
    `)
    .eq('is_deleted', false);

  if (dotNumber) {
    query = query.eq('dot_number', dotNumber);
  } else if (mcNumber) {
    query = query.eq('mc_number', mcNumber);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data || !data.fmcsa_data) return null;

  // Map our DB structure back to FMCSACarrier interface for the UI
  // Supabase returns reverse joins as an array, so we unwrap it
  const dbFmcsa = Array.isArray(data.fmcsa_data) ? data.fmcsa_data[0] : data.fmcsa_data;

  if (!dbFmcsa) return null;

  // If we have raw_data, use it as the base
  if (dbFmcsa.raw_data && Object.keys(dbFmcsa.raw_data).length > 0) {
    return dbFmcsa.raw_data as FMCSACarrier;
  }

  // Fallback: Manually map from the columns if raw_data is missing
  return {
    legalName: dbFmcsa.legal_name,
    dotNumber: data.dot_number,
    mcNumber: data.mc_number,
    phoneNumber: dbFmcsa.phone,
    phyStreet: dbFmcsa.street,
    phyCity: dbFmcsa.city,
    phyState: dbFmcsa.state,
    phyZipcode: dbFmcsa.zip,
    commonAuthorityStatus: dbFmcsa.common_authority,
    contractAuthorityStatus: dbFmcsa.contract_authority,
    brokerAuthorityStatus: dbFmcsa.broker_authority,
    vehicleOosRate: dbFmcsa.vehicle_oos_rate,
    driverOosRate: dbFmcsa.driver_oos_rate,
    allowedToOperate: dbFmcsa.allowed_to_operate,
  };
}

export async function getCarriers(orgId: string): Promise<Carrier[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('carriers')
    .select(`
      *,
      fmcsa_data:carrier_fmcsa(*)
    `)
    .eq('org_id', orgId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Unwrap the array format that PostgREST returns for joined relations
  return (data as any[]).map(c => ({
    ...c,
    fmcsa_data: Array.isArray(c.fmcsa_data) ? c.fmcsa_data[0] : c.fmcsa_data
  })) as Carrier[];
}

export async function getCarrier(id: string): Promise<Carrier> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('carriers')
    .select(`
      *,
      fmcsa_data:carrier_fmcsa(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const carrier = data as any;
  return {
    ...carrier,
    fmcsa_data: Array.isArray(carrier.fmcsa_data) ? carrier.fmcsa_data[0] : carrier.fmcsa_data
  } as Carrier;
}

export async function createCarrier(orgId: string, carrier: CarrierFormData): Promise<Carrier> {
  const supabase = createClient();

  const { fmcsa_data, ...carrierBase } = carrier;

  const payload = {
    ...carrierBase,
    org_id: orgId,
    insurance_expiration: carrierBase.insurance_expiration || null,
  };

  const { data: newCarrier, error: carrierError } = await supabase
    .from('carriers')
    .insert(payload)
    .select()
    .single();

  if (carrierError) throw carrierError;

  // Insert FMCSA data if provided
  if (fmcsa_data) {
    const { error: fmcsaError } = await supabase
      .from('carrier_fmcsa')
      .insert({
        ...fmcsa_data,
        carrier_id: newCarrier.id
      });

    if (fmcsaError) console.error('Error saving FMCSA data:', fmcsaError);
  }

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { logActivity } = await import('./activityService');
    await logActivity(orgId, user.id, 'create', 'carrier', newCarrier.id, { name: newCarrier.name });
  }

  return newCarrier as Carrier;
}

export async function updateCarrier(id: string, carrier: Partial<CarrierFormData>): Promise<Carrier> {
  const supabase = createClient();

  const { fmcsa_data, ...carrierBase } = carrier;

  const payload: Partial<CarrierFormData> = { ...carrierBase };
  if (payload.insurance_expiration === '') {
    payload.insurance_expiration = null;
  }

  const { data: updatedCarrier, error: carrierError } = await supabase
    .from('carriers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (carrierError) throw carrierError;

  // Update or Insert FMCSA data if provided
  if (fmcsa_data) {
    const { error: fmcsaError } = await supabase
      .from('carrier_fmcsa')
      .upsert({
        ...fmcsa_data,
        carrier_id: id,
        last_verified_at: new Date().toISOString()
      }, { onConflict: 'carrier_id' });

    if (fmcsaError) console.error('Error updating FMCSA data:', fmcsaError);
  }

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { logActivity } = await import('./activityService');
    await logActivity(updatedCarrier.org_id, user.id, 'update', 'carrier', updatedCarrier.id, { name: updatedCarrier.name });
  }

  return updatedCarrier as Carrier;
}

export async function softDeleteCarrier(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('carriers')
    .update({ is_deleted: true })
    .eq('id', id);

  if (error) throw error;
}

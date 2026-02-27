import { createClient } from '@/config/supabase';
import { RFPLane, RFPLaneCSVRow } from '@/constants/types';

export async function getLanesByRFP(rfpId: string): Promise<RFPLane[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('rfp_lanes')
    .select('*')
    .eq('rfp_id', rfpId)
    .order('origin_city', { ascending: true });

  if (error) throw error;
  return data as RFPLane[];
}

export async function createLanes(rfpId: string, lanes: RFPLaneCSVRow[]): Promise<RFPLane[]> {
  const supabase = createClient();
  const rows = lanes.map((lane) => ({
    rfp_id: rfpId,
    origin_city: lane.origin_city,
    origin_state: lane.origin_state,
    destination_city: lane.destination_city,
    destination_state: lane.destination_state,
    equipment_type: lane.equipment_type,
    frequency: lane.frequency || null,
    total_hours: lane.total_hours || null,
    total_time: lane.total_time || null,
  }));

  const { data, error } = await supabase
    .from('rfp_lanes')
    .insert(rows)
    .select();

  if (error) throw error;
  return data as RFPLane[];
}

export async function deleteLane(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('rfp_lanes')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

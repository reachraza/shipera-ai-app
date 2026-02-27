// ─── Organization ────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

// ─── User ────────────────────────────────────────────────────
export type UserRole = 'admin' | 'coordinator' | 'supervisor';

export interface User {
  id: string;
  org_id: string;
  role: UserRole;
  email?: string;
  full_name?: string;
  needs_password_change?: boolean;
  created_at: string;
}

// ─── Carrier ─────────────────────────────────────────────────
export type CarrierStatus = 'approved' | 'pending' | 'suspended';

export interface CarrierFMCSA {
  id: string;
  carrier_id: string;
  legal_name: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  common_authority: string | null;
  contract_authority: string | null;
  broker_authority: string | null;
  vehicle_oos_rate: number | null;
  driver_oos_rate: number | null;
  allowed_to_operate: string | null;
  raw_data: any;
  last_verified_at: string;
  created_at: string;
}

export interface Carrier {
  id: string;
  org_id: string;
  name: string;
  mc_number: string;
  dot_number: string;
  equipment_types: string[];
  email: string;
  phone: string;
  insurance_expiration: string | null;
  status: CarrierStatus;
  is_deleted: boolean;
  created_at: string;
  // Join related data
  fmcsa_data?: CarrierFMCSA | null;
}

export interface CarrierFormData {
  name: string;
  mc_number: string;
  dot_number: string;
  equipment_types: string[];
  email: string;
  phone: string;
  insurance_expiration: string | null;
  status: CarrierStatus;
  // FMCSA data is handled separately during registration/update
  fmcsa_data?: Partial<CarrierFMCSA> | null;
}

// ─── RFP ─────────────────────────────────────────────────────
export type RFPStatus = 'draft' | 'active' | 'closed';
export type RFPMode = 'full_truckload' | 'ltl' | 'intermodal';

export interface RFP {
  id: string;
  org_id: string;
  title: string;
  mode: RFPMode;
  notes: string;
  status: RFPStatus;
  deadline: string | null;
  created_at: string;
}

export interface RFPFormData {
  title: string;
  mode: RFPMode;
  deadline: string | null;
  notes: string;
}

// ─── RFP Lane ────────────────────────────────────────────────
export interface RFPLane {
  id: string;
  rfp_id: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  equipment_type: string;
  frequency: string | null;
  total_hours: string | null;
  total_time: string | null;
  rfp?: RFP;
}

export interface RFPLaneCSVRow {
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  equipment_type: string;
  frequency?: string;
  total_hours?: string;
  total_time?: string;
}

// ─── RFP Invite ──────────────────────────────────────────────
export type InviteStatus = 'invited' | 'opened' | 'submitted';

export interface RFPInvite {
  id: string;
  rfp_id: string;
  carrier_id: string;
  status: InviteStatus;
  access_token?: string;
  created_at: string;
  // Joined fields
  carrier?: Carrier;
  rfp?: RFP;
}

// ─── Bid ─────────────────────────────────────────────────────
export interface Bid {
  id: string;
  rfp_lane_id: string;
  carrier_id: string;
  rate: number;
  transit_time: string;
  notes: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  // Joined fields
  carrier?: Partial<Carrier>;
  lane?: Partial<RFPLane>;
}

// ─── Activity Log ────────────────────────────────────────────
export type ActionType = 'create' | 'update' | 'delete' | 'invite' | 'upload';
export type EntityType = 'carrier' | 'rfp' | 'rfp_lane' | 'rfp_invite' | 'bid';

export interface ActivityLog {
  id: string;
  org_id: string;
  user_id: string;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

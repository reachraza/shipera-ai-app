// ─── Organization ────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

// ─── User ────────────────────────────────────────────────────
export type UserRole = 'admin' | 'coordinator';

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

export interface Carrier {
  id: string;
  org_id: string;
  name: string;
  mc_number: string;
  dot_number: string;
  equipment_types: string[];
  email: string;
  phone: string;
  insurance_expiration: string;
  status: CarrierStatus;
  is_deleted: boolean;
  created_at: string;
}

export interface CarrierFormData {
  name: string;
  mc_number: string;
  dot_number: string;
  equipment_types: string[];
  email: string;
  phone: string;
  insurance_expiration: string;
  status: CarrierStatus;
}

// ─── RFP ─────────────────────────────────────────────────────
export type RFPStatus = 'draft' | 'active' | 'closed';
export type RFPMode = 'full_truckload' | 'ltl' | 'intermodal';

export interface RFP {
  id: string;
  org_id: string;
  title: string;
  mode: RFPMode;
  deadline: string;
  notes: string;
  status: RFPStatus;
  created_at: string;
}

export interface RFPFormData {
  title: string;
  mode: RFPMode;
  deadline: string;
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
}

export interface RFPLaneCSVRow {
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  equipment_type: string;
  frequency?: string;
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
}

// ─── Bid ─────────────────────────────────────────────────────
export interface Bid {
  id: string;
  rfp_lane_id: string;
  carrier_id: string;
  rate: number;
  transit_time: string;
  notes: string;
  created_at: string;
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

import { CarrierStatus, RFPStatus, InviteStatus } from './types';

export const CARRIER_STATUSES: { value: CarrierStatus; label: string; color: string }[] = [
  { value: 'approved', label: 'Approved', color: '#22c55e' },
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'suspended', label: 'Suspended', color: '#ef4444' },
];

export const RFP_STATUSES: { value: RFPStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#94a3b8' },
  { value: 'active', label: 'Active', color: '#22c55e' },
  { value: 'closed', label: 'Closed', color: '#ef4444' },
];

export const INVITE_STATUSES: { value: InviteStatus; label: string; color: string }[] = [
  { value: 'invited', label: 'Invited', color: '#3b82f6' },
  { value: 'opened', label: 'Opened', color: '#f59e0b' },
  { value: 'submitted', label: 'Submitted', color: '#22c55e' },
];

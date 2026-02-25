import { UserRole } from './types';

export const ROLES: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: 'Admin',
    description: 'Full access to all org features and settings',
  },
  coordinator: {
    label: 'Coordinator',
    description: 'Can manage RFPs, carriers, and bids',
  },
  supervisor: {
    label: 'Supervisor',
    description: 'Oversees team operations and approvals',
  },
};

export const PROTECTED_ROUTES = ['/dashboard', '/carriers', '/rfps'];

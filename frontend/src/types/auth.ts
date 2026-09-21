import { StaffRole } from './staff';

export interface UserProfile {
  id: string;           // Same as auth.users.id
  staffId?: string;     // Links to staff table
  role: StaffRole;
  fullName: string;
  createdAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type AppRole = StaffRole;

// Role-based page access configuration
export const ROLE_ACCESS: Record<string, AppRole[]> = {
  '/dashboard': ['Doctor', 'Nurse', 'Receptionist', 'Admin'],
  '/patients': ['Doctor', 'Nurse', 'Receptionist', 'Admin'],
  '/clinical-workspace': ['Doctor'],
  '/scheduling': ['Doctor', 'Nurse', 'Receptionist', 'Admin'],
  '/billing': ['Doctor', 'Admin'],
  '/staff-management': ['Doctor', 'Admin'],
};

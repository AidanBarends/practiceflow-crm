export type StaffRole = 'Doctor' | 'Nurse' | 'Receptionist' | 'Admin';
export type AccountStatus = 'Active' | 'On Leave' | 'Inactive';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  department?: string;
  status: AccountStatus;
  joinDate: string;
  lastActive: string;
  authUserId?: string;
  hasLogin?: boolean;
  loginStatus?: 'Active' | 'Revoked';
}

export type Staff = StaffMember;
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { StaffMember, StaffRole, AccountStatus } from '@/types/staff';

const initialStaff: StaffMember[] = [
  {
    id: 'd1111111-1111-1111-1111-111111111111',
    name: 'Dr. Sarah Smith',
    email: 's.smith@practiceflow.com',
    role: 'Doctor',
    department: 'Internal Medicine',
    status: 'Active',
    joinDate: 'Jan 15, 2023',
    lastActive: 'Active now',
  },
  {
    id: 'd2222222-2222-2222-2222-222222222222',
    name: 'Nurse Emily Davis',
    email: 'e.davis@practiceflow.com',
    role: 'Nurse',
    department: 'Pediatrics',
    status: 'Active',
    joinDate: 'Mar 20, 2023',
    lastActive: '—',
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    name: 'James Wilson',
    email: 'j.wilson@practiceflow.com',
    role: 'Receptionist',
    department: 'Administration',
    status: 'Active',
    joinDate: 'Jun 10, 2023',
    lastActive: '—',
  },
  {
    id: 'd4444444-4444-4444-4444-444444444444',
    name: 'Dr. Robert Wilson',
    email: 'r.wilson@practiceflow.com',
    role: 'Doctor',
    department: 'Cardiology',
    status: 'Active',
    joinDate: 'Nov 1, 2022',
    lastActive: '—',
  },
  {
    id: 'd5555555-5555-5555-5555-555555555555',
    name: 'Dr. Emily Blunt',
    email: 'e.blunt@practiceflow.com',
    role: 'Doctor',
    department: 'Dermatology',
    status: 'On Leave',
    joinDate: 'Feb 1, 2024',
    lastActive: '—',
  },
];

const LOGIN_CACHE_KEY = 'practiceflow_staff_logins_v1';

export function getCachedStaffLogins(): Record<string, { hasLogin: boolean; role?: StaffRole; authUserId?: string; loginStatus?: 'Active' | 'Revoked'; lastActive?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOGIN_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCachedStaffLogin(
  identifier: string,
  data: { hasLogin: boolean; role?: StaffRole; authUserId?: string; loginStatus?: 'Active' | 'Revoked'; lastActive?: string }
) {
  if (typeof window === 'undefined') return;
  try {
    const current = getCachedStaffLogins();
    current[identifier.toLowerCase().trim()] = data;
    localStorage.setItem(LOGIN_CACHE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Could not cache staff login:', e);
  }
}

let localStaffMemory: StaffMember[] = [...initialStaff];

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  const cached = getCachedStaffLogins();

  if (isSupabaseConfigured && supabase) {
    try {
      const [{ data: staffData }, { data: profilesData }] = await Promise.all([
        supabase.from('staff').select('*').order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('*')
      ]);

      const profiles = profilesData || [];

      if (staffData && staffData.length > 0) {
        return staffData.map((item) => {
          const cachedItem = cached[item.id] || cached[item.email.toLowerCase().trim()] || cached[item.name.toLowerCase().trim()];
          const matchedProfile = profiles.find(
            (p) => p.staff_id === item.id || 
                   p.id === item.auth_user_id ||
                   (p.full_name && item.name && p.full_name.toLowerCase().trim() === item.name.toLowerCase().trim())
          );
          const hasLogin = !!(matchedProfile || item.auth_user_id || cachedItem?.hasLogin);
          const isRevoked = item.status === 'Inactive' || cachedItem?.loginStatus === 'Revoked';

          return {
            id: item.id,
            name: item.name,
            email: item.email,
            role: (matchedProfile?.role || cachedItem?.role || item.role) as StaffRole,
            department: item.department,
            status: item.status as AccountStatus,
            joinDate: item.join_date,
            lastActive: cachedItem?.lastActive || (hasLogin ? 'Never' : '—'),
            authUserId: matchedProfile?.id || cachedItem?.authUserId || item.auth_user_id || undefined,
            hasLogin,
            loginStatus: isRevoked ? 'Revoked' : 'Active',
          };
        });
      }

      // If remote staff table is empty, enrich localStaffMemory with any Supabase user_profiles & cache
      return localStaffMemory.map((item) => {
        const cachedItem = cached[item.id] || cached[item.email.toLowerCase().trim()] || cached[item.name.toLowerCase().trim()];
        const matchedProfile = profiles.find(
          (p) => p.staff_id === item.id || 
                 p.id === item.authUserId ||
                 (p.full_name && item.name && p.full_name.toLowerCase().trim() === item.name.toLowerCase().trim())
        );
        const hasLogin = !!(matchedProfile || item.hasLogin || cachedItem?.hasLogin);
        const isRevoked = item.status === 'Inactive' || item.loginStatus === 'Revoked' || cachedItem?.loginStatus === 'Revoked';

        return {
          ...item,
          role: (matchedProfile?.role || cachedItem?.role || item.role) as StaffRole,
          authUserId: matchedProfile?.id || cachedItem?.authUserId || item.authUserId,
          hasLogin,
          loginStatus: isRevoked ? 'Revoked' : 'Active',
          lastActive: cachedItem?.lastActive || (hasLogin ? (item.lastActive === 'Active now' ? 'Active now' : 'Never') : '—'),
        };
      });
    } catch (e) {
      console.warn('Error fetching staff or profiles from Supabase:', e);
    }
  }

  // Pure local fallback with cache applied
  return localStaffMemory.map((item) => {
    const cachedItem = cached[item.id] || cached[item.email.toLowerCase().trim()] || cached[item.name.toLowerCase().trim()];
    const hasLogin = !!(item.hasLogin || cachedItem?.hasLogin);
    return {
      ...item,
      role: (cachedItem?.role || item.role) as StaffRole,
      hasLogin,
      loginStatus: (cachedItem?.loginStatus || item.loginStatus || 'Active') as 'Active' | 'Revoked',
      lastActive: cachedItem?.lastActive || (hasLogin ? (item.lastActive === 'Active now' ? 'Active now' : 'Never') : '—'),
    };
  });
}

export async function saveStaffMember(
  data: Omit<StaffMember, 'id' | 'joinDate' | 'lastActive'>,
  editingId?: string
): Promise<StaffMember> {
  if (editingId) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: updated, error } = await supabase
          .from('staff')
          .update({
            name: data.name,
            email: data.email,
            role: data.role,
            department: data.department,
            status: data.status,
          })
          .eq('id', editingId)
          .select()
          .single();

        if (error) {
          console.warn('Error updating staff in Supabase:', error.message || error);
        } else if (updated) {
          const result: StaffMember = {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            role: updated.role as StaffRole,
            department: updated.department,
            status: updated.status as AccountStatus,
            joinDate: updated.join_date,
            lastActive: updated.last_active || 'Just now',
          };
          localStaffMemory = localStaffMemory.map((m) => (m.id === editingId ? result : m));
          return result;
        }
      } catch (e) {
        console.warn('Failed to update staff in Supabase, using local fallback:', e);
      }
    }

    // Fallback ONLY for demo mode without Supabase or on network error
    localStaffMemory = localStaffMemory.map((member) =>
      member.id === editingId ? { ...member, ...data } : member
    );
    return localStaffMemory.find((m) => m.id === editingId)!;
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: inserted, error } = await supabase
        .from('staff')
        .insert({
          name: data.name,
          email: data.email,
          role: data.role,
          department: data.department,
          status: data.status,
        })
        .select()
        .single();

      if (error) {
        console.warn('Error creating staff in Supabase:', error.message || error);
      } else if (inserted) {
        const result: StaffMember = {
          id: inserted.id,
          name: inserted.name,
          email: inserted.email,
          role: inserted.role as StaffRole,
          department: inserted.department,
          status: inserted.status as AccountStatus,
          joinDate: todayStr,
          lastActive: 'Just now',
        };
        localStaffMemory = [result, ...localStaffMemory];
        return result;
      }
    } catch (e) {
      console.warn('Failed to create staff in Supabase, using local fallback:', e);
    }
  }

  // Fallback ONLY for demo mode without Supabase or on network error
  const newStaff: StaffMember = {
    ...data,
    id: crypto.randomUUID(),
    joinDate: todayStr,
    lastActive: 'Just now',
  };
  localStaffMemory = [newStaff, ...localStaffMemory];
  return newStaff;
}

export async function setStaffStatus(id: string, status: AccountStatus): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('staff').update({ status }).eq('id', id);
    } catch (e) {
      console.warn('Error updating staff status in Supabase:', e);
    }
  }

  localStaffMemory = localStaffMemory.map((member) =>
    member.id === id ? { ...member, status } : member
  );
}

export async function updateStaffRole(staffId: string, authUserId: string | undefined, role: StaffRole): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('staff').update({ role }).eq('id', staffId);
      if (authUserId) {
        await supabase.from('user_profiles').update({ role }).eq('id', authUserId);
      }
    } catch (e) {
      console.warn('Error updating staff role in Supabase:', e);
    }
  }

  localStaffMemory = localStaffMemory.map((member) =>
    member.id === staffId ? { ...member, role } : member
  );
}

export async function toggleStaffLoginAccess(staffId: string, authUserId: string | undefined, revoke: boolean): Promise<void> {
  const newStatus: AccountStatus = revoke ? 'Inactive' : 'Active';
  const newLoginStatus: 'Active' | 'Revoked' = revoke ? 'Revoked' : 'Active';

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('staff').update({ status: newStatus }).eq('id', staffId);
    } catch (e) {
      console.warn('Error updating login access in Supabase:', e);
    }
  }

  localStaffMemory = localStaffMemory.map((member) =>
    member.id === staffId ? { ...member, status: newStatus, loginStatus: newLoginStatus } : member
  );
}

export async function unlinkStaffLogin(staffId: string, authUserId: string | undefined): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('staff').update({ auth_user_id: null }).eq('id', staffId);
      if (authUserId) {
        await supabase.from('user_profiles').delete().eq('id', authUserId);
      }
    } catch (e) {
      console.warn('Error unlinking staff login in Supabase:', e);
    }
  }

  localStaffMemory = localStaffMemory.map((member) =>
    member.id === staffId ? { ...member, hasLogin: false, authUserId: undefined, loginStatus: undefined } : member
  );
}

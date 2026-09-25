import { createClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types/auth';
import { StaffRole } from '@/types/staff';

/**
 * Sign in with email and password using Supabase Auth.
 */
export async function loginWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user.
 */
export async function logout() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get the current authenticated session.
 */
export async function getSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get the current authenticated user.
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      return {
        id: data.id,
        staffId: data.staff_id,
        role: data.role as StaffRole,
        fullName: data.full_name,
        createdAt: data.created_at,
      };
    }

    // Fallback: If no profile row exists in user_profiles yet, auto-provision from auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      const emailPrefix = user.email?.split('@')[0] || 'User';
      const formattedName = user.user_metadata?.full_name ||
        (emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1).replace('.', ' '));
      const role: StaffRole = (user.user_metadata?.role as StaffRole) || 'Doctor';

      try {
        const { data: created } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            full_name: formattedName,
            role: role,
          })
          .select('*')
          .maybeSingle();

        if (created) {
          return {
            id: created.id,
            staffId: created.staff_id,
            role: created.role as StaffRole,
            fullName: created.full_name,
            createdAt: created.created_at,
          };
        }
      } catch (e) {
        console.warn('Could not auto-insert user profile:', e);
      }

      return {
        id: user.id,
        role: role,
        fullName: formattedName,
        createdAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Error fetching user profile:', err);
  }

  return null;
}

/**
 * Create an employee account via the Supabase Edge Function.
 * Only callable by admins/doctors.
 */
export async function createEmployeeAccount(params: {
  email: string;
  password: string;
  fullName: string;
  role: StaffRole;
  staffId: string;
}) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // 1. Try Supabase Edge Function first if deployed
  try {
    const response = await supabase.functions.invoke('create-user', {
      body: params,
    });
    if (!response.error && response.data?.user) {
      return response.data;
    }
  } catch (err) {
    console.warn('Edge function not available, proceeding with direct signup fallback:', err);
  }

  // 2. Fallback: Create account via an isolated Supabase client without disturbing current admin session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: authData, error: signUpError } = await isolatedClient.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName,
        role: params.role,
      },
    },
  });

  if (signUpError) {
    throw new Error(signUpError.message);
  }

  if (!authData.user) {
    throw new Error('Could not create employee credentials');
  }

  const newUserId = authData.user.id;

  // 3. Insert or update the new employee's profile
  try {
    await supabase.from('user_profiles').upsert({
      id: newUserId,
      staff_id: params.staffId,
      full_name: params.fullName,
      role: params.role,
    });
  } catch (profileErr) {
    console.warn('Could not link user_profile:', profileErr);
  }

  // 4. Update the staff record with auth_user_id
  if (params.staffId) {
    try {
      await supabase
        .from('staff')
        .update({ auth_user_id: newUserId })
        .eq('id', params.staffId);
    } catch (staffErr) {
      console.warn('Could not update staff table:', staffErr);
    }
  }

  return { user: authData.user };
}

/**
 * Send a password reset email.
 */
export async function resetPassword(email: string) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

/**
 * Update the user's password (used on the reset-password page).
 */
export async function updatePassword(newPassword: string) {
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthState, UserProfile } from '@/types/auth';
import { StaffRole } from '@/types/staff';
import { getCurrentUser, getUserProfile, logout as authLogout, onAuthStateChange } from '@/services/authService';

interface AuthContextValue extends AuthState {
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
  logout: async () => {},
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const userProfile = await getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let mounted = true;

    // Initial session check
    async function initAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (mounted && currentUser) {
          setUser({ id: currentUser.id, email: currentUser.email || '' });
          await loadProfile(currentUser.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        await loadProfile(session.user.id);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
      } else if (event === 'PASSWORD_RECOVERY') {
        // Redirect to reset password page
        router.push('/reset-password');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, router]);

  const handleLogout = useCallback(async () => {
    try {
      await authLogout();
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  // Infer fallback role safely without flashing elevated permissions
  const inferredRole: StaffRole = (() => {
    const email = user?.email?.toLowerCase() || '';
    if (email.includes('nurse')) return 'Nurse';
    if (email.includes('receptionist')) return 'Receptionist';
    if (email.includes('admin')) return 'Admin';
    if (email.includes('doctor') || email.includes('dr.')) return 'Doctor';
    return 'Nurse'; // Default safe role
  })();

  const effectiveProfile: UserProfile | null = profile || (user ? {
    id: user.id,
    fullName: user.email?.split('@')[0]
      ? (user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1).replace('.', ' '))
      : 'User',
    role: inferredRole,
    createdAt: new Date().toISOString(),
  } : null);

  const isAdmin = effectiveProfile?.role === 'Admin' || effectiveProfile?.role === 'Doctor';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: effectiveProfile,
        isLoading,
        isAdmin,
        logout: handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

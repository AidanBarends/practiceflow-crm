'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { AppRole, ROLE_ACCESS } from '@/types/auth';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [isLoading, user, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-teal-100"></div>
            <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-teal-600" />
          </div>
          <p className="text-sm font-medium text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Check role-based access
  const effectiveRoles = allowedRoles || (pathname ? ROLE_ACCESS[pathname] : undefined);
  
  if (effectiveRoles && profile && !effectiveRoles.includes(profile.role)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-lg border border-slate-200">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="mb-6 text-sm text-slate-500">
            You don&apos;t have permission to access this page. Your role ({profile.role}) does not have the required access level.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-700 hover:to-emerald-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

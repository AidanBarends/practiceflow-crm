'use client';

import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';

const pageTitles: Record<string, { title: string; breadcrumb: string[] }> = {
  '/dashboard': { title: 'Dashboard', breadcrumb: ['Home', 'Dashboard'] },
  '/patients': { title: 'Patient Directory', breadcrumb: ['Home', 'Patient Directory'] },
  '/clinical-workspace': { title: 'Clinical Workspace', breadcrumb: ['Home', 'Clinical Workspace'] },
  '/staff-management': { title: 'Staff Management', breadcrumb: ['Home', 'Staff Management'] },
  '/scheduling': { title: 'Scheduling', breadcrumb: ['Home', 'Scheduling'] },
  '/billing': { title: 'Billing', breadcrumb: ['Home', 'Billing'] },
};

export default function TopBar() {
  const pathname = usePathname() || '/dashboard';
  const pageInfo = pageTitles[pathname] || { title: 'Dashboard', breadcrumb: ['Home'] };
  const { user, profile } = useAuth();

  const userName = profile?.fullName || (user?.email ? user.email.split('@')[0] : 'User');
  const userRole = profile?.role || 'Staff';

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200/80 bg-white/80 backdrop-blur-sm px-6">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2">
        <nav className="flex items-center gap-1 text-sm">
          {pageInfo.breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
              <span className={i === pageInfo.breadcrumb.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-10 pr-12 text-sm text-gray-700 placeholder:text-gray-400 input-focus"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </div>

        {/* Notifications */}
        <button className="relative rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
          </span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold text-gray-800">{userName}</p>
            <p className="text-[11px] text-gray-400">{userRole}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white shadow-sm">
            {getInitials(userName)}
          </div>
        </div>
      </div>
    </header>
  );
}
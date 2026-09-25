'use client';

import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, ChevronDown, KeyRound, UserCog, UserX, UserCheck, Trash2 } from 'lucide-react';
import { StaffMember } from '@/types/staff';

interface ManageAccessDropdownProps {
  staff: StaffMember;
  onResetPassword: (staff: StaffMember) => void;
  onChangeRole: (staff: StaffMember) => void;
  onToggleAccess: (staff: StaffMember, revoke: boolean) => void;
  onRemoveLogin: (staff: StaffMember) => void;
}

export default function ManageAccessDropdown({
  staff,
  onResetPassword,
  onChangeRole,
  onToggleAccess,
  onRemoveLogin,
}: ManageAccessDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isRevoked = staff.loginStatus === 'Revoked' || staff.status === 'Inactive';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
          isRevoked
            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400'
            : 'border-teal-200 bg-teal-50/90 text-teal-800 hover:bg-teal-100 hover:border-teal-300'
        }`}
      >
        <ShieldCheck className={`h-3.5 w-3.5 ${isRevoked ? 'text-amber-600' : 'text-teal-600'}`} />
        <span>Manage Access</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-1.5 w-52 origin-top-right rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-black/5 animate-fade-in focus:outline-none">
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Account Access</p>
            <p className="text-xs font-medium text-slate-700 truncate">{staff.name}</p>
          </div>

          {/* Reset Password */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onResetPassword(staff);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-teal-50/70 hover:text-teal-900 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 text-teal-600" />
            <span>Reset Password</span>
          </button>

          {/* Change Role */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onChangeRole(staff);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-teal-50/70 hover:text-teal-900 transition-colors"
          >
            <UserCog className="h-3.5 w-3.5 text-indigo-600" />
            <span>Change Role ({staff.role})</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* Kick Out / Revoke Access or Restore Access */}
          {isRevoked ? (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onToggleAccess(staff, false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium">Restore Access</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onToggleAccess(staff, true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <UserX className="h-3.5 w-3.5 text-rose-600" />
              <span className="font-medium">Kick Out / Revoke Access</span>
            </button>
          )}

          {/* Unlink Login */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onRemoveLogin(staff);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Unlink Login Account</span>
          </button>
        </div>
      )}
    </div>
  );
}

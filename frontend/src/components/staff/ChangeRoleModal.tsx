'use client';

import { useState } from 'react';
import { X, UserCog, Check, Loader2 } from 'lucide-react';
import { StaffMember, StaffRole } from '@/types/staff';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  onSaveRole: (staffId: string, authUserId: string | undefined, newRole: StaffRole) => Promise<void>;
}

const ROLES: { role: StaffRole; label: string; desc: string }[] = [
  { role: 'Doctor', label: 'Doctor', desc: 'Full clinical workspace, patient records, prescriptions, and billing access.' },
  { role: 'Nurse', label: 'Nurse', desc: 'Patient management, vitals, scheduling, and clinical assistance.' },
  { role: 'Receptionist', label: 'Receptionist', desc: 'Appointments, check-ins, patient directory, and front desk workflow.' },
  { role: 'Admin', label: 'Admin', desc: 'Staff management, billing, system configuration, and practice analytics.' },
];

export default function ChangeRoleModal({
  isOpen,
  onClose,
  staff,
  onSaveRole,
}: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<StaffRole>(staff?.role || 'Nurse');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !staff) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staff) return;

    setIsLoading(true);
    try {
      await onSaveRole(staff.id, staff.authUserId, selectedRole);
      onClose();
    } catch (err) {
      console.error('Failed to change role:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <UserCog className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Change Role & Permissions</h3>
              <p className="text-xs text-slate-500">Updating access for {staff.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Select the new role. This immediately adjusts what pages, clinical records, and billing data {staff.name} can access.
          </p>

          <div className="space-y-2">
            {ROLES.map(({ role, label, desc }) => {
              const isSelected = selectedRole === role;
              return (
                <label
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-200'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    checked={isSelected}
                    onChange={() => setSelectedRole(role)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">{label}</span>
                      {isSelected && <Check className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

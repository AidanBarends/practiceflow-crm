'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { StaffMember, StaffRole, AccountStatus } from '@/types/staff';

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<StaffMember, 'id' | 'joinDate' | 'lastActive'>) => void;
  initialData?: StaffMember; // present = editing; absent = adding new
}

const roles: StaffRole[] = ['Doctor', 'Nurse', 'Receptionist', 'Admin'];
const statuses: AccountStatus[] = ['Active', 'On Leave', 'Inactive'];

export default function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: StaffFormModalProps) {
  // Parent mounts this modal only while open, so initial state is seeded from props once per open
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [department, setDepartment] = useState(initialData?.department ?? '');
  const [role, setRole] = useState<StaffRole>(initialData?.role ?? 'Doctor');
  const [status, setStatus] = useState<AccountStatus>(initialData?.status ?? 'Active');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, email, department, role, status });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Staff Member' : 'Add Staff Member'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</label>
          <input
            type="text"
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Cardiology, General Practice"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AccountStatus)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all"
          >
            {initialData ? 'Save Changes' : 'Add Staff Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
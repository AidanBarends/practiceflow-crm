'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import StaffPageHeader from '@/components/staff/StaffPageHeader';
import StaffStatsGrid from '@/components/staff/StaffStatsGrid';
import StaffFilterBar from '@/components/staff/StaffFilterBar';
import StaffTable from '@/components/staff/StaffTable';
import PaginationFooter from '@/components/staff/PaginationFooter';
import StaffFormModal from '@/components/staff/StaffFormModal';
import CreateLoginModal from '@/components/staff/CreateLoginModal';
import ChangeRoleModal from '@/components/staff/ChangeRoleModal';
import ResetStaffPasswordModal from '@/components/staff/ResetStaffPasswordModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  fetchStaffMembers,
  saveStaffMember,
  setStaffStatus as updateStaffStatusApi,
  updateStaffRole as updateStaffRoleApi,
  toggleStaffLoginAccess as toggleStaffLoginAccessApi,
  unlinkStaffLogin as unlinkStaffLoginApi,
  setCachedStaffLogin,
} from '@/services/staffService';
import { exportStaffToCsv } from '@/lib/exportCsv';
import { StaffMember, StaffRole, AccountStatus } from '@/types/staff';
import { useToast } from '@/components/ui/Toast';

const PAGE_SIZE = 5;

export default function StaffManagementPage() {
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchStaffMembers();
        setAllStaff(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'All Roles'>('All Roles');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'All Statuses'>('All Statuses');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | undefined>(undefined);
  const [deactivatingStaff, setDeactivatingStaff] = useState<StaffMember | null>(null);
  const [createLoginStaff, setCreateLoginStaff] = useState<StaffMember | null>(null);
  const [roleModalStaff, setRoleModalStaff] = useState<StaffMember | null>(null);
  const [resetModalStaff, setResetModalStaff] = useState<StaffMember | null>(null);
  const [revokingStaff, setRevokingStaff] = useState<{ staff: StaffMember; revoke: boolean } | null>(null);

  const filteredStaff = useMemo(() => {
    return allStaff.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All Roles' || member.role === roleFilter;
      const matchesStatus = statusFilter === 'All Statuses' || member.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [allStaff, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));
  const rangeStart = filteredStaff.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredStaff.length);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredStaff.slice(start, start + PAGE_SIZE);
  }, [filteredStaff, currentPage]);

  function handleAddClick() {
    setEditingStaff(undefined);
    setIsFormOpen(true);
  }

  function handleEditClick(staff: StaffMember) {
    setEditingStaff(staff);
    setIsFormOpen(true);
  }

  async function handleFormSubmit(data: Omit<StaffMember, 'id' | 'joinDate' | 'lastActive'>) {
    const saved = await saveStaffMember(data, editingStaff?.id);
    if (editingStaff) {
      setAllStaff((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      addToast({
        type: 'success',
        title: 'Staff Updated',
        message: `${saved.name}'s profile has been updated.`,
      });
    } else {
      setAllStaff((prev) => [saved, ...prev]);
      addToast({
        type: 'success',
        title: 'Staff Added',
        message: `${saved.name} has been added to the directory.`,
      });
    }
  }

  function handleDeactivateClick(staff: StaffMember) {
    setDeactivatingStaff(staff);
  }

  async function handleConfirmDeactivate() {
    if (!deactivatingStaff) return;
    const name = deactivatingStaff.name;
    await updateStaffStatusApi(deactivatingStaff.id, 'Inactive');
    setAllStaff((prev) =>
      prev.map((member) =>
        member.id === deactivatingStaff.id ? { ...member, status: 'Inactive', loginStatus: 'Revoked' } : member
      )
    );
    setDeactivatingStaff(null);
    addToast({
      type: 'warning',
      title: 'Account Deactivated',
      message: `${name}'s access has been suspended`,
    });
  }

  function handleExportCsv() {
    exportStaffToCsv(filteredStaff);
    addToast({
      type: 'info',
      title: 'Export Complete',
      message: `${filteredStaff.length} records exported to CSV`,
    });
  }

  function handleCreateLoginClick(staff: StaffMember) {
    setCreateLoginStaff(staff);
  }

  function handleLoginCreated(staffId: string) {
    if (createLoginStaff) {
      const cacheData = {
        hasLogin: true,
        role: createLoginStaff.role,
        loginStatus: 'Active' as const,
        lastActive: 'Never',
      };
      setCachedStaffLogin(createLoginStaff.id, cacheData);
      setCachedStaffLogin(createLoginStaff.email, cacheData);
      setCachedStaffLogin(createLoginStaff.name, cacheData);
    }

    setAllStaff((prev) =>
      prev.map((member) =>
        member.id === staffId
          ? { ...member, hasLogin: true, loginStatus: 'Active', lastActive: 'Never' }
          : member
      )
    );
    addToast({
      type: 'success',
      title: 'Login Created',
      message: `Login details have been created for ${createLoginStaff?.name}`,
    });
  }

  // --- ACCESS MANAGEMENT HANDLERS ---
  function handleResetPasswordClick(staff: StaffMember) {
    setResetModalStaff(staff);
  }

  function handleChangeRoleClick(staff: StaffMember) {
    setRoleModalStaff(staff);
  }

  async function handleSaveRole(staffId: string, authUserId: string | undefined, newRole: StaffRole) {
    await updateStaffRoleApi(staffId, authUserId, newRole);

    const staffMember = allStaff.find(s => s.id === staffId);
    if (staffMember) {
      setCachedStaffLogin(staffMember.id, { hasLogin: true, role: newRole, loginStatus: staffMember.loginStatus || 'Active' });
      setCachedStaffLogin(staffMember.email, { hasLogin: true, role: newRole, loginStatus: staffMember.loginStatus || 'Active' });
      setCachedStaffLogin(staffMember.name, { hasLogin: true, role: newRole, loginStatus: staffMember.loginStatus || 'Active' });
    }

    setAllStaff((prev) =>
      prev.map((member) =>
        member.id === staffId ? { ...member, role: newRole } : member
      )
    );
    addToast({
      type: 'success',
      title: 'Role Updated',
      message: `Role changed to ${newRole}`,
    });
  }

  function handleToggleAccessClick(staff: StaffMember, revoke: boolean) {
    setRevokingStaff({ staff, revoke });
  }

  async function handleConfirmToggleAccess() {
    if (!revokingStaff) return;
    const { staff, revoke } = revokingStaff;
    await toggleStaffLoginAccessApi(staff.id, staff.authUserId, revoke);

    const newLoginStatus: 'Active' | 'Revoked' = revoke ? 'Revoked' : 'Active';
    setCachedStaffLogin(staff.id, { hasLogin: true, role: staff.role, loginStatus: newLoginStatus });
    setCachedStaffLogin(staff.email, { hasLogin: true, role: staff.role, loginStatus: newLoginStatus });
    setCachedStaffLogin(staff.name, { hasLogin: true, role: staff.role, loginStatus: newLoginStatus });

    setAllStaff((prev) =>
      prev.map((member) =>
        member.id === staff.id
          ? {
              ...member,
              status: revoke ? 'Inactive' : 'Active',
              loginStatus: newLoginStatus,
            }
          : member
      )
    );

    addToast({
      type: revoke ? 'error' : 'success',
      title: revoke ? 'Access Revoked' : 'Access Restored',
      message: revoke
        ? `${staff.name} has been kicked out / locked out of the CRM.`
        : `${staff.name}'s login access has been restored.`,
    });

    setRevokingStaff(null);
  }

  async function handleRemoveLoginClick(staff: StaffMember) {
    await unlinkStaffLoginApi(staff.id, staff.authUserId);

    setCachedStaffLogin(staff.id, { hasLogin: false });
    setCachedStaffLogin(staff.email, { hasLogin: false });
    setCachedStaffLogin(staff.name, { hasLogin: false });

    setAllStaff((prev) =>
      prev.map((member) =>
        member.id === staff.id
          ? { ...member, hasLogin: false, authUserId: undefined, loginStatus: undefined, lastActive: '—' }
          : member
      )
    );
    addToast({
      type: 'info',
      title: 'Login Unlinked',
      message: `Login credentials unlinked for ${staff.name}. You can now create a new login.`,
    });
  }

  return (
    <ProtectedRoute allowedRoles={['Doctor', 'Admin']}>
      <AppShell>
        <StaffPageHeader onAddClick={handleAddClick} onExportClick={handleExportCsv} />
        <StaffStatsGrid staff={allStaff} />
        <StaffFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-6 card-hover">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Team Directory</h2>
              <p className="text-sm text-gray-400">
                {filteredStaff.length} registered staff members found
              </p>
            </div>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4 py-6">
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded-md bg-gray-100" />
            </div>
          ) : (
            <>
              <StaffTable
                staff={paginatedStaff}
                onEdit={handleEditClick}
                onDeactivate={handleDeactivateClick}
                onCreateLogin={handleCreateLoginClick}
                onResetPassword={handleResetPasswordClick}
                onChangeRole={handleChangeRoleClick}
                onToggleAccess={handleToggleAccessClick}
                onRemoveLogin={handleRemoveLoginClick}
              />
              <PaginationFooter
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                total={filteredStaff.length}
                onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                canGoPrevious={currentPage > 1}
                canGoNext={currentPage < totalPages}
              />
            </>
          )}
        </div>

        {/* Edit / Add Staff Modal */}
        {isFormOpen && (
          <StaffFormModal
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSubmit={handleFormSubmit}
            initialData={editingStaff}
          />
        )}

        {/* Create Login Modal */}
        <CreateLoginModal
          isOpen={createLoginStaff !== null}
          staff={createLoginStaff}
          onClose={() => setCreateLoginStaff(null)}
          onSuccess={handleLoginCreated}
        />

        {/* Change Role Modal */}
        <ChangeRoleModal
          isOpen={roleModalStaff !== null}
          staff={roleModalStaff}
          onClose={() => setRoleModalStaff(null)}
          onSaveRole={handleSaveRole}
        />

        {/* Reset Password Modal */}
        <ResetStaffPasswordModal
          isOpen={resetModalStaff !== null}
          staff={resetModalStaff}
          onClose={() => setResetModalStaff(null)}
        />

        {/* Kick Out / Revoke Access Confirm Dialog */}
        <ConfirmDialog
          isOpen={revokingStaff !== null}
          title={revokingStaff?.revoke ? 'Kick Out / Revoke Login Access' : 'Restore Login Access'}
          message={
            revokingStaff?.revoke
              ? `Are you sure you want to kick out ${revokingStaff?.staff.name}? Their login will be immediately revoked and they will be locked out of the CRM.`
              : `Restore login access for ${revokingStaff?.staff.name}? They will be able to sign in again.`
          }
          confirmLabel={revokingStaff?.revoke ? 'Kick Out / Revoke Access' : 'Restore Access'}
          isDangerous={revokingStaff?.revoke}
          onConfirm={handleConfirmToggleAccess}
          onCancel={() => setRevokingStaff(null)}
        />

        {/* Deactivate Staff Confirm Dialog */}
        <ConfirmDialog
          isOpen={deactivatingStaff !== null}
          title="Deactivate Staff Member"
          message={
            deactivatingStaff
              ? `Are you sure you want to deactivate ${deactivatingStaff.name}? Their account status will be changed to Inactive.`
              : ''
          }
          confirmLabel="Deactivate"
          isDangerous
          onConfirm={handleConfirmDeactivate}
          onCancel={() => setDeactivatingStaff(null)}
        />
      </AppShell>
    </ProtectedRoute>
  );
}
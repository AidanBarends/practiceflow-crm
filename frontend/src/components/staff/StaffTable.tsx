import { StaffMember } from '@/types/staff';
import StaffTableRow from './StaffTableRow';

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (staff: StaffMember) => void;
  onDeactivate: (staff: StaffMember) => void;
  onCreateLogin?: (staff: StaffMember) => void;
  onResetPassword?: (staff: StaffMember) => void;
  onChangeRole?: (staff: StaffMember) => void;
  onToggleAccess?: (staff: StaffMember, revoke: boolean) => void;
  onRemoveLogin?: (staff: StaffMember) => void;
}

const headers = ['Staff Member', 'Role', 'Status / Login', 'Join Date', 'Last Active', 'Actions'];

export default function StaffTable({
  staff,
  onEdit,
  onDeactivate,
  onCreateLogin,
  onResetPassword,
  onChangeRole,
  onToggleAccess,
  onRemoveLogin,
}: StaffTableProps) {
  if (staff.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">
        No staff members match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
            {headers.map((header) => (
              <th key={header} className="pb-3 pr-4 font-medium last:text-right">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <StaffTableRow
              key={member.id}
              staff={member}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              onCreateLogin={onCreateLogin}
              onResetPassword={onResetPassword}
              onChangeRole={onChangeRole}
              onToggleAccess={onToggleAccess}
              onRemoveLogin={onRemoveLogin}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
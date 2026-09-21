import { Pencil, UserX, MoreHorizontal, KeyRound } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import Badge from '@/components/ui/Badge';
import AccountStatusIndicator from './AccountStatusIndicator';
import ManageAccessDropdown from './ManageAccessDropdown';
import { roleStyles } from '@/lib/badgeStyles';
import { useAuth } from '@/components/auth/AuthContext';

interface StaffTableRowProps {
  staff: StaffMember;
  onEdit: (staff: StaffMember) => void;
  onDeactivate: (staff: StaffMember) => void;
  onCreateLogin?: (staff: StaffMember) => void;
  onResetPassword?: (staff: StaffMember) => void;
  onChangeRole?: (staff: StaffMember) => void;
  onToggleAccess?: (staff: StaffMember, revoke: boolean) => void;
  onRemoveLogin?: (staff: StaffMember) => void;
}

function getInitials(name: string): string {
  const words = name.replace('Dr. ', '').split(' ');
  return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 55%, 92%)`;
}

function getAvatarTextColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 60%, 35%)`;
}

export default function StaffTableRow({
  staff,
  onEdit,
  onDeactivate,
  onCreateLogin,
  onResetPassword,
  onChangeRole,
  onToggleAccess,
  onRemoveLogin,
}: StaffTableRowProps) {
  const { user } = useAuth();
  const isRevoked = staff.loginStatus === 'Revoked' || staff.status === 'Inactive';
  const isCurrentUser = !!(
    user &&
    (user.id === staff.authUserId ||
      (user.email && staff.email && user.email.toLowerCase() === staff.email.toLowerCase()))
  );

  return (
    <tr className="table-row-hover border-b border-gray-100 last:border-0">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: getAvatarColor(staff.name), color: getAvatarTextColor(staff.name) }}
          >
            {getInitials(staff.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{staff.name}</p>
            <p className="text-xs text-gray-400">{staff.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        <Badge className={roleStyles[staff.role]}>{staff.role}</Badge>
      </td>
      <td className="py-4 pr-4">
        <div className="flex flex-col gap-1 items-start">
          <AccountStatusIndicator status={staff.status} />
          {staff.hasLogin && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                isRevoked
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                  : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isRevoked ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              {isRevoked ? 'Access Revoked' : 'Login Active'}
            </span>
          )}
        </div>
      </td>
      <td className="py-4 pr-4 text-sm text-gray-500">{staff.joinDate}</td>
      <td className="py-4 pr-4 text-xs">
        {isCurrentUser ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Active now
          </span>
        ) : !staff.hasLogin ? (
          <span className="text-slate-400 font-normal">No account</span>
        ) : staff.lastActive === 'Never' || !staff.lastActive || staff.lastActive === '—' ? (
          <span className="text-slate-400 font-normal">Never logged in</span>
        ) : (
          <span className="text-slate-600 font-medium">{staff.lastActive}</span>
        )}
      </td>
      <td className="py-4">
        <div className="flex items-center justify-end gap-2">
          {/* If staff does NOT have a login yet, show Create Login button */}
          {!staff.hasLogin && onCreateLogin && (
            <button
              onClick={() => onCreateLogin(staff)}
              className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 hover:border-teal-300 transition-colors shadow-sm"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Create Login
            </button>
          )}

          {/* If staff HAS login, show the single Manage Access dropdown */}
          {staff.hasLogin && (
            <ManageAccessDropdown
              staff={staff}
              onResetPassword={onResetPassword || (() => {})}
              onChangeRole={onChangeRole || (() => {})}
              onToggleAccess={onToggleAccess || (() => {})}
              onRemoveLogin={onRemoveLogin || (() => {})}
            />
          )}

          <button
            onClick={() => onEdit(staff)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => onDeactivate(staff)}
            aria-label="Deactivate"
            className="rounded-xl p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <UserX className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
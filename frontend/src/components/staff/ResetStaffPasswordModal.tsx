'use client';

import { useState } from 'react';
import { X, KeyRound, Copy, CheckCircle2, RefreshCw, Send, Loader2 } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { resetPassword } from '@/services/authService';

interface ResetStaffPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function ResetStaffPasswordModal({
  isOpen,
  onClose,
  staff,
}: ResetStaffPasswordModalProps) {
  const [tempPassword, setTempPassword] = useState(generatePassword());
  const [copied, setCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !staff) return null;

  function handleCopy() {
    const text = `Staff Member: ${staff?.name}\nEmail: ${staff?.email}\nNew Password: ${tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSendResetEmail() {
    if (!staff?.email) return;
    setIsSendingEmail(true);
    setError('');
    try {
      await resetPassword(staff.email);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    } catch (err) {
      setError((err instanceof Error ? err.message : '') || 'Failed to send reset email');
    } finally {
      setIsSendingEmail(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
              <KeyRound className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Reset Credentials</h3>
              <p className="text-xs text-slate-500">For {staff.name} ({staff.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Option 1: Temporary Password */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">New Temporary Password</label>
              <button
                type="button"
                onClick={() => setTempPassword(generatePassword())}
                className="flex items-center gap-1 text-[11px] font-medium text-teal-600 hover:text-teal-700"
              >
                <RefreshCw className="h-3 w-3" />
                Regenerate
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tempPassword}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono font-medium text-slate-800"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50 transition-colors"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Provide this password to {staff.name}. They can update it after signing in.
            </p>
          </div>

          {/* Option 2: Send Email Link */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={isSendingEmail}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {isSendingEmail ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
              ) : emailSent ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Send className="h-3.5 w-3.5 text-slate-500" />
              )}
              {emailSent ? 'Reset Link Sent to Email!' : `Send Password Reset Link to ${staff.email}`}
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

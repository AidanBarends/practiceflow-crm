'use client';

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, X, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import { createEmployeeAccount } from '@/services/authService';
import { StaffMember } from '@/types/staff';

interface CreateLoginModalProps {
  isOpen: boolean;
  staff: StaffMember | null;
  onClose: () => void;
  onSuccess: (staffId: string) => void;
}

function generatePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let result = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}

export default function CreateLoginModal({ isOpen, staff, onClose, onSuccess }: CreateLoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens with new staff
  const handleOpen = () => {
    if (staff) {
      setEmail(staff.email);
      setPassword(generatePassword());
      setShowPassword(true);
      setError('');
      setSuccess(false);
      setCopied(false);
    }
  };

  // Run handleOpen when staff changes
  useState(() => {
    if (isOpen && staff) handleOpen();
  });

  if (!isOpen || !staff) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staff) return;

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await createEmployeeAccount({
        email,
        password,
        fullName: staff.name,
        role: staff.role,
        staffId: staff.id,
      });
      setSuccess(true);
      onSuccess(staff.id);
    } catch (err: any) {
      setError(err?.message || 'Failed to create login account.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyCredentials() {
    const text = `Email: ${email}\nTemporary Password: ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setSuccess(false);
    setCopied(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md animate-fade-in rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
              <KeyRound className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Create Login</h3>
              <p className="text-xs text-slate-500">for {staff.name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            /* Success State */
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
              <h4 className="text-lg font-semibold text-slate-900">Login Created!</h4>
              <p className="mt-1 text-sm text-slate-500">
                Share these credentials with {staff.name}. They should change their password on first login.
              </p>

              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-500">Email:</span>
                    <span className="ml-2 font-mono text-slate-900">{email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Password:</span>
                    <span className="ml-2 font-mono text-slate-900">{password}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleCopyCredentials}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Credentials
                    </>
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-teal-700 hover:to-emerald-700 transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Staff Member
                </label>
                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                  {staff.name} — <span className="text-slate-500">{staff.role}</span>
                </div>
              </div>

              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Login Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-focus w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700"
                  >
                    <RefreshCw className="h-3 w-3" /> Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-focus w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 pr-10 text-sm text-gray-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">The employee should change this after their first login.</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Login'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

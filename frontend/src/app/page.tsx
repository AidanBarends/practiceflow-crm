'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { loginWithEmail, resetPassword } from '@/services/authService';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await loginWithEmail(email, password);
      router.push('/dashboard');
    } catch (err) {
      const message = (err instanceof Error ? err.message : '') || 'Login failed';
      if (message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (message.includes('Email not confirmed')) {
        setError('Your email has not been confirmed. Please contact your administrator.');
      } else if (message.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetError('');
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError((err instanceof Error ? err.message : '') || 'Failed to send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  }

  // Show nothing while checking if user is already logged in
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  // Already logged in, will redirect
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left: Brand Panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="animated-gradient absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900" />
        
        {/* Decorative floating shapes */}
        <div className="absolute -left-24 -top-24 h-96 w-96 animate-pulse rounded-full bg-teal-400/20 mix-blend-screen blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 animate-pulse rounded-full bg-emerald-400/20 mix-blend-screen blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="absolute right-1/4 top-1/4 h-64 w-64 animate-pulse rounded-full bg-teal-200/10 mix-blend-screen blur-3xl" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex w-full justify-center pt-20 pb-4">
          <Image
            src="/logo.png"
            alt="PracticeFlow CRM"
            width={450}
            height={150}
            className="w-[225px] h-auto object-contain drop-shadow-2xl"
            priority
          />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-50 backdrop-blur-md">
            <ShieldCheck size={14} className="text-emerald-400" /> HIPAA Compliant Medical Platform
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Unified Clinical & Practice Management
          </h1>
          <p className="mt-4 text-base leading-relaxed text-teal-50/90">
            Seamlessly manage patient directory records, SOAP clinical encounter notes, and staff operations in a real-time connected workspace.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-teal-100/70">
          <span>© 2026 PracticeFlow CRM v1.0</span>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center lg:hidden rounded-xl bg-slate-900 p-4">
            <Image
              src="/logo.png"
              alt="PracticeFlow CRM"
              width={260}
              height={80}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>

          {showForgotPassword ? (
            /* Forgot Password Form */
            <>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Reset Password</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {resetSent ? (
                <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <h3 className="text-lg font-semibold text-emerald-800">Check Your Email</h3>
                  <p className="mt-2 text-sm text-emerald-600">
                    We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>. Please check your inbox and follow the instructions.
                  </p>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetSent(false);
                      setResetEmail('');
                    }}
                    className="mt-4 text-sm font-medium text-teal-600 hover:text-teal-700"
                  >
                    ← Back to sign in
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="doctor@practiceflow.com"
                        className="input-focus w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900"
                      />
                    </div>
                  </div>

                  {resetError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                      {resetError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 disabled:opacity-70"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetError('');
                    }}
                    className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    ← Back to sign in
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Login Form */
            <>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome Back</h2>
              <p className="mt-1.5 text-sm text-gray-500">
                Sign in to access your practice portal.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@practiceflow.com"
                      className="input-focus w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setResetEmail(email);
                      }}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-focus w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-gray-600">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-teal-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In to Portal'
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-xs text-gray-400">
            PracticeFlow CRM • Secured with 256-bit Encryption
          </p>
        </div>
      </div>
    </div>
  );
}
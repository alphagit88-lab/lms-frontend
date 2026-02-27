'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authAPI } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await authAPI.forgotPassword(email);
            setSuccess(true);
            // In development, the API returns the token directly
            if (result.resetToken) {
                setResetToken(result.resetToken);
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60" />
                <div className="relative flex flex-col justify-center items-center w-full p-12 text-white">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
                    <p className="text-amber-100 text-center max-w-sm text-lg leading-relaxed">
                        Don&apos;t worry, it happens to the best of us. We&apos;ll help you get back into your account.
                    </p>
                    <div className="mt-12 flex items-center gap-4 text-amber-100">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-sm">Secure</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-amber-200" />
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">Quick</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-amber-200" />
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">Easy</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                    </div>

                    {!success ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Forgot your password?
                                </h2>
                                <p className="text-slate-500 mt-2">
                                    Enter your email address and we&apos;ll send you a reset link
                                </p>
                            </div>

                            <div className="space-y-6">
                                {error && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Sending...
                                            </span>
                                        ) : (
                                            'Send Reset Link'
                                        )}
                                    </button>
                                </form>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-3 bg-white text-slate-500">
                                            Remember your password?
                                        </span>
                                    </div>
                                </div>

                                <Link
                                    href="/login"
                                    className="block w-full text-center py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
                                <p className="text-slate-500">
                                    If an account exists for <span className="font-medium text-slate-700">{email}</span>, you will receive a password reset link.
                                </p>
                            </div>

                            {/* Dev mode: show token directly */}
                            {resetToken && (
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left">
                                    <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Development Mode — Reset Token
                                    </p>
                                    <p className="text-xs text-amber-600 break-all font-mono bg-amber-100 p-2 rounded-lg">
                                        {resetToken}
                                    </p>
                                    <Link
                                        href={`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`}
                                        className="mt-3 inline-block w-full text-center py-2.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
                                    >
                                        Go to Reset Password →
                                    </Link>
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <Link
                                    href="/login"
                                    className="block w-full text-center py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                                >
                                    Back to Sign In
                                </Link>
                            </div>
                        </div>
                    )}

                    <p className="text-center mt-8 text-xs text-slate-400">
                        &copy; 2026 LMS. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

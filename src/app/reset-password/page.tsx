'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api/auth';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        token: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Pre-fill from URL params (when coming from the dev-mode link)
    useEffect(() => {
        const email = searchParams.get('email');
        const token = searchParams.get('token');
        if (email || token) {
            setFormData((prev) => ({
                ...prev,
                email: email || prev.email,
                token: token || prev.token,
            }));
        }
    }, [searchParams]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Client-side validation
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        const hasUpperCase = /[A-Z]/.test(formData.newPassword);
        const hasLowerCase = /[a-z]/.test(formData.newPassword);
        const hasNumber = /[0-9]/.test(formData.newPassword);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            setError(
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
            );
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword({
                email: formData.email,
                token: formData.token,
                newPassword: formData.newPassword,
            });
            setSuccess(true);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Password strength indicator
    const getPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[a-z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(formData.newPassword);
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-60" />
                <div className="relative flex flex-col justify-center items-center w-full p-12 text-white">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Create New Password</h1>
                    <p className="text-emerald-100 text-center max-w-sm text-lg leading-relaxed">
                        Choose a strong, unique password to secure your account and protect your data.
                    </p>
                    <div className="mt-12 space-y-3 text-emerald-100 text-sm">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>At least 8 characters long</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Include uppercase and lowercase letters</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Include numbers and special characters</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </div>

                    {!success ? (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">
                                    Set a new password
                                </h2>
                                <p className="text-slate-500 mt-2">
                                    Enter your reset token and choose a new password
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
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="token" className="block text-sm font-medium text-slate-700 mb-2">
                                            Reset Token
                                        </label>
                                        <input
                                            id="token"
                                            name="token"
                                            type="text"
                                            required
                                            value={formData.token}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition font-mono text-sm"
                                            placeholder="Paste your reset token here"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="newPassword"
                                                name="newPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition pr-12"
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                            >
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                        {/* Password strength indicator */}
                                        {formData.newPassword && (
                                            <div className="mt-2">
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4, 5].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= level
                                                                    ? strengthColors[passwordStrength]
                                                                    : 'bg-slate-200'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className={`text-xs ${passwordStrength <= 2 ? 'text-red-500' :
                                                        passwordStrength <= 3 ? 'text-yellow-600' :
                                                            'text-green-600'
                                                    }`}>
                                                    {strengthLabels[passwordStrength]}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                            placeholder="Confirm new password"
                                        />
                                        {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                        )}
                                        {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Passwords match
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Resetting...
                                            </span>
                                        ) : (
                                            'Reset Password'
                                        )}
                                    </button>
                                </form>
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
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Successful!</h2>
                                <p className="text-slate-500">
                                    Your password has been updated. You can now sign in with your new password.
                                </p>
                            </div>

                            <Link
                                href="/login"
                                className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
                            >
                                Go to Sign In
                            </Link>
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Loading...</p>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}

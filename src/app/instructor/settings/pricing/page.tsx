'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getMyTeacherProfile, updateTeacherProfile, TeacherProfile } from '@/lib/api/profile';

export default function PricingConfigurationPage() {
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [hourlyRate, setHourlyRate] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const fetchedProfile = await getMyTeacherProfile();
                if (fetchedProfile) {
                    setProfile(fetchedProfile);
                    setHourlyRate(fetchedProfile.hourlyRate || 0);
                } else {
                    setError('Profile not found. Please complete your profile first.');
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage('');
        setError(null);

        try {
            const updatedProfile = await updateTeacherProfile({ hourlyRate });
            setProfile(updatedProfile);
            setSuccessMessage('Pricing updated successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update pricing';
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-4">
                        Monetization Settings
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Set your pricing configuration for live teaching sessions and general availability.
                    </p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Pricing Form */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-xl shadow-slate-200/40">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Base Rate
                            </h2>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div>
                                    <label htmlFor="hourlyRate" className="block text-sm font-semibold text-slate-700 mb-2">
                                        Default Hourly Rate (LKR)
                                    </label>
                                    <p className="text-sm text-slate-500 mb-4">
                                        This rate will be used as the default base price when you create new availability slots.
                                        You can still override the price on individual slots if necessary.
                                    </p>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <span className="text-slate-400 font-medium">LKR</span>
                                        </div>
                                        <input
                                            type="number"
                                            id="hourlyRate"
                                            required
                                            min="0"
                                            step="100"
                                            value={hourlyRate}
                                            onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                                            className="block w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow font-medium text-slate-900"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-semibold hover:bg-slate-800 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Pricing Changes'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Packages Information Card */}
                        <div className="bg-slate-900 rounded-3xl p-8 shadow-xl relative overflow-hidden text-white">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                Package Discounts
                            </h2>
                            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                                To encourage bulk bookings, our platform automatically applies package discounts if students purchase multiple sessions with you at once.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">3-4 Sessions</p>
                                    <p className="text-2xl font-bold">5% Off</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">5+ Sessions</p>
                                    <p className="text-2xl font-bold">10% Off</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Commission Info
                            </h3>
                            <p className="text-sm text-emerald-800 leading-relaxed mb-4">
                                The platform takes a standard <strong>10% commission</strong> fee on all successful transactions. This means you keep 90% of your earnings.
                            </p>
                            <div className="bg-white/60 p-4 rounded-xl">
                                <p className="text-xs text-emerald-700 font-medium mb-1">Example Payout (per hour):</p>
                                <p className="text-xl font-bold text-emerald-900">
                                    {hourlyRate > 0 ? `LKR ${(hourlyRate * 0.9).toFixed(2)}` : 'LKR 0.00'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
                            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Best Practices
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-3 leading-relaxed">
                                <li className="flex gap-2">
                                    <span className="text-blue-500">•</span>
                                    Research average rates in your subject to remain competitive.
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-blue-500">•</span>
                                    Start with a lower rate to build up positive reviews, then gradually increase.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

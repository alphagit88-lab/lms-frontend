"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentHistory from "@/components/payment/PaymentHistory";
import { getTeacherEarnings } from "@/lib/api/payments";
import { Wallet, TrendingUp, History, Download, DollarSign, ArrowUpRight, Clock } from "lucide-react";

interface Payout {
    id: string;
    amount: number;
    status: 'completed' | 'pending';
    periodEnd: string;
    processedAt?: string;
}

interface EarningsData {
    totalEarnings: number;
    pendingPayouts: number;
    payouts: Payout[];
}

export default function EarningsDashboard() {
    const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEarnings = async () => {
            try {
                const data = await getTeacherEarnings();
                setEarningsData(data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load earnings dashboard.";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, []);

    if (loading) {
        return (
            <ProtectedRoute allowedRoles={["instructor"]}>
                <AppLayout>
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-sm text-slate-400 font-medium">Loading earnings…</p>
                        </div>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute allowedRoles={["instructor"]}>
                <AppLayout>
                    <div className="w-full px-6 lg:px-10 py-10">
                        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm text-red-500">
                                <Wallet className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold">Error loading earnings</h3>
                                <p className="text-sm mt-0.5 opacity-75">{error}</p>
                            </div>
                        </div>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    const { totalEarnings = 0, pendingPayouts = 0, payouts = [] } = earningsData || {};

    return (
        <ProtectedRoute allowedRoles={["instructor"]}>
            <AppLayout>
                <div className="w-full min-h-screen bg-slate-50">

                    {/* Hero Header */}
                    <div className="bg-linear-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 lg:px-10 pt-10 pb-20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">Instructor Portal</span>
                                </div>
                                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Earnings & Payouts</h1>
                                <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-lg">
                                    Track your financial performance. Weekly payouts are processed every Sunday directly to your account.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Stat Cards — overlapping hero */}
                    <div className="px-6 lg:px-10 -mt-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Total Earnings */}
                            <div className="relative bg-white rounded-2xl p-6 shadow-xl border border-slate-100 overflow-hidden">
                                <div className="absolute -right-6 -top-6 w-28 h-28 bg-slate-100 rounded-full opacity-60" />
                                <div className="absolute -right-2 -top-2 w-16 h-16 bg-emerald-50 rounded-full opacity-80" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-slate-100 rounded-lg">
                                                <DollarSign className="w-4 h-4 text-slate-600" />
                                            </div>
                                            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total Accumulated</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold">
                                            <ArrowUpRight className="w-3 h-3" />
                                            All Time
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-slate-400 text-lg font-bold">LKR</span>
                                        <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                                            {totalEarnings.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Pending Payout */}
                            <div className="relative bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-xl overflow-hidden">
                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full" />
                                <div className="absolute -right-2 top-6 w-16 h-16 bg-white/10 rounded-full" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 bg-white/20 rounded-lg">
                                                <Wallet className="w-4 h-4 text-white" />
                                            </div>
                                            <span className="text-xs font-bold tracking-widest text-emerald-100 uppercase">Pending Payout</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-white/20 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                                            <Clock className="w-3 h-3" />
                                            Upcoming Sunday
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-emerald-200 text-lg font-bold">LKR</span>
                                        <span className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                                            {pendingPayouts.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="px-6 lg:px-10 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Transaction Ledger — 2/3 width */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-slate-200 rounded-lg">
                                        <History className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Transaction Ledger</h2>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <PaymentHistory />
                                </div>
                            </div>

                            {/* Recent Payouts — 1/3 width */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-slate-200 rounded-lg">
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900">Recent Payouts</h2>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    {payouts.length === 0 ? (
                                        <div className="p-10 text-center">
                                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <Wallet className="w-7 h-7 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-500">No payouts yet</p>
                                            <p className="text-xs text-slate-400 mt-1">Payouts are processed every Sunday</p>
                                        </div>
                                    ) : (
                                        <ul className="divide-y divide-slate-100">
                                            {payouts.slice(0, 6).map((payout: Payout) => (
                                                <li key={payout.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                                                            payout.status === 'completed'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {new Date(payout.periodEnd).toLocaleDateString(undefined, { day: 'numeric' })}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {new Date(payout.periodEnd).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                            </p>
                                                            <span className={`text-[10px] font-bold tracking-widest uppercase ${
                                                                payout.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                                                            }`}>
                                                                {payout.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-slate-900">LKR {payout.amount.toFixed(2)}</p>
                                                        {payout.processedAt && (
                                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                                {new Date(payout.processedAt).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

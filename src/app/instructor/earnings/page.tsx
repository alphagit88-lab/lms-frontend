"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentHistory from "@/components/payment/PaymentHistory";
import { getTeacherEarnings } from "@/lib/api/payments";
import { Wallet, TrendingUp, History, Download, DollarSign } from "lucide-react";

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
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    if (error) {
        return (
            <ProtectedRoute allowedRoles={["instructor"]}>
                <AppLayout>
                    <div className="max-w-6xl mx-auto py-10 px-4">
                        <div className="bg-red-50 text-red-700 p-6 rounded-3xl border border-red-100 flex items-center gap-4">
                            <div className="p-3 bg-white rounded-2xl shadow-sm text-red-500">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Error loading earnings</h3>
                                <p className="text-sm font-medium mt-1 opacity-80">{error}</p>
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
                <div className="max-w-6xl mx-auto py-8 lg:py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Earnings & Payouts</h1>
                            </div>
                            <p className="text-slate-500 max-w-xl leading-relaxed ml-1">
                                Track your financial performance. Weekly payouts are processed automatically every Sunday directly to your registered account.
                            </p>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <DollarSign className="w-32 h-32" strokeWidth={1} />
                            </div>
                            <div>
                                <p className="text-slate-400 font-bold tracking-widest uppercase text-sm mb-2">Total Accumulated (All Time)</p>
                                <div className="text-5xl font-black tracking-tighter">
                                    <span className="text-2xl mr-1 text-slate-400 font-bold">LKR</span>
                                    {totalEarnings.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-3xl p-8 relative overflow-hidden shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-emerald-700 font-bold tracking-widest uppercase text-sm mb-2">Pending Payout</p>
                                        <div className="text-5xl font-black tracking-tighter text-emerald-600">
                                            <span className="text-2xl mr-1 font-bold">LKR</span>
                                            {pendingPayouts.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600">
                                        <Wallet className="w-8 h-8" />
                                    </div>
                                </div>
                                <p className="text-sm font-medium text-emerald-700 mt-6 bg-emerald-100/50 p-4 rounded-xl inline-block">
                                    Estimated processing date: <strong>Upcoming Sunday</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payouts Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <History className="w-5 h-5 text-slate-400" />
                                Transaction Ledger
                            </h2>
                            <PaymentHistory />
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                <Download className="w-5 h-5 text-slate-400" />
                                Recent Payouts
                            </h2>
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
                                {payouts.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50/50 rounded-2xl m-2 border border-dashed border-slate-200">
                                        <Wallet className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                                        <p className="text-sm font-bold text-slate-500">No payouts yet</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {payouts.slice(0, 5).map((payout: Payout) => (
                                            <li key={payout.id} className="p-4 flex items-center justify-between hover:bg-slate-50 rounded-2xl transition-colors">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-1">
                                                        {new Date(payout.periodEnd).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${payout.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {payout.status}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-slate-900">LKR {payout.amount.toFixed(2)}</p>
                                                    {payout.processedAt && (
                                                        <p className="text-xs font-medium text-slate-400 mt-1">Paid {new Date(payout.processedAt).toLocaleDateString()}</p>
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
            </AppLayout>
        </ProtectedRoute>
    );
}

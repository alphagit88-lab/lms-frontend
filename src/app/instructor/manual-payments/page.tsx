"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ManualPayment, getPendingManualPayments, reviewManualPayment } from "@/lib/api/payments";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

function statusBadge(status: string) {
    const map: Record<string, string> = {
        under_review: "bg-amber-100 text-amber-700",
        completed: "bg-emerald-100 text-emerald-700",
        failed: "bg-red-100 text-red-700",
        pending: "bg-slate-100 text-slate-600",
    };
    return map[status] || "bg-slate-100 text-slate-600";
}

export default function InstructorManualPaymentsPage() {
    const [payments, setPayments] = useState<ManualPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const data = await getPendingManualPayments();
            setPayments(data.payments);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load bank transfer payments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleReview = async (paymentId: string, action: "approve" | "reject") => {
        let note: string | undefined;
        if (action === "reject") {
            const input = prompt("Reason for rejection (optional):");
            note = input || undefined;
        }
        setActionLoading(paymentId);
        try {
            await reviewManualPayment(paymentId, action, note);
            setSuccess(action === "approve" ? "Payment approved — student enrolled!" : "Payment rejected.");
            load();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Action failed.");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["instructor"]}>
            <AppLayout>
                <div className="max-w-5xl mx-auto py-8 px-4">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">Bank Transfer Slips</h1>
                        <p className="text-slate-500 text-sm">Review students who paid via bank transfer for your courses.</p>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                            <p className="text-red-700 text-sm">{error}</p>
                            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <p className="text-emerald-700 text-sm">{success}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No Pending Bank Transfers</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">When a student submits a bank slip for one of your courses, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Student</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Amount</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Reference</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Submitted</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Slip</th>
                                            <th className="text-right px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p) => (
                                            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-slate-900">{p.user?.firstName} {p.user?.lastName}</p>
                                                    <p className="text-[10px] text-slate-400">{p.user?.email}</p>
                                                </td>
                                                <td className="px-5 py-4 font-bold text-slate-900">
                                                    {p.currency} {Number(p.amount).toFixed(2)}
                                                </td>
                                                <td className="px-5 py-4 font-mono text-xs text-slate-500 max-w-[140px] truncate">
                                                    {p.referenceId || p.id}
                                                </td>
                                                <td className="px-5 py-4 text-slate-400 text-xs">
                                                    {new Date(p.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBadge(p.paymentStatus)}`}>
                                                        {p.paymentStatus.replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {p.bankSlipUrl ? (
                                                        <a
                                                            href={`${API_BASE}${p.bankSlipUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            VIEW SLIP
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">Not yet uploaded</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {p.paymentStatus === "under_review" && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleReview(p.id, "approve")}
                                                                disabled={actionLoading === p.id}
                                                                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                                                            >
                                                                APPROVE
                                                            </button>
                                                            <button
                                                                onClick={() => handleReview(p.id, "reject")}
                                                                disabled={actionLoading === p.id}
                                                                className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-50 transition disabled:opacity-50"
                                                            >
                                                                REJECT
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

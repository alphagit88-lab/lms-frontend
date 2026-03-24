"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getPaymentHistory, processRefund } from "@/lib/api/payments";
import { Clock, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface Payment {
    id: string;
    createdAt: string;
    paymentType: string;
    amount: number;
    currency: string;
    paymentStatus: string;
    refundAmount?: number | null;
    refundDate?: string | null;
}

interface RefundModalState {
    paymentId: string;
    amount: number;
    currency: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [refundModal, setRefundModal] = useState<RefundModalState | null>(null);
    const [refundReason, setRefundReason] = useState("");
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundError, setRefundError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const data = await getPaymentHistory();
                setPayments(data.payments || []);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load payment history";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case "failed":
                return <XCircle className="w-5 h-5 text-red-500" />;
            case "refunded":
            case "partially_refunded":
                return <RotateCcw className="w-5 h-5 text-purple-500" />;
            default:
                return <Clock className="w-5 h-5 text-amber-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase rounded-md tracking-wider">Completed</span>;
            case "failed":
                return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold uppercase rounded-md tracking-wider">Failed</span>;
            case "refunded":
                return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold uppercase rounded-md tracking-wider">Refunded</span>;
            case "partially_refunded":
                return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-bold uppercase rounded-md tracking-wider">Partial Refund</span>;
            default:
                return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase rounded-md tracking-wider">{status}</span>;
        }
    };

    const canRequestRefund = (payment: Payment) =>
        payment.paymentType === 'booking_session' && payment.paymentStatus === 'completed';

    const openRefundModal = (payment: Payment) => {
        setRefundModal({ paymentId: payment.id, amount: payment.amount, currency: payment.currency || 'LKR' });
        setRefundReason("");
        setRefundError(null);
    };

    const [syncingId, setSyncingId] = useState<string | null>(null);

    const syncPayment = async (paymentId: string) => {
        try {
            setSyncingId(paymentId);
            setError(null);
            
            const API_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");
            const res = await fetch(`${API_URL}/api/payments/${paymentId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ force: false }) // Student shouldn't be able to force, but API will check host anyways
            });
            
            const data = await res.json();
            if (data.success) {
                setSuccessMsg(data.message);
                // Refresh the list
                const refreshedData = await getPaymentHistory();
                setPayments(refreshedData.payments || []);
            } else {
                setError(data.message);
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
            setError("Failed to sync payment status.");
        } finally {
            setSyncingId(null);
        }
    };

    const handleRefundSubmit = async () => {
        if (!refundModal) return;
        if (!refundReason.trim()) { setRefundError("Please provide a reason for the refund."); return; }
        setRefundLoading(true);
        setRefundError(null);
        try {
            const result = await processRefund(refundModal.paymentId, refundReason.trim());
            setPayments(prev => prev.map(p =>
                p.id === refundModal.paymentId
                    ? { ...p, paymentStatus: result.payment.paymentStatus, refundAmount: result.refundAmount }
                    : p
            ));
            setRefundModal(null);
            setSuccessMsg(result.message || `Refund of ${refundModal.currency} ${result.refundAmount.toLocaleString()} processed successfully.`);
            setTimeout(() => setSuccessMsg(null), 6000);
        } catch (err) {
            setRefundError(err instanceof Error ? err.message : "Failed to process refund.");
        } finally {
            setRefundLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="max-w-4xl mx-auto py-10 px-4">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
                            <p className="text-slate-500 mt-1">Review your recent transactions and payments.</p>
                        </div>
                    </div>

                    {successMsg && (
                        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>{successMsg}</span>
                            <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">✕</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="bg-white border text-center border-slate-200 rounded-2xl p-12 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No payment history</h3>
                            <p className="text-slate-500 mt-2">You haven&apos;t made any transactions yet.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider">Date & ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {payments.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {new Date(payment.createdAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {payment.id.split('-')[0]}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-700 capitalize">
                                                    {payment.paymentType.replace(/_/g, ' ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {payment.currency || 'LKR'} {Number(payment.amount).toLocaleString()}
                                                </div>
                                                {payment.refundAmount != null && Number(payment.refundAmount) > 0 && (
                                                    <div className="text-xs text-purple-600 mt-0.5">
                                                        Refunded: {payment.currency || 'LKR'} {Number(payment.refundAmount).toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(payment.paymentStatus)}
                                                    {getStatusBadge(payment.paymentStatus)}
                                                </div>
                                            </td>
                                             <td className="px-6 py-4 whitespace-nowrap text-right">
                                                 <div className="flex justify-end gap-2">
                                                     {payment.paymentStatus === 'pending' && (
                                                         <button
                                                             onClick={() => syncPayment(payment.id)}
                                                             disabled={syncingId === payment.id}
                                                             className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
                                                         >
                                                             <RotateCcw className={`w-3.5 h-3.5 ${syncingId === payment.id ? 'animate-spin' : ''}`} />
                                                             {syncingId === payment.id ? 'Syncing...' : 'Sync Status'}
                                                         </button>
                                                     )}
                                                     {canRequestRefund(payment) && (
                                                         <button
                                                             onClick={() => openRefundModal(payment)}
                                                             className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
                                                         >
                                                             <RotateCcw className="w-3.5 h-3.5" />
                                                             Request Refund
                                                         </button>
                                                     )}
                                                 </div>
                                             </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Refund Request Modal */}
                {refundModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                            <div className="px-6 py-5 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900">Request Refund</h2>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Amount: <span className="font-semibold text-slate-700">{refundModal.currency} {Number(refundModal.amount).toLocaleString()}</span>
                                </p>
                            </div>

                            <div className="px-6 py-5 space-y-4">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                                    <p className="font-semibold mb-1">Refund Policy</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                                        <li>≥ 48 hours before session: 100% refund</li>
                                        <li>≥ 6 hours before session: 50% refund</li>
                                        <li>&lt; 6 hours before session: No refund</li>
                                    </ul>
                                    <p className="mt-2 text-xs text-amber-600">Refund will be processed via PayHere merchant portal and may take 3–7 business days.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Reason for Refund <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Please explain why you are requesting a refund..."
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    />
                                    <p className="text-xs text-slate-400 text-right mt-1">{refundReason.length}/500</p>
                                </div>

                                {refundError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                                        {refundError}
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                                <button
                                    onClick={() => setRefundModal(null)}
                                    disabled={refundLoading}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRefundSubmit}
                                    disabled={refundLoading || !refundReason.trim()}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {refundLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AppLayout>
        </ProtectedRoute>
    );
}

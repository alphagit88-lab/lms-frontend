"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getPaymentHistory } from "@/lib/api/payments";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface Payment {
    id: string;
    createdAt: string;
    paymentType: string;
    amount: number;
    paymentStatus: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            default:
                return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase rounded-md tracking-wider">{status}</span>;
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
                                                    {payment.paymentType.replace('_', ' ')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-900">
                                                    ${payment.amount}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(payment.paymentStatus)}
                                                    {getStatusBadge(payment.paymentStatus)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

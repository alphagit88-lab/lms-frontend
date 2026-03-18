"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/api/payments";
import { ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";

interface Transaction {
    id: string;
    transactionType: "payment" | "payhere" | "manual" | "refund" | "payout" | "platform_fee";
    amount: number;
    description: string;
    createdAt: string;
}

export default function PaymentHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const data = await getTransactions();
                setTransactions(data.transactions || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load transactions.");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "payment":
            case "payhere":
                return <Receipt className="w-5 h-5 text-blue-500" />;
            case "manual":
                return <Receipt className="w-5 h-5 text-amber-500" />;
            case "payout":
                return <ArrowUpRight className="w-5 h-5 text-emerald-500" />;
            case "refund":
                return <ArrowDownLeft className="w-5 h-5 text-amber-500" />;
            case "platform_fee":
                return <ArrowUpRight className="w-5 h-5 text-slate-500" />;
            default:
                return <Receipt className="w-5 h-5 text-slate-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "payment":
            case "payhere": return "bg-blue-50 text-blue-700";
            case "manual": return "bg-amber-50 text-amber-700";
            case "payout": return "bg-emerald-50 text-emerald-700";
            case "refund": return "bg-purple-50 text-purple-700";
            case "platform_fee": return "bg-slate-100 text-slate-700";
            default: return "bg-slate-50 text-slate-700";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm">
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white border text-center border-slate-200 rounded-2xl p-12 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No transactions found</h3>
                <p className="text-slate-500 mt-2">You don&apos;t have any financial history yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider uppercase">Date & ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider uppercase">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 tracking-wider uppercase">Description</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 tracking-wider uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {transactions.map((txn) => (
                            <tr key={txn.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-bold text-slate-900">
                                        {new Date(txn.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5 group-hover:text-slate-600 transition-colors">
                                        {txn.id.split('-')[0]}...
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(txn.transactionType)}
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md tracking-wider ${getTypeColor(txn.transactionType)}`}>
                                            {txn.transactionType.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 max-w-sm truncate">
                                        {txn.description || "—"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className={`text-sm font-bold ${txn.transactionType === 'payout' || txn.transactionType === 'refund' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {(txn.transactionType === 'payout' || txn.transactionType === 'refund') ? "+" : ""}
                                        LKR {parseFloat(txn.amount.toString()).toFixed(2)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

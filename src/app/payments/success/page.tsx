"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { CheckCircle, Clock, RefreshCw, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("order_id");
    const [status, setStatus] = useState<'pending' | 'completed' | 'loading'>('loading');
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState("");

    const API_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

    const fetchStatus = useCallback(async () => {
        if (!orderId) return;
        try {
            const res = await fetch(`${API_URL}/api/payments/${orderId}/status`, { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            if (data.status === 'completed') {
                setStatus('completed');
            } else {
                setStatus('pending');
            }
        } catch (err) {
            console.error("Status check error:", err);
        }
    }, [orderId, API_URL]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleVerify = async (force = false) => {
        if (!orderId) return;
        setIsVerifying(true);
        setMessage("");
        try {
            const res = await fetch(`${API_URL}/api/payments/${orderId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ force })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('completed');
                setMessage(data.message);
            } else {
                setMessage(data.message);
            }
        } catch (err) {
            console.error("Verification error:", err);
            setMessage("Failed to verify payment status.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto py-20 px-4 text-center">
            {status === 'completed' ? (
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
            ) : (
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-blue-500 animate-pulse" />
                </div>
            )}
            
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
                {status === 'completed' ? "Payment Confirmed!" : "Payment Received!"}
            </h1>
            
            <p className="text-slate-500 mb-2">
                {status === 'completed' 
                    ? "Your booking/enrollment has been successfully activated." 
                    : "Your payment has been received and is being processed by our system."}
            </p>

            {orderId && (
                <p className="text-xs text-slate-400 font-mono mb-8">
                    Order ID: {orderId}
                </p>
            )}

            {status === 'pending' && (
                <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
                    <p className="text-sm text-slate-600 mb-4">
                        We are waiting for the final confirmation from the payment gateway. 
                        This usually takes a few seconds.
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => handleVerify(false)}
                            disabled={isVerifying}
                            className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
                            Sync Payment Status
                        </button>
                        
                        {/* Hidden override for local development */}
                        {(typeof window !== 'undefined' && window.location.hostname === 'localhost') && (
                            <button
                                onClick={() => handleVerify(true)}
                                disabled={isVerifying}
                                className="mt-2 text-[10px] text-slate-300 hover:text-slate-500 underline"
                            >
                                Dev Override: Force Complete
                            </button>
                        )}
                    </div>
                </div>
            )}

            {message && (
                <p className={`text-xs mb-6 flex items-center justify-center gap-1 ${message.includes("success") || message.includes("confirmed") ? "text-emerald-600" : "text-amber-600"}`}>
                    <AlertCircle className="w-3 h-3" />
                    {message}
                </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    Go to Dashboard
                </button>
                <button
                    onClick={() => router.push("/payments")}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition"
                >
                    Payment History
                </button>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <AppLayout>
            <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
                <SuccessContent />
            </Suspense>
        </AppLayout>
    );
}

"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PaymentForm from "@/components/payment/PaymentForm";
import { initializePayment, type PayHereCheckoutParams } from "@/lib/api/payments";
import { CreditCard, CheckCircle, ShieldCheck } from "lucide-react";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [checkoutParams, setCheckoutParams] = useState<PayHereCheckoutParams | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const type = searchParams.get("type") as "booking_session" | "course_enrollment" | null;
    const referenceId = searchParams.get("referenceId");
    const amountStr = searchParams.get("amount");
    const amount = amountStr ? parseFloat(amountStr) : 0;

    useEffect(() => {
        if (!type || !referenceId || !amount) {
            setError("Missing checkout parameters. Please return and try again.");
            setLoading(false);
            return;
        }

        const init = async () => {
            try {
                const response = await initializePayment({ type, referenceId, amount });

                if (response.isFree) {
                    // Free item — treat as instant success
                    setSuccess(true);
                    return;
                }

                if (!response.checkoutParams || !response.checkoutUrl) {
                    throw new Error("Payment initialization failed. Please try again.");
                }

                setCheckoutParams(response.checkoutParams);
                setCheckoutUrl(response.checkoutUrl);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to initialize payment.");
            } finally {
                setLoading(false);
            }
        };

        void init();
    }, [type, referenceId, amount]);

    const handleSuccess = () => {
        setSuccess(true);
        setTimeout(() => {
            if (type === "booking_session") {
                router.push("/bookings");
            } else if (type === "course_enrollment") {
                router.push("/student/my-courses");
            } else {
                router.push("/payments");
            }
        }, 3000);
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="flex h-[50vh] items-center justify-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    if (success) {
        return (
            <ProtectedRoute>
                <AppLayout>
                    <div className="max-w-md mx-auto py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100/50">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">Payment Successful!</h1>
                        <p className="text-slate-500 mb-8">
                            Your transaction has been securely processed. You will be redirected shortly...
                        </p>
                        <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="max-w-4xl mx-auto py-10 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* Summary Sidebar */}
                        <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <CreditCard className="w-32 h-32 text-white" strokeWidth={1} />
                            </div>

                            <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm font-medium border-b border-white/10 pb-4">
                                    <span className="text-slate-300">Description</span>
                                    <span className="uppercase">{type?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium border-b border-white/10 pb-4">
                                    <span className="text-slate-300">Reference ID</span>
                                    <span className="font-mono">{referenceId?.split('-')[0]}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold border-b border-white/10 pb-4">
                                    <span className="text-white">Total Amount</span>
                                    <span>LKR {amount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">Guaranteed Safe Checkout</p>
                                    <p className="text-xs text-slate-400">Your payment is encrypted and processed securely by PayHere.</p>
                                </div>
                            </div>
                        </div>

                        {/* PayHere Payment Form */}
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Payment</h1>
                            <p className="text-slate-500 text-sm mb-6">
                                Click the button below to proceed to PayHere&apos;s secure checkout page.
                            </p>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm mb-6 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {checkoutParams && checkoutUrl && (
                                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative">
                                    <PaymentForm
                                        onSuccess={handleSuccess}
                                        amount={amount}
                                        checkoutParams={checkoutParams}
                                        checkoutUrl={checkoutUrl}
                                    />
                                    <div className="absolute top-0 right-0 -m-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100 hidden sm:flex items-center gap-2 transform rotate-3 z-10 shadow-sm">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">SSL Secured</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <ProtectedRoute>
                <AppLayout>
                    <div className="flex h-[50vh] items-center justify-center">
                        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                </AppLayout>
            </ProtectedRoute>
        }>
            <CheckoutContent />
        </Suspense>
    );
}

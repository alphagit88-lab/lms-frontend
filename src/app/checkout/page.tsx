"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "@/components/payment/PaymentForm";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { createPaymentIntent, PaymentIntentResponse } from "@/lib/api/payments";
import { useAuth } from "@/contexts/AuthContext";

import { Suspense } from "react";

// Replace with a real publishable key
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock"
);

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const type = searchParams.get("type") as "course_enrollment" | "booking_session";
    const referenceId = searchParams.get("referenceId");
    const price = searchParams.get("price");
    const title = searchParams.get("title");

    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {
        if (!type || !referenceId || !price) {
            setError("Invalid checkout parameters.");
            setLoading(false);
            return;
        }

        // Initialize Payment Intent
        const initiatePayment = async () => {
            try {
                const amount = parseFloat(price);

                // Skip stripe if free
                if (amount <= 0) {
                    await createPaymentIntent({
                        type,
                        referenceId,
                        amount: 0,
                        currency: "USD"
                    });
                    setSuccess(true);
                    return;
                }

                const res = await createPaymentIntent({
                    type,
                    referenceId,
                    amount,
                    currency: "USD",
                });

                if (res.clientSecret) {
                    setClientSecret(res.clientSecret);
                } else {
                    // Client Secret returned null, presumably a free item that got auto bypassed
                    setSuccess(true);
                }

            } catch (err: unknown) {
                setError((err instanceof Error ? err.message : "Failed to initialize checkout.") || "Failed to initialize checkout.");
            } finally {
                setLoading(false);
            }
        };

        initiatePayment();
    }, [type, referenceId, price]);

    const handlePaymentSuccess = () => {
        setSuccess(true);
    };

    const handleReturn = () => {
        if (type === "course_enrollment") {
            router.push(`/courses/${referenceId}`);
        } else {
            router.push("/dashboard");
        }
    }

    const numericPrice = parseFloat(price || "0");

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="max-w-3xl mx-auto py-10 px-4">

                    <div className="flex flex-col items-center mb-10 text-center">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Secure Checkout</h1>
                        <p className="text-slate-500 font-medium mt-2 max-w-md mx-auto">Complete your payment securely through our Stripe partner gateway.</p>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-slate-200">
                            <div className="w-8 h-8 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin mb-4" />
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 border border-red-200 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <h4 className="font-bold">Checkout Error</h4>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                            <button onClick={() => router.back()} className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs uppercase hover:bg-red-700">Go Back</button>
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-3xl text-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Payment Successful!</h2>
                            <p className="text-emerald-700 font-medium mb-8">Your transaction has been confirmed and access has been granted.</p>

                            <button onClick={handleReturn} className="px-8 py-3.5 bg-emerald-600 text-white font-bold uppercase tracking-widest text-sm rounded-xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition">
                                Return to Content
                            </button>
                        </div>
                    )}

                    {clientSecret && !success && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            {/* Order Summary */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Order Summary</h3>

                                <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-100">
                                    <div className="pr-4">
                                        <div className="text-xs font-semibold text-blue-600 mb-1 capitalize">
                                            {type.replace("_", " ")}
                                        </div>
                                        <h4 className="font-bold text-slate-900 leading-tight">{title || "Item"}</h4>
                                    </div>
                                    <span className="font-bold text-slate-900">${numericPrice.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-500 text-sm">Subtotal</span>
                                    <span className="font-medium text-slate-900">${numericPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-slate-500 text-sm">Taxes & Fees</span>
                                    <span className="font-medium text-slate-900">$0.00</span>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                    <span className="font-bold text-slate-900 text-lg">Total Due</span>
                                    <span className="font-bold text-slate-900 text-2xl">${numericPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Block */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Payment Details</h3>
                                <Elements
                                    options={{ clientSecret, appearance: { theme: 'stripe' } }}
                                    stripe={stripePromise}
                                >
                                    <PaymentForm onSuccess={handlePaymentSuccess} amount={numericPrice} />
                                </Elements>
                            </div>
                        </div>
                    )}

                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}

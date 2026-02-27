"use client";

import { useEffect, useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";

interface PaymentFormProps {
    onSuccess: () => void;
    amount: number;
}

export default function PaymentForm({ onSuccess, amount }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            return;
        }

        setIsProcessing(true);
        setMessage(null);

        // Confirm the PaymentIntent with the elements mounted
        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required", // Prevent automatic redirect allowing local success flow
        });

        if (error) {
            // This point is only reached if there's an immediate error when
            // confirming the payment. Show the error to your customer (for example, payment details incomplete)
            setMessage(error.message ?? "An unexpected error occurred.");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // Payment succeeded!
            onSuccess();
        } else {
            setMessage("Payment is processing or requires further action.");
        }

        setIsProcessing(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="w-full">
            <PaymentElement
                id="payment-element"
                options={{ layout: "tabs" }}
                className="mb-6"
            />

            {/* Error Message Space */}
            {message && (
                <div className="mb-4 text-sm text-red-600 font-medium">
                    {message}
                </div>
            )}

            <button
                disabled={isProcessing || !stripe || !elements}
                id="submit"
                className="w-full px-5 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm border border-transparent focus:ring-4 focus:ring-blue-100 uppercase tracking-widest text-sm"
            >
                <span id="button-text">
                    {isProcessing ? "Processing..." : `Pay $${amount.toFixed(2)}`}
                </span>
            </button>
        </form>
    );
}

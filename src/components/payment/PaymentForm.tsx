"use client";

import { useRef, useState } from "react";

export interface PayHereCheckoutParams {
    merchant_id: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    order_id: string;
    items: string;
    currency: string;
    amount: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    hash: string;
}

interface PaymentFormProps {
    /** Called when payment is free and processed instantly */
    onSuccess: () => void;
    amount: number;
    currency?: string;
    /** PayHere checkout params returned by the backend */
    checkoutParams: PayHereCheckoutParams;
    /** PayHere hosted checkout page URL */
    checkoutUrl: string;
}

/**
 * PayHere Payment Form
 *
 * Instead of an embedded card UI (like Stripe Elements), PayHere uses a
 * redirect-based flow: we POST a signed form to PayHere's checkout page.
 *
 * Flow:
 *  1. Backend generates checkoutParams + hash.
 *  2. This component renders a hidden HTML form with all params.
 *  3. User clicks "Pay Now" → form submits → browser redirects to PayHere.
 *  4. PayHere processes payment and POSTs result to our notify_url.
 *  5. PayHere redirects user back to return_url or cancel_url.
 */
export default function PaymentForm({
    onSuccess,
    amount,
    currency = "LKR",
    checkoutParams,
    checkoutUrl,
}: PaymentFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const handlePayNow = () => {
        setIsRedirecting(true);
        // Submit the hidden form — browser will POST to PayHere and redirect
        formRef.current?.submit();
    };

    return (
        <div className="w-full space-y-6">
            {/* Payment Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Total Amount</span>
                    <span className="text-xl font-bold text-slate-900">
                        {currency} {Number(amount).toFixed(2)}
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    You will be redirected to PayHere's secure payment page to complete your purchase.
                </p>
            </div>

            {/* PayHere branding */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>Secured by <strong>PayHere</strong> — supports Visa, Mastercard, Amex &amp; more</span>
            </div>

            {/* Pay button */}
            <button
                onClick={handlePayNow}
                disabled={isRedirecting}
                className="w-full px-5 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:bg-blue-800 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm focus:ring-4 focus:ring-blue-100 uppercase tracking-widest text-sm"
            >
                {isRedirecting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Redirecting to PayHere...
                    </span>
                ) : (
                    `Pay ${currency} ${Number(amount).toFixed(2)} with PayHere`
                )}
            </button>

            {/* Hidden form that POSTs to PayHere */}
            <form
                ref={formRef}
                method="POST"
                action={checkoutUrl}
                style={{ display: "none" }}
            >
                {Object.entries(checkoutParams).map(([key, value]) => (
                    <input key={key} type="hidden" name={key} value={value} />
                ))}
            </form>
        </div>
    );
}


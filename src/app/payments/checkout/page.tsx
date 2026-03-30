'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { initializePayment, initializeBankTransfer, PaymentRequest, PayHereCheckoutParams } from '@/lib/api/payments';
import AppLayout from '@/components/layout/AppLayout';

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [method, setMethod] = useState<'payhere' | 'manual'>('payhere');
    const [payHereParams, setPayHereParams] = useState<PayHereCheckoutParams | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const submittedRef = useRef(false);

    const type = searchParams.get('type');
    const referenceId = searchParams.get('referenceId');
    const amountParam = searchParams.get('amount');
    const recipientId = searchParams.get('recipientId');
    const itemDescription = searchParams.get('itemDescription') || 'LMS Payment';

    useEffect(() => {
        if (!authLoading && !user) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/login?redirect=${returnUrl}`);
        }
    }, [authLoading, user, router]);

    const handlePayment = async () => {
        if (!user) return; // Should be handled by effect, but guard clause

        if (!type || !referenceId || !amountParam) {
            setError('Missing required payment parameters');
            return;
        }

        try {
            setLoading(true);
            setError('');

            if (method === 'manual') {
                const manualRes = await initializeBankTransfer({
                    type: type as any,
                    referenceId,
                    amount: parseFloat(amountParam),
                    recipientId: recipientId || undefined,
                });
                // Pass order details to the upload page for display
                router.push(`/checkout/upload-slip/${manualRes.paymentId}?amount=${amountParam}&title=${encodeURIComponent(itemDescription)}`);
                return;
            }

            if (!user) return;

            const paymentData: PaymentRequest = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: type as any,
                referenceId,
                amount: parseFloat(amountParam),
                recipientId: recipientId || undefined,
                itemDescription,
                firstName: user.firstName || 'Student',
                lastName: user.lastName || 'User',
                email: user.email,
                phone: '1234567890', // Default phone if not available
            };

            const response = await initializePayment(paymentData);

            if (response.isFree) {
                router.push(`/payments/success?order_id=${response.paymentId}`);
                return;
            }

            if (response.checkoutParams && response.checkoutUrl) {
                setPayHereParams(response.checkoutParams);
                setCheckoutUrl(response.checkoutUrl);
            } else {
                setError('Invalid payment initialization response from server');
            }
        } catch (err: unknown) {
            console.error('Payment error:', err);
            if (err instanceof Error) {
                setError(err.message || 'Payment initialization failed. Please try again.');
            } else {
                setError('An unknown error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Auto-submit form when params are ready
    useEffect(() => {
        if (payHereParams && checkoutUrl && !submittedRef.current) {
            const form = document.getElementById('payhere-form') as HTMLFormElement;
            if (form) {
                console.log('Submitting PayHere form...');
                submittedRef.current = true;
                form.target = "_top"; // Force top-level navigation
                form.submit();
            }
        }
    }, [payHereParams, checkoutUrl]);

    if (authLoading || (loading && !payHereParams)) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500">Processing...</p>
                </div>
            </div>
        );
    }
    
    // Auth redirect handled in effect, show nothing while redirect happens if user null
    if (!user) return null;

    if (!type || !referenceId || !amountParam) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-sm border border-red-200 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Checkout Link</h2>
                <p className="text-slate-600 mb-4">The payment link is missing required information.</p>
                <button 
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
                    <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
                    <p className="text-slate-500 mt-1">Review your order details before payment</p>
                </div>
                
                <div className="p-8 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-slate-900 text-lg">{itemDescription}</h3>
                                <p className="text-sm text-slate-500 capitalize">{type.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">
                                    LKR {parseFloat(amountParam).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        {recipientId && (
                            <div className="border-t border-slate-200 pt-3 flex justify-between text-sm text-slate-600">
                                <span>Reference</span>
                                <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded truncate max-w-50">{referenceId}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 block ml-1">Select Payment Method</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={() => setMethod('payhere')}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                    method === 'payhere' 
                                    ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600' 
                                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'payhere' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Online Payment</p>
                                    <p className="text-xs text-slate-500">Pay via PayHere (Visa, Master, Frimi, etc.)</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setMethod('manual')}
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                    method === 'manual' 
                                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-600' 
                                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method === 'manual' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Bank Transfer</p>
                                    <p className="text-xs text-slate-500">Upload deposit slip manually</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {!payHereParams ? (
                        <div className="space-y-4 pt-2">
                            {method === 'payhere' ? (
                                <div className="flex items-center gap-3 p-4 border border-blue-100 bg-blue-50 rounded-lg text-blue-700 text-sm">
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>You will be redirected to PayHere securely to complete your payment.</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4 border border-emerald-100 bg-emerald-50 rounded-lg text-emerald-700 text-sm">
                                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p>After clicking below, you'll see our bank details to deposit funds and upload your slip.</p>
                                </div>
                            )}

                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className={`w-full py-4 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 ${
                                    method === 'payhere' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>{method === 'payhere' ? 'PAY NOW' : 'CONTINUE TO BANK DETAILS'}</>
                                )}
                            </button>
                            
                            <button
                                onClick={() => router.back()}
                                className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium text-sm transition"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-4 border-slate-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <h3 className="text-lg font-medium text-slate-900">Redirecting to PayHere...</h3>
                            <p className="text-sm text-slate-500 mt-2">Please do not close this window.</p>
                        </div>
                    )}

                    {/* Hidden Form for PayHere */}
                    {payHereParams && checkoutUrl && (
                        <form 
                            id="payhere-form" 
                            method="post" 
                            action={checkoutUrl} 
                            className="hidden"
                            target="_top" // Ensure we break out of any iframes (e.g. dev environments)
                        >
                            <input type="hidden" name="merchant_id" value={payHereParams.merchant_id} />
                            <input type="hidden" name="return_url" value={payHereParams.return_url} />
                            <input type="hidden" name="cancel_url" value={payHereParams.cancel_url} />
                            <input type="hidden" name="notify_url" value={payHereParams.notify_url} />
                            <input type="hidden" name="order_id" value={payHereParams.order_id} />
                            <input type="hidden" name="items" value={payHereParams.items} />
                            <input type="hidden" name="currency" value={payHereParams.currency} />
                            <input type="hidden" name="amount" value={payHereParams.amount} />
                            <input type="hidden" name="first_name" value={payHereParams.first_name} />
                            <input type="hidden" name="last_name" value={payHereParams.last_name} />
                            <input type="hidden" name="email" value={payHereParams.email} />
                            <input type="hidden" name="phone" value={payHereParams.phone} />
                            <input type="hidden" name="address" value={payHereParams.address} />
                            <input type="hidden" name="city" value={payHereParams.city} />
                            <input type="hidden" name="country" value={payHereParams.country} />
                            <input type="hidden" name="hash" value={payHereParams.hash} />
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <AppLayout>
            <Suspense fallback={
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            }>
                <CheckoutContent />
            </Suspense>
        </AppLayout>
    );
}
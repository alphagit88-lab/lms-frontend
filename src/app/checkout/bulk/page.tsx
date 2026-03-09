"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import PaymentForm, { PayHereCheckoutParams } from "@/components/payment/PaymentForm";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { initializeBulkPayment, initializeBulkBankTransfer, BulkCourseInfo } from "@/lib/api/payments";
import { useAuth } from "@/contexts/AuthContext";

type PaymentMethod = "payhere" | "bank_transfer";

// ── Bulk checkout content ─────────────────────────────────────────────────────
function BulkCheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const rawIds = searchParams.get("courseIds") || "";
    const courseIds = rawIds.split(",").map((id) => id.trim()).filter(Boolean);
    const currency = searchParams.get("currency") || "LKR";

    // Stage: "pick" = choose method, "payhere" = show PayHere form
    const [stage, setStage] = useState<"pick" | "payhere">("pick");
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("payhere");
    const [checkoutParams, setCheckoutParams] = useState<PayHereCheckoutParams | null>(null);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
    const [courses, setCourses] = useState<BulkCourseInfo[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);   // initial course price fetch
    const [proceeding, setProceeding] = useState(false);
    const [reinitializing, setReinitializing] = useState(false);
    const [success, setSuccess] = useState(false);

    // On mount: just fetch course prices to populate the order summary
    useEffect(() => {
        if (courseIds.length === 0) {
            setError("No courses selected for checkout.");
            setLoading(false);
            return;
        }
        const fetchPrices = async () => {
            try {
                // Use the bulk-intent just to get course details + total (free flows auto-enroll)
                const res = await initializeBulkPayment({
                    courseIds,
                    currency,
                    firstName: user?.firstName || "Student",
                    lastName: user?.lastName || "User",
                    email: user?.email || "student@lms.com",
                });
                setCourses(res.courses);
                setTotalAmount(res.amount);
                if (res.isFree) setSuccess(true);  // all-free: enrolled immediately
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to load courses.");
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleReturn = () => router.push("/student/my-courses");

    // Proceed with the selected payment method
    const handleProceed = async () => {
        setProceeding(true);
        setError("");
        try {
            if (selectedMethod === "payhere") {
                const res = await initializeBulkPayment({
                    courseIds: courses.map((c) => c.id),
                    currency,
                    firstName: user?.firstName || "Student",
                    lastName: user?.lastName || "User",
                    email: user?.email || "student@lms.com",
                });
                if (res.isFree) {
                    setSuccess(true);
                } else {
                    setCheckoutParams(res.checkoutParams);
                    setCheckoutUrl(res.checkoutUrl);
                    setStage("payhere");
                }
            } else {
                const res = await initializeBulkBankTransfer({
                    courseIds: courses.map((c) => c.id),
                    currency,
                });
                router.push(
                    `/checkout/upload-slip/${res.paymentId}?amount=${res.amount}&currency=${currency}&title=${encodeURIComponent(`${courses.length} Courses`)}&isBulk=1`
                );
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to proceed to payment.");
        } finally {
            setProceeding(false);
        }
    };

    // Remove a single course from the order summary (re-fetch prices)
    const handleRemoveCourse = async (courseId: string) => {
        const remaining = courses.filter((c) => c.id !== courseId);
        if (remaining.length === 0) { router.back(); return; }
        setReinitializing(true);
        setError("");
        try {
            const res = await initializeBulkPayment({
                courseIds: remaining.map((c) => c.id),
                currency,
                firstName: user?.firstName || "Student",
                lastName: user?.lastName || "User",
                email: user?.email || "student@lms.com",
            });
            setCourses(res.courses);
            setTotalAmount(res.amount);
            if (res.isFree) { setSuccess(true); setCheckoutParams(null); setCheckoutUrl(null); }
            else { setCheckoutParams(res.checkoutParams); setCheckoutUrl(res.checkoutUrl); }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update order.");
        } finally {
            setReinitializing(false);
        }
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="max-w-3xl mx-auto py-10 px-4">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Secure Checkout</h1>
                        <p className="text-slate-500 font-medium mt-2 max-w-md mx-auto">
                            Complete your payment for {courseIds.length} course{courseIds.length !== 1 ? "s" : ""} securely through PayHere.
                        </p>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-slate-200">
                            <div className="w-8 h-8 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="bg-red-50 text-red-600 border border-red-200 p-6 rounded-2xl flex items-center justify-between">
                            <div>
                                <h4 className="font-bold">Checkout Error</h4>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => router.back()}
                                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs uppercase hover:bg-red-700"
                            >
                                Go Back
                            </button>
                        </div>
                    )}

                    {/* Free success */}
                    {!loading && success && (
                        <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-3xl text-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Enrolled Successfully!</h2>
                            <p className="text-emerald-700 font-medium mb-4">
                                All {courses.length} course{courses.length !== 1 ? "s" : ""} are free — your access has been activated instantly.
                            </p>
                            <ul className="mb-8 space-y-1 text-sm text-emerald-800 text-left max-w-xs mx-auto">
                                {courses.map((c) => (
                                    <li key={c.id} className="flex items-center gap-2">
                                        <span className="w-4 h-4 text-emerald-500 shrink-0">✓</span>
                                        {c.title}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={handleReturn}
                                className="px-8 py-3.5 bg-emerald-600 text-white font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-emerald-700 transition"
                            >
                                Go to My Courses
                            </button>
                        </div>
                    )}

                    {/* Method picker + order summary */}
                    {!loading && !success && !error && stage === "pick" && courses.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                            {/* Order Summary */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Order Summary</h3>

                                <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
                                    {courses.map((course) => (
                                        <div key={course.id} className="flex items-center justify-between gap-3">
                                            <div className="text-sm text-slate-700 font-medium leading-snug flex-1 min-w-0 truncate" title={course.title}>
                                                {course.title}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                                                    {course.price === 0
                                                        ? <span className="text-emerald-600">Free</span>
                                                        : `${currency} ${course.price.toFixed(2)}`}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveCourse(course.id)}
                                                    disabled={reinitializing}
                                                    title="Remove from order"
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-40"
                                                >
                                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {reinitializing && (
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                                        Updating order…
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-500 text-sm">Subtotal</span>
                                    <span className="font-medium text-slate-900">{currency} {totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-slate-500 text-sm">Taxes &amp; Fees</span>
                                    <span className="font-medium text-slate-900">{currency} 0.00</span>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                    <span className="font-bold text-slate-900 text-lg">Total Due</span>
                                    <span className="font-bold text-slate-900 text-2xl">{currency} {totalAmount.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-4">
                                    {courses.length} course{courses.length !== 1 ? "s" : ""} will be unlocked after payment.
                                </p>
                            </div>

                            {/* Payment method picker */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col gap-4">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Method</h3>

                                <button
                                    onClick={() => setSelectedMethod("payhere")}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left ${selectedMethod === "payhere" ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMethod === "payhere" ? "border-blue-500" : "border-slate-300"}`}>
                                        {selectedMethod === "payhere" && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900 text-sm">Pay Online via PayHere</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Visa, Mastercard, Amex &amp; more — instant activation</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod("bank_transfer")}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition text-left ${selectedMethod === "bank_transfer" ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300"}`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMethod === "bank_transfer" ? "border-amber-500" : "border-slate-300"}`}>
                                        {selectedMethod === "bank_transfer" && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900 text-sm">Bank Transfer</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Pay directly to our bank account &amp; upload your receipt</div>
                                    </div>
                                </button>

                                <button
                                    onClick={handleProceed}
                                    disabled={proceeding || reinitializing}
                                    className="mt-4 w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                                >
                                    {proceeding ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                                    ) : selectedMethod === "payhere" ? "Continue to PayHere" : "Continue to Bank Transfer"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PayHere checkout form (after proceeding with payhere) */}
                    {!loading && !success && !error && stage === "payhere" && checkoutParams && checkoutUrl && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Order Summary</h3>
                                <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
                                    {courses.map((c) => (
                                        <div key={c.id} className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-slate-700 font-medium flex-1 min-w-0 truncate">{c.title}</span>
                                            <span className="text-sm font-semibold text-slate-900 shrink-0">
                                                {c.price === 0 ? <span className="text-emerald-600">Free</span> : `${currency} ${c.price.toFixed(2)}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                    <span className="font-bold text-slate-900 text-lg">Total Due</span>
                                    <span className="font-bold text-slate-900 text-2xl">{currency} {totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Payment Details</h3>
                                <PaymentForm
                                    onSuccess={() => setSuccess(true)}
                                    amount={totalAmount}
                                    currency={currency}
                                    checkoutParams={checkoutParams}
                                    checkoutUrl={checkoutUrl}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

export default function BulkCheckoutPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <BulkCheckoutContent />
        </Suspense>
    );
}

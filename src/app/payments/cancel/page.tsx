"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { XCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

function CancelContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("order_id");

    return (
        <div className="max-w-lg mx-auto py-20 px-4 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Payment Cancelled</h1>
            <p className="text-slate-500 mb-2">
                Your payment was cancelled. No charges have been made.
            </p>
            {orderId && (
                <p className="text-xs text-slate-400 font-mono mb-8">
                    Order ID: {orderId}
                </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                    Try Again
                </button>
                <button
                    onClick={() => router.push("/courses")}
                    className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition"
                >
                    Browse Courses
                </button>
            </div>
        </div>
    );
}

export default function PaymentCancelPage() {
    return (
        <AppLayout>
            <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>}>
                <CancelContent />
            </Suspense>
        </AppLayout>
    );
}

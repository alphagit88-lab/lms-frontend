"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, Suspense } from "react";
import Image from "next/image";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { uploadBankSlip } from "@/lib/api/payments";

const BANK_DETAILS = {
    bankName: "Bank of Ceylon",
    accountName: "LMS Education (Pvt) Ltd",
    accountNumber: "1234567890",
    branch: "Colombo Main Branch",
    swiftCode: "BCEYLKLX",
};

function UploadSlipContent() {
    const { paymentId } = useParams<{ paymentId: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();

    const amount   = searchParams.get("amount") || "0";
    const currency = searchParams.get("currency") || "LKR";
    const title    = searchParams.get("title") || "Your order";

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setError("");
        if (f.type.startsWith("image/")) {
            setPreview(URL.createObjectURL(f));
        } else {
            setPreview(null); // PDF — no preview
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) {
            setFile(f);
            setError("");
            if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
            else setPreview(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) { setError("Please select your bank slip file."); return; }
        setUploading(true);
        setError("");
        try {
            await uploadBankSlip(paymentId, file);
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <ProtectedRoute>
            <AppLayout>
                <div className="max-w-2xl mx-auto py-10 px-4">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                            <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bank Transfer</h1>
                        <p className="text-slate-500 font-medium mt-2 max-w-sm">
                            Transfer <span className="font-bold text-slate-700">{currency} {parseFloat(amount).toFixed(2)}</span> for <span className="font-semibold">{title}</span>, then upload your receipt below.
                        </p>
                    </div>

                    {success ? (
                        <div className="bg-emerald-50 border border-emerald-100 p-10 rounded-3xl text-center">
                            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Slip Uploaded!</h2>
                            <p className="text-emerald-700 font-medium mb-2">
                                Your payment is now under review. We will activate your access within 1–2 business days.
                            </p>
                            <p className="text-emerald-600 text-sm mb-8">Reference: <span className="font-mono font-bold">{paymentId}</span></p>
                            <button
                                onClick={() => router.push("/student/my-courses")}
                                className="px-8 py-3.5 bg-emerald-600 text-white font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-emerald-700 transition"
                            >
                                Go to My Courses
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Bank details card */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Bank Account Details</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                    {[
                                        ["Bank", BANK_DETAILS.bankName],
                                        ["Account Name", BANK_DETAILS.accountName],
                                        ["Account No.", BANK_DETAILS.accountNumber],
                                        ["Branch", BANK_DETAILS.branch],
                                        ["SWIFT / BIC", BANK_DETAILS.swiftCode],
                                        ["Reference", paymentId],
                                    ].map(([label, value]) => (
                                        <div key={label}>
                                            <div className="text-slate-400 font-medium text-xs mb-0.5">{label}</div>
                                            <div className="font-semibold text-slate-900 break-all">{value}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                                    <strong>Important:</strong> Please use the Reference number above as the payment description so we can match your transfer.
                                </div>
                            </div>

                            {/* Upload drop-zone */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Upload Bank Slip / Receipt</h3>

                                <div
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                    onClick={() => inputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition ${file ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"}`}
                                >
                                    {preview ? (
                                        <Image src={preview} alt="slip preview" width={400} height={208} unoptimized className="max-h-52 w-auto h-auto rounded-xl object-contain mb-3" />
                                    ) : (
                                        <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    )}
                                    <p className="text-sm font-medium text-slate-600">
                                        {file ? file.name : "Drag & drop or click to browse"}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WEBP or PDF · max 5 MB</p>
                                </div>

                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {error && (
                                    <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
                                )}

                                <button
                                    onClick={handleSubmit}
                                    disabled={uploading || !file}
                                    className="mt-6 w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                                    ) : "Submit Slip for Review"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

export default function UploadSlipPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-slate-900 border-t-blue-600 rounded-full animate-spin" />
            </div>
        }>
            <UploadSlipContent />
        </Suspense>
    );
}

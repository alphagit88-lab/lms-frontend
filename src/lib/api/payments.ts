const API_BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

// ─── PayHere Checkout Types ──────────────────────────────────────────────────

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

/** Response from POST /api/payments/create-intent */
export interface PaymentInitResponse {
    isFree: boolean;
    paymentId: string;
    /** Null for free items */
    checkoutParams: PayHereCheckoutParams | null;
    /** PayHere hosted checkout URL (sandbox or live). Null for free items. */
    checkoutUrl: string | null;
    amount: number;
}

export interface PaymentRequest {
    type: 'course_enrollment' | 'booking_session' | 'booking_package' | 'content_purchase';
    referenceId: string;
    amount: number;
    currency?: string;
    recipientId?: string;
    itemDescription?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

// ─── API functions ───────────────────────────────────────────────────────────

/**
 * Initializes a PayHere payment session.
 * Returns checkout params the frontend uses to redirect to PayHere.
 * For free items, isFree=true and checkoutParams is null.
 */
export const initializePayment = async (data: PaymentRequest): Promise<PaymentInitResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize payment');
    }

    return response.json();
};

/** @deprecated Use initializePayment instead */
export const createPaymentIntent = initializePayment;

export const getPaymentHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/api/payments/history`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payment history');
    }

    return response.json();
};

export const getTransactions = async (type?: string) => {
    const url = type
        ? `${API_BASE_URL}/api/payments/transactions?type=${type}`
        : `${API_BASE_URL}/api/payments/transactions`;

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch transactions');
    }

    return response.json();
};

export const getTeacherEarnings = async () => {
    const response = await fetch(`${API_BASE_URL}/api/payments/earnings`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch teacher earnings');
    }

    return response.json();
};

export const getPaymentsList = async (params?: { page?: number; status?: string; method?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.status) qs.set('status', params.status);
    if (params?.method) qs.set('method', params.method);

    const response = await fetch(`${API_BASE_URL}/api/payments/list${qs.toString() ? `?${qs.toString()}` : ''}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch payments list');
    }

    return response.json();
};

export const confirmPayHerePayment = async (paymentId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to confirm payment');
    }

    return response.json();
};

export const cancelPayHerePayment = async (paymentId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel payment');
    }

    return response.json();
};

// ─── Bulk course payment ──────────────────────────────────────────────────────

export interface BulkCourseInfo {
    id: string;
    title: string;
    price: number;
}

/** Response from POST /api/payments/create-bulk-intent */
export interface BulkPaymentInitResponse {
    isFree: boolean;
    paymentId: string;
    checkoutParams: PayHereCheckoutParams | null;
    checkoutUrl: string | null;
    amount: number;
    courses: BulkCourseInfo[];
}

export interface BulkPaymentRequest {
    courseIds: string[];
    currency?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

/**
 * Initializes a single combined PayHere payment for multiple courses.
 * Returns checkout params for the combined total.
 * For all-free selections, isFree=true and courses are enrolled immediately.
 */
export const initializeBulkPayment = async (data: BulkPaymentRequest): Promise<BulkPaymentInitResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-bulk-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initialize bulk payment');
    }

    return response.json();
};

// ─── Manual / Bank-Transfer Payment ──────────────────────────────────────────

export interface ManualPayment {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    paymentType: string;
    paymentStatus: string;
    bankSlipUrl?: string | null;
    manualReviewNote?: string | null;
    referenceId: string;
    metadata?: { courseIds?: string[] } | null;
    createdAt: string;
    updatedAt: string;
    user?: { firstName: string; lastName: string; email: string };
}

/** POST /api/payments/bank-transfer/create-intent */
export const initializeBankTransfer = async (data: {
    type: string;
    referenceId: string;
    amount: number;
    currency?: string;
    recipientId?: string;
}): Promise<{ paymentId: string; amount: number }> => {
    const res = await fetch(`${API_BASE_URL}/api/payments/bank-transfer/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to create bank transfer.'); }
    return res.json();
};

/** POST /api/payments/bank-transfer/create-bulk-intent */
export const initializeBulkBankTransfer = async (data: {
    courseIds: string[];
    currency?: string;
}): Promise<{ paymentId: string; amount: number; courses: BulkCourseInfo[] }> => {
    const res = await fetch(`${API_BASE_URL}/api/payments/bank-transfer/create-bulk-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to create bulk bank transfer.'); }
    return res.json();
};

/** POST /api/payments/bank-transfer/:paymentId/upload-slip */
export const uploadBankSlip = async (paymentId: string, file: File): Promise<{ message: string; payment: ManualPayment }> => {
    const formData = new FormData();
    formData.append('slip', file);
    const res = await fetch(`${API_BASE_URL}/api/payments/bank-transfer/${paymentId}/upload-slip`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to upload bank slip.'); }
    return res.json();
};

/** GET /api/payments/bank-transfer/pending */
export const getPendingManualPayments = async (): Promise<{ payments: ManualPayment[] }> => {
    const res = await fetch(`${API_BASE_URL}/api/payments/bank-transfer/pending`, {
        credentials: 'include',
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to fetch manual payments.'); }
    return res.json();
};

/** POST /api/payments/bank-transfer/:paymentId/review */
export const reviewManualPayment = async (
    paymentId: string,
    action: 'approve' | 'reject',
    note?: string
): Promise<{ message: string; payment: ManualPayment }> => {
    const res = await fetch(`${API_BASE_URL}/api/payments/bank-transfer/${paymentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, note }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to review payment.'); }
    return res.json();
};

// ─── Refund ───────────────────────────────────────────────────────────────────

export interface RefundResponse {
    message: string;
    payment: {
        id: string;
        paymentStatus: string;
        refundAmount: number | null;
    };
    refundAmount: number;
    refundPercentage: number;
}

/**
 * Process a refund for a payment.
 * Students can only refund their own booking_session payments.
 * Course enrollment refunds require admin role.
 * Admins can pass an explicit refundPercentage (0–100).
 * POST /api/payments/refund
 */
export const processRefund = async (
    paymentId: string,
    reason: string,
    refundPercentage?: number,
): Promise<RefundResponse> => {
    const body: Record<string, unknown> = { paymentId, reason };
    if (refundPercentage !== undefined) body.refundPercentage = refundPercentage;

    const res = await fetch(`${API_BASE_URL}/api/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to process refund.'); }
    return res.json();
};

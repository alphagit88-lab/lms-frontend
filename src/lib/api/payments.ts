const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
    type: 'course_enrollment' | 'booking_session' | 'content_purchase';
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


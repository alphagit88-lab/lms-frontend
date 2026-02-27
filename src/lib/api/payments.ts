const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface PaymentIntentResponse {
    clientSecret: string;
    paymentId: string;
}

export interface PaymentRequest {
    type: "course_enrollment" | "booking_session" | "content_purchase";
    referenceId: string;
    amount: number;
    currency?: string;
    recipientId?: string;
}

export const createPaymentIntent = async (data: PaymentRequest): Promise<PaymentIntentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment intent');
    }

    return response.json();
};

export const getPaymentHistory = async () => {
    const response = await fetch(`${API_BASE_URL}/api/payments/history`, {
        headers: {
            'Content-Type': 'application/json',
        },
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
        headers: {
            'Content-Type': 'application/json',
        },
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
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch teacher earnings');
    }

    return response.json();
};

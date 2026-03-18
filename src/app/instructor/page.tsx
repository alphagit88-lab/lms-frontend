'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstructorIndexPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/instructor/dashboard');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
        </div>
    );
}

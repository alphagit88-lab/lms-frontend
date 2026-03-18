'use client';

import React, { Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { ExamBuilder } from '@/components/exam/ExamBuilder';

export default function CreateExamPage() {
    return (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <AppLayout>
                <div className="p-8 max-w-5xl mx-auto">
                    <Suspense fallback={<div className="text-center py-20">Loading builder...</div>}>
                        <ExamBuilder />
                    </Suspense>
                </div>
            </AppLayout>
        </ProtectedRoute>
    );
}

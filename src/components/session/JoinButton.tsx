'use client';

import React, { useState, useEffect } from 'react';
import { Session, sessionApi } from '@/lib/api/sessions';
import { useAuth } from '@/hooks/useAuth';

interface JoinButtonProps {
    session: Session;
    onStatusChange?: (updatedSession: Session) => void;
}

export const JoinButton: React.FC<JoinButtonProps> = ({ session, onStatusChange }) => {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(session.startTime).getTime();
            setTimeLeft(start - now);
        }, 1000);

        return () => clearInterval(timer);
    }, [session.startTime]);

    const isTeacher = user?.role === 'instructor';
    const isStarted = session.status === 'in_progress';
    const isCompleted = session.status === 'completed';
    const isCancelled = session.status === 'cancelled';

    // Can join 15 mins before start
    const canJoin = timeLeft <= 15 * 60 * 1000 && !isCompleted && !isCancelled;
    const isRightNow = timeLeft <= 0 && !isCompleted && !isCancelled;

    const handleStart = async () => {
        if (!isTeacher || isStarted || isCompleted) return;
        setLoading(true);
        try {
            const updated = await sessionApi.startSession(session.id);
            if (onStatusChange) onStatusChange(updated);
            // Open Zoom link if it exists, otherwise alert
            if (session.meetingLink) {
                window.open(session.meetingLink, '_blank');
            } else {
                alert('Session started, but no Zoom meeting link is attached to this session.');
            }
        } catch (error) {
            console.error('Failed to start session:', error);
            alert('Failed to start session. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = () => {
        if (session.meetingLink) {
            window.open(session.meetingLink, '_blank');
        } else {
            alert('No meeting link is available for this session.');
        }
    };

    if (isCompleted) {
        return (
            <button disabled className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed font-medium">
                Session Ended
            </button>
        );
    }

    if (isCancelled) {
        return (
            <button disabled className="px-4 py-2 bg-red-100 text-red-500 rounded-md cursor-not-allowed font-medium">
                Cancelled
            </button>
        );
    }

    if (isTeacher) {
        if (isStarted) {
            return (
                <button
                    onClick={handleJoin}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
                >
                    Re-join Session
                </button>
            );
        }

        return (
            <button
                onClick={handleStart}
                disabled={!canJoin || loading}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${canJoin
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
            >
                {loading ? 'Starting...' : canJoin ? 'Start Session' : `Starts in ${Math.ceil(timeLeft / (60 * 60 * 1000))}h`}
            </button>
        );
    }

    // Student logic
    return (
        <button
            onClick={handleJoin}
            disabled={!canJoin}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${canJoin
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
        >
            {isStarted ? 'Join Now' : canJoin ? 'Join Session' : 'Scheduled'}
        </button>
    );
};

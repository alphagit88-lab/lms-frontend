'use client';

import React from 'react';
import Link from 'next/link';
import { Session } from '@/lib/api/sessions';
import { JoinButton } from './JoinButton';
import { format } from 'date-fns';
import { Video, Calendar, Clock, User, ChevronRight, Trash2 } from 'lucide-react';

interface SessionCardProps {
    session: Session;
    onStatusChange?: (updatedSession: Session) => void;
    onDelete?: (sessionId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onStatusChange, onDelete }) => {
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${session.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                            session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {session.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <Link href={`/sessions/${session.id}`} className="block hover:text-blue-600 transition-colors">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{session.title}</h3>
                    </Link>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Video className="w-5 h-5 text-blue-600" />
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(startDate, 'EEEE, MMMM do')}
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                </div>
                {session.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                        {session.description}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                        <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        {session.bookingId ? 'One-to-One' : 'Group Class'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {onDelete && (
                        <button
                            onClick={() => onDelete(session.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete session"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <Link
                        href={`/sessions/${session.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View details"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                    <JoinButton session={session} onStatusChange={onStatusChange} />
                </div>
            </div>
        </div>
    );
};


"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  Video, 
  Users,  
  PlayCircle,
  CheckCircle,

  Plus
} from "lucide-react";
import { Session, sessionApi } from "@/lib/api/sessions";
import Link from "next/link";
import CreateSessionModal from "@/components/instructor/CreateSessionModal";

export default function InstructorSessionsPage() {
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [upcoming, past] = await Promise.all([
        sessionApi.getUpcomingSessions(),
        sessionApi.getPastSessions()
      ]);
      setUpcomingSessions(upcoming);
      setPastSessions(past);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (sessionId: string) => {
    try {
      await sessionApi.startSession(sessionId);
      fetchSessions(); // Refresh list
      // unexpected side effect: could open zoom link here if desired
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  const handleEndSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to end this session?")) return;
    try {
      await sessionApi.endSession(sessionId);
      fetchSessions();
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to cancel this session? This action cannot be undone.")) return;
    try {
      await sessionApi.cancelSession(sessionId);
      fetchSessions();
    } catch (error) {
      console.error("Failed to cancel session:", error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["instructor", "admin"]}>
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Sessions Management</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your live classes and session history</p>
            </div>
            
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Session
            </button>
          </div>

          <CreateSessionModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={() => {
              fetchSessions();
              setIsCreateModalOpen(false);
            }}
          />

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Upcoming Sessions</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{upcomingSessions.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Completed (All Time)</p>
                <p className="text-3xl font-black text-slate-900 mt-2">{pastSessions.filter(s => s.status === 'completed').length}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Hours</p>
                <p className="text-3xl font-black text-slate-900 mt-2">--</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
                  activeTab === 'upcoming' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Upcoming Sessions
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
                  activeTab === 'past' 
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Past History
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-12 text-center text-slate-400">Loading sessions...</div>
              ) : (activeTab === 'upcoming' ? upcomingSessions : pastSessions).length === 0 ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <Calendar className="w-10 h-10 stroke-1" />
                  <p>No {activeTab} sessions found.</p>
                </div>
              ) : (
                (activeTab === 'upcoming' ? upcomingSessions : pastSessions).map((session) => (
                  <div key={session.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-6">
                    {/* Date Box */}
                    <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 text-slate-600">
                      <span className="text-xs font-bold uppercase">{format(new Date(session.startTime), "MMM")}</span>
                      <span className="text-xl font-black text-slate-900">{format(new Date(session.startTime), "d")}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'in_progress' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                          session.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {session.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 truncate" title={session.title}>
                        {session.title}
                      </h3>
                      
                      {session.description && (
                         <p className="text-sm text-slate-500 mt-1 line-clamp-1">{session.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                        {session.sessionType === 'live' && (
                           <div className="flex items-center gap-1.5">
                             <Video className="w-4 h-4" />
                             <span>Live Zoom</span>
                           </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4" />
                          <span>{session.attendanceCount ?? 0} Attended</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 justify-center">
                      {session.status === 'scheduled' && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleStartSession(session.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <PlayCircle className="w-4 h-4" /> Start
                          </button>
                          
                          {session.meetingStartLink && (
                            <Link 
                              href={session.meetingStartLink} 
                              target="_blank" 
                              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" /> Launch Zoom
                            </Link>
                          )}
                        </div>
                      )}

                      {session.status === 'in_progress' && (
                        <button 
                          onClick={() => handleEndSession(session.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          End Session
                        </button>
                      )}
                      
                      {session.status === 'scheduled' && (
                        <button 
                          onClick={() => handleCancelSession(session.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-medium hover:underline mt-1"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
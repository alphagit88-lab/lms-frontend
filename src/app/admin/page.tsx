'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
    PlatformStats,
    AdminUser,
    PendingTeacher,
    getStats,
    getUsers,
    toggleUserActive,
    deleteUser,
    getPendingTeachers,
    verifyTeacher,
    rejectTeacher,
} from '@/lib/api/admin';

type Tab = 'overview' | 'users' | 'teachers';

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        else if (user && user.role !== 'admin') router.push('/dashboard');
    }, [user, authLoading, router]);

    // Initial load
    useEffect(() => {
        if (user?.role === 'admin') loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, usersData, teachersData] = await Promise.all([
                getStats(),
                getUsers({ page: 1, limit: 10 }),
                getPendingTeachers(),
            ]);
            setStats(statsData);
            setUsers(usersData.users);
            setUsersTotal(usersData.total);
            setUsersTotalPages(usersData.totalPages);
            setPendingTeachers(teachersData.teachers);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = useCallback(
        async (page: number, role?: string, search?: string) => {
            try {
                const data = await getUsers({ page, limit: 20, role: role || undefined, search: search || undefined });
                setUsers(data.users);
                setUsersTotal(data.total);
                setUsersPage(data.page);
                setUsersTotalPages(data.totalPages);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load users');
            }
        },
        []
    );

    useEffect(() => {
        if (activeTab === 'users' && user?.role === 'admin') {
            loadUsers(1, roleFilter, searchQuery);
        }
    }, [activeTab, roleFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadUsers(1, roleFilter, searchQuery);
    };

    const handleToggleActive = async (userId: string) => {
        setActionLoading(userId);
        try {
            const res = await toggleUserActive(userId);
            setSuccess(res.message);
            setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
            if (stats) {
                const refreshed = await getStats();
                setStats(refreshed);
            }
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return;
        setActionLoading(userId);
        try {
            await deleteUser(userId);
            setSuccess('User deleted');
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            if (stats) setStats({ ...stats, totalUsers: stats.totalUsers - 1 });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleVerifyTeacher = async (teacherId: string) => {
        setActionLoading(teacherId);
        try {
            await verifyTeacher(teacherId);
            setSuccess('Teacher verified!');
            setPendingTeachers((prev) => prev.filter((t) => t.teacherId !== teacherId));
            if (stats) setStats({ ...stats, pendingTeachers: stats.pendingTeachers - 1 });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectTeacher = async (teacherId: string) => {
        const reason = prompt('Reason for rejection (optional):');
        setActionLoading(teacherId);
        try {
            await rejectTeacher(teacherId, reason || undefined);
            setSuccess('Teacher rejected');
            setPendingTeachers((prev) => prev.filter((t) => t.teacherId !== teacherId));
            if (stats) setStats({ ...stats, pendingTeachers: stats.pendingTeachers - 1 });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed');
        } finally {
            setActionLoading(null);
        }
    };

    /* ─── Render ─────────────────────────────────────── */

    if (authLoading || loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
                        <p className="mt-4 text-slate-500 text-sm">Loading admin dashboard…</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const tabs: { key: Tab; label: string; badge?: number }[] = [
        { key: 'overview', label: 'Admin Overview' },
        { key: 'users', label: 'Platform Users', badge: stats?.totalUsers },
        { key: 'teachers', label: 'Teacher Verification', badge: stats?.pendingTeachers },
    ];

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/20 rounded text-[10px] font-bold uppercase tracking-wider text-blue-300">Administrative Suite</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Administrative Dashboard</h1>
                            <p className="text-slate-400 text-sm">Manage entire platform operations and oversee user activities</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
                    <p className="text-red-700 text-sm">{error}</p>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-emerald-700 text-sm">{success}</p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.key
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-slate-200 text-slate-600'
                                    }`}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
            {activeTab === 'overview' && stats && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Users" value={stats.totalUsers} icon={<UsersIcon />} accent="bg-blue-100 text-blue-600" />
                        <StatCard label="Active Students" value={stats.students} icon={<StudentIcon />} accent="bg-violet-100 text-violet-600" />
                        <StatCard label="Active Teachers" value={stats.instructors} icon={<TeacherIcon />} accent="bg-emerald-100 text-emerald-600" />
                        <StatCard label="Total Courses" value={stats.totalCourses} icon={<BookIcon />} accent="bg-pink-100 text-pink-600" />
                    </div>

                    {/* Operational Management (Manage other roles tasks) */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <h3 className="text-base font-bold text-slate-900">Operational Management</h3>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <ActionCardLarge
                                title="Manage Bookings"
                                description="Oversee and manage all student-teacher sessions"
                                icon={<CalendarIcon />}
                                onClick={() => router.push('/instructor/bookings')}
                                color="blue"
                            />
                            <ActionCardLarge
                                title="Course Catalog"
                                description="Manage all published and draft courses"
                                icon={<BookIcon />}
                                onClick={() => router.push('/instructor/courses')}
                                color="indigo"
                            />
                            <ActionCardLarge
                                title="Live Sessions"
                                description="Monitor ongoing and upcoming live classroom links"
                                icon={<div className="scale-75"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>}
                                onClick={() => router.push('/instructor/sessions')}
                                color="purple"
                            />
                            <ActionCardLarge
                                title="Content Library"
                                description="Review platform content, PDFs, and resources"
                                icon={<div className="scale-75"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></div>}
                                onClick={() => router.push('/instructor/content')}
                                color="amber"
                            />
                            <ActionCardLarge
                                title="Session Recordings"
                                description="Access all cloud-recorded teaching sessions"
                                icon={<div className="scale-75"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>}
                                onClick={() => router.push('/instructor/recordings')}
                                color="rose"
                            />
                            <ActionCardLarge
                                title="Global Availability"
                                description="Configure platform availability and time slots"
                                icon={<ClockIcon />}
                                onClick={() => router.push('/instructor/availability')}
                                color="emerald"
                            />
                        </div>
                    </div>

                    {/* User & Verification Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <UsersIcon /> Identity Management
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 transition-all group"
                                >
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-slate-900">Manage {stats.totalUsers} Users</p>
                                        <p className="text-xs text-slate-500">Enable/Disable accounts from student to admin</p>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                                <button
                                    onClick={() => setActiveTab('teachers')}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-all group"
                                >
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-slate-900">Verify Pending Teachers</p>
                                        <p className="text-xs text-slate-500">{stats.pendingTeachers} applications waiting for your review</p>
                                    </div>
                                    <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Platform Health / Secondary Stats */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <TrendIcon />
                            </div>
                            <h3 className="text-sm font-bold text-slate-300 mb-4">Platform Growth (7d)</h3>
                            <div className="flex items-end gap-2 mb-6">
                                <span className="text-4xl font-bold">+{stats.recentSignups}</span>
                                <span className="text-emerald-400 text-sm font-medium mb-1.5 flex items-center gap-0.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" /></svg>
                                    New Users
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Bookings</p>
                                    <p className="text-lg font-bold">{stats.totalBookings}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Parents</p>
                                    <p className="text-lg font-bold">{stats.parents}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ USERS TAB ═══════════════ */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
                        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                            <input
                                type="text"
                                placeholder="Search by name or email…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                            <button type="submit" className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition">Search</button>
                        </form>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                        >
                            <option value="">All Roles</option>
                            <option value="student">Students</option>
                            <option value="instructor">Instructors</option>
                            <option value="parent">Parents</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                        <th className="text-left px-5 py-4 font-bold">User Identity</th>
                                        <th className="text-left px-5 py-4 font-bold">Role Hierarchy</th>
                                        <th className="text-left px-5 py-4 font-bold">Account State</th>
                                        <th className="text-left px-5 py-4 font-bold">Joined Platform</th>
                                        <th className="text-right px-5 py-4 font-bold">Controls</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-20 text-slate-400 font-medium">No records matching your search criteria</td></tr>
                                    ) : (
                                        users.map((u) => (
                                            <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center flex-shrink-0 border border-slate-200 uppercase">
                                                            {u.firstName?.[0]}{u.lastName?.[0]}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                                                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-slate-900 text-white' :
                                                            u.role === 'instructor' ? 'bg-emerald-100 text-emerald-700' :
                                                                u.role === 'parent' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>{u.role}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                        {u.isActive ? 'ACTIVE' : 'DISABLED'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-slate-500 font-medium">
                                                    {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleToggleActive(u.id)} disabled={actionLoading === u.id} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${u.isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                                                            {u.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {usersTotalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-100">
                                <p className="text-xs font-medium text-slate-500">Record {((usersPage - 1) * 10) + 1} to {Math.min(usersPage * 10, usersTotal)} of {usersTotal}</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => loadUsers(usersPage - 1, roleFilter, searchQuery)} disabled={usersPage <= 1} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 disabled:opacity-40 shadow-xs">Previous</button>
                                    <button onClick={() => loadUsers(usersPage + 1, roleFilter, searchQuery)} disabled={usersPage >= usersTotalPages} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 disabled:opacity-40 shadow-xs">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════ TEACHERS TAB ═══════════════ */}
            {activeTab === 'teachers' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><ClockIcon /></div>
                        <div>
                            <p className="text-sm font-bold text-blue-900">Pending Review Queue</p>
                            <p className="text-xs text-blue-700">These teachers cannot publish courses or take bookings until you verify their credentials.</p>
                        </div>
                    </div>

                    {pendingTeachers.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Queue is Empty</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">All teacher applications have been processed. New applications will appear here in real-time.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {pendingTeachers.map((t) => (
                                <div key={t.teacherId} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all flex flex-col">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md uppercase">
                                            {t.teacher.firstName[0]}{t.teacher.lastName[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{t.teacher.firstName} {t.teacher.lastName}</p>
                                            <p className="text-xs text-slate-400 truncate">{t.teacher.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Background Bio</p>
                                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{t.bio || 'No biography provided'}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {t.specializations.map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded capitalize">{s}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                        <button onClick={() => handleVerifyTeacher(t.teacherId)} disabled={actionLoading === t.teacherId} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50">APPROVE</button>
                                        <button onClick={() => handleRejectTeacher(t.teacherId)} disabled={actionLoading === t.teacherId} className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition disabled:opacity-50">REJECT</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

function ActionCardLarge({ title, description, icon, onClick, color }: { title: string; description: string; icon: React.ReactNode; onClick: () => void; color: string }) {
    const themes: Record<string, string> = {
        blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
        indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
        purple: 'bg-purple-600 hover:bg-purple-700 shadow-purple-100',
        rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
        emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
        amber: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
    };

    return (
        <button onClick={onClick} className={`group relative bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
            <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-all duration-300 ${themes[color]} text-white group-hover:scale-110 shadow-lg`}>
                {icon}
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{title}</h4>
            <p className="text-[11px] text-slate-500 leading-normal">{description}</p>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg>
            </div>
        </button>
    );
}

/* ═══════════════ ICONS ═══════════════ */
function UsersIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>); }
function StudentIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>); }
function TeacherIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>); }
function BookIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>); }
function CalendarIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>); }
function ClockIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>); }
function TrendIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>); }

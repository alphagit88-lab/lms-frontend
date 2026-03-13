'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
    PlatformStats,
    AdminUser,
    AdminPayment,
    AdminEnrollment,
    AdminParentLink,
    PendingTeacher,
    getStats,
    getUsers,
    toggleUserActive,
    deleteUser,
    getPendingTeachers,
    verifyTeacher,
    rejectTeacher,
    getPayments,
    getEnrollments,
    confirmPayment,
    getParentLinks,
    removeParentLink,
} from '@/lib/api/admin';
import { ManualPayment, getPendingManualPayments, reviewManualPayment } from '@/lib/api/admin';
import { processRefund } from '@/lib/api/payments';

type Tab = 'overview' | 'users' | 'teachers' | 'transactions' | 'enrollments' | 'parents';
type TxSubTab = 'payhere' | 'bank-transfer';

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [txSubTab, setTxSubTab] = useState<TxSubTab>('payhere');
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersTotal, setUsersTotal] = useState(0);
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [roleFilter, setRoleFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
    const [payments, setPayments] = useState<AdminPayment[]>([]);
    const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
    const [parentLinks, setParentLinks] = useState<AdminParentLink[]>([]);
    const [manualPayments, setManualPayments] = useState<ManualPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Admin refund modal state
    const [refundModal, setRefundModal] = useState<{ paymentId: string; amount: number; currency: string } | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [refundPct, setRefundPct] = useState<number>(100);
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundError, setRefundError] = useState('');

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        else if (user && user.role !== 'admin') router.push('/dashboard');
    }, [user, authLoading, router]);

    // Initial load
    useEffect(() => {
        if (user?.role === 'admin') loadData();
    }, [user?.role]);

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
        if (user?.role !== 'admin') return;
        if (activeTab === 'users') loadUsers(1, roleFilter, searchQuery);
        if (activeTab === 'transactions') { loadPayments(1); loadManualPayments(); }
        if (activeTab === 'enrollments') loadEnrollments(1);
        if (activeTab === 'parents') loadParentLinks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, roleFilter, user?.role]);

    const loadParentLinks = async (page: number) => {
        setLoading(true);
        try {
            const data = await getParentLinks({ page });
            setParentLinks(data.links);
        } catch {
            setError('Failed to load parent links');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveLink = async (id: string) => {
        if (!confirm('Remove this link relationship?')) return;
        setActionLoading(id);
        try {
            await removeParentLink(id);
            setSuccess('Link removed');
            loadParentLinks(1);
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to remove link');
        } finally {
            setActionLoading(null);
        }
    };

    const loadPayments = async (page: number) => {
        setLoading(true);
        try {
            const data = await getPayments({ page });
            setPayments(data.payments);
        } catch {
            setError('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const loadEnrollments = async (page: number) => {
        setLoading(true);
        try {
            const data = await getEnrollments({ page });
            setEnrollments(data.enrollments);
        } catch {
            setError('Failed to load enrollments');
        } finally {
            setLoading(false);
        }
    };

    const loadManualPayments = async () => {
        setLoading(true);
        try {
            const data = await getPendingManualPayments();
            setManualPayments(data.payments);
        } catch {
            setError('Failed to load manual payments');
        } finally {
            setLoading(false);
        }
    };

    const handleReviewManualPayment = async (paymentId: string, action: 'approve' | 'reject') => {
        let note: string | undefined;
        if (action === 'reject') {
            const input = prompt('Reason for rejection (optional):');
            note = input || undefined;
        }
        setActionLoading(paymentId);
        try {
            await reviewManualPayment(paymentId, action, note);
            setSuccess(action === 'approve' ? 'Payment approved — student enrolled!' : 'Payment rejected.');
            loadManualPayments();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Review action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmPayment = async (id: string) => {
        setActionLoading(id);
        try {
            await confirmPayment(id);
            setSuccess('Payment confirmed and student enrolled!');
            loadPayments(1);
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to confirm payment');
        } finally {
            setActionLoading(null);
        }
    };

    const openAdminRefundModal = (p: AdminPayment) => {
        setRefundModal({ paymentId: p.id, amount: Number(p.amount), currency: p.currency });
        setRefundReason('');
        setRefundPct(100);
        setRefundError('');
    };

    const handleAdminRefund = async () => {
        if (!refundModal) return;
        if (!refundReason.trim()) { setRefundError('Please provide a reason.'); return; }
        setRefundLoading(true);
        setRefundError('');
        try {
            const result = await processRefund(refundModal.paymentId, refundReason.trim(), refundPct);
            setRefundModal(null);
            setSuccess(result.message || `Refund of ${refundModal.currency} ${result.refundAmount.toLocaleString()} processed.`);
            loadPayments(1);
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setRefundError(err instanceof Error ? err.message : 'Refund failed.');
        } finally {
            setRefundLoading(false);
        }
    };

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
        { key: 'overview', label: 'Dashboard Overview' },
        { key: 'users', label: 'Platform Users', badge: stats?.totalUsers },
        { key: 'teachers', label: 'Instructor Verification', badge: stats?.pendingTeachers },
        { key: 'transactions', label: 'Transactions' },
        { key: 'enrollments', label: 'Enrollments' },
        { key: 'parents', label: 'Parent Links' },
    ];

    return (
        <>
        <AppLayout>
            {/* Header */}
            <div className="mb-6">
                <div className="bg-linear-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
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

                    {/* Separated Role Management */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Instructor Management Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <TeacherIcon />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Instructor Management</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <ActionCardSmall
                                    title="Verify Instructors"
                                    description={`${stats.pendingTeachers} pending review`}
                                    onClick={() => setActiveTab('teachers')}
                                    icon={<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                />
                                <ActionCardSmall
                                    title="Manage Courses"
                                    description="Review and publish"
                                    onClick={() => router.push('/instructor/courses')}
                                />
                                <ActionCardSmall
                                    title="Live Classrooms"
                                    description="Monitor sessions"
                                    onClick={() => router.push('/instructor/sessions')}
                                />
                                <ActionCardSmall
                                    title="Content Review"
                                    description="Library assets"
                                    onClick={() => router.push('/instructor/content')}
                                />
                            </div>
                        </div>

                        {/* Student Management Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <StudentIcon />
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Student Management</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <ActionCardSmall
                                    title="Oversee Enrollments"
                                    description="Track participation"
                                    onClick={() => setActiveTab('enrollments')}
                                />
                                <ActionCardSmall
                                    title="Payment Portal"
                                    description="Verify transactions"
                                    onClick={() => setActiveTab('transactions')}
                                />
                                <ActionCardSmall
                                    title="Parent Oversight"
                                    description="Manage family links"
                                    onClick={() => setActiveTab('parents')}
                                    icon={<div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                                />
                                <ActionCardSmall
                                    title="Platform Users"
                                    description="Access list & stats"
                                    onClick={() => setActiveTab('users')}
                                />
                            </div>
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
                                        <p className="text-xs text-slate-500">Enable/Disable accounts (Students, Teachers, parents)</p>
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
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 border border-slate-200 uppercase">
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
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><ClockIcon /></div>
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
                                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md uppercase">
                                            {t.teacher.firstName[0]}{t.teacher.lastName[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 truncate">{t.teacher.firstName} {t.teacher.lastName}</p>
                                            <p className="text-xs text-slate-400 truncate">{t.teacher.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Qualifications</p>
                                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{t.qualifications || 'No qualifications provided'}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {t.specialization && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded capitalize">{t.specialization}</span>
                                            )}
                                            {t.subjects && t.subjects.split(',').map((s, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded capitalize">{s.trim()}</span>
                                            ))}
                                            {t.teachingLanguages && (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">{t.teachingLanguages}</span>
                                            )}
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
            {/* ═══════════════ TRANSACTIONS TAB ═══════════════ */}
            {activeTab === 'transactions' && (
                <div className="space-y-4">
                    {/* Sub-tab bar */}
                    <div className="flex items-center gap-1 border-b border-slate-200 mb-2">
                        <button
                            onClick={() => setTxSubTab('payhere')}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                                txSubTab === 'payhere' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            PayHere Payments
                        </button>
                        <button
                            onClick={() => setTxSubTab('bank-transfer')}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
                                txSubTab === 'bank-transfer'
                                    ? 'border-slate-900 text-slate-900'
                                    : 'border-transparent text-slate-400 hover:text-slate-700'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Bank Transfer Slips
                            {manualPayments.filter(p => p.paymentStatus === 'under_review').length > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                    {manualPayments.filter(p => p.paymentStatus === 'under_review').length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* ── PayHere sub-tab ── */}
                    {txSubTab === 'payhere' && (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Student</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Instructor</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Course</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Amount</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Method</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                            <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Date</th>
                                            <th className="text-right px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.filter(p => p.paymentMethod !== 'bank_transfer').length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-20 text-slate-400">No PayHere payment records found</td></tr>
                                        ) : (
                                            payments.filter(p => p.paymentMethod !== 'bank_transfer').map((p) => (
                                                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                                    <td className="px-5 py-4">
                                                        <p className="font-bold text-slate-900">{p.student.firstName} {p.student.lastName}</p>
                                                        <p className="text-[10px] text-slate-400">{p.student.email}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {p.instructor ? (
                                                            <>
                                                                <p className="font-medium text-slate-800">{p.instructor.firstName} {p.instructor.lastName}</p>
                                                                <p className="text-[10px] text-slate-400">{p.instructor.email}</p>
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 italic">Platform</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-500 text-xs max-w-37.5 truncate">{p.course?.title || '—'}</td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-bold text-slate-900">{p.currency} {Number(p.amount).toFixed(2)}</p>
                                                        {p.refundAmount && (
                                                            <p className="text-[10px] text-purple-600">Refund: {p.currency} {Number(p.refundAmount).toFixed(2)}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600">
                                                            {p.paymentMethod.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            p.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                            p.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-700' :
                                                            p.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>{p.paymentStatus.replace('_', ' ')}</span>
                                                    </td>
                                                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                                                        {new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        {p.paymentStatus === 'pending' && (
                                                            <button onClick={() => handleConfirmPayment(p.id)} disabled={actionLoading === p.id} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 disabled:opacity-50">CONFIRM</button>
                                                        )}
                                                        {(p.paymentStatus === 'completed' || p.paymentStatus === 'partially_refunded') && (
                                                            <button onClick={() => openAdminRefundModal(p)} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700">REFUND</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ── Bank Transfer sub-tab ── */}
                    {txSubTab === 'bank-transfer' && (
                        <>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Bank Transfer Records</p>
                                    <p className="text-xs text-amber-700">All bank transfer submissions — pending, under review, approved, and rejected.</p>
                                </div>
                            </div>

                            {manualPayments.length === 0 ? (
                                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">No Bank Transfer Records</h3>
                                    <p className="text-slate-500 text-sm">No bank transfer payments have been submitted yet.</p>
                                </div>
                            ) : (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Student</th>
                                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Instructor</th>
                                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Amount</th>
                                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Reference</th>
                                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Submitted</th>
                                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Slip</th>
                                                    <th className="text-right px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {manualPayments.map((p) => (
                                                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                                        <td className="px-5 py-4">
                                                            <p className="font-bold text-slate-900">{p.user?.firstName} {p.user?.lastName}</p>
                                                            <p className="text-[10px] text-slate-400">{p.user?.email}</p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {(() => {
                                                                const match = payments.find(pay => pay.id === p.id);
                                                                return match?.instructor ? (
                                                                    <>
                                                                        <p className="font-medium text-slate-800">{match.instructor.firstName} {match.instructor.lastName}</p>
                                                                        <p className="text-[10px] text-slate-400">{match.instructor.email}</p>
                                                                    </>
                                                                ) : <span className="text-[10px] text-slate-400 italic">—</span>;
                                                            })()}
                                                        </td>
                                                        <td className="px-5 py-4 font-bold text-slate-900">{p.currency} {Number(p.amount).toFixed(2)}</td>
                                                        <td className="px-5 py-4 font-mono text-xs text-slate-500 max-w-30 truncate">{p.referenceId || p.id}</td>
                                                        <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                                                            {new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                p.paymentStatus === 'under_review' ? 'bg-amber-100 text-amber-700' :
                                                                p.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                p.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>{p.paymentStatus.replace('_', ' ')}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {p.bankSlipUrl ? (
                                                                <a
                                                                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${p.bankSlipUrl}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                    VIEW SLIP
                                                                </a>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400">Not uploaded</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            {(p.paymentStatus === 'under_review' || p.paymentStatus === 'pending') ? (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button onClick={() => handleReviewManualPayment(p.id, 'approve')} disabled={actionLoading === p.id} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition disabled:opacity-50">APPROVE</button>
                                                                    <button onClick={() => handleReviewManualPayment(p.id, 'reject')} disabled={actionLoading === p.id} className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold hover:bg-red-50 transition disabled:opacity-50">REJECT</button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic">Processed</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ═══════════════ ENROLLMENTS TAB ═══════════════ */}
            {activeTab === 'enrollments' && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                    <th className="text-left px-5 py-4 font-bold">Student</th>
                                    <th className="text-left px-5 py-4 font-bold">Course</th>
                                    <th className="text-left px-5 py-4 font-bold">Date</th>
                                    <th className="text-left px-5 py-4 font-bold">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-20 text-slate-400">No enrollment records found</td></tr>
                                ) : (
                                    enrollments.map((e) => (
                                        <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                            <td className="px-5 py-4 font-medium">{e.student.firstName} {e.student.lastName}</td>
                                            <td className="px-5 py-4 text-slate-500">{e.course.title}</td>
                                            <td className="px-5 py-4 text-slate-400 font-mono text-xs">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-4">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500" style={{ width: `${e.progress || 0}%` }} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* ═══════════════ PARENTS TAB ═══════════════ */}
            {activeTab === 'parents' && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Parent</th>
                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Student</th>
                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                    <th className="text-left px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Created</th>
                                    <th className="text-right px-5 py-4 font-bold uppercase tracking-wider text-[10px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parentLinks.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-20 text-slate-400">No parent-student links found</td></tr>
                                ) : (
                                    parentLinks.map((l) => (
                                        <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-900">{l.parent.firstName} {l.parent.lastName}</p>
                                                <p className="text-[10px] text-slate-400">{l.parent.email}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-900">{l.student.firstName} {l.student.lastName}</p>
                                                <p className="text-[10px] text-slate-400">{l.student.email}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${l.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-400 text-xs">{new Date(l.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-4 text-right">
                                                <button onClick={() => handleRemoveLink(l.id)} disabled={actionLoading === l.id} className="p-1.5 text-red-400 hover:text-red-600 transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppLayout>

            {/* ── Admin Refund Modal ── */}
            {refundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">Process Refund</h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Original amount: <span className="font-semibold text-slate-700">{refundModal.currency} {refundModal.amount.toLocaleString()}</span>
                            </p>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Refund Percentage: <span className="text-purple-600">{refundPct}%</span>
                                    <span className="ml-2 font-normal text-slate-500">
                                        = {refundModal.currency} {(refundModal.amount * refundPct / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </label>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={5}
                                    value={refundPct}
                                    onChange={(e) => setRefundPct(Number(e.target.value))}
                                    className="w-full accent-purple-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                                    <span>0%</span><span>50%</span><span>100%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Reason for this refund decision..."
                                    className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none ${refundError && !refundReason.trim() ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
                                />
                            </div>
                            {refundError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">{refundError}</div>
                            )}
                            <p className="text-xs text-slate-400">Note: Actual money transfer to student must be done manually via the PayHere Merchant Portal. This action updates the payment status in the database immediately.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
                            <button
                                onClick={() => setRefundModal(null)}
                                disabled={refundLoading}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdminRefund}
                                disabled={refundLoading}
                                className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {refundLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                Confirm Refund ({refundPct}%)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function ActionCardSmall({ title, description, onClick, icon }: { title: string; description: string; onClick: () => void; icon?: React.ReactNode }) {
    return (
        <button onClick={onClick} className="flex flex-col p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md transition-all text-left relative group">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{title}</span>
                {icon}
            </div>
            <p className="text-[10px] text-slate-500">{description}</p>
        </button>
    );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

/* ═══════════════ ICONS ═══════════════ */
function UsersIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>); }
function StudentIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>); }
function TeacherIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>); }
function BookIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>); }
function ClockIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>); }
function TrendIcon() { return (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>); }

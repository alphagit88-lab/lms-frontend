"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  getAdminSummary,
  getAdminRevenue,
  getAdminTeachers,
  type AdminSummary,
  type RevenueDataPoint,
  type AdminTeacherRow,
} from "@/lib/api/analytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  Activity,
  Star,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: "slate" | "emerald" | "blue" | "amber" | "purple" | "rose";
}) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-start gap-4">
      <div className={`p-3 rounded-xl flex-shrink-0 ${colors[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { label: "Monthly", value: "monthly" as const },
  { label: "Weekly", value: "weekly" as const },
];

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [revenuePeriod, setRevenuePeriod] = useState<"monthly" | "weekly">("monthly");
  const [teachers, setTeachers] = useState<AdminTeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"revenue" | "teachers">("revenue");

  useEffect(() => {
    Promise.all([getAdminSummary(), getAdminTeachers()])
      .then(([s, t]) => {
        setSummary(s);
        setTeachers(t.teachers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getAdminRevenue(revenuePeriod)
      .then((d) => setRevenueData(d.data))
      .catch(console.error);
  }, [revenuePeriod]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-purple-500 rounded-full animate-spin" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppLayout>
        <div className="min-h-screen bg-slate-50">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-purple-900 px-6 lg:px-10 pt-10 pb-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-purple-400 text-sm font-semibold tracking-widest uppercase">Platform Analytics</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Analytics Dashboard</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Monitor platform activity, revenue, and instructor performance.
            </p>
          </div>

          <div className="px-6 lg:px-10 -mt-12 pb-16 space-y-8">
            {/* ── Platform KPI Cards (7.7) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Users"
                value={(summary?.totalUsers ?? 0).toLocaleString()}
                sub={`+${summary?.newUsersThisMonth ?? 0} this month`}
                icon={Users}
                accent="blue"
              />
              <StatCard
                label="Students"
                value={(summary?.totalStudents ?? 0).toLocaleString()}
                icon={UserCheck}
                accent="emerald"
              />
              <StatCard
                label="Instructors"
                value={(summary?.totalTeachers ?? 0).toLocaleString()}
                icon={ShieldCheck}
                accent="purple"
              />
              <StatCard
                label="Parents"
                value={(summary?.totalParents ?? 0).toLocaleString()}
                icon={Users}
                accent="amber"
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Courses"
                value={(summary?.totalCourses ?? 0).toLocaleString()}
                sub={`${summary?.publishedCourses ?? 0} published`}
                icon={BookOpen}
                accent="blue"
              />
              <StatCard
                label="Gross Revenue"
                value={`LKR ${(summary?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={DollarSign}
                accent="emerald"
              />
              <StatCard
                label="Platform Commission"
                value={`LKR ${(summary?.totalCommission ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingUp}
                accent="purple"
              />
              <StatCard
                label="Active Sessions Today"
                value={summary?.activeSessionsToday ?? 0}
                icon={Activity}
                accent="rose"
              />
            </div>

            {/* ── Tabs for Revenue / Teachers ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="font-bold text-slate-800 text-lg">
                    {tab === "revenue" ? "Revenue Analytics" : "Teacher Activity"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tab === "revenue"
                      ? "Gross revenue, commission, and payouts over time"
                      : "Instructor performance and earnings overview"}
                  </p>
                </div>

                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setTab("revenue")}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      tab === "revenue" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setTab("teachers")}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      tab === "teachers" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Teachers
                  </button>
                </div>
              </div>

              {/* ── Revenue Chart (7.8) ── */}
              {tab === "revenue" && (
                <div className="p-6">
                  <div className="flex justify-end mb-4 gap-2">
                    {PERIOD_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => setRevenuePeriod(o.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          revenuePeriod === o.value
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  {revenueData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                      No revenue data yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          width={75}
                          tickFormatter={(v) => `LKR ${Number(v).toLocaleString()}`}
                        />
                        <Tooltip
                      formatter={(v, name) => [
                            `LKR ${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                            name as string,
                          ]}
                          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="grossRevenue" name="Gross Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="commission" name="Commission" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="payouts" name="Payouts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {/* ── Teacher Activity Table (7.9) ── */}
              {tab === "teachers" && (
                <div className="overflow-x-auto">
                  {teachers.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">No instructor data found.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instructor</th>
                          <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Courses</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessions</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Earnings</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teachers.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{t.name}</p>
                              <p className="text-xs text-slate-400">{t.email}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {t.isActive ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                                    <XCircle className="w-3.5 h-3.5" /> Inactive
                                  </span>
                                )}
                                {t.verified && (
                                  <span className="inline-flex items-center gap-1 text-blue-600 text-xs font-semibold">
                                    <ShieldCheck className="w-3 h-3" /> Verified
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-slate-700">{t.coursesCreated}</td>
                            <td className="px-6 py-4 text-right font-semibold text-slate-700">{t.sessionsConducted}</td>
                            <td className="px-6 py-4 text-right">
                              {t.rating != null ? (
                                <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  {Number(t.rating).toFixed(1)}
                                  <span className="text-slate-400 font-normal text-xs">({t.ratingCount})</span>
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                              LKR {t.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-slate-400">
                              {t.lastActive ? new Date(t.lastActive).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

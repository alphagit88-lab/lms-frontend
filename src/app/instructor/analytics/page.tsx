"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  getTeacherSummary,
  getTeacherEarningsChart,
  getTeacherStudents,
  getTeacherAttendance,
  getCoursePerformance,
  type TeacherSummary,
  type EarningsDataPoint,
  type StudentProgressRow,
  type AttendanceRow,
  type CoursePerformance,
} from "@/lib/api/analytics";
import { getMyCourses, type Course } from "@/lib/api/courses";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Users,
  Star,
  TrendingUp,
  BookOpen,
  Clock,
  Wallet,
  ChevronDown,
  AlertCircle,
  Award,
  Activity,
} from "lucide-react";

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: "emerald" | "blue" | "amber" | "purple";
}) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex items-start gap-4">
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

// ── Progress bar ────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = "bg-emerald-500" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const PERIOD_OPTIONS = [
  { label: "Monthly", value: "monthly" as const },
  { label: "Weekly", value: "weekly" as const },
];

export default function InstructorAnalyticsPage() {
  const [summary, setSummary] = useState<TeacherSummary | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsDataPoint[]>([]);
  const [earningsPeriod, setEarningsPeriod] = useState<"monthly" | "weekly">("monthly");
  const [students, setStudents] = useState<StudentProgressRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [coursePerf, setCoursePerf] = useState<CoursePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"students" | "attendance" | "course">("students");

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const [sumData, courseList] = await Promise.all([
          getTeacherSummary(),
          getMyCourses(),
        ]);
        setSummary(sumData);
        setCourses(courseList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  // Earnings chart
  useEffect(() => {
    getTeacherEarningsChart(earningsPeriod)
      .then((d) => setEarningsData(d.data))
      .catch(console.error);
  }, [earningsPeriod]);

  // Students + Attendance when course filter changes
  useEffect(() => {
    Promise.all([
      getTeacherStudents(selectedCourse || undefined),
      getTeacherAttendance(selectedCourse || undefined),
    ])
      .then(([s, a]) => {
        setStudents(s.students);
        setAttendance(a.students);
      })
      .catch(console.error);
  }, [selectedCourse]);

  // Course performance
  const loadCoursePerf = useCallback((courseId: string) => {
    if (!courseId) { setCoursePerf(null); return; }
    getCoursePerformance(courseId)
      .then(setCoursePerf)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (tab === "course" && selectedCourse) loadCoursePerf(selectedCourse);
  }, [tab, selectedCourse, loadCoursePerf]);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["instructor", "admin"]}>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["instructor", "admin"]}>
      <AppLayout>
        <div className="min-h-screen bg-slate-50">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 lg:px-10 pt-10 pb-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">Instructor Analytics</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Analytics & Insights</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Track student progress, course performance, and your earnings at a glance.
            </p>
          </div>

          <div className="px-6 lg:px-10 -mt-12 pb-16 space-y-8">
            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Total Earnings"
                value={`LKR ${(summary?.totalEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={DollarSign}
                accent="emerald"
              />
              <StatCard
                label="This Month"
                value={`LKR ${(summary?.thisMonthEarnings ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingUp}
                accent="blue"
              />
              <StatCard
                label="Pending Payout"
                value={`LKR ${(summary?.pendingPayout ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Wallet}
                accent="amber"
              />
              <StatCard
                label="Active Students"
                value={summary?.totalStudents ?? 0}
                icon={Users}
                accent="purple"
              />
              <StatCard
                label="Sessions Conducted"
                value={summary?.totalSessions ?? 0}
                icon={Clock}
                accent="blue"
              />
              <StatCard
                label="Average Rating"
                value={summary?.rating != null ? `${Number(summary.rating).toFixed(1)} ★` : "—"}
                sub={summary?.ratingCount ? `${summary.ratingCount} reviews` : undefined}
                icon={Star}
                accent="amber"
              />
            </div>

            {/* ── Earnings Chart ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Earnings Over Time</h2>
                    <p className="text-xs text-slate-400">Net earnings (excl. platform fee)</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {PERIOD_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setEarningsPeriod(o.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        earningsPeriod === o.value
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {earningsData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                  No earnings data yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={earningsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={70}
                      tickFormatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                    <Tooltip
                      formatter={(v) => [`LKR ${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Earnings"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    />
                    <Bar dataKey="earnings" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Course Filter + Tabs ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <h2 className="font-bold text-slate-800 text-lg">Student & Course Insights</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Filter by course or view all</p>
                </div>
                {/* Course selector */}
                <div className="relative">
                  <select
                    className="appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      if (tab === "course" && e.target.value) loadCoursePerf(e.target.value);
                    }}
                  >
                    <option value="">All Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {(["students", "attendance", "course"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTab(t);
                        if (t === "course" && selectedCourse) loadCoursePerf(selectedCourse);
                      }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                        tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {t === "course" ? "Performance" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Students Tab (7.1) ── */}
              {tab === "students" && (
                <div className="overflow-x-auto">
                  {students.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">No students found.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Progress</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Score</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students.map((s) => (
                          <tr key={s.enrollmentId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{s.name}</p>
                              <p className="text-xs text-slate-400">{s.email}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{s.courseTitle}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <ProgressBar value={s.progress} />
                                </div>
                                <span className="text-xs font-semibold text-slate-600 w-10 text-right">{s.progress}%</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {s.completedLessons}/{s.totalLessons} lessons
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {s.avgExamScore != null ? (
                                <span
                                  className={`font-bold ${s.avgExamScore >= 70 ? "text-emerald-600" : s.avgExamScore >= 50 ? "text-amber-600" : "text-red-500"}`}
                                >
                                  {s.avgExamScore}%
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-slate-400">
                              {s.lastActive ? new Date(s.lastActive).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ── Attendance Tab (7.3) ── */}
              {tab === "attendance" && (
                <div className="overflow-x-auto">
                  {attendance.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">No attendance data yet.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attended</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">No-Shows</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-48">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendance.map((a) => (
                          <tr key={a.studentId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{a.name}</p>
                              <p className="text-xs text-slate-400">{a.email}</p>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-emerald-600">{a.sessionsAttended}</td>
                            <td className="px-6 py-4 text-right font-semibold text-red-400">{a.noShows}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <ProgressBar
                                  value={a.attendanceRate}
                                  color={a.attendanceRate >= 80 ? "bg-emerald-500" : a.attendanceRate >= 60 ? "bg-amber-500" : "bg-red-400"}
                                />
                                <span className="text-xs font-bold text-slate-600 w-12 text-right">{a.attendanceRate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ── Course Performance Tab (7.6) ── */}
              {tab === "course" && (
                <div className="p-6">
                  {!selectedCourse ? (
                    <div className="text-center py-12 text-slate-400 text-sm flex flex-col items-center gap-2">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                      Select a course above to view its performance.
                    </div>
                  ) : !coursePerf ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-black text-slate-900">{coursePerf.totalEnrolled}</p>
                          <p className="text-xs text-slate-500 mt-1">Enrolled</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-black text-emerald-600">{coursePerf.completionRate}%</p>
                          <p className="text-xs text-slate-500 mt-1">Course Completion</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4 text-center">
                          <p className="text-2xl font-black text-blue-600">{coursePerf.averageScore}%</p>
                          <p className="text-xs text-slate-500 mt-1">Avg Exam Score</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Performers */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-amber-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Top Performers</h3>
                          </div>
                          {coursePerf.topPerformers.length === 0 ? (
                            <p className="text-xs text-slate-400">No graded exams yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {coursePerf.topPerformers.map((s, i) => (
                                <div key={s.studentId} className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-2">
                                  <span className="text-xs font-black text-amber-500 w-4">#{i + 1}</span>
                                  <p className="flex-1 text-sm font-semibold text-slate-700">{s.name}</p>
                                  <span className="text-sm font-black text-amber-600">{s.avgScore}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Needs Attention */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Needs Attention (&lt;50%)</h3>
                          </div>
                          {coursePerf.needsAttention.length === 0 ? (
                            <p className="text-xs text-slate-400">All students are passing!</p>
                          ) : (
                            <div className="space-y-2">
                              {coursePerf.needsAttention.map((s) => (
                                <div key={s.studentId} className="flex items-center gap-3 bg-red-50 rounded-xl px-4 py-2">
                                  <p className="flex-1 text-sm font-semibold text-slate-700">{s.name}</p>
                                  <span className="text-sm font-black text-red-500">{s.avgScore}%</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lesson Engagement */}
                      <div>
                        <h3 className="font-bold text-slate-700 text-sm mb-3">Lesson Engagement</h3>
                        {coursePerf.lessonEngagement.length === 0 ? (
                          <p className="text-xs text-slate-400">No lessons in this course yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {coursePerf.lessonEngagement.map((l) => (
                              <div key={l.lessonId}>
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                  <span className="font-medium text-slate-700 truncate max-w-xs">{l.lessonTitle}</span>
                                  <span>{l.studentsCompleted}/{l.studentsStarted || coursePerf.totalEnrolled} completed</span>
                                </div>
                                <ProgressBar
                                  value={l.studentsCompleted}
                                  max={Math.max(l.studentsStarted, coursePerf.totalEnrolled) || 1}
                                  color="bg-blue-500"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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

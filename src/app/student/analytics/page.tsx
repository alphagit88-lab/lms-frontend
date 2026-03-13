"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import {
  getStudentExams,
  getStudentTimeline,
  type ExamRecord,
  type StudentExamsResponse,
  type TimelineEvent,
} from "@/lib/api/analytics";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
} from "recharts";
import {
  ClipboardCheck,
  Clock,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  FileText,
  GraduationCap,
} from "lucide-react";

// ── Helpers ─────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-100 text-emerald-700"
      : score >= 50
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-600";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${color}`}>{score}%</span>
  );
}

function TrendBadge({ trend }: { trend: "improving" | "declining" | "stable" }) {
  if (trend === "improving")
    return (
      <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
        <TrendingUp className="w-3 h-3" /> Improving
      </span>
    );
  if (trend === "declining")
    return (
      <span className="flex items-center gap-1 text-red-500 text-xs font-semibold bg-red-50 px-2.5 py-1 rounded-full">
        <TrendingDown className="w-3 h-3" /> Declining
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-slate-500 text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-full">
      <Minus className="w-3 h-3" /> Stable
    </span>
  );
}

function timelineIcon(type: TimelineEvent["type"]) {
  if (type === "enrollment") return <GraduationCap className="w-4 h-4" />;
  if (type === "lesson_completed") return <CheckCircle2 className="w-4 h-4" />;
  return <ClipboardCheck className="w-4 h-4" />;
}

function timelineColor(type: TimelineEvent["type"]) {
  if (type === "enrollment") return "bg-blue-100 text-blue-600";
  if (type === "lesson_completed") return "bg-emerald-100 text-emerald-600";
  return "bg-purple-100 text-purple-600";
}

// ── Page ─────────────────────────────────────────────────────────

export default function StudentAnalyticsPage() {
  const [examData, setExamData] = useState<StudentExamsResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [tab, setTab] = useState<"exams" | "timeline">("exams");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudentExams(), getStudentTimeline()])
      .then(([ed, t]) => {
        setExamData(ed);
        setTimeline(t.events);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const avgScore = examData?.averageScore ?? 0;
  const gaugeData = [{ value: avgScore, fill: avgScore >= 70 ? "#10b981" : avgScore >= 50 ? "#f59e0b" : "#ef4444" }];

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppLayout>
        <div className="min-h-screen bg-slate-50">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-6 lg:px-10 pt-10 pb-20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-blue-400 text-sm font-semibold tracking-widest uppercase">My Analytics</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Learning Progress</h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              Track your exam performance and learning journey over time.
            </p>
          </div>

          <div className="px-6 lg:px-10 -mt-12 pb-16 space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gauge card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-6">
                <div className="w-20 h-20 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="65%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                      data={gaugeData}
                    >
                      <RadialBar dataKey="value" maxBarSize={12} background={{ fill: "#f1f5f9" }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Score</p>
                  <p className="text-3xl font-black text-slate-900">{avgScore}%</p>
                  {examData && <TrendBadge trend={examData.trend} />}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="p-3 bg-purple-50 rounded-xl inline-flex mb-3">
                  <ClipboardCheck className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{examData?.total ?? 0}</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Exams Completed</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="p-3 bg-emerald-50 rounded-xl inline-flex mb-3">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-black text-slate-900">{timeline.filter((e) => e.type === "lesson_completed").length}</p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Lessons Completed</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setTab("exams")}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      tab === "exams" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Exam History
                  </button>
                  <button
                    onClick={() => setTab("timeline")}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      tab === "timeline" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Learning Timeline
                  </button>
                </div>
              </div>

              {/* ── Exam History (7.2) ── */}
              {tab === "exams" && (
                <div className="overflow-x-auto">
                  {!examData || examData.exams.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-3 text-slate-400">
                      <FileText className="w-10 h-10 text-slate-200" />
                      <p className="text-sm">No graded exams yet. Keep learning!</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/60">
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Exam</th>
                          <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                          <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                          <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {examData.exams.map((exam: ExamRecord) => (
                          <tr key={exam.submissionId} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-800">{exam.examTitle}</p>
                              <p className="text-xs text-slate-400 capitalize">{(exam.examType ?? "").replace(/_/g, " ")}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">{exam.courseTitle}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <ScoreBadge score={exam.scorePercent} />
                                <span className="text-xs text-slate-400">
                                  {exam.marksAwarded}/{exam.totalMarks} marks
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {exam.passed === true ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                                </span>
                              ) : exam.passed === false ? (
                                <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
                                  <XCircle className="w-3.5 h-3.5" /> Failed
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-slate-400">
                              {exam.timeSpentMinutes != null
                                ? `${exam.timeSpentMinutes} min`
                                : "—"}
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-slate-400">
                              {exam.gradedAt
                                ? new Date(exam.gradedAt).toLocaleDateString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ── Learning Timeline (7.4) ── */}
              {tab === "timeline" && (
                <div className="p-6">
                  {timeline.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-3 text-slate-400">
                      <Clock className="w-10 h-10 text-slate-200" />
                      <p className="text-sm">No learning activity yet. Start a course!</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />
                      <div className="space-y-6">
                        {timeline.map((event, i) => (
                          <div key={`${event.referenceId}-${i}`} className="flex items-start gap-4 relative">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${timelineColor(event.type)}`}
                            >
                              {timelineIcon(event.type)}
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl p-4 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm leading-tight">{event.title}</p>
                              {event.subtitle && (
                                <p className="text-xs text-slate-500 mt-0.5">{event.subtitle}</p>
                              )}
                              {event.type === "exam_graded" && event.meta?.scorePercent != null && (
                                <div className="mt-2">
                                  <ScoreBadge score={event.meta.scorePercent as number} />
                                </div>
                              )}
                              <p className="text-xs text-slate-400 mt-2">
                                {new Date(event.eventDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
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

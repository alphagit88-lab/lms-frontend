"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  getCourses,
  getCategories,
  deleteCourse,
  togglePublishCourse,
  type Course,
  type Category,
} from "@/lib/api/courses";
import {
  BookOpen,
  Search,
  Trash2,
  Eye,
  EyeOff,
  Users,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  draft: "bg-amber-50 text-amber-700 border border-amber-200",
  archived: "bg-slate-100 text-slate-500 border border-slate-200",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [coursesData, categoriesData] = await Promise.all([
        getCourses(), // no published filter → admin sees all
        getCategories(),
      ]);
      setCourses(coursesData);
      setCategories(categoriesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePublish = async (course: Course) => {
    setActionLoading(course.id);
    try {
      const updated = await togglePublishCourse(course.id, !course.isPublished);
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, ...updated } : c))
      );
      showToast("success", `Course ${updated.isPublished ? "published" : "unpublished"} successfully`);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(confirmDelete.id);
    setConfirmDelete(null);
    try {
      await deleteCourse(confirmDelete.id);
      setCourses((prev) => prev.filter((c) => c.id !== confirmDelete.id));
      showToast("success", "Course deleted successfully");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Client-side filtering
  const filtered = courses.filter((c) => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
      !(c.instructor?.firstName + " " + c.instructor?.lastName).toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedCategory && c.categoryId !== selectedCategory) return false;
    if (selectedLevel && c.level !== selectedLevel) return false;
    if (selectedStatus) {
      if (selectedStatus === "published" && !c.isPublished) return false;
      if (selectedStatus === "unpublished" && c.isPublished) return false;
      if (selectedStatus === "draft" && c.status !== "draft") return false;
      if (selectedStatus === "archived" && c.status !== "archived") return false;
    }
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-1">
                System Management
              </p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                All Courses
              </h1>
              <p className="text-slate-500 mt-1">
                Manage, publish, and moderate all platform courses
              </p>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Courses", value: courses.length, color: "bg-blue-50 text-blue-700" },
              { label: "Published", value: courses.filter((c) => c.isPublished).length, color: "bg-emerald-50 text-emerald-700" },
              { label: "Drafts", value: courses.filter((c) => !c.isPublished && c.status === "draft").length, color: "bg-amber-50 text-amber-700" },
              { label: "Total Enrollments", value: courses.reduce((s, c) => s + (c.enrollmentCount ?? 0), 0), color: "bg-purple-50 text-purple-700" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-black mt-1 ${stat.color.split(" ")[1]}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title or instructor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full appearance-none pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Showing {filtered.length} of {courses.length} courses
            </p>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all ${
                toast.type === "success"
                  ? "bg-emerald-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {toast.text}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-5 py-4 text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <BookOpen className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-semibold">No courses found</p>
                <p className="text-sm mt-1">Try adjusting the filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Course</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Instructor</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Level</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Price</th>
                      <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Enrollments</th>
                      <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((course) => {
                      const thumbnailUrl = course.thumbnail
                        ? course.thumbnail.startsWith("http")
                          ? course.thumbnail
                          : `${API_BASE_URL}${course.thumbnail}`
                        : null;
                      const instructorName = course.instructor
                        ? `${course.instructor.firstName} ${course.instructor.lastName ?? ""}`.trim()
                        : "—";
                      const isProcessing = actionLoading === course.id;
                      const status = course.isPublished ? "published" : course.status ?? "draft";

                      return (
                        <tr
                          key={course.id}
                          className={`hover:bg-slate-50/60 transition ${isProcessing ? "opacity-50" : ""}`}
                        >
                          {/* Course */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3 max-w-65">
                              <div className="w-12 h-10 rounded-lg bg-slate-100 shrink-0 overflow-hidden">
                                {thumbnailUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={thumbnailUrl}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/courses/${course.id}`}
                                  className="font-semibold text-slate-900 hover:text-blue-600 transition truncate block"
                                >
                                  {course.title}
                                </Link>
                                <p className="text-xs text-slate-400 truncate mt-0.5">{course.slug}</p>
                              </div>
                            </div>
                          </td>

                          {/* Instructor */}
                          <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{instructorName}</td>

                          {/* Category */}
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                            {course.category?.name ?? "—"}
                          </td>

                          {/* Level */}
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 whitespace-nowrap">
                              {LEVEL_LABELS[course.level] ?? course.level}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-5 py-4 text-slate-700 font-medium whitespace-nowrap">
                            {Number(course.price) === 0 ? (
                              <span className="text-emerald-600 font-bold">Free</span>
                            ) : (
                              `Rs. ${Number(course.price).toLocaleString()}`
                            )}
                          </td>

                          {/* Enrollments */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {course.enrollmentCount ?? 0}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleTogglePublish(course)}
                                disabled={isProcessing}
                                title={course.isPublished ? "Unpublish" : "Publish"}
                                className={`p-2 rounded-xl transition ${
                                  course.isPublished
                                    ? "text-amber-600 hover:bg-amber-50"
                                    : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {course.isPublished ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(course)}
                                disabled={isProcessing}
                                title="Delete course"
                                className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-7 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-red-100 rounded-xl">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Delete Course</h2>
              </div>
              <p className="text-slate-600 text-sm mb-1">
                Are you sure you want to delete:
              </p>
              <p className="font-semibold text-slate-900 mb-4">
                &ldquo;{confirmDelete.title}&rdquo;
              </p>
              <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-6">
                This will permanently delete the course and all its lessons, enrollments, and content. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
                >
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Calendar, Clock, Video, BookOpen, AlertCircle } from "lucide-react";
import { CreateSessionPayload, sessionApi } from "@/lib/api/sessions";
import { getMyCourses } from "@/lib/api/courses";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSessionModal({ isOpen, onClose, onSuccess }: CreateSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateSessionPayload>({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    sessionType: "live",
    createZoomMeeting: true,
    courseId: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadCourses();
      // Reset form
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      const end = new Date(now);
      end.setHours(end.getHours() + 1);
      
      setFormData({
        title: "",
        description: "",
        startTime: now.toISOString().slice(0, 16), // datetime-local format
        endTime: end.toISOString().slice(0, 16),
        sessionType: "live",
        createZoomMeeting: true,
        courseId: "",
      });
      setError(null);
    }
  }, [isOpen]);

  const loadCourses = async () => {
    try {
      // Assuming getMyCourses returns instructor's courses
      const courses = await getMyCourses();
      setCourses(courses || []);
    } catch (err) {
      console.error("Failed to load courses", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: CreateSessionPayload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        // Only send courseId if selected
        courseId: formData.courseId || undefined,
      };

      await sessionApi.createSession(payload);
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    Schedule New Session
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Session Topic</label>
                    <input
                      required
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g., Week 4: Live Q&A"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  {/* Course Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Related Course (Optional)</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <select
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
                        value={formData.courseId}
                        onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      >
                        <option value="">-- No specific course --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">If selected, enrolled students will be notified.</p>
                  </div>

                  {/* Date/Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          required
                          type="datetime-local"
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                       <div className="relative">
                         <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                         <input
                           required
                           type="datetime-local"
                           className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                           value={formData.endTime}
                           onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                         />
                       </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Notes or agenda for the session..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Options */}
                  <div className="flex items-center gap-3">
                    <input
                      id="createZoom"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      checked={formData.createZoomMeeting}
                      onChange={(e) => setFormData({ ...formData, createZoomMeeting: e.target.checked })}
                    />
                    <label htmlFor="createZoom" className="text-sm text-slate-700 font-medium cursor-pointer select-none">
                      Auto-create Zoom meeting link
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        "Schedule Session"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
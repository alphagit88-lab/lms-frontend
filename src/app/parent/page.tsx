'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AppLayout from '@/components/layout/AppLayout';
import {
  getMyStudents,
  linkStudent,
  unlinkStudent,
  LinkedStudent,
} from '@/lib/api/parent';

export default function ParentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    studentEmail: '',
    message: '',
  });
  const [linkLoading, setLinkLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'parent') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'parent') {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await getMyStudents();
      setStudents(data.students);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!linkFormData.studentEmail) {
      setError('Student email is required');
      return;
    }

    try {
      setLinkLoading(true);
      await linkStudent(linkFormData.studentEmail, linkFormData.message);
      setSuccess('Link request sent successfully! Waiting for student approval.');
      setLinkFormData({ studentEmail: '', message: '' });
      setShowLinkForm(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send link request');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleUnlink = async (linkId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unlink from ${studentName}?`)) {
      return;
    }

    try {
      await unlinkStudent(linkId);
      setSuccess('Successfully unlinked');
      loadStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink');
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parent Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor your children&apos;s learning progress</p>
        </div>
        <button
          onClick={() => setShowLinkForm(!showLinkForm)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition shadow-sm self-start"
        >
          {showLinkForm ? 'Cancel' : '+ Link Student'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      {/* Link Student Form */}
      {showLinkForm && (
        <div className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-900">Link with Student Account</h2>
          <form onSubmit={handleLinkStudent} className="space-y-4">
            <div>
              <label htmlFor="studentEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
                Student Email Address
              </label>
              <input
                type="email"
                id="studentEmail"
                value={linkFormData.studentEmail}
                onChange={(e) => setLinkFormData({ ...linkFormData, studentEmail: e.target.value })}
                placeholder="student@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
                Message (Optional)
              </label>
              <textarea
                id="message"
                value={linkFormData.message}
                onChange={(e) => setLinkFormData({ ...linkFormData, message: e.target.value })}
                placeholder="Hi, I'm your parent requesting to link accounts..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={linkLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {linkLoading ? 'Sending...' : 'Send Link Request'}
            </button>
          </form>
        </div>
      )}

      {/* Linked Students */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-slate-900">
          Linked Students {students.length > 0 && `(${students.length})`}
        </h2>

        {students.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-slate-600 mb-2">No students linked yet</p>
            <p className="text-sm text-slate-400">
              Click &quot;Link Student&quot; above to request linking with a student account
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <div
                key={student.linkId}
                className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center mb-4">
                  {student.profilePicture ? (
                    <Image
                      src={student.profilePicture}
                      alt={`${student.firstName} ${student.lastName}`}
                      width={48}
                      height={48}
                      className="rounded-full mr-3 object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg font-bold text-blue-700 mr-3">
                      {student.firstName[0]}
                      {student.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">{student.email}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4">
                  Linked since {new Date(student.linkedSince).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/parent/student/${student.studentId}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg font-medium text-sm hover:bg-blue-700 transition"
                  >
                    View Progress
                  </Link>
                  <button
                    onClick={() =>
                      handleUnlink(
                        student.linkId,
                        `${student.firstName} ${student.lastName}`
                      )
                    }
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Parent Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Monitor your children&apos;s learning progress
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        {/* Link Student Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            {showLinkForm ? 'Cancel' : '+ Link Student'}
          </button>
        </div>

        {/* Link Student Form */}
        {showLinkForm && (
          <div className="mb-8 p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
              Link with Student Account
            </h2>
            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label
                  htmlFor="studentEmail"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Student Email Address
                </label>
                <input
                  type="email"
                  id="studentEmail"
                  value={linkFormData.studentEmail}
                  onChange={(e) =>
                    setLinkFormData({ ...linkFormData, studentEmail: e.target.value })
                  }
                  placeholder="student@example.com"
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                >
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={linkFormData.message}
                  onChange={(e) =>
                    setLinkFormData({ ...linkFormData, message: e.target.value })
                  }
                  placeholder="Hi, I'm your parent requesting to link accounts..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <button
                type="submit"
                disabled={linkLoading}
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {linkLoading ? 'Sending...' : 'Send Link Request'}
              </button>
            </form>
          </div>
        )}

        {/* Linked Students */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
            Linked Students {students.length > 0 && `(${students.length})`}
          </h2>

          {students.length === 0 ? (
            <div className="text-center py-12 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                No students linked yet
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Click &quot;Link Student&quot; above to request linking with a student account
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => (
                <div
                  key={student.linkId}
                  className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:shadow-lg transition"
                >
                  <div className="flex items-center mb-4">
                    {student.profilePicture ? (
                      <img
                        src={student.profilePicture}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="w-16 h-16 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-600 dark:text-zinc-400 mr-4">
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-black dark:text-white">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                    Linked since{' '}
                    {new Date(student.linkedSince).toLocaleDateString()}
                  </p>

                  <div className="flex gap-2">
                    <Link
                      href={`/parent/student/${student.studentId}`}
                      className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-center rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
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
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      Unlink
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

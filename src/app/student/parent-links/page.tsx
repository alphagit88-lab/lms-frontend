'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getMyParents,
  getPendingRequests,
  respondToLink,
  unlinkStudent,
  LinkedParent,
  LinkRequest,
} from '@/lib/api/parent';

export default function StudentParentLinksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [parents, setParents] = useState<LinkedParent[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [parentsData, requestsData] = await Promise.all([
        getMyParents(),
        getPendingRequests(),
      ]);
      setParents(parentsData.parents);
      setPendingRequests(requestsData.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToLink = async (linkId: string, action: 'accept' | 'reject') => {
    try {
      await respondToLink(linkId, action);
      setSuccess(`Link request ${action}ed successfully`);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to request');
    }
  };

  const handleUnlink = async (linkId: string, parentName: string) => {
    if (!confirm(`Are you sure you want to unlink from ${parentName}?`)) {
      return;
    }

    try {
      await unlinkStudent(linkId);
      setSuccess('Successfully unlinked');
      loadData();
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
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Parent Account Links
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Manage parent accounts that can view your progress
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

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-6 border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-black dark:text-white">
                        {request.parentName}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        {request.parentEmail}
                      </p>
                      {request.message && (
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-black p-3 rounded border border-zinc-200 dark:border-zinc-800">
                          &quot;{request.message}&quot;
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                        Requested on{' '}
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleRespondToLink(request.id, 'accept')}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRespondToLink(request.id, 'reject')}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Parents */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-black dark:text-white">
            Linked Parents {parents.length > 0 && `(${parents.length})`}
          </h2>

          {parents.length === 0 ? (
            <div className="text-center py-12 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                No parents linked yet
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Parents can request to link with your account to monitor your progress
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {parents.map((parent) => (
                <div
                  key={parent.linkId}
                  className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:shadow-lg transition"
                >
                  <div className="flex items-center mb-4">
                    {parent.profilePicture ? (
                      <img
                        src={parent.profilePicture}
                        alt={`${parent.firstName} ${parent.lastName}`}
                        className="w-16 h-16 rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-600 dark:text-zinc-400 mr-4">
                        {parent.firstName[0]}
                        {parent.lastName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg text-black dark:text-white">
                        {parent.firstName} {parent.lastName}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {parent.email}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
                    Linked since{' '}
                    {new Date(parent.linkedSince).toLocaleDateString()}
                  </p>

                  <button
                    onClick={() =>
                      handleUnlink(
                        parent.linkId,
                        `${parent.firstName} ${parent.lastName}`
                      )
                    }
                    className="w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    Unlink Parent
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-black dark:text-white mb-2">
            About Parent Linking
          </h3>
          <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
            <li>• Parents can view your course enrollments and progress</li>
            <li>• Parents cannot make changes to your account or courses</li>
            <li>• You can unlink a parent at any time</li>
            <li>• Parents need your approval before linking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

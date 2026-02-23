'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Parent Account Links</h1>
        <p className="text-sm text-slate-500 mt-1">Manage parent accounts that can view your progress</p>
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

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-900">
            Pending Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="p-5 border-2 border-amber-200 bg-amber-50 rounded-xl"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900">
                      {request.parentName}
                    </h3>
                    <p className="text-sm text-slate-500 mb-2">
                      {request.parentEmail}
                    </p>
                    {request.message && (
                      <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                        &quot;{request.message}&quot;
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Requested on{' '}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleRespondToLink(request.id, 'accept')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToLink(request.id, 'reject')}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition"
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
        <h2 className="text-lg font-semibold mb-4 text-slate-900">
          Linked Parents {parents.length > 0 && `(${parents.length})`}
        </h2>

        {parents.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-slate-600 mb-2">No parents linked yet</p>
            <p className="text-sm text-slate-400">
              Parents can request to link with your account to monitor your progress
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {parents.map((parent) => (
              <div
                key={parent.linkId}
                className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center mb-4">
                  {parent.profilePicture ? (
                    <img
                      src={parent.profilePicture}
                      alt={`${parent.firstName} ${parent.lastName}`}
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-lg font-bold text-blue-700 mr-3">
                      {parent.firstName[0]}
                      {parent.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {parent.firstName} {parent.lastName}
                    </h3>
                    <p className="text-sm text-slate-500">{parent.email}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-4">
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
                  className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium text-sm hover:bg-red-50 transition"
                >
                  Unlink Parent
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="font-semibold text-slate-900 mb-2 text-sm">About Parent Linking</h3>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Parents can view your course enrollments and progress</li>
          <li>• Parents cannot make changes to your account or courses</li>
          <li>• You can unlink a parent at any time</li>
          <li>• Parents need your approval before linking</li>
        </ul>
      </div>
    </AppLayout>
  );
}

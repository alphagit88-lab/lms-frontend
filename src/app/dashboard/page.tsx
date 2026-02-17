'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Navigation */}
        <nav className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-black dark:text-white">
                LMS Dashboard
              </h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Card */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-2">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              You&apos;re logged in as{' '}
              <span className="font-medium text-black dark:text-white">
                {user?.role}
              </span>
            </p>
          </div>

          {/* User Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                ACCOUNT INFORMATION
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Full Name
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-black dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-black dark:text-white">
                    {user?.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Role
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black dark:bg-white text-white dark:text-black">
                      {user?.role.toUpperCase()}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
                ACCOUNT STATUS
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Email Verified
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user?.emailVerified
                          ? 'bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {user?.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Member Since
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-black dark:text-white">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                    Last Login
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-black dark:text-white">
                    {user?.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-4">
              QUICK ACTIONS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button className="px-4 py-3 text-sm font-medium text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-left">
                View Courses
              </button>
              <button className="px-4 py-3 text-sm font-medium text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-left">
                Update Profile
              </button>
              <button className="px-4 py-3 text-sm font-medium text-black dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition text-left">
                Settings
              </button>
            </div>
          </div>

          {/* Role-specific content */}
          {user?.role === 'instructor' && (
            <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Instructor Tools
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Manage your courses and students
              </p>
              <button className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition">
                Create New Course
              </button>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="mt-8 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 bg-zinc-50 dark:bg-zinc-900">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
                Admin Panel
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Manage users, courses, and system settings
              </p>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition">
                  Manage Users
                </button>
                <button className="px-4 py-2 text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
                  System Settings
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

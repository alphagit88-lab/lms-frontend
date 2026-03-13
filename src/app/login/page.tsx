'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'instructor') {
        router.push('/instructor/courses');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'instructor') {
        router.push('/instructor/courses');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white relative overflow-hidden">
      {/* Background effects (match homepage vibe) */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-225 h-150 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-105 h-105 bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-90 h-90 bg-indigo-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative min-h-screen grid lg:grid-cols-2">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex items-center justify-center px-10 py-16">
          <div className="max-w-xl w-full">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight group-hover:text-white/90 transition-colors">
                LMS
              </span>
            </Link>

            {/* Badge */}
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Built for Sri Lankan learners
            </div>

            <h1 className="mt-6 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Welcome back.
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-violet-400 to-indigo-400">
                Continue learning
              </span>
            </h1>
            <p className="mt-4 text-slate-300 text-base leading-relaxed max-w-md">
              Sign in to pick up where you left off with live sessions, courses, exams, and detailed analytics.
            </p>

            {/* Highlight card */}
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex items-center gap-4 shadow-lg shadow-black/30">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-emerald-400/80 to-blue-500/80 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  One login for every role
                </p>
                <p className="text-xs text-slate-400">
                  Seamlessly switch between student, instructor, parent, and admin experiences.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-5">
              {[
                { value: "100+", label: "Teachers" },
                { value: "500+", label: "Students" },
                { value: "50+", label: "Courses" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="relative rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-md overflow-hidden"
                >
                  <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-60" />
                  <div className="relative">
                    <div className="text-sm text-slate-400 mb-1">{stat.label}</div>
                    <div className="text-2xl font-semibold text-white">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex items-center justify-center px-6 py-14">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="w-11 h-11 bg-linear-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-lg font-bold tracking-tight">LMS</span>
              </Link>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
              <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-white/10">
                <h2 className="text-2xl font-bold tracking-tight text-white">Sign in</h2>
                <p className="text-slate-400 mt-1 text-sm">
                  Enter your credentials to access your dashboard.
                </p>
              </div>

              <div className="px-6 sm:px-8 py-6 space-y-6">
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
                    <svg className="w-5 h-5 text-red-300 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-200 leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      New here?{" "}
                      <Link
                        href="/register"
                        className="text-slate-200 hover:text-white font-semibold transition-colors"
                      >
                        Create an account
                      </Link>
                    </div>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-slate-300 hover:text-white font-semibold transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-xl shadow-blue-700/25 hover:shadow-blue-600/35 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Demo Credentials */}
                <div className="rounded-2xl border border-white/10 bg-white/5">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-slate-200 tracking-wide uppercase">Demo credentials</p>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-1 gap-2 text-xs text-slate-400">
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-slate-200">Admin</span>
                      <span className="text-right">admin@lms.com / Test@1234</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-slate-200">Instructor</span>
                      <span className="text-right">john.doe@lms.com / Test@1234</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-slate-200">Student</span>
                      <span className="text-right">jane.smith@lms.com / Test@1234</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="font-semibold text-slate-200">Parent</span>
                      <span className="text-right">kamala.perera@lms.com / Test@1234</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center mt-8 text-xs text-slate-600">
              &copy; 2026 LMS. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'student' as 'student' | 'instructor' | 'parent' | 'admin',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'instructor') {
        router.push('/instructor/onboarding');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      });

      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'instructor') {
        router.push('/instructor/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const roleOptions = [
    { value: 'student', label: 'Learn (Student)', icon: '📚', desc: 'Browse courses, book sessions' },
    { value: 'instructor', label: 'Teach (Instructor)', icon: '🎓', desc: 'Create courses, manage students' },
    { value: 'parent', label: 'Monitor (Parent)', icon: '👨‍👩‍👧', desc: 'Track your child\'s progress' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white relative overflow-hidden">
      {/* Background effects (match homepage vibe) */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[420px] h-[420px] bg-violet-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-[360px] h-[360px] bg-indigo-500/10 rounded-full blur-[80px]" />
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight group-hover:text-white/90 transition-colors">
                LMS
              </span>
            </Link>

            <div className="mt-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Start in minutes
            </div>

            <h1 className="mt-6 text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Join LMS today.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400">
                Learn, teach, or monitor
              </span>
            </h1>
            <p className="mt-4 text-slate-300 text-base leading-relaxed max-w-md">
              Create your account to book live sessions, manage courses, and track progress — all in one platform.
            </p>

            <div className="mt-8 space-y-3 max-w-md">
              {[
                "Expert teachers from across Sri Lanka",
                "Interactive live sessions and recordings",
                "Analytics to track progress and outcomes",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-slate-200">{feature}</span>
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
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-lg font-bold tracking-tight">LMS</span>
              </Link>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
              <div className="px-6 sm:px-8 pt-8 pb-6 border-b border-white/10">
                <h2 className="text-2xl font-bold tracking-tight text-white">Create account</h2>
                <p className="text-slate-400 mt-1 text-sm">Get started in just a few steps.</p>
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
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-slate-200 mb-2">
                        First name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition"
                        placeholder="John"
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-slate-200 mb-2">
                        Last name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition"
                        placeholder="Doe"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

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

                  {/* Role Selector */}
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      I want to
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {roleOptions.map((role) => {
                        const selected = formData.role === role.value;
                        const short =
                          role.value === 'student' ? 'Learn' : role.value === 'instructor' ? 'Teach' : 'Monitor';
                        return (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, role: role.value as typeof formData.role })}
                            className={[
                              "p-3 rounded-2xl border text-left transition-all group",
                              selected
                                ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-lg">{role.icon}</div>
                              {selected && (
                                <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className={`mt-1 text-xs font-semibold ${selected ? "text-blue-200" : "text-slate-200"}`}>
                              {short}
                            </div>
                            <div className="mt-0.5 text-[11px] leading-snug text-slate-500 line-clamp-2">
                              {role.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
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
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200 mb-2">
                      Confirm password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition-all shadow-xl shadow-blue-700/25 hover:shadow-blue-600/35 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating account...
                      </span>
                    ) : (
                      'Create account'
                    )}
                  </button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-transparent text-slate-500">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <Link
                  href="/login"
                  className="block w-full text-center py-3 rounded-2xl border border-white/10 bg-white/5 text-slate-200 font-semibold hover:bg-white/10 hover:border-white/20 transition"
                >
                  Sign in
                </Link>
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

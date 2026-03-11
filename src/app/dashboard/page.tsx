'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import InstructorAnalyticsSection from '@/components/instructor/InstructorAnalyticsSection';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ─── Reusable sub-components ───────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-[24px] border border-white/40 p-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_50px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-500 group flex items-center gap-6">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 shadow-lg ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5 opacity-80">
          {label}
        </p>
        <p className="text-3xl font-semibold text-slate-900 leading-none mb-1 group-hover:text-blue-600 transition-colors">
          {value}
        </p>
        <p className="text-[11px] font-medium text-slate-400 opacity-70 lowercase">{sub}</p>
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`${gradient} relative group rounded-[32px] p-8 text-left border border-white/20 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] hover:-translate-y-2.5 transition-all duration-500 overflow-hidden flex flex-col items-start gap-5`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-150 transition-transform duration-[1.5s] ease-out">
        {icon}
      </div>
      <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
        <div className="scale-125">{icon}</div>
      </div>
      <div className="relative">
        <h4 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors tracking-tight">
          {title}
        </h4>
        <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[200px] opacity-90">
          {description}
        </p>
      </div>
      <div className="relative mt-2 flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-950/5 group-hover:bg-blue-600 text-[11px] font-semibold text-slate-500 group-hover:text-white uppercase tracking-widest transition-all duration-300">
        Launch Action
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg>
      </div>
    </button>
  );
}

const icons = {
  users: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  calendar: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  book: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  chart: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  plus: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>,
  clock: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  play: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  eye: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  search: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  wallet: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  video: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  upload: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  profile: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect admin
  useEffect(() => {
    if (!authLoading && user?.role === 'admin') router.replace('/admin');
  }, [user, authLoading, router]);

  const profilePicUrl = user?.profilePicture
    ? user.profilePicture.startsWith('http')
      ? user.profilePicture
      : `${API_BASE_URL}${user.profilePicture}`
    : null;

  return (
    <ProtectedRoute>
      <AppLayout>
        {/* ── Dashboard Hero Banner ────────────────────────────── */}
        <div className="mb-14 group">
          <div className="relative rounded-[40px] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-700">
            {/* Soft Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-indigo-900" />

            <div className="relative px-10 sm:px-14 py-16 sm:py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-10 flex-1 min-w-0">
                <div className="hidden sm:block flex-shrink-0 relative">
                  {profilePicUrl ? (
                    <Image
                      src={profilePicUrl}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-3xl border-2 border-white/20 object-cover shadow-2xl relative z-10"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-3xl font-semibold flex items-center justify-center shadow-2xl relative z-10">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">{getTodayFormatted()}</p>
                  <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-4 tracking-tight">
                    {getGreeting()}, <span className="text-blue-400">{user?.firstName}</span>
                  </h1>
                  <p className="text-white/70 text-lg font-medium max-w-xl">
                    Welcome to your <span className="text-white capitalize">{user?.role}</span> workspace.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <button
                  onClick={() => router.push('/profile')}
                  className="px-8 py-4 rounded-xl bg-blue-600 text-white text-sm font-semibold uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                >
                  Manage Profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Activity Grids ──────────────────────── */}

        {/* STUDENT DASHBOARD */}
        {user?.role === 'student' && (
          <div className="space-y-16 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard icon={icons.book} label="Learning" value="4 Courses" sub="Active enrollments" accent="bg-white text-blue-600" />
              <StatCard icon={icons.calendar} label="Schedule" value="2 Labs" sub="Upcoming sessions" accent="bg-white text-indigo-600" />
              <StatCard icon={icons.users} label="Network" value="12 Mentors" sub="Connected instructors" accent="bg-white text-emerald-600" />
              <StatCard icon={icons.chart} label="Rank" value="Top 5%" sub="Performance metrics" accent="bg-white text-amber-600" />
            </div>

            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8 px-2">Essential Student Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
                <ActionCard icon={icons.search} title="Discover Courses" description="Explore our catalog of educational content" onClick={() => router.push('/courses')} gradient="bg-slate-50" />
                <ActionCard icon={icons.book} title="My Curriculum" description="Access your enrolled courses and materials" onClick={() => router.push('/student/my-courses')} gradient="bg-slate-50" />
                <ActionCard icon={icons.calendar} title="Book 1-on-1" description="Schedule private sessions with instructors" onClick={() => router.push('/teachers')} gradient="bg-slate-50" />
                <ActionCard icon={icons.chart} title="My Progress" description="Insights into your learning journey" onClick={() => router.push('/student/my-courses')} gradient="bg-slate-50" />
              </div>
            </section>
          </div>
        )}

        {/* INSTRUCTOR DASHBOARD */}
        {user?.role === 'instructor' && (
          <div className="space-y-16 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard icon={icons.users} label="Reach" value="142 Students" sub="Active learners" accent="bg-white text-blue-600" />
              <StatCard icon={icons.calendar} label="Pipeline" value="8 Bookings" sub="Next 7 days" accent="bg-white text-indigo-600" />
              <StatCard icon={icons.wallet} label="Yield" value="$4,280" sub="Earnings this month" accent="bg-white text-emerald-600" />
              <StatCard icon={icons.chart} label="Trust" value="4.9/5" sub="Average rating" accent="bg-white text-amber-600" />
            </div>

            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8 px-2">Teaching Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-8">
                <ActionCard icon={icons.calendar} title="Manage Bookings" description="Control teacher-student sessions" onClick={() => router.push('/instructor/bookings')} gradient="bg-slate-50" />
                <ActionCard icon={icons.clock} title="Set Availability" description="Manage your teaching hours and slots" onClick={() => router.push('/instructor/availability')} gradient="bg-slate-50" />
                <ActionCard icon={icons.play} title="Live Classroom" description="Start instant live interactive sessions" onClick={() => router.push('/instructor/sessions')} gradient="bg-slate-50" />
                <ActionCard icon={icons.plus} title="New Course" description="Design and publish elite curriculum" onClick={() => router.push('/instructor/courses/create')} gradient="bg-slate-50" />
                <ActionCard icon={icons.upload} title="Content Library" description="Manage PDFs, videos, and handouts" onClick={() => router.push('/instructor/content')} gradient="bg-slate-50" />
                <ActionCard icon={icons.eye} title="Exams & Assessments" description="Create, grade, and publish exam scores" onClick={() => router.push('/instructor/exams')} gradient="bg-slate-50" />
                <ActionCard icon={icons.chart} title="Instructor Hub" description="Full instructor dashboard overview" onClick={() => router.push('/instructor/dashboard')} gradient="bg-slate-50" />
              </div>
            </section>

            <InstructorAnalyticsSection />
          </div>
        )}

        {/* PARENT DASHBOARD */}
        {user?.role === 'parent' && (
          <div className="space-y-16 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard icon={icons.users} label="Family" value="2 Students" sub="Linked learners" accent="bg-white text-purple-600" />
              <StatCard icon={icons.calendar} label="Events" value="3 Lessons" sub="Next 48 hours" accent="bg-white text-blue-600" />
              <StatCard icon={icons.book} label="Enrollments" value="6 Courses" sub="Total active tracks" accent="bg-white text-emerald-600" />
              <StatCard icon={icons.chart} label="Average" value="88%" sub="Children's performance" accent="bg-white text-amber-600" />
            </div>

            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8 px-2">Guardian Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
                <ActionCard icon={icons.eye} title="Accountability" description="View student learning metrics" onClick={() => router.push('/parent')} gradient="bg-slate-50" />
                <ActionCard icon={icons.plus} title="Add Student" description="Link new student accounts" onClick={() => router.push('/parent')} gradient="bg-slate-50" />
                <ActionCard icon={icons.search} title="Find Teachers" description="Book mentors for your family" onClick={() => router.push('/teachers')} gradient="bg-slate-50" />
                <ActionCard icon={icons.calendar} title="Bookings" description="Manage family educational time" onClick={() => router.push('/bookings')} gradient="bg-slate-50" />
              </div>
            </section>
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-lg font-bold text-slate-900">LMS</span>
          </div>
          <div className="flex items-center gap-3">
          <Link
            href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative max-w-6xl mx-auto px-6 py-20 sm:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Built for Sri Lankan Education
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Modern Learning,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Made Simple
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with expert teachers, book live sessions, track your progress, and achieve your learning goals — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-medium text-base hover:bg-blue-700 transition shadow-lg shadow-blue-200"
            >
              Start Learning Free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 border border-slate-300 text-slate-700 rounded-xl font-medium text-base hover:bg-slate-50 transition"
          >
              I already have an account
          </Link>
          </div>
        </div>
      </section>

        {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need to learn</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Our platform brings together the best tools for students, teachers, and parents.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-gradient-to-b from-blue-50 to-white border border-blue-100 rounded-2xl p-7 hover:shadow-lg hover:shadow-blue-50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Live Sessions</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Book 1-on-1 or group sessions with verified teachers via live video calls
            </p>
          </div>
          
            <div className="group bg-gradient-to-b from-purple-50 to-white border border-purple-100 rounded-2xl p-7 hover:shadow-lg hover:shadow-purple-50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Track Progress</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Monitor your learning journey with detailed analytics and progress reports
            </p>
          </div>
          
            <div className="group bg-gradient-to-b from-emerald-50 to-white border border-emerald-100 rounded-2xl p-7 hover:shadow-lg hover:shadow-emerald-50 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Community</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Join students and teachers, with parent oversight for younger learners
            </p>
            </div>
          </div>
        </div>
      </section>

        {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-400">
          &copy; 2026 LMS. All rights reserved.
        </div>
        </footer>
    </div>
  );
}

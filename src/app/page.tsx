import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">LMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-600/20"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative w-full max-w-7xl mx-auto px-6 py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Built for Sri Lankan Education
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.08]">
            Modern Learning,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400">
              Made Simple
            </span>
          </h1>

          {/* Sub-text */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Connect with expert teachers, book live sessions, track your progress,
            and achieve your learning goals — all in one platform.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold text-base transition-all shadow-xl shadow-blue-700/30 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Start Learning Free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 rounded-xl font-semibold text-base transition-all"
            >
              I already have an account
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-20 flex flex-col sm:flex-row gap-8 justify-center items-center">
            {[
              { value: "500+", label: "Active Students" },
              { value: "50+", label: "Verified Teachers" },
              { value: "1,200+", label: "Sessions Completed" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-28 bg-[#0d1224]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Everything you need to learn
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
              Our platform brings together the best tools for students, teachers, and parents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-6 group-hover:bg-blue-500/25 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Sessions</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Book 1-on-1 or group sessions with verified teachers via live video calls.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-b from-violet-500/10 to-transparent border border-violet-500/20 hover:border-violet-500/40 rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center mb-6 group-hover:bg-violet-500/25 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Track Progress</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Monitor your learning journey with detailed analytics and progress reports.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-8 transition-all hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-6 group-hover:bg-emerald-500/25 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Community</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Join students and teachers, with parent oversight for younger learners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-indigo-600/20 border border-white/10 p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to start your journey?</h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Join hundreds of students already learning smarter on our platform.
              </p>
              <Link
                href="/register"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-xl font-semibold text-base transition-all shadow-xl shadow-blue-700/30 hover:-translate-y-0.5"
              >
                Get Started — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-600">
          &copy; 2026 LMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

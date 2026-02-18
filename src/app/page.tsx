import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Logo/Title */}
        <h1 className="text-6xl md:text-8xl font-bold text-black dark:text-white mb-6">
          LMS
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-4">
          Learning Management System
        </p>
        
        <p className="text-lg text-zinc-500 dark:text-zinc-500 mb-12 max-w-2xl mx-auto">
          A modern platform for online learning. Create, share, and discover courses.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-lg font-medium text-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 border-2 border-black dark:border-white text-black dark:text-white rounded-lg font-medium text-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
          >
            Create Account
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Rich Content
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create courses with video, text, and interactive multimedia content
            </p>
          </div>
          
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Track Progress
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Monitor your learning journey with detailed progress tracking
            </p>
          </div>
          
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">
              Learn Together
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Join a community of learners and instructors worldwide
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-sm text-zinc-500">
          © 2026 LMS. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

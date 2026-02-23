'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  TeacherProfile,
  getVerifiedTeachers,
  getTeacherDisplayName,
  parseSubjects,
  parseLanguages,
  formatRating,
} from '@/lib/api/teachers';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getVerifiedTeachers({
        subject: subjectFilter || undefined,
        language: languageFilter || undefined,
      });
      setTeachers(data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load teachers');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, languageFilter]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery) return true;
    const name = getTeacherDisplayName(t).toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      name.includes(query) ||
      (t.specialization || '').toLowerCase().includes(query) ||
      (t.subjects || '').toLowerCase().includes(query)
    );
  });

  return (
    <ProtectedRoute>
      <AppLayout>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Find a Teacher</h1>
          <p className="text-sm text-slate-500 mt-1">Browse verified teachers and book available sessions</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, subject, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
            >
              <option value="">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
              <option value="Sinhala">Sinhala</option>
              <option value="Tamil">Tamil</option>
              <option value="ICT">ICT</option>
              <option value="Commerce">Commerce</option>
              <option value="Accounting">Accounting</option>
            </select>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white"
            >
              <option value="">All Languages</option>
              <option value="English">English</option>
              <option value="Sinhala">Sinhala</option>
              <option value="Tamil">Tamil</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={loadTeachers} className="ml-auto font-medium underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-slate-500">Finding teachers...</p>
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No teachers found</h3>
            <p className="text-sm text-slate-500">
              {searchQuery || subjectFilter || languageFilter
                ? 'Try adjusting your search or filters'
                : 'No verified teachers available yet'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((profile) => {
                const name = getTeacherDisplayName(profile);
                const subjects = parseSubjects(profile.subjects);
                const languages = parseLanguages(profile.teachingLanguages);
                const ratingDisplay = formatRating(profile.rating ? Number(profile.rating) : undefined);
                const initials = `${profile.teacher.firstName[0]}${profile.teacher.lastName[0]}`.toUpperCase();

                return (
                  <Link
                    key={profile.id}
                    href={`/teachers/${profile.teacherId}`}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                        {profile.teacher.profilePicture ? (
                          <img
                            src={profile.teacher.profilePicture}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition truncate">
                          {name}
                        </h3>
                        {profile.specialization && (
                          <p className="text-sm text-slate-500 truncate">{profile.specialization}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-medium">{ratingDisplay}</span>
                        {profile.ratingCount > 0 && (
                          <span className="text-slate-400">({profile.ratingCount})</span>
                        )}
                      </div>
                      {profile.yearsExperience != null && profile.yearsExperience > 0 && (
                        <div className="text-slate-500">
                          {profile.yearsExperience} yr{profile.yearsExperience !== 1 ? 's' : ''} exp
                        </div>
                      )}
                      {profile.totalSessions > 0 && (
                        <div className="text-slate-500">
                          {profile.totalSessions} sessions
                        </div>
                      )}
                    </div>

                    {subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {subjects.slice(0, 4).map((subj) => (
                          <span key={subj} className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                            {subj}
                          </span>
                        ))}
                        {subjects.length > 4 && (
                          <span className="inline-block px-2 py-0.5 text-slate-400 text-xs">
                            +{subjects.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      {profile.hourlyRate != null && Number(profile.hourlyRate) > 0 ? (
                        <span className="text-sm font-semibold text-emerald-700">
                          LKR {Number(profile.hourlyRate).toLocaleString()}/hr
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Rate not set</span>
                      )}
                      {languages.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          {languages.join(', ')}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}

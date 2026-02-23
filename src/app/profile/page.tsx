'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import {
  StudentProfile,
  TeacherProfile,
  ParentProfile,
  UpdateStudentProfileData,
  UpdateTeacherProfileData,
  UpdateParentProfileData,
  getMyStudentProfile,
  getMyTeacherProfile,
  getMyParentProfile,
  updateStudentProfile,
  updateTeacherProfile,
  updateParentProfile,
  GRADES,
  MEDIUMS,
  LEARNING_STYLES,
  TIMEZONES,
  RELATIONSHIPS,
} from '@/lib/api/profile';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Student profile state
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [studentForm, setStudentForm] = useState<UpdateStudentProfileData>({
    grade: '',
    medium: '',
    school: '',
    dateOfBirth: '',
    interests: '',
    learningStyle: '',
    notes: '',
  });

  // Teacher profile state
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [teacherForm, setTeacherForm] = useState<UpdateTeacherProfileData>({
    specialization: '',
    qualifications: '',
    yearsExperience: undefined,
    hourlyRate: undefined,
    teachingLanguages: '',
    subjects: '',
    availabilityTimezone: 'Asia/Colombo',
    autoConfirmBookings: false,
  });

  // Parent profile state
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [parentForm, setParentForm] = useState<UpdateParentProfileData>({
    relationship: '',
    occupation: '',
    emergencyContact: '',
    preferredLanguage: 'English',
    notes: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      if (user.role === 'student') {
        const profile = await getMyStudentProfile();
        setStudentProfile(profile);
        if (profile) {
          setStudentForm({
            grade: profile.grade || '',
            medium: profile.medium || '',
            school: profile.school || '',
            dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
            interests: profile.interests || '',
            learningStyle: profile.learningStyle || '',
            notes: profile.notes || '',
          });
        }
      } else if (user.role === 'instructor') {
        const profile = await getMyTeacherProfile();
        setTeacherProfile(profile);
        if (profile) {
          setTeacherForm({
            specialization: profile.specialization || '',
            qualifications: profile.qualifications || '',
            yearsExperience: profile.yearsExperience,
            hourlyRate: profile.hourlyRate,
            teachingLanguages: profile.teachingLanguages || '',
            subjects: profile.subjects || '',
            availabilityTimezone: profile.availabilityTimezone || 'Asia/Colombo',
            autoConfirmBookings: profile.autoConfirmBookings || false,
          });
        }
      } else if (user.role === 'parent') {
        const profile = await getMyParentProfile();
        setParentProfile(profile);
        if (profile) {
          setParentForm({
            relationship: profile.relationship || '',
            occupation: profile.occupation || '',
            emergencyContact: profile.emergencyContact || '',
            preferredLanguage: profile.preferredLanguage || 'English',
            notes: profile.notes || '',
          });
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      // Don't show error for 404 (profile not found)
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!studentForm.grade || !studentForm.medium) {
      setError('Grade and medium are required');
      return;
    }

    try {
      setSaving(true);
      await updateStudentProfile(studentForm);
      setSuccess('Profile updated successfully!');
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      await updateTeacherProfile(teacherForm);
      setSuccess('Profile updated successfully!');
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);
      await updateParentProfile(parentForm);
      setSuccess('Profile updated successfully!');
      await loadProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = "w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm";

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-3 text-sm text-slate-500">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.role === 'student' && 'Manage your student profile and learning preferences'}
          {user?.role === 'instructor' && 'Manage your teaching profile and settings'}
          {user?.role === 'parent' && 'Manage your parent profile and notification preferences'}
        </p>
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

      {/* Account Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6 max-w-3xl">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500">Full Name</p>
            <p className="text-sm font-medium text-slate-900">{user?.firstName} {user?.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm font-medium text-slate-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Role</p>
            <p className="text-sm font-medium text-slate-900 capitalize">{user?.role}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Member Since</p>
            <p className="text-sm font-medium text-slate-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Student Profile Form */}
      {user?.role === 'student' && (
        <form onSubmit={handleStudentSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Student Profile</h2>
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentForm.grade}
                  onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                  className={inputClasses}
                  required
                >
                  <option value="">Select grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Medium <span className="text-red-500">*</span>
                </label>
                <select
                  value={studentForm.medium}
                  onChange={(e) => setStudentForm({ ...studentForm, medium: e.target.value })}
                  className={inputClasses}
                  required
                >
                  <option value="">Select medium</option>
                  {MEDIUMS.map((medium) => (
                    <option key={medium} value={medium}>{medium}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">School</label>
              <input
                type="text"
                value={studentForm.school}
                onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })}
                placeholder="Your school name"
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={studentForm.dateOfBirth}
                  onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Learning Style</label>
                <select
                  value={studentForm.learningStyle}
                  onChange={(e) => setStudentForm({ ...studentForm, learningStyle: e.target.value })}
                  className={inputClasses}
                >
                  <option value="">Select learning style</option>
                  {LEARNING_STYLES.map((style) => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subjects of Interest</label>
              <input
                type="text"
                value={studentForm.interests}
                onChange={(e) => setStudentForm({ ...studentForm, interests: e.target.value })}
                placeholder="e.g., Mathematics, Science, English"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea
                value={studentForm.notes}
                onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })}
                placeholder="Any additional information about your learning goals..."
                rows={3}
                className={inputClasses}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? 'Saving...' : studentProfile ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Teacher Profile Form */}
      {user?.role === 'instructor' && (
        <form onSubmit={handleTeacherSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900">Teacher Profile</h2>
            {teacherProfile?.verified ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Pending Verification
              </span>
            )}
          </div>

          {teacherProfile && (
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{teacherProfile.totalStudents}</p>
                <p className="text-xs text-slate-500">Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{teacherProfile.totalSessions}</p>
                <p className="text-xs text-slate-500">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {teacherProfile.rating ? Number(teacherProfile.rating).toFixed(1) : 'N/A'}
                </p>
                <p className="text-xs text-slate-500">Rating ({teacherProfile.ratingCount})</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Specialization</label>
              <input
                type="text"
                value={teacherForm.specialization}
                onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                placeholder="e.g., Mathematics, A/L Physics"
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Qualifications</label>
              <textarea
                value={teacherForm.qualifications}
                onChange={(e) => setTeacherForm({ ...teacherForm, qualifications: e.target.value })}
                placeholder="Your educational qualifications and certifications..."
                rows={3}
                className={inputClasses}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
                <input
                  type="number"
                  value={teacherForm.yearsExperience || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, yearsExperience: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="0"
                  min="0"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Hourly Rate (LKR)</label>
                <input
                  type="number"
                  value={teacherForm.hourlyRate || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Teaching Languages</label>
              <input
                type="text"
                value={teacherForm.teachingLanguages}
                onChange={(e) => setTeacherForm({ ...teacherForm, teachingLanguages: e.target.value })}
                placeholder="e.g., English, Sinhala, Tamil"
                className={inputClasses}
              />
              <p className="mt-1 text-xs text-slate-400">Comma-separated list of languages you teach in</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subjects</label>
              <textarea
                value={teacherForm.subjects}
                onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value })}
                placeholder="List of subjects you teach..."
                rows={2}
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
              <select
                value={teacherForm.availabilityTimezone}
                onChange={(e) => setTeacherForm({ ...teacherForm, availabilityTimezone: e.target.value })}
                className={inputClasses}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="autoConfirm"
                checked={teacherForm.autoConfirmBookings}
                onChange={(e) => setTeacherForm({ ...teacherForm, autoConfirmBookings: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <div>
                <label htmlFor="autoConfirm" className="text-sm font-medium text-slate-900 cursor-pointer">
                  Auto-confirm bookings
                </label>
                <p className="text-xs text-slate-500">Automatically approve new booking requests</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? 'Saving...' : teacherProfile ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Parent Profile Form */}
      {user?.role === 'parent' && (
        <form onSubmit={handleParentSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Parent Profile</h2>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Relationship</label>
                <select
                  value={parentForm.relationship}
                  onChange={(e) => setParentForm({ ...parentForm, relationship: e.target.value })}
                  className={inputClasses}
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel.toLowerCase()}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Occupation</label>
                <input
                  type="text"
                  value={parentForm.occupation}
                  onChange={(e) => setParentForm({ ...parentForm, occupation: e.target.value })}
                  placeholder="Your occupation"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Emergency Contact</label>
                <input
                  type="tel"
                  value={parentForm.emergencyContact}
                  onChange={(e) => setParentForm({ ...parentForm, emergencyContact: e.target.value })}
                  placeholder="+94 XX XXX XXXX"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Language</label>
                <select
                  value={parentForm.preferredLanguage}
                  onChange={(e) => setParentForm({ ...parentForm, preferredLanguage: e.target.value })}
                  className={inputClasses}
                >
                  {MEDIUMS.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
              <textarea
                value={parentForm.notes}
                onChange={(e) => setParentForm({ ...parentForm, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
                className={inputClasses}
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? 'Saving...' : parentProfile ? 'Update Profile' : 'Create Profile'}
              </button>
            </div>
          </div>
        </form>
      )}
    </AppLayout>
  );
}


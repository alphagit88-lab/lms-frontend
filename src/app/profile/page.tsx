'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { authAPI } from '@/lib/api/auth';
import PricingSettings from '@/components/instructor/PricingSettings';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
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

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    try {
      setUploadingPicture(true);
      setError('');
      await authAPI.uploadProfilePicture(file);
      await refreshUser();
      setSuccess('Profile picture updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload picture');
    } finally {
      setUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePictureDelete = async () => {
    try {
      setUploadingPicture(true);
      setError('');
      await authAPI.deleteProfilePicture();
      await refreshUser();
      setSuccess('Profile picture removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const profilePicUrl = user?.profilePicture
    ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${API_BASE_URL}${user.profilePicture}`)
    : null;

  const inputClasses = "w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium";

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-500 font-medium text-sm">Loading your profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* ── Profile Header ────────────────────────────── */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Account Profile</h1>
            <p className="text-slate-500 font-medium mt-1">
              Manage your personal details and academic preferences.
            </p>
          </div>

          {success && (
            <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-xl border border-emerald-100 flex items-center gap-3 animate-in fade-in duration-300">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm font-semibold">{success}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 px-6 py-3 rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in duration-300">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start pb-20">

        {/* LEFT COLUMN: ACCOUNT OVERVIEW */}
        <div className="xl:col-span-4 space-y-8">

          {/* Profile Picture Card */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                />
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-lg relative group/img cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {profilePicUrl ? (
                    <img src={profilePicUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-semibold">
                      {user?.firstName?.[0]}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                  </div>
                </div>
                {profilePicUrl && (
                  <button onClick={handlePictureDelete} className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 text-white shadow-md rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <h2 className="text-2xl font-semibold text-slate-900 leading-tight mb-1">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-slate-500 font-medium text-sm mb-6">{user?.email}</p>

              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Role</p>
                  <p className="text-xs font-semibold text-blue-600 capitalize">{user?.role}</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-semibold text-emerald-600">Active</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Card (For Instructors) */}
          {user?.role === 'instructor' && teacherProfile && (
            <div className="bg-slate-900 rounded-[32px] p-8 text-white">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">Teaching Overview</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-semibold mb-1">{teacherProfile.totalStudents}</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Students</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold mb-1">{teacherProfile.totalSessions}</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Sessions</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold mb-1">{teacherProfile.rating ? Number(teacherProfile.rating).toFixed(1) : '—'}</p>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Rating</p>
                </div>
              </div>
            </div>
          )}

          {/* Account Integrity */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">Verification</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <svg className={`w-5 h-5 ${user?.emailVerified ? 'text-emerald-500' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-semibold text-slate-700">Email Status</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${user?.emailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {user?.emailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Joined</p>
                  <p className="text-xs font-semibold text-slate-700">{user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Last Login</p>
                  <p className="text-xs font-semibold text-slate-700">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROFESSIONAL DETAILS FORM */}
        <div className="xl:col-span-8">

          <div className="bg-white rounded-[32px] p-8 sm:p-12 border border-slate-200">

            {/* STUDENT FORM */}
            {user?.role === 'student' && (
              <form onSubmit={handleStudentSubmit} className="space-y-10">
                <header className="border-b border-slate-100 pb-6">
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Academic Profile</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Configure your learning preferences and data.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Grade Level</label>
                    <select value={studentForm.grade} onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })} className={inputClasses}>
                      <option value="">Select current grade</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Medium of Study</label>
                    <select value={studentForm.medium} onChange={(e) => setStudentForm({ ...studentForm, medium: e.target.value })} className={inputClasses}>
                      <option value="">Select medium</option>
                      {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">School Name</label>
                  <input type="text" value={studentForm.school} onChange={(e) => setStudentForm({ ...studentForm, school: e.target.value })} placeholder="School Name" className={inputClasses} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Date of Birth</label>
                    <input type="date" value={studentForm.dateOfBirth} onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })} className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Learning Style</label>
                    <select value={studentForm.learningStyle} onChange={(e) => setStudentForm({ ...studentForm, learningStyle: e.target.value })} className={inputClasses}>
                      <option value="">Select style</option>
                      {LEARNING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Subjects of Interest</label>
                  <input type="text" value={studentForm.interests} onChange={(e) => setStudentForm({ ...studentForm, interests: e.target.value })} placeholder="Mathematics, Physics, Art..." className={inputClasses} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Notes</label>
                  <textarea value={studentForm.notes} onChange={(e) => setStudentForm({ ...studentForm, notes: e.target.value })} placeholder="Tell us about yourself..." rows={4} className={inputClasses} />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={saving} className="px-8 py-4 bg-blue-600 text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:bg-slate-300">
                    {saving ? 'Saving...' : 'Update Records'}
                  </button>
                </div>
              </form>
            )}

            {/* TEACHER FORM */}
            {user?.role === 'instructor' && (
              <form onSubmit={handleTeacherSubmit} className="space-y-10">
                <header className="border-b border-slate-100 pb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Teacher Credentials</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Manage your professional information.</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${teacherProfile?.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {teacherProfile?.verified ? 'Verified' : 'Verification Pending'}
                  </span>
                </header>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Specialization</label>
                    <input type="text" value={teacherForm.specialization} onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })} placeholder="Principal Physics Instructor" className={inputClasses} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Qualifications</label>
                    <textarea value={teacherForm.qualifications} onChange={(e) => setTeacherForm({ ...teacherForm, qualifications: e.target.value })} placeholder="Describe your academic background..." rows={3} className={inputClasses} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Years of Experience</label>
                      <input type="number" value={teacherForm.yearsExperience || ''} onChange={(e) => setTeacherForm({ ...teacherForm, yearsExperience: e.target.value ? parseInt(e.target.value) : undefined })} className={inputClasses} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Hourly Rate (LKR)</label>
                      <input type="number" value={teacherForm.hourlyRate || ''} onChange={(e) => setTeacherForm({ ...teacherForm, hourlyRate: e.target.value ? parseFloat(e.target.value) : undefined })} className={inputClasses} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Teaching Languages</label>
                    <input type="text" value={teacherForm.teachingLanguages} onChange={(e) => setTeacherForm({ ...teacherForm, teachingLanguages: e.target.value })} placeholder="English, Sinhala..." className={inputClasses} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Timezone</label>
                    <select value={teacherForm.availabilityTimezone} onChange={(e) => setTeacherForm({ ...teacherForm, availabilityTimezone: e.target.value })} className={inputClasses}>
                      {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">Auto-confirm Bookings</p>
                      <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Automatically approve new lesson requests</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTeacherForm({ ...teacherForm, autoConfirmBookings: !teacherForm.autoConfirmBookings })}
                      className={`w-12 h-6 rounded-full relative transition-colors ${teacherForm.autoConfirmBookings ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${teacherForm.autoConfirmBookings ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={saving} className="px-10 py-4 bg-blue-600 text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:bg-slate-300">
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* MONETIZATION SETTINGS — instructor only */}
            {user?.role === 'instructor' && (
              <div className="space-y-6">
                <header className="border-b border-slate-100 pb-6">
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Monetization Settings</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Set your pricing configuration for live teaching sessions.</p>
                </header>
                <PricingSettings />
              </div>
            )}

            {/* PARENT FORM */}
            {user?.role === 'parent' && (
              <form onSubmit={handleParentSubmit} className="space-y-10">
                <header className="border-b border-slate-100 pb-6">
                  <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Parental Settings</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Manage family contact information.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Relationship</label>
                    <select value={parentForm.relationship} onChange={(e) => setParentForm({ ...parentForm, relationship: e.target.value })} className={inputClasses}>
                      <option value="">Select identity</option>
                      {RELATIONSHIPS.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Occupation</label>
                    <input type="text" value={parentForm.occupation} onChange={(e) => setParentForm({ ...parentForm, occupation: e.target.value })} placeholder="Occupation" className={inputClasses} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Emergency Contact</label>
                    <input type="tel" value={parentForm.emergencyContact} onChange={(e) => setParentForm({ ...parentForm, emergencyContact: e.target.value })} placeholder="+94 XXX XXX XXXX" className={inputClasses} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Preferred Language</label>
                    <select value={parentForm.preferredLanguage} onChange={(e) => setParentForm({ ...parentForm, preferredLanguage: e.target.value })} className={inputClasses}>
                      {MEDIUMS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Additional Notes</label>
                  <textarea value={parentForm.notes} onChange={(e) => setParentForm({ ...parentForm, notes: e.target.value })} placeholder="Additional instructions..." rows={4} className={inputClasses} />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={saving} className="px-10 py-4 bg-blue-600 text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:bg-slate-300">
                    {saving ? 'Saving...' : 'Update Information'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}

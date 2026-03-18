'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { authAPI } from '@/lib/api/auth';
import { updateTeacherProfile, TIMEZONES, TEACHING_LANGUAGES } from '@/lib/api/profile';
import {
    CheckCircle, ChevronRight, ChevronLeft, User, GraduationCap,
    Settings, DollarSign, Camera, Sparkles, Loader2, BookOpen,
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────

const SUBJECTS = [
    'Mathematics', 'Combined Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'Sinhala', 'Tamil', 'History', 'Geography',
    'ICT', 'Commerce', 'Accounting', 'Economics',
    'Art', 'Music', 'Drama', 'Physical Education', 'Science',
];

const RATE_PRESETS = ['1000', '1500', '2000', '2500', '3000', '5000'];

const TOTAL_STEPS = 5;

const STEP_META = [
    { label: 'About You', icon: User },
    { label: 'Background', icon: GraduationCap },
    { label: 'Teaching', icon: Settings },
    { label: 'Pricing', icon: DollarSign },
    { label: 'Photo', icon: Camera },
];

// ─── Types ──────────────────────────────────────────────────────────────────

interface WizardData {
    bio: string;
    specialization: string;
    qualifications: string;
    yearsExperience: string;
    subjects: string[];
    teachingLanguages: string[];
    availabilityTimezone: string;
    autoConfirmBookings: boolean;
    hourlyRate: string;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function TeacherOnboardingPage() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState(0); // 0 = welcome screen
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string>('');
    const [done, setDone] = useState(false);

    const [data, setData] = useState<WizardData>({
        bio: user?.bio || '',
        specialization: '',
        qualifications: '',
        yearsExperience: '',
        subjects: [],
        teachingLanguages: ['English'],
        availabilityTimezone: 'Asia/Colombo',
        autoConfirmBookings: false,
        hourlyRate: '',
    });

    // ─── Helpers ──────────────────────────────────────────────────────────────

    const update = (field: keyof WizardData, value: WizardData[keyof WizardData]) =>
        setData(prev => ({ ...prev, [field]: value }));

    const toggleArrayItem = (field: 'subjects' | 'teachingLanguages', item: string) => {
        setData(prev => {
            const arr = prev[field] as string[];
            return {
                ...prev,
                [field]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item],
            };
        });
    };

    const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfilePicFile(file);
        setProfilePicPreview(URL.createObjectURL(file));
    };

    // ─── Submit ───────────────────────────────────────────────────────────────

    const handleFinish = async () => {
        setSaving(true);
        setError('');
        try {
            // 1. Update user bio if provided
            if (data.bio.trim()) {
                await authAPI.updateProfile({ bio: data.bio.trim() });
            }

            // 2. Upsert teacher profile
            await updateTeacherProfile({
                specialization: data.specialization.trim() || undefined,
                qualifications: data.qualifications.trim() || undefined,
                yearsExperience: data.yearsExperience ? parseInt(data.yearsExperience) : undefined,
                subjects: data.subjects.length > 0 ? data.subjects.join(', ') : undefined,
                teachingLanguages: data.teachingLanguages.length > 0 ? data.teachingLanguages.join(', ') : undefined,
                availabilityTimezone: data.availabilityTimezone,
                autoConfirmBookings: data.autoConfirmBookings,
                hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate) : undefined,
            });

            // 3. Upload profile picture if chosen
            if (profilePicFile) {
                await authAPI.uploadProfilePicture(profilePicFile);
            }

            await refreshUser();
            setDone(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = () => {
        setError('');
        if (step === TOTAL_STEPS) {
            handleFinish();
        } else {
            setStep(s => s + 1);
        }
    };

    const progress = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

    // ─── Done screen ──────────────────────────────────────────────────────────

    if (done) {
        return (
            <ProtectedRoute allowedRoles={['instructor']}>
                <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete!</h2>
                        <p className="text-gray-500 mb-8">
                            Your teacher profile is set up. You&apos;re ready to create courses, manage sessions, and start teaching.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/instructor/courses/create"
                                className="block w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-center"
                            >
                                Create Your First Course
                            </Link>
                            <Link
                                href="/instructor/dashboard"
                                className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center"
                            >
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // ─── Welcome screen ───────────────────────────────────────────────────────

    if (step === 0) {
        return (
            <ProtectedRoute allowedRoles={['instructor']}>
                <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-10 h-10 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">
                            Welcome, {user?.firstName}! 👋
                        </h1>
                        <p className="text-gray-500 mb-2">
                            Let&apos;s set up your teacher profile in <strong>5 quick steps</strong>.
                        </p>
                        <p className="text-sm text-gray-400 mb-8">
                            A complete profile helps students find you and builds trust before their first booking.
                        </p>
                        <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                            {[
                                { icon: User, label: 'Bio & Details' },
                                { icon: BookOpen, label: 'Subjects' },
                                { icon: DollarSign, label: 'Pricing' },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-xl">
                                    <Icon className="w-5 h-5 text-blue-600" />
                                    <span className="text-gray-600 font-medium text-xs">{label}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Get Started <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push('/instructor/dashboard')}
                            className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    // ─── Steps 1–5 ───────────────────────────────────────────────────────────

    return (
        <ProtectedRoute allowedRoles={['instructor']}>
            <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center justify-center p-4">

                {/* ── Progress header ── */}
                <div className="w-full max-w-xl mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-600">Step {step} of {TOTAL_STEPS}</span>
                        <span className="text-sm text-gray-400">{STEP_META[step - 1]?.label}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {/* Step dots */}
                    <div className="flex justify-between mt-3">
                        {STEP_META.map((meta, i) => {
                            const StepIcon = meta.icon;
                            const isCompleted = i + 1 < step;
                            const isActive = i + 1 === step;
                            return (
                                <div key={i} className="flex flex-col items-center gap-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        isCompleted
                                            ? 'bg-blue-600 text-white'
                                            : isActive
                                            ? 'bg-white border-2 border-blue-600 text-blue-600'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {isCompleted
                                            ? <CheckCircle className="w-4 h-4" />
                                            : <StepIcon className="w-4 h-4" />
                                        }
                                    </div>
                                    <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {meta.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Card ── */}
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl">

                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* ── Step 1: About You ── */}
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Tell students about yourself</h2>
                            <p className="text-sm text-gray-400 mb-6">A short bio helps students connect with you before booking.</p>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Bio <span className="font-normal text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    rows={6}
                                    maxLength={500}
                                    placeholder="Hi! I'm a passionate educator with experience in..."
                                    value={data.bio}
                                    onChange={e => update('bio', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{data.bio.length}/500</p>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Professional Background ── */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Professional Background</h2>
                            <p className="text-sm text-gray-400 mb-6">Share your expertise and credentials.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specialization</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Mathematics, A/L Physics"
                                        value={data.specialization}
                                        onChange={e => update('specialization', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Qualifications</label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. BSc Mathematics (University of Colombo), 10+ years teaching experience..."
                                        value={data.qualifications}
                                        onChange={e => update('qualifications', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years of Experience</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        placeholder="e.g. 5"
                                        value={data.yearsExperience}
                                        onChange={e => update('yearsExperience', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subjects I Teach</label>
                                    <div className="flex flex-wrap gap-2">
                                        {SUBJECTS.map(subject => (
                                            <button
                                                key={subject}
                                                type="button"
                                                onClick={() => toggleArrayItem('subjects', subject)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                    data.subjects.includes(subject)
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                                                }`}
                                            >
                                                {subject}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Teaching Preferences ── */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Teaching Preferences</h2>
                            <p className="text-sm text-gray-400 mb-6">Configure your teaching languages and booking settings.</p>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teaching Languages</label>
                                    <div className="flex flex-wrap gap-3">
                                        {TEACHING_LANGUAGES.map(lang => (
                                            <button
                                                key={lang}
                                                type="button"
                                                onClick={() => toggleArrayItem('teachingLanguages', lang)}
                                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                                                    data.teachingLanguages.includes(lang)
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                                                }`}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Timezone</label>
                                    <select
                                        value={data.availabilityTimezone}
                                        onChange={e => update('availabilityTimezone', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                    >
                                        {TIMEZONES.map(tz => (
                                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Auto-confirm bookings</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Automatically approve booking requests without manual review
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => update('autoConfirmBookings', !data.autoConfirmBookings)}
                                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                                            data.autoConfirmBookings ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
                                            data.autoConfirmBookings ? 'left-6' : 'left-0.5'
                                        }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 4: Pricing ── */}
                    {step === 4 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Set Your Hourly Rate</h2>
                            <p className="text-sm text-gray-400 mb-6">You can change this at any time from your profile settings.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Hourly Rate (LKR) <span className="font-normal text-gray-400">(optional)</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 pointer-events-none">Rs.</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="100"
                                            placeholder="e.g. 2500"
                                            value={data.hourlyRate}
                                            onChange={e => update('hourlyRate', e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Common rates:</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {RATE_PRESETS.map(rate => (
                                            <button
                                                key={rate}
                                                type="button"
                                                onClick={() => update('hourlyRate', rate)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                                    data.hourlyRate === rate
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                                                }`}
                                            >
                                                Rs. {parseInt(rate).toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
                                    💡 A 10% platform commission applies. You receive 90% of each booking payment.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Step 5: Profile Picture ── */}
                    {step === 5 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Add a Profile Photo</h2>
                            <p className="text-sm text-gray-400 mb-6">
                                Help students recognise you. You can skip this and add it later from your profile settings.
                            </p>
                            <div className="flex flex-col items-center gap-5">
                                <div className="w-32 h-32 rounded-full border-4 border-blue-100 overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {profilePicPreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={profilePicPreview} alt="Profile preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-300" />
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handlePicChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
                                >
                                    {profilePicPreview ? 'Change Photo' : 'Choose Photo'}
                                </button>
                                <p className="text-xs text-gray-400">JPG, PNG or WebP — max 5MB</p>
                            </div>
                        </div>
                    )}

                    {/* ── Navigation ── */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => { setError(''); setStep(s => Math.max(0, s - 1)); }}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : step === TOTAL_STEPS ? (
                                <><CheckCircle className="w-4 h-4" /> Complete Setup</>
                            ) : (
                                <>Next <ChevronRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </div>

                {/* Save & exit link */}
                <button
                    onClick={() => router.push('/instructor/dashboard')}
                    className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                    Save &amp; complete later
                </button>
            </div>
        </ProtectedRoute>
    );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/components/layout/NotificationBell';
import { useCart } from '@/contexts/CartContext';
import PackageBookingModal from '@/components/booking/PackageBookingModal';
import { CreatePackageBookingResponse } from '@/lib/api/bookings';

const API_BASE_URL = typeof window !== "undefined" ? "/proxied-backend" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Browse Courses',
    href: '/courses',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: 'My Learning',
    href: '/student/my-courses',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    roles: ['student'],
  },
  {
    label: 'Recordings',
    href: '/recordings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    roles: ['student', 'admin', 'parent'],
  },
  {
    label: 'My Exams',
    href: '/exams',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    roles: ['student'],
  },
  {
    label: 'My Progress',
    href: '/student/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['student'],
  },
  {
    label: 'Bookings',
    href: '/bookings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['student', 'parent'],
  },
  {
    label: 'My Children',
    href: '/parent',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    roles: ['parent'],
  },
  {
    label: 'My Courses',
    href: '/instructor/courses',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    roles: ['instructor'],
  },
  {
    label: 'My Availability',
    href: '/instructor/availability',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['instructor'],
  },
  {
    label: 'Exams',
    href: '/instructor/exams',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    roles: ['instructor'],
  },
  {
    label: 'Recordings',
    href: '/instructor/recordings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['instructor'],
  },

  {
    label: 'Transactions',
    href: '/instructor/transactions',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    roles: ['instructor'],
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['admin'],
  },
  {
    label: 'Billing',
    href: '/payments',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    roles: ['student', 'instructor', 'parent'],
  },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpenAt, setMobileMenuOpenAt] = useState<string | null>(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const { cartItems, removeFromCart, clearCart } = useCart();
  const isMobileMenuOpen = mobileMenuOpenAt === pathname;

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  }).map(item => {
    if (user?.role === 'admin') {
      if (item.label === 'Dashboard') return { ...item, href: '/admin' };
      if (item.label === 'Browse Courses') return { ...item, href: '/admin/courses' };
    }
    return item;
  });

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isAdmin = user?.role === 'admin';

  const profilePicUrl = user?.profilePicture
    ? user.profilePicture.startsWith('http')
      ? user.profilePicture
      : `${API_BASE_URL}${user.profilePicture}`
    : null;

  const handlePackageSuccess = (response: CreatePackageBookingResponse) => {
    setShowCartModal(false);
    clearCart();
    // Redirect to checkout if paid
    if (response.package.finalPrice && Number(response.package.finalPrice) > 0) {
      const recipientId = response.package.teacherId || response.bookings[0]?.teacherId;
      router.push(`/payments/checkout?type=booking_package&referenceId=${response.package.id}&amount=${response.package.finalPrice}&recipientId=${recipientId}`);
    } else {
      router.push('/bookings');
    }
  };

  const handleRemoveSlot = (slotId: string) => {
    removeFromCart(slotId);
  };


  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex">
        <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 sticky top-0 h-screen shadow-2xl shadow-slate-200/50">
          <div className="p-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-linear-to-br from-slate-800 to-black rounded-xl flex items-center justify-center shadow-xl group-hover:scale-105 transition-all">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-semibold text-slate-900 tracking-tight">Admin<span className="text-slate-400">Hub</span></span>
            </Link>
          </div>

          <nav className="flex-1 px-6 space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-4 mt-4">System Management</div>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/admin' && pathname === '/admin');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-medium transition-all group ${isActive
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                    }`}
                >
                  <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 transition-colors'}`}>
                    {item.icon}
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <Link
              href="/profile"
              className="flex items-center justify-center p-3 rounded-2xl hover:bg-white transition shadow-sm hover:shadow-md group mb-3"
            >
              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border-2 border-white group-hover:border-blue-100 transition overflow-hidden shadow-inner relative">
                {profilePicUrl ? (
                  <Image src={profilePicUrl} alt="Profile" fill className="object-cover" />
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition border border-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout Admin
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button onClick={() => setMobileMenuOpenAt(pathname)} className="p-2.5 bg-slate-100 rounded-xl text-slate-700 hover:bg-slate-200 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 sm:p-10 lg:p-14 bg-[#f8fafc]/50">
            <div className="max-w-425 mx-auto transition-all duration-500">{children}</div>
          </main>
        </div>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpenAt(null)} />
            <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
              {/* ... existing mobile menu content, optimized for better padding/spacing ... */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xl font-bold">Admin Console</span>
                <button onClick={() => setMobileMenuOpenAt(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">&times;</button>
              </div>
              <nav className="flex-1 p-6 space-y-2">
                {filteredNavItems.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpenAt(null)} className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium ${pathname === item.href ? 'bg-slate-900 text-white' : 'text-slate-500'}`}>
                    {item.icon} {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-indigo-50/30 rounded-full blur-[100px]" />
      </div>

      <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)]">
        <div className="max-w-480 mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex justify-between h-20 sm:h-24">
            <div className="flex items-center gap-12">
              <Link href="/" className="shrink-0 flex items-center gap-3.5 group">
                <div className="w-12 h-12 bg-linear-to-tr from-blue-600 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] group-hover:shadow-[0_12px_25px_-4px_rgba(37,99,235,0.5)] group-hover:-translate-y-0.5 transition-all duration-300">
                  <span className="text-white font-bold text-xl tracking-tighter italic">L</span>
                </div>
                <div>
                  <span className="text-2xl font-semibold text-slate-900 tracking-tight block leading-none">LMS<span className="text-blue-600 leading-none">.</span></span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1 block">Learn Better</span>
                </div>
              </Link>

              <nav className="hidden md:flex items-center p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                {filteredNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-5 py-2.5 rounded-[14px] text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 ${isActive
                        ? 'bg-white text-blue-600 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)] scale-100'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                        }`}
                    >
                      <div className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600 transition-colors opacity-80'}`}>
                        {item.icon}
                      </div>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-semibold uppercase tracking-widest text-slate-500 hover:text-red-500 hover:bg-red-50/50 transition-all border border-slate-100 hover:border-red-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>

              <div className="h-10 w-px bg-slate-200/60 hidden sm:block" />

              {/* Cart Indicator */}
              {user?.role === 'student' && cartItems.length > 0 && (
                <button 
                  onClick={() => setShowCartModal(true)}
                  className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-blue-600 text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] hover:bg-blue-700 hover:shadow-[0_12px_25px_-4px_rgba(37,99,235,0.5)] transition-all group/cart group"
                  title={`${cartItems.length} sessions selected in package - Click to finalize`}
                >
                  <div className="relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-blue-600 text-[9px] font-bold rounded-full flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                      {cartItems.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider hidden lg:block">Review & Book</span>
                  
                  {/* Tooltip detail */}
                  <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 opacity-0 invisible group-hover/cart:opacity-100 group-hover/cart:visible transition-all z-50 transform translate-y-2 group-hover/cart:translate-y-0 text-left">
                    <p className="text-[11px] font-bold text-slate-900 mb-2">Package Summary ({cartItems.length} sessions)</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                      {cartItems.slice(0, 3).map(item => (
                        <div key={item.id} className="text-[10px] text-slate-500 border-l-2 border-blue-200 pl-2">
                           <div className="font-semibold text-slate-700 truncate">{item.teacherName || 'Instructor'}</div>
                           <div className="opacity-70">{new Date(item.startTime).toLocaleDateString()}</div>
                        </div>
                      ))}
                      {cartItems.length > 3 && <div className="text-[10px] text-slate-400 italic mt-1 font-medium">+{cartItems.length - 3} more sessions...</div>}
                    </div>
                    <div className="pt-2 border-t border-slate-50 text-[10px] text-blue-600 font-bold flex items-center gap-1.5 animate-pulse">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Click to finish booking package
                    </div>
                  </div>
                </button>
              )}

              <NotificationBell />

              <Link
                href="/profile"
                className="flex items-center justify-center p-2 rounded-[20px] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-[14px] bg-white flex items-center justify-center text-slate-500 border border-slate-100 overflow-hidden shadow-sm group relative">
                  {profilePicUrl ? (
                    <Image src={profilePicUrl} alt="Profile" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="bg-linear-to-br from-slate-50 to-slate-100 w-full h-full flex items-center justify-center">
                      <span className="font-bold text-slate-400 group-hover:scale-110 transition-transform">{user?.firstName?.[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full ring-2 ring-emerald-500/20" />
                </div>
              </Link>

              <button onClick={() => setMobileMenuOpenAt(pathname)} className="md:hidden p-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-60 p-4 flex flex-col animate-in fade-in duration-300">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setMobileMenuOpenAt(null)} />
            <div className="relative bg-white rounded-3xl w-full flex-1 flex flex-col p-8 overflow-y-auto animate-in slide-in-from-bottom-10 shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <span className="text-2xl font-semibold">Menu<span className="text-blue-600">.</span></span>
                <button onClick={() => setMobileMenuOpenAt(null)} className="p-3 bg-slate-100 rounded-2xl">&times;</button>
              </div>
              {/* Mobile links... */}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col relative w-full overflow-x-hidden">
        <div className="flex-1 max-w-480 mx-auto w-full px-6 sm:px-10 lg:px-16 py-10 sm:py-14 lg:py-20 transition-all duration-700 ease-in-out">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-100 py-16 sm:py-24 relative">
        <div className="max-w-480 mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-11 h-11 bg-slate-900 rounded-[14px] flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-lg">
                <span className="text-white font-bold text-sm italic">L</span>
              </div>
              <div>
                <span className="text-lg font-semibold text-slate-900 block leading-none mb-1">Global Education<span className="text-blue-600">.</span></span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest block opacity-70">Empowering Minds Everywhere</span>
              </div>
            </Link>
            <div className="flex flex-wrap justify-center gap-10 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">Safety</Link>
              <Link href="/terms" className="hover:text-blue-600 transition-colors">Guidelines</Link>
              <Link href="/support" className="hover:text-blue-600 transition-colors">Help Center</Link>
              <Link href="/blog" className="hover:text-blue-600 transition-colors">Stories</Link>
            </div>
            <p className="text-[11px] font-medium text-slate-300">&copy; 2026. Built with Excellence.</p>
          </div>
        </div>
      </footer>

      {user?.role === 'student' && cartItems.length > 0 && (
        <PackageBookingModal
          isOpen={showCartModal}
          slots={cartItems}
          teacherName={(() => {
            const uniqueTeachers = Array.from(new Set(cartItems.map(i => i.teacherName || 'Instructor')));
            return uniqueTeachers.length === 1 ? uniqueTeachers[0] : 'Multiple Instructors';
          })()}
          onClose={() => setShowCartModal(false)}
          onSuccess={handlePackageSuccess}
          onRemoveSlot={handleRemoveSlot}
          // Use 5%/10% defaults for multi-instructor
          packageDiscount3Plus={5}
          packageDiscount5Plus={10}
        />
      )}
    </div>
  );
}

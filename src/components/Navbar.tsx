'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';
import { Shield, MapPin, Building2, Key, PlusCircle, Activity, UserCheck, ChevronDown, LogIn, UserPlus, Users, LogOut } from 'lucide-react';

interface NavbarProps {
  criticalCount?: number;
}

export default function Navbar({ criticalCount = 2 }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth');
      if (!res.ok) {
        setActiveUser(null);
        return;
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      if (data && data.success && data.user) {
        setActiveUser(data.user);
      } else {
        setActiveUser(null);
      }
    } catch (err) {
      console.warn('Session fetch failed:', err);
      setActiveUser(null);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGOUT' })
      });
      setActiveUser(null);
      setUserMenuOpen(false);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navItems = [
    { label: 'Lalitpur Feed', href: '/', icon: MapPin },
    { label: 'Raise Issue', href: '/raise-issue', icon: PlusCircle },
    { label: 'Municipality Admin', href: '/admin', icon: Building2 },
    { label: 'NGO API Portal', href: '/ngo-portal', icon: Key },
  ];

  if (activeUser?.role === 'municipality_admin') {
    navItems.push({ label: 'Officer Users', href: '/admin/users', icon: Users });
  }

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 p-0.5 shadow-lg shadow-sky-950/40 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-sky-400 group-hover:text-sky-300 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white font-sans">CivicPulse</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Lalitpur City
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden sm:block">Municipal Hygiene Intelligence</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Session & Auth Buttons */}
        <div className="flex items-center gap-3">
          
          {activeUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 hover:border-sky-500 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span className="max-w-[120px] truncate hidden sm:inline">{activeUser.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300">
                  {activeUser.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl border border-slate-700 p-2 shadow-2xl z-50 space-y-1 animate-in fade-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 text-xs">
                    <p className="font-bold text-white truncate">{activeUser.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{activeUser.email}</p>
                  </div>

                  {activeUser.role === 'municipality_admin' && (
                    <Link
                      href="/admin/users"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full p-2 rounded-xl text-xs font-semibold hover:bg-slate-800 text-slate-200"
                    >
                      <Users className="w-4 h-4 text-sky-400" />
                      <span>Manage Admin Users</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full p-2 rounded-xl text-xs font-semibold hover:bg-rose-950/60 text-rose-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}

          <Link
            href="/raise-issue"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-semibold hover:from-sky-500 hover:to-blue-500 shadow-md shadow-sky-950/40 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Raise Issue</span>
          </Link>
        </div>

      </div>
    </header>
  );
}

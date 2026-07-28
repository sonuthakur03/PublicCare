'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';
import { Shield, MapPin, Building2, Key, PlusCircle, Activity, UserCheck, ChevronDown, LogIn, UserPlus, Users, LogOut, Radio } from 'lucide-react';
import LocationAccessBadge from '@/components/LocationAccessBadge';

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

  const getNavItems = () => {
    if (!activeUser) return [];

    const baseItems = [{ label: 'Community Feed', href: '/', icon: MapPin }];
    
    if (activeUser.role === 'user') {
      return [...baseItems, { label: 'Report Issue', href: '/raise-issue', icon: PlusCircle }];
    }
    
    if (activeUser.role === 'municipality_admin') {
      return [
        ...baseItems,
        { label: 'Report Issue', href: '/raise-issue', icon: PlusCircle },
        { label: 'Dispatch Console', href: '/admin', icon: Building2 },
        { label: 'Manage Officers', href: '/admin/users', icon: Users }
      ];
    }
    
    if (activeUser.role === 'ngo') {
      return [
        ...baseItems,
        { label: 'Data Portal', href: '/ngo-portal', icon: Key }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] border-b border-[#D6CFC0] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative w-12 h-12 rounded-[12px] bg-[var(--primary)] p-0.5 group-hover:scale-105 transition-transform duration-200" style={{boxShadow: 'var(--shadow-level-1)'}}>
            <div className="w-full h-full bg-[#FFFFFF] rounded-[10px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-[var(--primary)] group-hover:text-[var(--primary-container)] transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-[24px] tracking-tight text-[#211D17]">CivicPulse</span>
              <span className="text-[11px] font-semibold tracking-wider px-2.5 py-0.5 rounded-[6px] bg-[#14837A] text-[#FFFFFF] border border-[#0F6E64] uppercase">
                Lalitpur
              </span>
            </div>
            <p className="text-[13px] text-[#59524A] hidden sm:block">Municipal Hygiene Intelligence</p>
          </div>
        </Link>

        {/* Navigation Links */}
        {activeUser && navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-[14px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#0F6E64] text-[#FFFFFF]'
                      : 'text-[#59524A] hover:text-[#211D17] hover:bg-[#F5F1E9]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFFFFF]' : 'text-[#59524A]'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Session & Auth Buttons */}
        <div className="flex items-center gap-3">
          
          <div className="hidden lg:block">
            <LocationAccessBadge compact />
          </div>

          {activeUser ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-[6px] bg-[#FFFFFF] border border-[#7A7266] text-[14px] font-medium text-[#211D17] hover:border-[#0F6E64] transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#0F6E64]" />
                  <span className="max-w-[120px] truncate hidden sm:inline">{activeUser.name}</span>
                  <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-semibold tracking-wider uppercase bg-[#14837A] text-[#FFFFFF]">
                    {activeUser.role.replace('_', ' ')}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#59524A]" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] rounded-[12px] border border-[#D6CFC0] p-3 z-50 space-y-2 animate-in fade-in duration-150" style={{boxShadow: 'var(--shadow-level-2)'}}>
                    <div className="px-3 py-2 border-b border-[#D6CFC0] pb-3 mb-2">
                      <p className="font-bold text-[14px] text-[#211D17] truncate">{activeUser.name}</p>
                      <p className="text-[12px] text-[#59524A] truncate">{activeUser.email}</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full p-2.5 rounded-[6px] text-[14px] font-medium hover:bg-[#FBE3E0] text-[#B3261E] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
              
              <Link
                href="/raise-issue"
                className="flex items-center gap-2 px-6 py-2.5 rounded-[6px] bg-[#0F6E64] text-[#FFFFFF] text-[14px] font-semibold hover:bg-[#14837A] active:scale-[0.98] transition-all"
                style={{boxShadow: 'var(--shadow-level-1)'}}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Report Issue</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-[6px] border border-[#0F6E64] text-[#0F6E64] text-[14px] font-semibold hover:bg-[#0F6E64] hover:text-[#FFFFFF] transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#0F6E64] hover:bg-[#14837A] text-[#FFFFFF] text-[14px] font-semibold transition-colors"
                style={{boxShadow: 'var(--shadow-level-1)'}}
              >
                <UserPlus className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}


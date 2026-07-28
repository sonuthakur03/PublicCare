'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';
import { Shield, MapPin, Building2, Key, PlusCircle, Activity, UserCheck, ChevronDown, LogIn, UserPlus, Users, LogOut, Radio, Store, Megaphone, FileText } from 'lucide-react';
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

    if (activeUser.role === 'vendor') {
      return [
        ...baseItems,
        { label: 'Vendor Dashboard', href: '/vendor', icon: Store },
        { label: 'My Ads', href: '/vendor/ads', icon: Megaphone },
        { label: 'Tenders', href: '/vendor/tenders', icon: FileText },
      ];
    }

    if (activeUser.role === 'superadmin') {
      return [
        ...baseItems,
        { label: 'Super Console', href: '/superadmin', icon: Shield },
        { label: 'Dispatch Console', href: '/admin', icon: Building2 },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F4]/90 backdrop-blur-md border-b border-[#D6CFC0]/70 px-8 py-5 shadow-sm transition-all duration-300">
      <div className="max-w-[85rem] mx-auto flex items-center justify-between gap-8">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F6E64] to-[#14837A] p-0.5 group-hover:scale-105 transition-all duration-300 shadow-sm shadow-[#0F6E64]/20">
            <div className="w-full h-full bg-[#FFFFFF] rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#0F6E64] group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[20px] tracking-tight text-[#211D17]">PublicCare</span>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#E1F0EA] text-[#0F6E64] border border-[#BFE3D5] uppercase">
              Lalitpur
            </span>
          </div>
        </Link>

        {/* Navigation Links - Smaller */}
        {activeUser && navItems.length > 0 && (
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-[#0F6E64] text-[#FFFFFF] shadow-sm shadow-[#0F6E64]/20'
                      : 'text-[#59524A] hover:text-[#211D17] hover:bg-[#EFE9DC]/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#FFFFFF]' : 'text-[#7A7266]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* User Session & Auth Buttons */}
        <div className="flex items-center gap-4">
          
          <div className="hidden xl:block">
            <LocationAccessBadge compact />
          </div>

          {activeUser ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E1F0EA] border-2 border-[#E5E0D5] text-[#0F6E64] hover:border-[#0F6E64] hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <UserCheck className="w-5 h-5" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-[#FFFFFF] rounded-xl border border-[#E5E0D5] p-3 z-50 space-y-2 shadow-lg animate-in fade-in duration-200">
                    <div className="px-3 py-2 border-b border-[#E5E0D5] pb-3 mb-2">
                      <p className="font-bold text-[14px] text-[#211D17] truncate">{activeUser.name}</p>
                      <p className="text-[11px] font-medium text-[#7A7266] truncate mt-0.5">{activeUser.email}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[#0F6E64] text-[#FFFFFF]">
                        {activeUser.role.replace('_', ' ')}
                      </span>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full p-2.5 rounded-lg text-[13px] font-bold hover:bg-[#FFF0EE] text-[#B3261E] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#0F6E64] text-[#0F6E64] text-[13px] font-bold hover:bg-[#0F6E64] hover:text-[#FFFFFF] transition-all duration-200"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F6E64] hover:bg-[#14837A] text-[#FFFFFF] text-[13px] font-bold transition-all duration-200 shadow-sm shadow-[#0F6E64]/20"
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


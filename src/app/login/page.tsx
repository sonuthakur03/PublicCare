'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGIN', email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.user.role === 'municipality_admin') {
        router.push('/admin');
      } else if (data.user.role === 'ngo') {
        router.push('/ngo-portal');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#211D17] font-[var(--font-body)]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full">
        
        <div className="mb-[32px] text-center flex flex-col items-center gap-[8px]">
          <div className="w-[48px] h-[48px] rounded-full bg-[#EFE9DC] flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-[#0F6E64]" />
          </div>
          <h1 className="text-[22px] font-semibold text-[#211D17] font-[var(--font-display)]">Welcome back</h1>
          <p className="text-[#59524A] text-[15px]">Sign in to your CivicPulse account</p>
        </div>

        {error && (
          <div className="mb-[32px] w-full max-w-md p-4 rounded-[8px] bg-[#FBE3E0] text-[#8C2A22] border border-[#B3261E] flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-[14px]">{error}</span>
          </div>
        )}

        <div className="w-full max-w-md bg-[#FFFFFF] p-[32px] rounded-[12px] border border-[#D6CFC0] shadow-[0_4px_16px_rgba(33,29,23,0.06)]">
          <form onSubmit={handleLogin} className="flex flex-col gap-[20px]">
            <div>
              <label className="block text-[13px] font-semibold text-[#59524A] mb-[6px] uppercase tracking-[0.03em]">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-[#59524A] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="citizen@lalitpur.gov.np"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 rounded-[6px] bg-[#FFFFFF] border border-[#D6CFC0] text-[15px] text-[#211D17] focus:outline-none focus:border-[#0F6E64]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#59524A] mb-[6px] uppercase tracking-[0.03em]">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#59524A] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 rounded-[6px] bg-[#FFFFFF] border border-[#D6CFC0] text-[15px] text-[#211D17] focus:outline-none focus:border-[#0F6E64]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[6px] bg-[#0F6E64] text-[#FFFFFF] font-semibold text-[15px] flex items-center justify-center gap-2 cursor-pointer hover:brightness-90 active:scale-[0.98] transition-all mt-[12px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-[32px] pt-[32px] border-t border-[#D6CFC0] text-center flex flex-col gap-[12px]">
            <p className="text-[14px] text-[#59524A]">Don't have an account?</p>
            <div className="flex items-center justify-center gap-4 text-[14px] font-semibold">
              <Link href="/register" className="text-[#0F6E64] hover:underline">Citizen Register</Link>
              <span className="text-[#D6CFC0]">|</span>
              <Link href="/register/ngo" className="text-[#0F6E64] hover:underline">NGO Register</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

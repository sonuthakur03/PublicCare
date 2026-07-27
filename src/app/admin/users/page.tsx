'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { User } from '@/types';
import { Building2, UserPlus, ShieldCheck, Lock, AlertCircle, CheckCircle2, Users } from 'lucide-react';

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsersAndSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }

      const authRes = await fetch('/api/auth');
      const authData = await authRes.json();
      if (authData.success) {
        setCurrentUser(authData.user);
      }
    } catch (err) {
      console.error('Failed to load admin users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndSession();
  }, []);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please provide name, email, and initial password.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin user');

      setSuccessMsg(`✅ Municipality Admin account created for ${data.user.name}!`);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsersAndSession();
    } catch (err: any) {
      setError(err.message || 'Error creating admin user');
    } finally {
      setSubmitting(false);
    }
  };

  if (currentUser && currentUser.role !== 'municipality_admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center space-y-4">
          <Lock className="w-12 h-12 text-rose-400" />
          <h1 className="text-xl font-bold">Unauthorized Admin Access</h1>
          <p className="text-xs text-slate-400">Only active Municipality Admins can provision new admin users.</p>
        </main>
      </div>
    );
  }

  const adminUsers = users.filter(u => u.role === 'municipality_admin');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Municipal Officer Provisioning</h1>
              <p className="text-xs text-slate-400">Provision official `municipality_admin` accounts for Lalitpur City Officers.</p>
            </div>
          </div>

          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Active Admin: {currentUser?.name}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create Admin Form (5 Cols) */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-400" />
              Provision New Municipality Admin
            </h2>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Officer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Sunil Maharjan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Municipal Email *</label>
                <input
                  type="email"
                  required
                  placeholder="sunil.officer@lalitpur.gov.np"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                {submitting ? 'Provisioning...' : 'Provision Admin Officer Account'}
              </button>
            </form>
          </div>

          {/* List of Municipal Admin Users (7 Cols) */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white">Registered Municipal Officers ({adminUsers.length})</h2>
            
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {adminUsers.map((u) => (
                <div key={u.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <h3 className="font-bold text-slate-100">{u.name}</h3>
                    <p className="text-slate-400 font-mono text-[11px]">{u.email}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

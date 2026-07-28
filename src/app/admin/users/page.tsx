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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center space-y-4">
          <Lock style={{ width: '48px', height: '48px', color: '#B3261E' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: '#211D17' }}>Unauthorized Admin Access</h1>
          <p style={{ fontSize: '12px', color: '#59524A' }}>Only active Municipality Admins can provision new admin users.</p>
        </main>
      </div>
    );
  }

  const adminUsers = users.filter(u => u.role === 'municipality_admin');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="sm:flex-row sm:items-center sm:justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#0F6E64', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <Users style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Municipal Officer Provisioning</h1>
              <p style={{ fontSize: '12px', color: '#59524A' }}>Provision official `municipality_admin` accounts for Lalitpur City Officers.</p>
            </div>
          </div>

          <span style={{ fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '12px', backgroundColor: '#F5F1E9', color: '#0F6E64', border: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck style={{ width: '16px', height: '16px' }} />
            <span>Active Admin: {currentUser?.name}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 space-y-4" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#211D17', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
              <UserPlus style={{ width: '20px', height: '20px', color: '#0F6E64' }} />
              Provision New Municipality Admin
            </h2>

            {error && (
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#FBE3E0', border: '1px solid #B3261E', color: '#8C2A22', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: '#E1F0EA', border: '1px solid #157F4A', color: '#0B5850', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>Officer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Sunil Maharjan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '12px', color: '#211D17' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>Official Municipal Email *</label>
                <input
                  type="email"
                  required
                  placeholder="sunil.officer@lalitpur.gov.np"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '12px', color: '#211D17' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '12px', color: '#211D17' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer', marginTop: '8px' }}
              >
                {submitting ? 'Provisioning...' : 'Provision Admin Officer Account'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4" style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)' }}>Registered Municipal Officers ({adminUsers.length})</h2>
            
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {adminUsers.map((u) => (
                <div key={u.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FAF8F4', border: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                  <div>
                    <h3 style={{ fontWeight: 'bold', color: '#211D17' }}>{u.name}</h3>
                    <p style={{ color: '#59524A', fontFamily: 'monospace', fontSize: '11px' }}>{u.email}</p>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', backgroundColor: '#F5F1E9', color: '#0F6E64', border: '1px solid #D6CFC0' }}>
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

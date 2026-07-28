'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Issue, IssueStatus, StatsSummary, User } from '@/types';
import { Building2, AlertTriangle, CheckCircle2, Clock, ShieldCheck, Filter, Send, MapPin, Lock, LogIn } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newStatus, setNewStatus] = useState<IssueStatus>('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/issues?status=${statusFilter !== 'ALL' ? statusFilter : ''}`);
      const data = await res.json();

      if (data.success) {
        setIssues(data.data);
        setStats(data.stats);
        if (data.currentUser && data.currentUser.role === 'municipality_admin') {
          setCurrentUser(data.currentUser);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Failed to load issues for admin', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: selectedIssue.id,
          status: newStatus,
          notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedIssue(null);
        setNotes('');
        fetchIssues();
      }
    } catch (err) {
      console.error('Error updating status', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p style={{ fontSize: '12px', color: '#59524A' }} className="animate-pulse">Verifying Sanitation Officer Access...</p>
        </main>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'municipality_admin') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '12px', 
            border: '1px solid #D6CFC0', 
            boxShadow: '0 4px 16px rgba(33,29,23,0.06)', 
            padding: '32px', 
            maxWidth: '440px', 
            width: '100%', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#E1F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock style={{ width: '24px', height: '24px', color: '#0F6E64' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'var(--font-display)', color: '#211D17', marginBottom: '8px' }}>Protected Portal</h1>
              <p style={{ fontSize: '14px', color: '#59524A' }}>
                This dashboard is restricted to authorized <strong>Lalitpur Municipality Officers</strong>.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px 20px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: 'pointer', border: 'none', transition: 'filter 200ms' }}
              onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
            >
              <LogIn style={{ width: '18px', height: '18px' }} />
              <span>Sign In as Sanitation Officer</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const criticalEscalations = issues.filter(i => i.status === 'CRITICAL');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
      <Navbar criticalCount={stats?.criticalIssues || 0} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="sm:flex-row sm:items-center sm:justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#E1F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: '24px', height: '24px', color: '#0F6E64' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#211D17', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Dispatch Console</h1>
              <p style={{ fontSize: '14px', color: '#59524A' }}>Official Municipal Workorder Dispatch & Verification System</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div className="hidden sm:block" style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: '#59524A' }}>Sanitation Budget Spent</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#A6720B' }}>Rs. {(stats?.totalEstimatedCostNpr || 145000).toLocaleString()}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, padding: '8px 16px', borderRadius: '6px', backgroundColor: '#F5F1E9', color: '#211D17', border: '1px solid #D6CFC0' }}>
              <ShieldCheck style={{ width: '18px', height: '18px', color: '#0F6E64' }} />
              <span>{currentUser.name}</span>
            </div>
          </div>
        </div>

        {criticalEscalations.length > 0 && (
          <div style={{ padding: '24px', borderRadius: '12px', backgroundColor: '#FBEAE1', border: '1px solid #C1592B', color: '#7A331A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#C1592B' }} />
                <h3 style={{ fontWeight: 600, fontSize: '18px', color: '#7A331A', fontFamily: 'var(--font-display)' }}>High-Priority Escalated Dispatch Alert</h3>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#FFFFFF', color: '#C1592B', border: '1px solid #C1592B' }}>
                {criticalEscalations.length} Action Required
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#7A331A', marginBottom: '16px' }}>
              The following Lalitpur community issues received <strong>≥ 3 net upvotes</strong> within the threshold window and have been automatically flagged for immediate municipal crew deployment:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalEscalations.map((item) => (
                <div key={item.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
                  <div className="min-w-0">
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#211D17', marginBottom: '4px' }} className="line-clamp-1">{item.title}</h4>
                    <p style={{ fontSize: '13px', color: '#59524A', marginBottom: '8px' }} className="truncate">📍 {item.address}</p>
                    <span style={{ fontSize: '12px', color: '#C1592B', fontWeight: 600 }}>👍 {item.netUpvotes} Community Upvotes</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIssue(item);
                      setNewStatus('IN_PROGRESS');
                    }}
                    style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#C1592B', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'filter 200ms' }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                    className="shrink-0"
                  >
                    Dispatch Crew
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Filter style={{ width: '20px', height: '20px', color: '#0F6E64' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#211D17' }}>Filter Workorders:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
            {[
              { id: 'ALL', label: 'All Workorders' },
              { id: 'CRITICAL', label: '🔴 Critical Escalated' },
              { id: 'REPORTED', label: '🔵 Pending' },
              { id: 'IN_PROGRESS', label: '🟠 In Progress' },
              { id: 'RESOLVED', label: '🟢 Verified Resolved' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setStatusFilter(btn.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: statusFilter === btn.id ? '1px solid #0F6E64' : '1px solid transparent',
                  backgroundColor: statusFilter === btn.id ? '#0F6E64' : '#EFE9DC',
                  color: statusFilter === btn.id ? '#FFFFFF' : '#59524A',
                  transition: 'all 200ms'
                }}
                onMouseEnter={(e) => {
                  if (statusFilter !== btn.id) e.currentTarget.style.filter = 'brightness(0.95)';
                }}
                onMouseLeave={(e) => {
                  if (statusFilter !== btn.id) e.currentTarget.style.filter = 'none';
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#EFE9DC', borderBottom: '1px solid #D6CFC0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#59524A', fontWeight: 600 }}>
                  <th className="py-4 px-5">Issue Details</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Community Votes</th>
                  <th className="py-4 px-5">Current Status</th>
                  <th className="py-4 px-5">Reported Date</th>
                  <th className="py-4 px-5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '14px' }}>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 0', textAlign: 'center', color: '#59524A' }}>No workorders found under current status filter.</td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr 
                      key={issue.id} 
                      style={{ borderBottom: '1px solid #D6CFC0', backgroundColor: '#FFFFFF', transition: 'background-color 200ms' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F1E9'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                    >
                      <td className="py-4 px-5 max-w-xs">
                        <div style={{ fontWeight: 600, color: '#211D17', marginBottom: '4px' }} className="line-clamp-1">{issue.title}</div>
                        <div style={{ fontSize: '13px', color: '#59524A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin style={{ width: '14px', height: '14px', color: '#0F6E64', flexShrink: 0 }} />
                          <span className="truncate">{issue.address}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span style={{ padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#EFE9DC', color: '#59524A', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {issue.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        <span style={{ fontWeight: 600, fontSize: '14px', color: issue.netUpvotes >= 3 ? '#C1592B' : '#0F6E64' }}>
                          👍 {issue.netUpvotes}
                        </span>
                      </td>

                      <td className="py-4 px-5">
                        {issue.status === 'CRITICAL' && (
                          <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, backgroundColor: '#FBE3E0', color: '#8C2A22', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            CRITICAL
                          </span>
                        )}
                        {issue.status === 'REPORTED' && (
                          <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, backgroundColor: '#EFE9DC', color: '#59524A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            REPORTED
                          </span>
                        )}
                        {issue.status === 'IN_PROGRESS' && (
                          <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, backgroundColor: '#FBEEDD', color: '#7A5108', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            IN_PROGRESS
                          </span>
                        )}
                        {issue.status === 'RESOLVED' && (
                          <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, backgroundColor: '#E1F0EA', color: '#0B5850', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            RESOLVED
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5" style={{ color: '#59524A', fontSize: '13px' }}>
                        {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
                            setNewStatus(issue.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS');
                            setNotes(issue.resolutionNotes || '');
                          }}
                          style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'transparent', color: '#0F6E64', border: '1px solid #0F6E64', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 200ms' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#0F6E64';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#0F6E64';
                          }}
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(33,29,23,0.4)', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: '100%', maxWidth: '560px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', padding: '32px', boxShadow: '0 12px 32px rgba(15,110,100,0.12)' }} className="space-y-6">
            
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#211D17', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-display)' }}>
              <Building2 style={{ width: '24px', height: '24px', color: '#0F6E64' }} />
              Update Lalitpur Workorder #{selectedIssue.id.slice(0,8)}
            </h3>

            <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#F5F1E9', border: '1px solid #D6CFC0', fontSize: '14px' }} className="space-y-2">
              <p style={{ fontWeight: 600, color: '#211D17' }}>{selectedIssue.title}</p>
              <p style={{ color: '#59524A', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin style={{width: '14px', height: '14px', color: '#0F6E64'}} /> {selectedIssue.address}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#211D17', marginBottom: '8px' }}>Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '14px', color: '#211D17' }}
                >
                  <option value="REPORTED">Pending (Reported)</option>
                  <option value="IN_PROGRESS">In Progress (Jetting / Crew Dispatched)</option>
                  <option value="RESOLVED">Resolved & Sanitation Verified</option>
                  <option value="CRITICAL">Critical Problem</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#211D17', marginBottom: '8px' }}>Officer Dispatch & Resolution Notes</label>
                <textarea
                  rows={4}
                  placeholder="Enter dispatch details, crew vehicle ID, or sanitation actions taken..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '14px', color: '#211D17', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', paddingTop: '16px', borderTop: '1px solid #D6CFC0' }}>
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: 600, color: '#59524A', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 200ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F1E9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'filter 200ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  {submitting ? 'Saving...' : 'Save & Publish Update'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

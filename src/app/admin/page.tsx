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
  
  // Status modal state
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
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-500 animate-pulse">Verifying Sanitation Officer Access...</p>
        </main>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'municipality_admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Protected Sanitation Officer Portal</h1>
          <p className="text-xs text-slate-400">
            This dashboard is restricted to authorized <strong>Lalitpur Municipality Officers (`municipality_admin`)</strong>.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In as Sanitation Officer</span>
          </button>
        </main>
      </div>
    );
  }

  const criticalEscalations = issues.filter(i => i.status === 'CRITICAL');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar criticalCount={stats?.criticalIssues || 0} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-950/50">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Lalitpur Sanitation Dispatch Console</h1>
              <p className="text-xs text-slate-400">Official Municipal Workorder Dispatch & Verification System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-slate-400">Sanitation Budget Spent</p>
              <p className="text-base font-bold text-emerald-400">Rs. {(stats?.totalEstimatedCostNpr || 145000).toLocaleString()} NPR</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Officer: {currentUser.name}</span>
            </div>
          </div>
        </div>

        {criticalEscalations.length > 0 && (
          <div className="p-5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-100 shadow-xl space-y-3 critical-pulse-badge">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-bounce" />
                <h3 className="font-bold text-base text-rose-200">High-Priority Escalated Dispatch Alert</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {criticalEscalations.length} Action Required
              </span>
            </div>
            <p className="text-xs text-rose-300">
              The following Lalitpur community issues received <strong>≥ 3 net upvotes</strong> within the threshold window and have been automatically flagged for immediate municipal crew deployment:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {criticalEscalations.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-1">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 truncate">📍 {item.address}</p>
                    <span className="text-[10px] text-rose-400 font-semibold">👍 {item.netUpvotes} Community Upvotes</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIssue(item);
                      setNewStatus('IN_PROGRESS');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors shrink-0"
                  >
                    Dispatch Crew
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between glass-panel p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-semibold text-slate-300">Filter Workorders:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === btn.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3.5 px-4">Issue Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Community Votes</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Reported Date</th>
                  <th className="py-3.5 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">No workorders found under current status filter.</td>
                  </tr>
                ) : (
                  issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-slate-100 line-clamp-1">{issue.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{issue.address}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-semibold text-[10px]">
                          {issue.category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`font-bold text-sm ${issue.netUpvotes >= 3 ? 'text-rose-400' : 'text-sky-400'}`}>
                          👍 {issue.netUpvotes}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {issue.status === 'CRITICAL' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            🔴 CRITICAL
                          </span>
                        )}
                        {issue.status === 'REPORTED' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                            🔵 PENDING
                          </span>
                        )}
                        {issue.status === 'IN_PROGRESS' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            🟠 IN PROGRESS
                          </span>
                        )}
                        {issue.status === 'RESOLVED' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            🟢 RESOLVED
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedIssue(issue);
                            setNewStatus(issue.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS');
                            setNotes(issue.resolutionNotes || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 font-semibold text-xs transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400" />
              Update Lalitpur Workorder #{selectedIssue.id}
            </h3>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-slate-100">{selectedIssue.title}</p>
              <p className="text-slate-400">📍 {selectedIssue.address}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100"
                >
                  <option value="REPORTED" className="bg-slate-900">Pending (Reported)</option>
                  <option value="IN_PROGRESS" className="bg-slate-900">In Progress (Jetting / Crew Dispatched)</option>
                  <option value="RESOLVED" className="bg-slate-900">Resolved & Sanitation Verified</option>
                  <option value="CRITICAL" className="bg-slate-900">Critical Problem</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Officer Dispatch & Resolution Notes</label>
                <textarea
                  rows={3}
                  placeholder="Enter dispatch details, crew vehicle ID, or sanitation actions taken..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedIssue(null)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-all"
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

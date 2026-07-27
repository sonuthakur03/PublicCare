'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CivicMap from '@/components/CivicMap';
import IssueCard from '@/components/IssueCard';
import { Issue, IssueCategory, IssueStatus, StatsSummary } from '@/types';
import { Search, Filter, AlertTriangle, ShieldCheck, Flame, Layers, Sparkles, RefreshCw, PlusCircle, MapPin } from 'lucide-react';

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`/api/v1/issues?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setIssues(data.data);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load Lalitpur issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, categoryFilter, searchQuery]);

  const handleUpvote = async (issueId: string) => {
    try {
      const res = await fetch('/api/v1/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId })
      });
      const data = await res.json();
      if (res.status === 403) {
        return false;
      }
      if (data.success) {
        if (data.escalated) {
          setAlertMessage(`🚨 CRITICAL THRESHOLD REACHED: "${data.issue.title}" reached 3 upvotes and has been automatically escalated to Critical status!`);
          setTimeout(() => setAlertMessage(null), 8000);
        }
        fetchIssues();
        return true;
      }
    } catch (err) {
      console.error('Upvote failed', err);
    }
  };

  const categories = [
    { label: 'All Categories', value: 'ALL' },
    { label: 'Garbage Dump', value: 'GARBAGE_DUMP' },
    { label: 'Sewage Overflow', value: 'SEWAGE_OVERFLOW' },
    { label: 'Water Contamination', value: 'WATER_CONTAMINATION' },
    { label: 'Illegal Dumping', value: 'ILLEGAL_DUMPING' },
    { label: 'Public Toilet', value: 'PUBLIC_TOILET' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Header */}
      <Navbar criticalCount={stats?.criticalIssues || 0} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Escalation Toast Alert */}
        {alertMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/60 text-rose-200 shadow-2xl flex items-center justify-between gap-4 critical-pulse-badge animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
              <span className="text-sm font-semibold">{alertMessage}</span>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-xs font-bold text-rose-400 hover:text-rose-200 px-2 py-1 bg-rose-900/40 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Banner & Lalitpur Live KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Lalitpur Reports</p>
              <h3 className="text-xl font-bold text-white">{stats?.totalIssues || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Critical Escalated</p>
              <h3 className="text-xl font-bold text-rose-400">{stats?.criticalIssues || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">In Progress</p>
              <h3 className="text-xl font-bold text-amber-400">{stats?.inProgressIssues || 0}</h3>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Resolved Rate</p>
              <h3 className="text-xl font-bold text-emerald-400">{stats?.resolutionRate || 0}%</h3>
            </div>
          </div>
        </div>

        {/* Upvote Escalation Rule & Raise Issue CTA */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
            <span>
              <strong>Lalitpur Escalation Engine:</strong> Issues receiving <span className="text-sky-400 font-bold">≥ 3 net upvotes</span> within 7 weeks automatically escalate to <span className="text-rose-400 font-bold">Critical Status</span> for municipal crew dispatch.
            </span>
          </div>
          <Link
            href="/raise-issue"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-all shrink-0 shadow-md"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Pin & Raise Issue →</span>
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between glass-panel p-3 rounded-2xl border border-slate-800">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Patan, Jawalakhel, Kupondole landmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CRITICAL', label: '🔴 Critical' },
              { id: 'REPORTED', label: '🔵 Pending' },
              { id: 'IN_PROGRESS', label: '🟠 In Progress' },
              { id: 'RESOLVED', label: '🟢 Resolved' },
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

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value} className="bg-slate-900 text-slate-100">
                {c.label}
              </option>
            ))}
          </select>

        </div>

        {/* Main Content Layout: Bounded Lalitpur Map + Live Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
          
          <div className="lg:col-span-7 h-full">
            <CivicMap
              issues={issues}
              onUpvote={handleUpvote}
              selectedIssueId={selectedIssueId}
              onSelectIssue={(id) => setSelectedIssueId(id)}
            />
          </div>

          <div className="lg:col-span-5 h-full flex flex-col glass-panel rounded-2xl border border-slate-800 p-4 overflow-hidden">
            
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Lalitpur Community Feed</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-sky-400">
                  {issues.length} Active
                </span>
              </div>
              <button
                onClick={fetchIssues}
                className="p-1.5 text-slate-400 hover:text-sky-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Refresh Feed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loading ? (
                <div className="py-20 text-center text-slate-500 text-sm">Loading Lalitpur issues...</div>
              ) : issues.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">No issues match the selected filters.</div>
              ) : (
                issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onUpvote={handleUpvote}
                    isSelected={selectedIssueId === issue.id}
                    onSelect={() => setSelectedIssueId(issue.id)}
                  />
                ))
              )}
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

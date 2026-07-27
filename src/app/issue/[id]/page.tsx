'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CivicMap from '@/components/CivicMap';
import { Issue } from '@/types';
import { MapPin, Calendar, ThumbsUp, AlertTriangle, CheckCircle2, Clock, ArrowLeft, Share2, Flame, Building2, UserCheck, ShieldCheck } from 'lucide-react';

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const issueId = params.id as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvoting, setUpvoting] = useState(false);
  const [votedError, setVotedError] = useState(false);

  const fetchIssueDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/issues`);
      const data = await res.json();
      if (data.success && data.data) {
        const found = data.data.find((i: Issue) => i.id === issueId);
        if (found) {
          setIssue(found);
        } else {
          setError('Issue report not found.');
        }
      }
    } catch (err) {
      setError('Failed to load issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) fetchIssueDetail();
  }, [issueId]);

  const handleUpvote = async () => {
    if (!issue || issue.hasVotedByCurrentUser) return;

    setUpvoting(true);
    setVotedError(false);

    try {
      const res = await fetch('/api/v1/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: issue.id })
      });
      const data = await res.json();
      if (res.status === 403) {
        setVotedError(true);
      } else if (data.success) {
        fetchIssueDetail();
      }
    } catch (err) {
      console.error('Upvote failed', err);
    } finally {
      setUpvoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500 animate-pulse">Loading Lalitpur issue details...</p>
        </main>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">{error || 'Issue Not Found'}</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-500 transition-colors"
          >
            Back to Lalitpur Feed
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lalitpur Community Feed</span>
        </button>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Photo & Story (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Image Box */}
            <div className="rounded-2xl glass-panel p-2 border border-slate-800 overflow-hidden shadow-2xl">
              <img
                src={issue.imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'}
                alt={issue.title}
                className="w-full h-80 lg:h-96 object-cover rounded-xl"
              />
            </div>

            {/* Issue Description Box */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {issue.category.replace('_', ' ')}
                </span>
                
                {issue.status === 'CRITICAL' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 critical-pulse-badge">
                    🔴 CRITICAL COMMUNITY PROBLEM
                  </span>
                )}
                {issue.status === 'RESOLVED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    🟢 VERIFIED RESOLVED
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-white">{issue.title}</h1>

              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {issue.description}
              </p>

              {/* Upvoting & Single Vote Rule */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {issue.hasVotedByCurrentUser ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                    >
                      Already Voted ({issue.netUpvotes})
                    </button>
                  ) : (
                    <button
                      onClick={handleUpvote}
                      disabled={upvoting}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Upvote Issue ({issue.netUpvotes})</span>
                    </button>
                  )}

                  {votedError && (
                    <span className="text-xs text-rose-400 font-semibold">Already voted! (1 vote per session)</span>
                  )}
                </div>

                <span className="text-xs text-slate-400">Report ID: <code className="font-mono text-sky-400">{issue.id}</code></span>
              </div>

            </div>

            {/* Resolution Log (if in progress or resolved) */}
            {issue.resolutionNotes && (
              <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Lalitpur Municipal Officer Notes
                </h3>
                <p className="text-xs text-emerald-200 leading-relaxed font-normal">
                  "{issue.resolutionNotes}"
                </p>
              </div>
            )}

          </div>

          {/* Right Column: Spatial Context & Status Timeline (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Spatial Location Map */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                Spatial Location in Lalitpur
              </h3>

              <div className="h-56 rounded-xl overflow-hidden">
                <CivicMap issues={[issue]} selectedIssueId={issue.id} />
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-white">📍 {issue.address}</p>
                <p className="text-[11px] text-slate-500 font-mono">GPS Coordinates: {issue.locationLat.toFixed(4)}° N, {issue.locationLng.toFixed(4)}° E</p>
              </div>
            </div>

            {/* Status History & Audit Timeline */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                Status History & Audit Timeline
              </h3>

              <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 text-xs">
                
                {/* Reported Step */}
                <div className="flex items-start gap-3 pl-6 relative">
                  <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-sky-500 border-2 border-slate-950"></span>
                  <div>
                    <p className="font-bold text-slate-100">Hygiene Issue Reported</p>
                    <p className="text-[11px] text-slate-400">Logged by {issue.reporterName || 'Citizen'} on {new Date(issue.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Escalation Step */}
                {issue.escalatedAt && (
                  <div className="flex items-start gap-3 pl-6 relative">
                    <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-rose-500 border-2 border-slate-950"></span>
                    <div>
                      <p className="font-bold text-rose-400">Escalated to Critical</p>
                      <p className="text-[11px] text-slate-400">Reached 3+ net upvotes on {new Date(issue.escalatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {/* Resolved Step */}
                {issue.resolvedAt && (
                  <div className="flex items-start gap-3 pl-6 relative">
                    <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
                    <div>
                      <p className="font-bold text-emerald-400">Verified & Resolved</p>
                      <p className="text-[11px] text-slate-400">Completed by Municipal Sanitation Crew on {new Date(issue.resolvedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

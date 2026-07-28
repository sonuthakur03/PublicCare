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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.875rem', color: '#7A7266' }}>Loading Lalitpur issue details...</p>
        </main>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main style={{ flex: 1, maxWidth: '36rem', margin: '0 auto', padding: '5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <AlertTriangle style={{ width: '3rem', height: '3rem', color: '#B3261E' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)' }}>{error || 'Issue Not Found'}</h1>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '0.5rem 1rem', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
          >
            Back to Lalitpur Feed
          </button>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '72rem', width: '100%', margin: '0 auto', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Back Link */}
        <button
          onClick={() => router.push('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#59524A', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', alignSelf: 'flex-start' }}
        >
          <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
          <span>Back to Lalitpur Community Feed</span>
        </button>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Left Column: Photo & Story */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: '1 1 60%' }}>
            
            {/* Image Box */}
            <div style={{ borderRadius: '12px', backgroundColor: '#FFFFFF', padding: '0.5rem', border: '1px solid #D6CFC0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <img
                src={issue.imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'}
                alt={issue.title}
                style={{ width: '100%', height: '24rem', objectFit: 'cover', borderRadius: '6px' }}
              />
            </div>

            {/* Issue Description Box */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#EFE9DC', color: '#0F6E64', border: '1px solid #D6CFC0' }}>
                  {issue.category.replace('_', ' ')}
                </span>
                
                {issue.status === 'CRITICAL' && (
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#FBE3E0', color: '#8C2A22', border: '1px solid #B3261E' }}>
                    🔴 CRITICAL COMMUNITY PROBLEM
                  </span>
                )}
                {issue.status === 'RESOLVED' && (
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#E1F0EA', color: '#157F4A', border: '1px solid #157F4A' }}>
                    🟢 VERIFIED RESOLVED
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)' }}>{issue.title}</h1>

              <p style={{ fontSize: '0.875rem', color: '#59524A', lineHeight: '1.6', fontWeight: 'normal' }}>
                {issue.description}
              </p>

              {/* Upvoting & Single Vote Rule */}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {issue.hasVotedByCurrentUser ? (
                    <button
                      disabled
                      style={{ padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: '#E9E2D3', color: '#7A7266', border: '1px solid #D6CFC0', cursor: 'not-allowed' }}
                    >
                      Already Voted ({issue.netUpvotes})
                    </button>
                  ) : (
                    <button
                      onClick={handleUpvote}
                      disabled={upvoting}
                      style={{ padding: '0.625rem 1.25rem', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 'bold', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', border: 'none', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}
                    >
                      <ThumbsUp style={{ width: '1rem', height: '1rem' }} />
                      <span>Upvote Issue ({issue.netUpvotes})</span>
                    </button>
                  )}

                  {votedError && (
                    <span style={{ fontSize: '0.75rem', color: '#B3261E', fontWeight: 600 }}>Already voted! (1 vote per session)</span>
                  )}
                </div>

                <span style={{ fontSize: '0.75rem', color: '#7A7266' }}>Report ID: <code style={{ fontFamily: 'monospace', color: '#0F6E64' }}>{issue.id}</code></span>
              </div>

            </div>

            {/* Resolution Log (if in progress or resolved) */}
            {issue.resolutionNotes && (
              <div style={{ backgroundColor: '#E1F0EA', padding: '1.5rem', borderRadius: '12px', border: '1px solid #157F4A', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#0B5850', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 style={{ width: '1rem', height: '1rem' }} />
                  Lalitpur Municipal Officer Notes
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#157F4A', lineHeight: '1.6', fontWeight: 'normal' }}>
                  "{issue.resolutionNotes}"
                </p>
              </div>
            )}

          </div>

          {/* Right Column: Spatial Context & Status Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: '1 1 35%' }}>
            
            {/* Spatial Location Map */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #D6CFC0', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#211D17', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin style={{ width: '1rem', height: '1rem', color: '#0F6E64' }} />
                Spatial Location in Lalitpur
              </h3>

              <div style={{ height: '14rem', borderRadius: '6px', overflow: 'hidden' }}>
                <CivicMap issues={[issue]} selectedIssueId={issue.id} />
              </div>

              <div style={{ fontSize: '0.75rem', color: '#59524A', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <p style={{ fontWeight: 600, color: '#211D17' }}>📍 {issue.address}</p>
                <p style={{ fontSize: '0.6875rem', color: '#7A7266', fontFamily: 'monospace' }}>GPS Coordinates: {issue.locationLat.toFixed(4)}° N, {issue.locationLng.toFixed(4)}° E</p>
              </div>
            </div>

            {/* Status History & Audit Timeline */}
            <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #D6CFC0', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#211D17', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ width: '1rem', height: '1rem', color: '#0F6E64' }} />
                Status History & Audit Timeline
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', fontSize: '0.75rem' }}>
                <div style={{ position: 'absolute', left: '0.375rem', top: '0.5rem', bottom: '0.5rem', width: '2px', backgroundColor: '#D6CFC0' }}></div>
                
                {/* Reported Step */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, top: '0.25rem', width: '0.875rem', height: '0.875rem', borderRadius: '9999px', backgroundColor: '#0F6E64', border: '2px solid #FFFFFF' }}></span>
                  <div>
                    <p style={{ fontWeight: 'bold', color: '#211D17' }}>Hygiene Issue Reported</p>
                    <p style={{ fontSize: '0.6875rem', color: '#59524A' }}>Logged by {issue.reporterName || 'Citizen'} on {new Date(issue.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Escalation Step */}
                {issue.escalatedAt && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: '0.25rem', width: '0.875rem', height: '0.875rem', borderRadius: '9999px', backgroundColor: '#B3261E', border: '2px solid #FFFFFF' }}></span>
                    <div>
                      <p style={{ fontWeight: 'bold', color: '#B3261E' }}>Escalated to Critical</p>
                      <p style={{ fontSize: '0.6875rem', color: '#59524A' }}>Reached 3+ net upvotes on {new Date(issue.escalatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {/* Resolved Step */}
                {issue.resolvedAt && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', paddingLeft: '1.5rem', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: '0.25rem', width: '0.875rem', height: '0.875rem', borderRadius: '9999px', backgroundColor: '#157F4A', border: '2px solid #FFFFFF' }}></span>
                    <div>
                      <p style={{ fontWeight: 'bold', color: '#157F4A' }}>Verified & Resolved</p>
                      <p style={{ fontSize: '0.6875rem', color: '#59524A' }}>Completed by Municipal Sanitation Crew on {new Date(issue.resolvedAt).toLocaleDateString()}</p>
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

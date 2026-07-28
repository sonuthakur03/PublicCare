'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CivicMap from '@/components/CivicMap';
import IssueCard from '@/components/IssueCard';
import LocationAccessBadge from '@/components/LocationAccessBadge';
import NearbyChatWidget from '@/components/NearbyChatWidget';
import { Issue, IssueCategory, IssueStatus, StatsSummary, User } from '@/types';
import { Search, Filter, AlertTriangle, ShieldCheck, Flame, Layers, Sparkles, RefreshCw, PlusCircle, MapPin, ThumbsUp, Building2, ChevronRight } from 'lucide-react';

export default function Home() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number>(27.6727);
  const [userLng, setUserLng] = useState<number>(85.3253);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

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
    if (user) {
      fetchIssues();
    }
  }, [user, statusFilter, categoryFilter, searchQuery]);

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
          setAlertMessage(`CRITICAL THRESHOLD REACHED: "${data.issue.title}" reached 3 upvotes and has been automatically escalated to Critical status!`);
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

  if (authLoading) {
    return (
      <div style={{ backgroundColor: '#FAF8F4', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#59524A' }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar criticalCount={0} />
        
        <main style={{ flex: 1 }}>
          {/* Hero Section */}
          <section style={{ padding: '6rem 1rem', textAlign: 'center', maxWidth: '80rem', margin: '0 auto' }} className="py-16 md:py-24">
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: '#211D17', marginBottom: '1.5rem', lineHeight: 1.2 }}>
              Clean Streets. Safe Water. Your Voice Matters.
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#59524A', maxWidth: '48rem', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
              CivicPulse empowers citizens of Lalitpur Municipality to report waste hazards, track sanitation progress, and hold public services accountable.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" style={{ padding: '0.75rem 2rem', backgroundColor: '#0F6E64', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600, fontSize: '1.125rem', textDecoration: 'none' }}>
                Get Started
              </Link>
              <Link href="/login" style={{ padding: '0.75rem 2rem', backgroundColor: 'transparent', color: '#0F6E64', border: '2px solid #0F6E64', borderRadius: '6px', fontWeight: 600, fontSize: '1.125rem', textDecoration: 'none' }}>
                Sign In
              </Link>
            </div>
          </section>

          {/* Features Section */}
          <section style={{ padding: '4rem 1rem', maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
                <div style={{ width: '3rem', height: '3rem', backgroundColor: '#E1F0EA', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <MapPin style={{ color: '#157F4A', width: '1.5rem', height: '1.5rem' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#211D17' }}>Pin It on the Map</h3>
                <p style={{ color: '#59524A', lineHeight: 1.6 }}>Easily drop a GPS pin and upload photos of waste hazards in your neighborhood. Help the municipality identify precise locations for cleanups.</p>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
                <div style={{ width: '3rem', height: '3rem', backgroundColor: '#FBEEDD', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <ThumbsUp style={{ color: '#B8720B', width: '1.5rem', height: '1.5rem' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#211D17' }}>Community Upvoting</h3>
                <p style={{ color: '#59524A', lineHeight: 1.6 }}>Upvote issues in your area. Issues with high community engagement are automatically escalated to prioritize urgent municipal action.</p>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
                <div style={{ width: '3rem', height: '3rem', backgroundColor: '#FBEAE1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <Building2 style={{ color: '#C1592B', width: '1.5rem', height: '1.5rem' }} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: '#211D17' }}>Real-Time Dispatch</h3>
                <p style={{ color: '#59524A', lineHeight: 1.6 }}>Track the progress of reported issues as municipal officers review, dispatch crews, and resolve sanitation problems in real-time.</p>
              </div>

            </div>
          </section>

          {/* How It Works Section */}
          <section style={{ padding: '4rem 1rem', maxWidth: '80rem', margin: '0 auto', marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '3rem', color: '#211D17' }}>How It Works</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              {[
                { step: '01', title: 'See an Issue', desc: 'Spot a garbage dump, sewage overflow, or sanitation hazard.' },
                { step: '02', title: 'Report It', desc: 'Snap a photo, add details, and drop a pin on the CivicPulse map.' },
                { step: '03', title: 'Community Vote', desc: 'Neighbors upvote critical issues to raise their priority.' },
                { step: '04', title: 'Action Taken', desc: 'Lalitpur officers dispatch crews and mark the issue resolved.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 700, color: '#D6CFC0', lineHeight: 1 }}>{item.step}</div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#211D17' }}>{item.title}</h4>
                  <p style={{ color: '#59524A', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

        </main>

        <footer style={{ borderTop: '1px solid #D6CFC0', padding: '2rem', textAlign: 'center', color: '#59524A' }}>
          <p>Built for Lalitpur Metropolitan City © 2026 CivicPulse.</p>
        </footer>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <Navbar criticalCount={stats?.criticalIssues || 0} />

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '80rem', width: '100%', margin: '0 auto', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* Citizen Location Access Prompt */}
        <LocationAccessBadge
          onLocationDetected={(lat, lng) => {
            setUserLat(lat);
            setUserLng(lng);
          }}
        />
        {/* Escalation Toast Alert */}
        {alertMessage && (
          <div style={{ padding: '1.5rem', borderRadius: '12px', backgroundColor: '#FBE3E0', border: '1px solid #B3261E', color: '#8C2A22', boxShadow: '0 8px 24px rgba(33,29,23,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AlertTriangle style={{ width: '1.75rem', height: '1.75rem', flexShrink: 0 }} />
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>{alertMessage}</span>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#B3261E', padding: '0.5rem 1rem', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Bar */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '8px', backgroundColor: '#EFE9DC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers style={{ width: '1.5rem', height: '1.5rem', color: '#0F6E64' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#59524A', fontWeight: 500, marginBottom: '0.25rem' }}>Lalitpur Reports</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{stats?.totalIssues || 0}</h3>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '8px', backgroundColor: '#FBE3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Flame style={{ width: '1.5rem', height: '1.5rem', color: '#B3261E' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#59524A', fontWeight: 500, marginBottom: '0.25rem' }}>Critical Escalated</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#B3261E', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{stats?.criticalIssues || 0}</h3>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '8px', backgroundColor: '#FBEEDD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles style={{ width: '1.5rem', height: '1.5rem', color: '#B8720B' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#59524A', fontWeight: 500, marginBottom: '0.25rem' }}>In Progress</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#A6720B', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{stats?.inProgressIssues || 0}</h3>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '8px', backgroundColor: '#E1F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck style={{ width: '1.5rem', height: '1.5rem', color: '#157F4A' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#59524A', fontWeight: 500, marginBottom: '0.25rem' }}>Resolved Rate</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#157F4A', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{stats?.resolutionRate || 0}%</h3>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <section>
          {/* Toolbar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: '1.25rem', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              
              <div style={{ position: 'relative', flex: '1 1 300px' }}>
                <Search style={{ width: '1.25rem', height: '1.25rem', color: '#7A7266', position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search Patan, Jawalakhel, Kupondole landmarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '1rem', color: '#211D17', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = '#0F6E64'}
                  onBlur={(e) => e.target.style.borderColor = '#D6CFC0'}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {[
                  { id: 'ALL', label: 'All Issues' },
                  { id: 'CRITICAL', label: 'Critical' },
                  { id: 'REPORTED', label: 'Pending' },
                  { id: 'IN_PROGRESS', label: 'In Progress' },
                  { id: 'RESOLVED', label: 'Resolved' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => setStatusFilter(btn.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      border: statusFilter === btn.id ? '1px solid #0F6E64' : '1px solid transparent',
                      backgroundColor: statusFilter === btn.id ? '#14837A' : '#E9E2D3',
                      color: statusFilter === btn.id ? '#FFFFFF' : '#4C4437',
                      transition: 'all 0.2s'
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '0.875rem', color: '#211D17', outline: 'none', cursor: 'pointer' }}
                onFocus={(e) => e.target.style.borderColor = '#0F6E64'}
                onBlur={(e) => e.target.style.borderColor = '#D6CFC0'}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', minHeight: '800px' }}>
            
            {/* Map Area */}
            <div style={{ borderRadius: '12px', border: '1px solid #D6CFC0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <CivicMap
                issues={issues}
                onUpvote={handleUpvote}
                selectedIssueId={selectedIssueId}
                onSelectIssue={(id) => setSelectedIssueId(id)}
              />
            </div>

            {/* Feed Area */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', padding: '1.5rem', overflow: 'hidden', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #D6CFC0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#211D17', fontFamily: 'var(--font-display)' }}>Community Feed</h2>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#EFE9DC', color: '#0F6E64' }}>
                    {issues.length} Issues
                  </span>
                </div>
                <button
                  onClick={fetchIssues}
                  style={{ padding: '0.5rem', color: '#59524A', borderRadius: '6px', backgroundColor: '#F5F1E9', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  title="Refresh Feed"
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#EFE9DC'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#F5F1E9'}
                >
                  <RefreshCw style={{ width: '1.25rem', height: '1.25rem' }} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '0.5rem' }}>
                {loading ? (
                  <div style={{ padding: '5rem 0', textAlign: 'center', color: '#7A7266', fontSize: '1rem' }}>Loading Lalitpur issues...</div>
                ) : issues.length === 0 ? (
                  <div style={{ padding: '5rem 0', textAlign: 'center', color: '#7A7266', fontSize: '1rem' }}>No issues match the selected filters.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {issues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onUpvote={handleUpvote}
                        isSelected={selectedIssueId === issue.id}
                        onSelect={() => setSelectedIssueId(issue.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </section>

      </main>

      {/* Real-time WebSocket Nearby Anonymous Network Chat */}
      <NearbyChatWidget currentUser={user} userLat={userLat} userLng={userLng} />

    </div>
  );
}


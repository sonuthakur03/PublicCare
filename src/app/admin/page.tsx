'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import NearbyVendorsPanel from '@/components/NearbyVendorsPanel';
import ExportButton from '@/components/ExportButton';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { Issue, IssueStatus, StatsSummary, User, Tender } from '@/types';
import { Building2, AlertTriangle, CheckCircle2, Clock, ShieldCheck, Filter, Send, MapPin, Lock, LogIn, Download, FileText, TrendingUp, BarChart3, Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  REPORTED: '#EFE9DC',
  CRITICAL: '#FBE3E0',
  IN_PROGRESS: '#FBEEDD',
  RESOLVED: '#E1F0EA',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  REPORTED: '#59524A',
  CRITICAL: '#8C2A22',
  IN_PROGRESS: '#7A5108',
  RESOLVED: '#0B5850',
};

const PIE_COLORS = ['#D6CFC0', '#C1592B', '#B8720B', '#0F6E64'];

export default function AdminDashboard() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'dispatch' | 'analytics' | 'tenders'>('dispatch');

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [newStatus, setNewStatus] = useState<IssueStatus>('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [showVendorsFor, setShowVendorsFor] = useState<Issue | null>(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/issues?status=${statusFilter !== 'ALL' ? statusFilter : ''}`);
      const data = await res.json();

      if (data.success) {
        setIssues(data.data);
        setStats(data.stats);
        if (data.currentUser && (data.currentUser.role === 'municipality_admin' || data.currentUser.role === 'superadmin')) {
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

  const fetchTenders = async () => {
    try {
      const res = await fetch('/api/v1/tenders');
      const data = await res.json();
      if (data.success) {
        setTenders(data.data);
      }
    } catch (err) {
      console.error('Failed to load tenders', err);
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchTenders();
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

  const handleTenderAction = async (tenderId: string, status: 'ACCEPTED' | 'REJECTED', responseNotes?: string) => {
    try {
      await fetch(`/api/v1/tenders/${tenderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseNotes })
      });
      fetchTenders();
    } catch (err) {
      console.error('Error updating tender', err);
    }
  };

  if (loading) {
    return <PageLoadingScreen isLoading={true} subtitle="Verifying Sanitation Officer Access…" />;
  }

  if (!currentUser || (currentUser.role !== 'municipality_admin' && currentUser.role !== 'superadmin')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', padding: '40px', maxWidth: '440px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#E1F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock style={{ width: '28px', height: '28px', color: '#0F6E64' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'var(--font-display)', color: '#211D17', marginBottom: '10px' }}>Protected Portal</h1>
              <p style={{ fontSize: '15px', color: '#59524A' }}>
                This dashboard is restricted to authorized <strong>Lalitpur Municipality Officers</strong>.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 600, fontSize: '15px', cursor: 'pointer', border: 'none', transition: 'filter 200ms' }}
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

  // Prepare chart data
  const categoryData = issues.reduce((acc: any[], issue) => {
    const existing = acc.find(a => a.name === issue.category.replace(/_/g, ' '));
    if (existing) existing.count++;
    else acc.push({ name: issue.category.replace(/_/g, ' '), count: 1 });
    return acc;
  }, []);

  const statusData = [
    { name: 'Reported', value: issues.filter(i => i.status === 'REPORTED').length, color: '#D6CFC0' },
    { name: 'Critical', value: issues.filter(i => i.status === 'CRITICAL').length, color: '#C1592B' },
    { name: 'In Progress', value: issues.filter(i => i.status === 'IN_PROGRESS').length, color: '#B8720B' },
    { name: 'Resolved', value: issues.filter(i => i.status === 'RESOLVED').length, color: '#0F6E64' },
  ].filter(d => d.value > 0);

  const tabs = [
    { id: 'dispatch' as const, label: 'Dispatch Console', icon: Building2 },
    { id: 'analytics' as const, label: 'Analytics & Charts', icon: BarChart3 },
    { id: 'tenders' as const, label: 'Vendor Tenders', icon: FileText },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
      <Navbar criticalCount={stats?.criticalIssues || 0} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-10" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', padding: '36px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="sm:flex-row sm:items-center sm:justify-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '28px', backgroundColor: '#E1F0EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 style={{ width: '28px', height: '28px', color: '#0F6E64' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#211D17', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>Municipal Dispatch Console</h1>
              <p style={{ fontSize: '15px', color: '#59524A', marginTop: '4px' }}>Official Workorder Dispatch, Vendor Coordination & Analytics</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <ExportButton reportType="issues_summary" label="Export Report" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, padding: '10px 20px', borderRadius: '8px', backgroundColor: '#F5F1E9', color: '#211D17', border: '1px solid #D6CFC0' }}>
              <ShieldCheck style={{ width: '18px', height: '18px', color: '#0F6E64' }} />
              <span>{currentUser.name}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          {[
            { label: 'Total Reports', value: stats?.totalIssues || 0, color: '#0F6E64', bg: '#E1F0EA', icon: TrendingUp },
            { label: 'Critical Alerts', value: stats?.criticalIssues || 0, color: '#C1592B', bg: '#FBEAE1', icon: AlertTriangle },
            { label: 'In Progress', value: stats?.inProgressIssues || 0, color: '#B8720B', bg: '#FBEEDD', icon: Clock },
            { label: 'Resolved', value: stats?.resolvedIssues || 0, color: '#0F6E64', bg: '#E1F0EA', icon: CheckCircle2 },
            { label: 'Resolution Rate', value: `${stats?.resolutionRate || 0}%`, color: '#0F6E64', bg: '#E1F0EA', icon: ShieldCheck },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: '14px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon style={{ width: '22px', height: '22px', color: card.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#59524A', fontWeight: 500, marginBottom: '4px' }}>{card.label}</p>
                  <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: card.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{card.value}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Critical Escalations */}
        {criticalEscalations.length > 0 && (
          <div style={{ padding: '28px', borderRadius: '14px', backgroundColor: '#FBEAE1', border: '1px solid #C1592B', color: '#7A331A' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle style={{ width: '24px', height: '24px', color: '#C1592B' }} />
                <h3 style={{ fontWeight: 600, fontSize: '18px', color: '#7A331A', fontFamily: 'var(--font-display)' }}>High-Priority Escalated Dispatch Alert</h3>
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#FFFFFF', color: '#C1592B', border: '1px solid #C1592B' }}>
                {criticalEscalations.length} Action Required
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {criticalEscalations.map((item) => (
                <div key={item.id} style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
                  <div className="min-w-0">
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#211D17', marginBottom: '6px' }} className="line-clamp-1">{item.title}</h4>
                    <p style={{ fontSize: '13px', color: '#59524A', marginBottom: '8px' }} className="truncate">📍 {item.address}</p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#C1592B', fontWeight: 600 }}>👍 {item.netUpvotes} Upvotes</span>
                      <button
                        onClick={() => setShowVendorsFor(item)}
                        style={{ fontSize: '12px', color: '#0F6E64', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        <Store style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                        Find Vendors
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedIssue(item); setNewStatus('IN_PROGRESS'); }}
                    style={{ padding: '10px 18px', borderRadius: '8px', backgroundColor: '#C1592B', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'filter 200ms' }}
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

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px', padding: '6px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  backgroundColor: activeTab === tab.id ? '#0F6E64' : 'transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : '#59524A',
                }}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dispatch Tab */}
        {activeTab === 'dispatch' && (
          <>
            {/* Filter Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Filter style={{ width: '20px', height: '20px', color: '#0F6E64' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#211D17' }}>Filter Workorders:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
                {[
                  { id: 'ALL', label: 'All Workorders' },
                  { id: 'CRITICAL', label: '🔴 Critical' },
                  { id: 'REPORTED', label: '🔵 Pending' },
                  { id: 'IN_PROGRESS', label: '🟠 In Progress' },
                  { id: 'RESOLVED', label: '🟢 Resolved' },
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
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Issues Table */}
            <div style={{ borderRadius: '14px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#EFE9DC', borderBottom: '1px solid #D6CFC0', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#59524A', fontWeight: 600 }}>
                      <th className="py-5 px-6">Issue Details</th>
                      <th className="py-5 px-6">Category</th>
                      <th className="py-5 px-6">Votes</th>
                      <th className="py-5 px-6">Status</th>
                      <th className="py-5 px-6">Date</th>
                      <th className="py-5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '14px' }}>
                    {issues.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '60px 0', textAlign: 'center', color: '#59524A' }}>No workorders found under current filter.</td>
                      </tr>
                    ) : (
                      issues.map((issue) => (
                        <tr 
                          key={issue.id} 
                          style={{ borderBottom: '1px solid #D6CFC0', backgroundColor: '#FFFFFF', transition: 'background-color 200ms' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F1E9'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                        >
                          <td className="py-5 px-6 max-w-xs">
                            <div style={{ fontWeight: 600, color: '#211D17', marginBottom: '6px' }} className="line-clamp-1">{issue.title}</div>
                            <div style={{ fontSize: '13px', color: '#59524A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin style={{ width: '14px', height: '14px', color: '#0F6E64', flexShrink: 0 }} />
                              <span className="truncate">{issue.address}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span style={{ padding: '5px 14px', borderRadius: '9999px', backgroundColor: '#EFE9DC', color: '#59524A', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {issue.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span style={{ fontWeight: 600, fontSize: '14px', color: issue.netUpvotes >= 3 ? '#C1592B' : '#0F6E64' }}>
                              👍 {issue.netUpvotes}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span style={{
                              padding: '5px 14px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: STATUS_COLORS[issue.status] || '#EFE9DC',
                              color: STATUS_TEXT_COLORS[issue.status] || '#59524A',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em'
                            }}>
                              {issue.status}
                            </span>
                          </td>
                          <td className="py-5 px-6" style={{ color: '#59524A', fontSize: '13px' }}>
                            {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setShowVendorsFor(issue)}
                                style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'transparent', color: '#B8720B', border: '1px solid #B8720B', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 200ms' }}
                                title="Find nearby vendors"
                              >
                                <Store style={{ width: '14px', height: '14px' }} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setNewStatus(issue.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS');
                                  setNotes(issue.resolutionNotes || '');
                                }}
                                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'transparent', color: '#0F6E64', border: '1px solid #0F6E64', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 200ms' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0F6E64'; e.currentTarget.style.color = '#FFFFFF'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#0F6E64'; }}
                              >
                                Update
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div id="analytics-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Category Chart */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #D6CFC0', padding: '32px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#211D17', fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Issues by Category</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D6CFC0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #D6CFC0' }} />
                  <Bar dataKey="count" fill="#0F6E64" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Pie Chart */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #D6CFC0', padding: '32px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#211D17', fontFamily: 'var(--font-display)', marginBottom: '24px' }}>Status Distribution</h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Export Section */}
            <div style={{ gridColumn: '1 / -1', backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #D6CFC0', padding: '32px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#211D17', fontFamily: 'var(--font-display)', marginBottom: '8px' }}>Export Analytics Report</h3>
                <p style={{ fontSize: '14px', color: '#59524A' }}>Generate a comprehensive PDF report with all charts, tables, and data visualizations.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <ExportButton reportType="issues_summary" label="Issues Report" />
                <ExportButton reportType="full_report" label="Full Report" />
              </div>
            </div>
          </div>
        )}

        {/* Tenders Tab */}
        {activeTab === 'tenders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #D6CFC0', padding: '32px', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#211D17', fontFamily: 'var(--font-display)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText style={{ width: '22px', height: '22px', color: '#0F6E64' }} />
                Vendor Tender Proposals
              </h3>

              {tenders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '48px 0', color: '#59524A' }}>No tenders submitted yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {tenders.map((tender) => (
                    <div key={tender.id} style={{ padding: '24px', borderRadius: '12px', border: '1px solid #D6CFC0', backgroundColor: '#FAFAF8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '16px', color: '#211D17' }}>{tender.vendor?.companyName || 'Unknown Vendor'}</span>
                            <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, backgroundColor: tender.vendor?.businessType ? '#EFE9DC' : '#F5F1E9', color: '#59524A', textTransform: 'uppercase' }}>
                              {(tender.vendor?.businessType || 'N/A').replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#59524A' }}>
                            For: <strong>{tender.issue?.title || 'Unknown Issue'}</strong>
                          </p>
                        </div>
                        <span style={{
                          padding: '5px 14px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          backgroundColor: tender.status === 'ACCEPTED' ? '#E1F0EA' : tender.status === 'REJECTED' ? '#FBE3E0' : '#FBEEDD',
                          color: tender.status === 'ACCEPTED' ? '#0B5850' : tender.status === 'REJECTED' ? '#8C2A22' : '#7A5108',
                        }}>
                          {tender.status}
                        </span>
                      </div>

                      <p style={{ fontSize: '14px', color: '#211D17', marginBottom: '16px', lineHeight: 1.6, backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid #EFE9DC' }}>
                        {tender.proposalText}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                          <span style={{ color: '#59524A' }}>💰 <strong style={{ color: '#211D17' }}>Rs. {tender.estimatedCostNpr?.toLocaleString()}</strong></span>
                          <span style={{ color: '#59524A' }}>📅 <strong style={{ color: '#211D17' }}>{tender.estimatedDays} days</strong></span>
                        </div>
                        {tender.status === 'SUBMITTED' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleTenderAction(tender.id, 'ACCEPTED', 'Approved by municipal admin')}
                              style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleTenderAction(tender.id, 'REJECTED', 'Rejected by municipal admin')}
                              style={{ padding: '8px 18px', borderRadius: '6px', backgroundColor: 'transparent', color: '#B3261E', fontSize: '13px', fontWeight: 600, border: '1px solid #B3261E', cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Nearby Vendors Modal */}
      {showVendorsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(33,29,23,0.4)', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: '100%', maxWidth: '560px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #D6CFC0', padding: '32px', boxShadow: '0 12px 32px rgba(15,110,100,0.12)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#211D17', fontFamily: 'var(--font-display)' }}>
                Vendors Near: {showVendorsFor.title.substring(0, 40)}...
              </h3>
              <button onClick={() => setShowVendorsFor(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#59524A' }}>✕</button>
            </div>
            <NearbyVendorsPanel issueLat={showVendorsFor.locationLat} issueLng={showVendorsFor.locationLng} issueId={showVendorsFor.id} />
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(33,29,23,0.4)', backdropFilter: 'blur(2px)' }}>
          <div style={{ width: '100%', maxWidth: '560px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #D6CFC0', padding: '36px', boxShadow: '0 12px 32px rgba(15,110,100,0.12)' }} className="space-y-6">
            
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#211D17', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-display)' }}>
              <Building2 style={{ width: '24px', height: '24px', color: '#0F6E64' }} />
              Update Workorder #{selectedIssue.id.slice(0,8)}
            </h3>

            <div style={{ padding: '20px', borderRadius: '10px', backgroundColor: '#F5F1E9', border: '1px solid #D6CFC0', fontSize: '14px' }} className="space-y-2">
              <p style={{ fontWeight: 600, color: '#211D17' }}>{selectedIssue.title}</p>
              <p style={{ color: '#59524A', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin style={{width: '14px', height: '14px', color: '#0F6E64'}} /> {selectedIssue.address}</p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#211D17', marginBottom: '8px' }}>Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '14px', color: '#211D17' }}
                >
                  <option value="REPORTED">Pending (Reported)</option>
                  <option value="IN_PROGRESS">In Progress (Crew Dispatched)</option>
                  <option value="RESOLVED">Resolved & Verified</option>
                  <option value="CRITICAL">Critical Problem</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#211D17', marginBottom: '8px' }}>Resolution Notes</label>
                <textarea
                  rows={4}
                  placeholder="Enter dispatch details, crew vehicle ID, or actions taken..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '14px', color: '#211D17', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', paddingTop: '16px', borderTop: '1px solid #D6CFC0' }}>
                <button type="button" onClick={() => setSelectedIssue(null)} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, color: '#59524A', backgroundColor: 'transparent', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'filter 200ms' }}
                >
                  {submitting ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

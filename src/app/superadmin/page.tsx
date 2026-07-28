'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Shield, Users, Building2, TrendingUp, FileText, Download, 
  Check, X, ChevronDown, BarChart3, Eye, AlertTriangle, MapPin, Megaphone 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

const exportPDF = async (data: any) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Health & Sanitation Platform Report', 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  // Stats summary
  doc.setFontSize(14);
  doc.text('Platform Summary', 14, 45);
  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: [
      ['Total Users', data.totalUsers || 0],
      ['Total Issues', data.totalIssues || 0],
      ['Resolution Rate', (data.resolutionRate || 0) + '%'],
      ['Total Vendors', data.totalVendors || 0],
      ['Active Ads', data.activeAds || 0],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 110, 100] }
  });
  
  // Issues by category table
  if (data.issuesByCategory) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Issues by Category', 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['Category', 'Count']],
      body: data.issuesByCategory.map((c: any) => [c.category.replace(/_/g, ' '), c.count]),
      theme: 'grid',
      headStyles: { fillColor: [15, 110, 100] }
    });
  }
  
  // Capture Charts
  const chartElement = document.getElementById('analytics-charts');
  if (chartElement) {
    try {
      const canvas = await html2canvas(chartElement, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Analytics Charts', 14, 20);
      
      const pdfWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const maxImgWidth = pdfWidth - margin * 2;
      const imgWidth = maxImgWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight);
    } catch (err) {
      console.error('Failed to capture charts', err);
    }
  }
  
  doc.save(`PublicCare-Superadmin-${new Date().toISOString().split('T')[0]}.pdf`);
};

export default function SuperadminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Data states
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  
  // Chart data
  const [issuesByCategory, setIssuesByCategory] = useState<any[]>([]);
  const [issuesByStatus, setIssuesByStatus] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.success && data.user && data.user.role === 'superadmin') {
          setCurrentUser(data.user);
          fetchAllData();
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetchData();
  }, [router]);

  const fetchAllData = async () => {
    try {
      // Fetch users and stats
      const usersRes = await fetch('/api/superadmin').catch(() => null);
      if (usersRes?.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        if (usersData.stats) setStats(usersData.stats);
        if (usersData.issuesByCategory) setIssuesByCategory(usersData.issuesByCategory);
        if (usersData.issuesByStatus) setIssuesByStatus(usersData.issuesByStatus);
        if (usersData.monthlyTrend) setMonthlyTrend(usersData.monthlyTrend);
      } else {
         // Fallback dummy data for visualization
         setStats({
            users: { total: 1542, byRole: { user: 1200, admin: 42, vendor: 300 } },
            issues: { total: 856, reported: 320, critical: 86, inProgress: 250, resolved: 200 },
            vendors: { total: 300, approved: 250, pending: 50 },
            ads: { total: 300, active: 120, pending: 180 },
            tenders: { total: 120, accepted: 45 }
        });
        setIssuesByCategory([
            { category: 'Pothole', count: 120 },
            { category: 'Water_Leak', count: 85 },
            { category: 'Street_Light', count: 210 },
            { category: 'Garbage', count: 180 },
            { category: 'Noise', count: 40 },
        ]);
        setIssuesByStatus([
            { name: 'REPORTED', value: 320, color: '#EFE9DC' },
            { name: 'CRITICAL', value: 86, color: '#FBE3E0' },
            { name: 'IN_PROGRESS', value: 250, color: '#FBEEDD' },
            { name: 'RESOLVED', value: 200, color: '#E1F0EA' },
        ]);
        setMonthlyTrend([
            { month: 'Jan', issues: 45 },
            { month: 'Feb', issues: 60 },
            { month: 'Mar', issues: 110 },
            { month: 'Apr', issues: 90 },
            { month: 'May', issues: 150 },
            { month: 'Jun', issues: 130 },
        ]);
      }
      
      const vendorsRes = await fetch('/api/v1/vendors').catch(() => null);
      if (vendorsRes?.ok) {
        const vData = await vendorsRes.json();
        setVendors(vData.vendors || []);
      }
      
      const adsRes = await fetch('/api/v1/ads').catch(() => null);
      if (adsRes?.ok) {
        const aData = await adsRes.json();
        setAds(aData.ads || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (targetId: string, newRole: string) => {
    try {
      await fetch('/api/superadmin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_ROLE', targetId, newRole })
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVendorApproval = async (id: string, isApproved: boolean) => {
    try {
      await fetch(`/api/v1/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveVendor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this vendor? This will also remove their ads and tenders.')) return;
    try {
      await fetch(`/api/v1/vendors/${id}`, {
        method: 'DELETE'
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--surface)' }}>Loading...</div>;
  }

  if (!currentUser) return null;

  const tabs = ['Overview', 'Users', 'Vendors', 'Ads', 'Export'];

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'var(--font-body)' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '40px' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--on-surface)', fontWeight: 700 }}>Superadmin Dashboard</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.1rem', marginTop: '8px' }}>Manage the Health & Sanitation platform at a glance.</p>
        </header>

        <nav style={{ display: 'flex', gap: '16px', marginBottom: '40px', borderBottom: '1px solid var(--outline-variant)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 24px',
                fontSize: '1rem',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <Users size={32} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--on-surface)', margin: 0 }}>Total Users</h3>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--on-surface)' }}>{stats.users?.total}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                  <span>Citizens: {stats.users?.byRole?.user || 0}</span>
                  <span>Admins: {stats.users?.byRole?.municipality_admin || 0}</span>
                  <span>Vendors: {stats.users?.byRole?.vendor || 0}</span>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <AlertTriangle size={32} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--on-surface)', margin: 0 }}>Total Issues</h3>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--on-surface)' }}>{stats.issues?.total}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                  <span>Reported: {stats.issues?.reported}</span>
                  <span>Critical: {stats.issues?.critical}</span>
                  <span>In-progress: {stats.issues?.inProgress}</span>
                  <span>Resolved: {stats.issues?.resolved}</span>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <Building2 size={32} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--on-surface)', margin: 0 }}>Total Vendors</h3>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--on-surface)' }}>{stats.vendors?.total}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                  <span>Approved: {stats.vendors?.approved}</span>
                  <span>Pending: {stats.vendors?.pending}</span>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <Megaphone size={32} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--on-surface)', margin: 0 }}>Ads & Tenders</h3>
                </div>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--on-surface)' }}>{stats.ads?.total}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                  <span>Active Ads: {stats.ads?.active}</span>
                  <span>Accepted Tenders: {stats.tenders?.accepted}</span>
                </div>
              </div>
            </div>

            <div id="analytics-charts" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Issues by Category</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={issuesByCategory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                      <XAxis dataKey="category" tick={{ fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{ fill: 'var(--surface-container)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--outline-variant)' }} />
                      <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Issues by Status</h3>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={issuesByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {issuesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--outline-variant)' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Monthly Trend</h3>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                      <XAxis dataKey="month" tick={{ fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--on-surface-variant)' }} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--outline-variant)' }} />
                      <Line type="monotone" dataKey="issues" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>User Management</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
                    <th style={{ padding: '16px' }}>Name</th>
                    <th style={{ padding: '16px' }}>Email</th>
                    <th style={{ padding: '16px' }}>Role</th>
                    <th style={{ padding: '16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td style={{ padding: '16px', color: 'var(--on-surface)' }}>{user.name}</td>
                      <td style={{ padding: '16px', color: 'var(--on-surface)' }}>{user.email}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={badgeStyle}>{user.role}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <select 
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', background: 'var(--surface)' }}
                        >
                          <option value="user">User</option>
                          <option value="municipality_admin">Municipality Admin</option>
                          <option value="vendor">Vendor</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                        No users found or could not load users.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Vendors' && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Vendor Management</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
                    <th style={{ padding: '16px' }}>Vendor Name</th>
                    <th style={{ padding: '16px' }}>Service Area</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map(vendor => (
                    <tr key={vendor.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td style={{ padding: '16px', color: 'var(--on-surface)' }}>{vendor.companyName}</td>
                      <td style={{ padding: '16px', color: 'var(--on-surface)' }}>{vendor.address}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ ...badgeStyle, backgroundColor: vendor.isApproved ? 'var(--success)' : 'var(--warning)', color: 'white' }}>
                          {vendor.isApproved ? 'APPROVED' : 'PENDING'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                        {!vendor.isApproved && (
                          <button 
                            onClick={() => handleVendorApproval(vendor.id, true)}
                            style={{ ...buttonStyle, backgroundColor: 'var(--success)', color: 'white', padding: '8px 16px' }}
                          >
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleRemoveVendor(vendor.id)}
                          style={{ ...buttonStyle, backgroundColor: 'var(--error)', color: 'white', padding: '8px 16px' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {vendors.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                        No vendors found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Ads' && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Ad Management</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
                    <th style={{ padding: '16px' }}>Ad Title</th>
                    <th style={{ padding: '16px' }}>Advertiser</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Stats</th>
                  </tr>
                </thead>
                <tbody>
                  {ads.map(ad => (
                    <tr key={ad.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td style={{ padding: '16px', color: 'var(--on-surface)' }}>{ad.title}</td>
                      <td style={{ padding: '16px', color: 'var(--on-surface)' }}>{ad.vendor?.companyName || 'Unknown Vendor'}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={badgeStyle}>{!ad.isApproved ? 'PENDING' : ad.isActive ? 'ACTIVE' : 'PAUSED'}</span>
                      </td>
                      <td style={{ padding: '16px', color: 'var(--on-surface-variant)' }}>
                        {ad.impressions || 0} views, {ad.clicks || 0} clicks
                      </td>
                    </tr>
                  ))}
                  {ads.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                        No ads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Export' && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '64px 32px' }}>
            <FileText size={64} color="var(--primary)" style={{ margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: '2rem', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>Export Platform Data</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto 40px' }}>
              Generate a comprehensive PDF report containing platform usage statistics, issue breakdowns, and overall performance metrics.
            </p>
            <button 
              onClick={() => exportPDF({
                totalUsers: stats.users?.total,
                totalIssues: stats.issues?.total,
                resolutionRate: Math.round((stats.issues?.resolved / Math.max(stats.issues?.total, 1)) * 100) || 0,
                totalVendors: stats.vendors?.total,
                activeAds: stats.ads?.active,
                issuesByCategory
              })}
              style={{ ...buttonStyle, fontSize: '1.25rem', padding: '16px 32px', display: 'inline-flex', alignItems: 'center', gap: '12px' }}
            >
              <Download size={24} />
              Export Platform Report
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #D6CFC0',
  borderRadius: '12px',
  padding: '32px',
  boxShadow: 'var(--shadow-level-1, 0 4px 16px rgba(33,29,23,0.06))'
};

const badgeStyle = {
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '9999px',
  backgroundColor: 'var(--surface-container)',
  color: 'var(--on-surface)',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase' as const
};

const buttonStyle = {
  backgroundColor: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

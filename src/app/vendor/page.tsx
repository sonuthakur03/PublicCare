'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Store, MapPin, Megaphone, FileText, TrendingUp, Eye, MousePointer2, Clock, CheckCircle, XCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function VendorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authRes = await fetch('/api/auth');
        const authData = await authRes.json();
        
        if (!authData.success || authData.user.role !== 'vendor') {
          router.push('/login');
          return;
        }
        setUser(authData.user);

        // Fetch vendor profile
        const vendorRes = await fetch('/api/v1/vendors');
        const vendorData = await vendorRes.json();
        const myVendor = (vendorData.vendors || []).find((v: any) => v.userId === authData.user.id);
        setVendor(myVendor);

        if (myVendor) {
          // Fetch issues
          fetch('/api/v1/issues').then(r => r.json()).then(d => setIssues(d.issues || []));
          // Fetch ads
          fetch(`/api/v1/ads?vendorId=${myVendor.id}`).then(r => r.json()).then(d => setAds(d.ads || []));
          // Fetch tenders
          fetch(`/api/v1/tenders?vendorId=${myVendor.id}`).then(r => r.json()).then(d => setTenders(d.tenders || []));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const pendingTenders = tenders.filter(t => t.status === 'SUBMITTED').length;
  const acceptedTenders = tenders.filter(t => t.status === 'ACCEPTED').length;

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Section 1: Welcome Header */}
        <section style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '28px', color: 'var(--primary)', marginBottom: '8px' }}>
                Welcome, {vendor?.companyName || user?.name || 'Vendor'}
              </h1>
              <p style={{ color: 'var(--on-surface-variant)' }}>
                {vendor?.businessType || 'Service Provider'} Dashboard
              </p>
            </div>
            {vendor?.isApproved === false ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#FFF4E5', color: 'var(--warning)', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <AlertTriangle size={16} /> Pending Approval
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#E6F4EA', color: 'var(--success)', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <CheckCircle size={16} /> Approved Vendor
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Stats Cards */}
        <section style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          {[
            { label: 'Nearby Issues', value: issues.length, icon: <MapPin size={24} color="var(--primary)" /> },
            { label: 'Active Ads', value: ads.filter(a => a.isActive).length, icon: <Megaphone size={24} color="var(--accent)" /> },
            { label: 'Pending / Accepted Tenders', value: `${pendingTenders} / ${acceptedTenders}`, icon: <FileText size={24} color="var(--tertiary)" /> },
            { label: 'Total Ad Impressions', value: totalImpressions, icon: <Eye size={24} color="var(--primary)" /> }
          ].map((stat, i) => (
            <div key={i} style={{ flex: '1 1 200px', backgroundColor: 'var(--surface-container-lowest)', padding: '24px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'var(--surface-container)', padding: '12px', borderRadius: '8px' }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--on-surface)' }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {/* Section 3: Nearby Issues Map (List version for simple rendering) */}
          <section style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-1)' }}>
            <h2 style={{ fontSize: '20px', fontFamily: '"Space Grotesk", sans-serif', color: 'var(--primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} /> Nearby Issues
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {issues.slice(0, 4).map((issue: any) => (
                <div key={issue.id} style={{ padding: '16px', border: '1px solid var(--outline-variant)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 'bold', color: 'var(--on-surface)' }}>{issue.title}</h3>
                    <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '9999px', backgroundColor: 'var(--surface-container)', textTransform: 'uppercase' }}>{issue.category}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginBottom: '16px' }}>{issue.address}</p>
                  <Link href={`/vendor/tenders?issueId=${issue.id}`}>
                    <button style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      Submit Tender <ArrowRight size={16} />
                    </button>
                  </Link>
                </div>
              ))}
              {issues.length === 0 && <p style={{ color: 'var(--on-surface-variant)' }}>No nearby issues found.</p>}
            </div>
          </section>

          {/* Section 4 & 5 Wrap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Section 4: My Ads Preview */}
            <section style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontFamily: '"Space Grotesk", sans-serif', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={20} /> My Ads Overview
                </h2>
                <Link href="/vendor/ads" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>Manage All Ads</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ads.slice(0, 3).map(ad => (
                  <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'var(--surface-container-low)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--on-surface)' }}>{ad.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={12}/> {ad.impressions || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MousePointer2 size={12}/> {ad.clicks || 0}</span>
                      </div>
                    </div>
                    <div>
                      {ad.isActive ? <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 'bold' }}>ACTIVE</span> : <span style={{ color: 'var(--on-surface-variant)', fontSize: '11px', fontWeight: 'bold' }}>PAUSED</span>}
                    </div>
                  </div>
                ))}
                {ads.length === 0 && <p style={{ color: 'var(--on-surface-variant)' }}>You have not created any ads yet.</p>}
              </div>
            </section>

            {/* Section 5: Recent Tenders */}
            <section style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontFamily: '"Space Grotesk", sans-serif', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} /> Recent Tenders
                </h2>
                <Link href="/vendor/tenders" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }}>View All Tenders</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tenders.slice(0, 3).map(tender => (
                  <div key={tender.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--outline-variant)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--on-surface)' }}>Proposal for Issue #{tender.issueId}</div>
                      <div style={{ fontSize: '14px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Cost: Rs. {tender.cost}</div>
                    </div>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold',
                      backgroundColor: tender.status === 'ACCEPTED' ? '#E6F4EA' : tender.status === 'REJECTED' ? '#FCE8E6' : '#FFF4E5',
                      color: tender.status === 'ACCEPTED' ? 'var(--success)' : tender.status === 'REJECTED' ? 'var(--error)' : 'var(--warning)'
                    }}>
                      {tender.status}
                    </span>
                  </div>
                ))}
                {tenders.length === 0 && <p style={{ color: 'var(--on-surface-variant)' }}>No tenders submitted yet.</p>}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

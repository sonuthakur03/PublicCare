'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { FileText, Plus, CheckCircle, Clock, XCircle, AlertTriangle, Flame, Tag, ArrowRight } from 'lucide-react';

function VendorTendersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedIssueId = searchParams?.get('issueId');

  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [tenders, setTenders] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [newTender, setNewTender] = useState({ issueId: preSelectedIssueId || '', proposal: '', cost: '', timeline: '' });

  useEffect(() => {
    if (preSelectedIssueId) setShowModal(true);
  }, [preSelectedIssueId]);

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

        const vendorRes = await fetch('/api/v1/vendors');
        const vendorData = await vendorRes.json();
        const myVendor = (vendorData.vendors || []).find((v: any) => v.userId === authData.user.id);
        setVendor(myVendor);

        if (myVendor) {
          const tendersRes = await fetch(`/api/v1/tenders?vendorId=${myVendor.id}`);
          const tendersData = await tendersRes.json();
          setTenders(tendersData.tenders || []);

          const issuesRes = await fetch('/api/v1/issues');
          const issuesData = await issuesRes.json();
          setIssues(issuesData.data || issuesData.issues || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmitTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      const res = await fetch('/api/v1/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueId: newTender.issueId,
          proposalText: newTender.proposal,
          estimatedCostNpr: Number(newTender.cost),
          estimatedDays: Number(newTender.timeline),
          vendorId: vendor.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setTenders([data.tender, ...tenders]);
        setShowModal(false);
        setNewTender({ issueId: '', proposal: '', cost: '', timeline: '' });
      } else {
        alert(data.error || 'Failed to submit tender');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <PageLoadingScreen isLoading={true} subtitle="Loading your tenders…" />;

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '28px', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={28} /> Tender Management
            </h1>
            <p style={{ color: 'var(--on-surface-variant)' }}>Submit proposals and track your active tenders</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Plus size={20} /> Submit New Tender
          </button>
        </div>

        {vendor?.isApproved === false && (
          <div style={{ padding: '16px', backgroundColor: '#FFF4E5', color: 'var(--warning)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Your vendor profile is pending approval. You may submit tenders, but they won't be awarded until approved.
          </div>
        )}

        {/* Open Civic Hazards Available for Tendering */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontFamily: '"Space Grotesk", sans-serif', fontWeight: 'bold', color: '#211D17', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flame size={24} color="#B3261E" /> Open Sanitation & Health Hazards
              </h2>
              <p style={{ color: '#59524A', fontSize: '14px', marginTop: '4px' }}>
                Select a critical or active health/sanitation problem below to immediately formulate and submit a repair tender.
              </p>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#FBE3E0', color: '#B3261E' }}>
              {issues.filter(i => i.status !== 'RESOLVED').length} Active Hazards
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {issues
              .filter(i => i.status !== 'RESOLVED')
              .sort((a, b) => {
                const aCrit = a.status === 'CRITICAL' || a.upvotes >= 3 ? 1 : 0;
                const bCrit = b.status === 'CRITICAL' || b.upvotes >= 3 ? 1 : 0;
                return bCrit - aCrit || b.upvotes - a.upvotes;
              })
              .map(issue => {
                const isCritical = issue.status === 'CRITICAL' || issue.upvotes >= 3;
                return (
                  <div
                    key={issue.id}
                    style={{
                      backgroundColor: isCritical ? '#FFF8F7' : '#FAF8F4',
                      border: isCritical ? '2px solid #F87171' : '1px solid #D6CFC0',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                      boxShadow: isCritical ? '0 4px 12px rgba(179, 38, 30, 0.08)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', backgroundColor: isCritical ? '#B3261E' : '#0F6E64', color: '#FFFFFF' }}>
                          {isCritical ? '🔥 CRITICAL PRIORITY' : issue.status}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#59524A' }}>
                          👍 {issue.upvotes || 0} Upvotes
                        </span>
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#211D17', marginBottom: '8px', lineHeight: 1.3 }}>
                        {issue.title}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#59524A', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {issue.description}
                      </p>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(214,207,192,0.5)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F6E64', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={14} /> {issue.category.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => {
                          setNewTender({ ...newTender, issueId: issue.id });
                          setShowModal(true);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isCritical ? '#B3261E' : '#0F6E64',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>Bid Tender</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            {issues.filter(i => i.status !== 'RESOLVED').length === 0 && (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#7A7266' }}>
                No active sanitation/health issues available for tendering at this time.
              </div>
            )}
          </div>
        </section>

        {/* Tenders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {['ACCEPTED', 'SUBMITTED', 'REJECTED'].map(statusGroup => {
            const groupTenders = tenders.filter(t => t.status === statusGroup);
            if (groupTenders.length === 0) return null;

            return (
              <section key={statusGroup} style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-1)' }}>
                <h2 style={{ fontSize: '18px', fontFamily: '"Space Grotesk", sans-serif', color: 'var(--on-surface)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {statusGroup === 'ACCEPTED' && <CheckCircle size={20} color="var(--success)" />}
                  {statusGroup === 'SUBMITTED' && <Clock size={20} color="var(--warning)" />}
                  {statusGroup === 'REJECTED' && <XCircle size={20} color="var(--error)" />}
                  {statusGroup} TENDERS
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {groupTenders.map(tender => {
                    const issue = issues.find(i => i.id === tender.issueId);
                    return (
                      <div key={tender.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px', backgroundColor: 'var(--surface-container-low)', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
                        <div style={{ flex: 1, paddingRight: '24px' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--on-surface)', marginBottom: '8px' }}>
                            Issue: {issue?.title || `Issue #${tender.issueId}`}
                          </h3>
                          <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginBottom: '16px' }}>{tender.proposal}</p>
                          <div style={{ display: 'flex', gap: '24px', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                            <div><strong style={{ color: 'var(--on-surface)' }}>Cost:</strong> Rs. {tender.cost}</div>
                            <div><strong style={{ color: 'var(--on-surface)' }}>Timeline:</strong> {tender.timeline}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          
          {tenders.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)', borderRadius: '12px', border: '1px dashed var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--on-surface)' }}>No Tenders Submitted</h3>
              <p>Browse nearby issues and submit your first proposal.</p>
            </div>
          )}
        </div>
      </main>

      {/* Submit Tender Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-level-3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '24px', fontFamily: '"Space Grotesk", sans-serif', color: 'var(--primary)', marginBottom: '24px' }}>Submit Tender Proposal</h2>
            <form onSubmit={handleSubmitTender} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Target Sanitation Issue</label>
                {newTender.issueId ? (
                  <div style={{ padding: '12px', backgroundColor: '#E1F0EA', borderRadius: '8px', border: '1px solid #157F4A', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 700, color: '#157F4A', fontSize: '14px' }}>
                      Selected: {issues.find(i => i.id === newTender.issueId)?.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#59524A', marginTop: '4px' }}>
                      Category: {issues.find(i => i.id === newTender.issueId)?.category}
                    </div>
                  </div>
                ) : null}
                <select required value={newTender.issueId} onChange={e => setNewTender({...newTender, issueId: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }}>
                  <option value="" disabled>-- Choose an open issue --</option>
                  {issues.map(issue => (
                    <option key={issue.id} value={issue.id}>{issue.title} ({issue.category}) - {issue.status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Proposal Description</label>
                <textarea required rows={4} value={newTender.proposal} onChange={e => setNewTender({...newTender, proposal: e.target.value})} placeholder="How will you fix this? Materials used, process..." style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Estimated Cost (Rs)</label>
                <input required type="number" value={newTender.cost} onChange={e => setNewTender({...newTender, cost: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Estimated Timeline</label>
                <input required type="text" value={newTender.timeline} onChange={e => setNewTender({...newTender, timeline: e.target.value})} placeholder="e.g., 2 weeks, 3 days" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', cursor: 'pointer', fontWeight: 'bold' }}>Submit Proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorTendersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center font-semibold text-[#59524A]">Loading Tenders...</div>}>
      <VendorTendersContent />
    </Suspense>
  );
}

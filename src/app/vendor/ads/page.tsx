'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { Megaphone, Plus, Eye, MousePointer2, AlertTriangle, Play, Pause, Trash2, Upload } from 'lucide-react';

export default function VendorAdsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', description: '', imageUrl: '', linkUrl: '', placement: 'FEED' });
  const [uploading, setUploading] = useState(false);

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
          const adsRes = await fetch(`/api/v1/ads?vendorId=${myVendor.id}`);
          const adsData = await adsRes.json();
          setAds(adsData.ads || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    try {
      const res = await fetch('/api/v1/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAd, vendorId: vendor.id })
      });
      const data = await res.json();
      if (data.success) {
        setAds([data.ad, ...ads]);
        setShowModal(false);
        setNewAd({ title: '', description: '', imageUrl: '', linkUrl: '', placement: 'FEED' });
      } else {
        alert(data.error || 'Failed to create ad');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setNewAd(prev => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleAd = async (adId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/ads/${adId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAds(ads.map(ad => ad.id === adId ? { ...ad, isActive: !currentStatus } : ad));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAd = async (adId: number) => {
    if (!confirm('Are you sure you want to permanently remove this ad?')) return;
    try {
      const res = await fetch(`/api/v1/ads/${adId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setAds(ads.filter(ad => ad.id !== adId));
      } else {
        alert(data.error || 'Failed to delete ad');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <PageLoadingScreen isLoading={true} subtitle="Loading your ads…" />;

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '28px', color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={28} /> Ad Management
            </h1>
            <p style={{ color: 'var(--on-surface-variant)' }}>Create and monitor your local business advertisements</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Plus size={20} /> Create New Ad
          </button>
        </div>

        {vendor?.isApproved === false && (
          <div style={{ padding: '16px', backgroundColor: '#FFF4E5', color: 'var(--warning)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} /> Your vendor profile is pending approval. Ads will not be shown to users until approved.
          </div>
        )}

        {/* Ads Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '32px' }}>
          {ads.map(ad => (
            <div key={ad.id} style={{ backgroundColor: 'var(--surface-container-lowest)', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', backgroundColor: 'var(--surface-container)', position: 'relative' }}>
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--on-surface-variant)' }}>No Image Provided</div>
                )}
                <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold', backgroundColor: ad.isApproved ? '#E6F4EA' : '#FFF4E5', color: ad.isApproved ? 'var(--success)' : 'var(--warning)' }}>
                  {ad.isApproved ? 'APPROVED' : 'PENDING'}
                </div>
              </div>
              
              <div style={{ padding: '24px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--on-surface)' }}>{ad.title}</h3>
                  <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>{ad.placement}</span>
                </div>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginBottom: '24px', minHeight: '40px' }}>{ad.description}</p>
                
                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--outline-variant)', borderBottom: '1px solid var(--outline-variant)', padding: '16px 0', marginBottom: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--on-surface-variant)', fontSize: '12px', marginBottom: '4px' }}><Eye size={14}/> Impressions</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--on-surface)' }}>{ad.impressions || 0}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--on-surface-variant)', fontSize: '12px', marginBottom: '4px' }}><MousePointer2 size={14}/> Clicks</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--on-surface)' }}>{ad.clicks || 0}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => handleToggleAd(ad.id, ad.isActive)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px', border: `1px solid ${ad.isActive ? 'var(--outline-variant)' : 'var(--primary)'}`, backgroundColor: ad.isActive ? 'var(--surface-container)' : 'var(--primary)', color: ad.isActive ? 'var(--on-surface)' : 'var(--on-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {ad.isActive ? <><Pause size={16} /> Pause Ad</> : <><Play size={16} /> Activate Ad</>}
                  </button>
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
                    style={{ color: '#B3261E', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {ads.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)', borderRadius: '12px', border: '1px dashed var(--outline-variant)', color: 'var(--on-surface-variant)' }}>
              <Megaphone size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--on-surface)' }}>No Ads Yet</h3>
              <p>Create your first advertisement to reach the local community.</p>
            </div>
          )}
        </div>
      </main>

      {/* Create Ad Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-level-3)' }}>
            <h2 style={{ fontSize: '24px', fontFamily: '"Space Grotesk", sans-serif', color: 'var(--primary)', marginBottom: '24px' }}>Create New Ad</h2>
            <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Ad Title</label>
                <input required type="text" value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Description</label>
                <textarea required rows={3} value={newAd.description} onChange={e => setNewAd({...newAd, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Ad Media (Image)</label>
                {newAd.imageUrl ? (
                  <div style={{ marginBottom: '8px', position: 'relative', width: '100%', height: '120px', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src={newAd.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setNewAd({...newAd, imageUrl: ''})} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Change</button>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <input type="file" accept="image/*" onChange={handleFileUpload} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px dashed var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)', cursor: 'pointer' }} disabled={uploading} />
                    {uploading && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', color: 'var(--primary)' }}>Uploading...</div>}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Target Link (URL)</label>
                <input required type="url" value={newAd.linkUrl} onChange={e => setNewAd({...newAd, linkUrl: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Placement</label>
                <select value={newAd.placement} onChange={e => setNewAd({...newAd, placement: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }}>
                  <option value="FEED">News Feed</option>
                  <option value="SIDEBAR">Sidebar</option>
                  <option value="BANNER">Banner</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', cursor: 'pointer', fontWeight: 'bold' }}>Submit Ad</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import InteractiveMapPicker from '@/components/InteractiveMapPicker';
import { IssueCategory, User } from '@/types';
import { MapPin, Camera, AlertCircle, Check, Loader2, ArrowLeft, UploadCloud, Lock, LogIn } from 'lucide-react';

export default function RaiseIssuePage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssueCategory>('GARBAGE_DUMP');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [locationLat, setLocationLat] = useState<number>(27.6727);
  const [locationLng, setLocationLng] = useState<number>(85.3253);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setReporterName(data.user.name);
          setReporterContact(data.user.email);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLocationSelect = (lat: number, lng: number, addressHint: string) => {
    setLocationLat(lat);
    setLocationLng(lng);
    if (!address || address.startsWith('Near') || address === 'Lalitpur Ward Area') {
      setAddress(addressHint);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!title || !description || !address) {
      setError('Please complete all required fields (title, category, description, and location).');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/v1/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          description,
          address,
          locationLat,
          locationLng,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
          reporterName: reporterName || currentUser.name,
          reporterContact
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');

      setSuccessMsg('✅ Hygiene issue successfully reported! Redirecting to Lalitpur Community Map...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error submitting report');
      setSubmitting(false);
    }
  };

  const categories: { label: string; value: IssueCategory }[] = [
    { label: 'Garbage Dump / Solid Waste Heap', value: 'GARBAGE_DUMP' },
    { label: 'Clogged Sewage / Storm Drain Overflow', value: 'SEWAGE_OVERFLOW' },
    { label: 'Water Contamination / Pipe Leak', value: 'WATER_CONTAMINATION' },
    { label: 'Illegal Dumping / Chemical Spill', value: 'ILLEGAL_DUMPING' },
    { label: 'Public Toilet Unhygienic State', value: 'PUBLIC_TOILET' },
    { label: 'Dead Animal Hazard', value: 'DEAD_ANIMAL' },
    { label: 'Other Hygiene & Waste Concern', value: 'OTHER' },
  ];

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p style={{ fontSize: '12px', color: '#59524A' }} className="animate-pulse">Verifying Citizen Authentication...</p>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center space-y-4">
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
            <Lock style={{ width: '32px', height: '32px', color: '#0F6E64' }} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: '#211D17' }}>Sign In Required to Raise Report</h1>
          <p style={{ fontSize: '12px', color: '#59524A' }}>
            Please sign in or create a citizen account to pin and report hygiene issues in Lalitpur Municipality.
          </p>
          <button
            onClick={() => router.push('/login')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer', marginTop: '16px' }}
          >
            <LogIn style={{ width: '16px', height: '16px' }} />
            <span>Sign In to Continue</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F4', color: '#211D17', fontFamily: 'var(--font-body)' }}>
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#59524A', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span>Back to Lalitpur Feed</span>
          </button>

          <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '9999px', backgroundColor: '#E1F0EA', color: '#0B5850', border: '1px solid #157F4A' }}>
            Lalitpur Citizen Portal
          </span>
        </div>

        <div style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} className="space-y-2">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#211D17', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-display)' }}>
            <MapPin style={{ width: '24px', height: '24px', color: '#0F6E64' }} />
            Raise a Municipal Hygiene Report
          </h1>
          <p style={{ fontSize: '12px', color: '#59524A' }}>
            Pin the location on the Lalitpur map below and upload photo evidence. Reports with ≥ 3 upvotes automatically escalate to Critical status for sanitation crew dispatch.
          </p>
        </div>

        {error && (
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#FBE3E0', border: '1px solid #B3261E', color: '#8C2A22', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#E1F0EA', border: '1px solid #157F4A', color: '#0B5850', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Check style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: '24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#211D17', marginBottom: '6px' }}>Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Garbage Heap blocking Mangal Bazar Walkway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '14px', color: '#211D17' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#211D17', marginBottom: '6px' }}>Hygiene & Waste Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '14px', color: '#211D17' }}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#211D17', marginBottom: '6px' }}>Detailed Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the problem, odor severity, public hazard, or obstruction level..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '14px', color: '#211D17', resize: 'vertical' }}
            />
          </div>

          <div style={{ paddingTop: '16px', borderTop: '1px solid #D6CFC0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#211D17' }}>
              Select Location on Lalitpur Map *
            </label>

            <InteractiveMapPicker
              onLocationSelect={handleLocationSelect}
              initialLat={locationLat}
              initialLng={locationLng}
            />

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#59524A', marginBottom: '4px' }}>Landmark / Street Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. Near Patan Durbar Square Heritage Entrance, Ward 16"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '10px 16px', borderRadius: '12px', backgroundColor: '#FFFFFF', border: '1px solid #D6CFC0', fontSize: '12px', color: '#211D17' }}
              />
            </div>
          </div>

          <div style={{ paddingTop: '16px', borderTop: '1px solid #D6CFC0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#211D17' }}>Photo Evidence (Cloudinary Upload)</label>
            
            <div style={{ position: 'relative', border: '2px dashed #D6CFC0', borderRadius: '12px', padding: '24px', textAlign: 'center', backgroundColor: '#F5F1E9', cursor: 'pointer' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />

              {previewUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <img src={previewUrl} alt="Preview" style={{ width: '144px', height: '144px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #0F6E64', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }} />
                  <span style={{ fontSize: '12px', color: '#0F6E64', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {uploadingImage ? <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" /> : <Check style={{ width: '14px', height: '14px' }} />}
                    {uploadingImage ? 'Uploading to Cloudinary...' : 'Uploaded to Cloudinary CDN'}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <UploadCloud style={{ width: '32px', height: '32px', color: '#0F6E64' }} />
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#211D17', margin: 0 }}>Click or Drag & Drop Photo Evidence</p>
                  <p style={{ fontSize: '11px', color: '#59524A', margin: 0 }}>Supports PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #D6CFC0' }}>
            <button
              type="button"
              onClick={() => router.push('/')}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #D6CFC0', color: '#59524A', fontSize: '12px', fontWeight: 600, backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '6px', backgroundColor: '#0F6E64', color: '#FFFFFF', fontWeight: 'bold', fontSize: '12px', border: 'none', cursor: 'pointer' }}
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                  Submitting to Lalitpur City...
                </>
              ) : (
                'Submit Hygiene Report'
              )}
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}

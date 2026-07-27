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

  // Cloudinary Image Upload state
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
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-xs text-slate-500 animate-pulse">Verifying Citizen Authentication...</p>
        </main>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-sky-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Sign In Required to Raise Report</h1>
          <p className="text-xs text-slate-400">
            Please sign in or create a citizen account to pin and report hygiene issues in Lalitpur Municipality.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Continue</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Lalitpur Feed</span>
          </button>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
            Lalitpur Citizen Portal
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-400" />
            Raise a Municipal Hygiene Report
          </h1>
          <p className="text-xs text-slate-300">
            Pin the location on the Lalitpur map below and upload photo evidence. Reports with ≥ 3 upvotes automatically escalate to Critical status for sanitation crew dispatch.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 font-bold animate-bounce">
            <Check className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Garbage Heap blocking Mangal Bazar Walkway"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">Hygiene & Waste Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value} className="bg-slate-900 text-slate-100">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">Detailed Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the problem, odor severity, public hazard, or obstruction level..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-bold text-slate-200">
              Select Location on Lalitpur Map *
            </label>

            <InteractiveMapPicker
              onLocationSelect={handleLocationSelect}
              initialLat={locationLat}
              initialLng={locationLng}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Landmark / Street Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. Near Patan Durbar Square Heritage Entrance, Ward 16"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-bold text-slate-200">Photo Evidence (Cloudinary Upload)</label>
            
            <div className="relative border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-6 text-center bg-slate-900/60 transition-colors cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {previewUrl ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={previewUrl} alt="Preview" className="w-36 h-36 object-cover rounded-xl border border-sky-500 shadow-md" />
                  <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {uploadingImage ? 'Uploading to Cloudinary...' : 'Uploaded to Cloudinary CDN'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <UploadCloud className="w-8 h-8 text-sky-400 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-slate-300">Click or Drag & Drop Photo Evidence</p>
                  <p className="text-[11px] text-slate-500">Supports PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-950/50 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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

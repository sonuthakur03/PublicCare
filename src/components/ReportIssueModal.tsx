'use client';

import React, { useState } from 'react';
import { X, MapPin, Camera, AlertCircle, Check, Loader2, UploadCloud } from 'lucide-react';
import { IssueCategory } from '@/types';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: () => void;
}

export default function ReportIssueModal({ isOpen, onClose, onIssueCreated }: ReportIssueModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<IssueCategory>('GARBAGE_DUMP');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [locationLat, setLocationLat] = useState('27.6727');
  const [locationLng, setLocationLng] = useState('85.3253');
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

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
      if (data.success && (data.imageUrl || data.cloudinaryUrl)) {
        setImageUrl(data.imageUrl || data.cloudinaryUrl);
      }
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
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
          locationLat: parseFloat(locationLat) || 27.6727,
          locationLng: parseFloat(locationLng) || 85.3253,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
          reporterName,
          reporterContact
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit issue');

      onIssueCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  const categories: { label: string; value: IssueCategory }[] = [
    { label: 'Garbage Dump / Trash', value: 'GARBAGE_DUMP' },
    { label: 'Sewage Overflow', value: 'SEWAGE_OVERFLOW' },
    { label: 'Water Contamination', value: 'WATER_CONTAMINATION' },
    { label: 'Illegal Dumping', value: 'ILLEGAL_DUMPING' },
    { label: 'Public Toilet Hygiene', value: 'PUBLIC_TOILET' },
    { label: 'Dead Animal Hazard', value: 'DEAD_ANIMAL' },
    { label: 'Other Hygiene Concern', value: 'OTHER' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Report Municipal Hygiene Issue
            </h2>
            <p className="text-xs text-slate-400">Escalate civic problems directly to city sanitation authorities.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Uncollected Waste near Ward 4 Market"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Hygiene Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-slate-900 text-slate-100">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the severity, duration, hazards, or obstruction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Address & Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address / Landmark *</label>
              <input
                type="text"
                required
                placeholder="e.g. 14th Main Road, near Community Center"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Latitude</label>
              <input
                type="text"
                value={locationLat}
                onChange={(e) => setLocationLat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Longitude</label>
              <input
                type="text"
                value={locationLng}
                onChange={(e) => setLocationLng(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
              />
            </div>
          </div>

          {/* Photo Evidence Cloudinary Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Photo Evidence (Cloudinary CDN Upload)</label>
            <div className="relative border-2 dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center bg-slate-900/60 transition-all cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {previewUrl || imageUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={previewUrl || imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-emerald-500 shadow-md" />
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {uploadingImage ? 'Uploading to Cloudinary...' : 'Uploaded to Cloudinary'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <UploadCloud className="w-7 h-7 text-emerald-400" />
                  <p className="text-xs font-semibold text-slate-200">Click or Drag photo here to upload</p>
                  <p className="text-[11px] text-slate-400">JPG, PNG, WEBP saved to Cloudinary</p>
                </div>
              )}
            </div>
          </div>

          {/* Reporter info optional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Your Name (Optional)</label>
              <input
                type="text"
                placeholder="Anonymous Citizen"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Email/Phone (Optional)</label>
              <input
                type="text"
                placeholder="citizen@mail.org"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Issue Report'
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

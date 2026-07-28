'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, User, MapPin, Briefcase, Phone, Globe, CheckCircle } from 'lucide-react';

export default function VendorRegistration() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    businessType: 'WASTE_MANAGEMENT',
    description: '',
    contactPhone: '',
    website: '',
    address: '',
    locationLat: 27.6727,
    locationLng: 85.3253,
    serviceRadius: 5
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REGISTER_VENDOR',
          ...formData
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to register vendor account.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '40px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-2)', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 24px' }} />
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '28px', color: 'var(--primary)', marginBottom: '16px' }}>Account Created!</h1>
          <p style={{ color: 'var(--on-surface-variant)', fontSize: '16px', lineHeight: '1.5', marginBottom: '32px' }}>
            Your vendor profile is pending approval by the municipality. You can now log in and explore the dashboard, but you won't be able to receive contracts until approved.
          </p>
          <Link href="/login" style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', textDecoration: 'none', padding: '12px 32px', borderRadius: '6px', fontWeight: 'bold' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ backgroundColor: 'var(--surface-container-lowest)', padding: '40px', borderRadius: '12px', border: '1px solid var(--outline-variant)', boxShadow: 'var(--shadow-level-2)', maxWidth: '800px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Store size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>Register as a Vendor</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Partner with PublicCare to help improve the municipality</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#FCE8E6', color: 'var(--error)', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section: Personal Info */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--on-surface)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
              <User size={20} /> Personal Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Email Address</label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Password</label>
                <input required type="password" name="password" value={formData.password} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
            </div>
          </section>

          {/* Section: Company Info */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--on-surface)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
              <Briefcase size={20} /> Company Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Company Name</label>
                <input required type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Business Type</label>
                <select required name="businessType" value={formData.businessType} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }}>
                  <option value="WASTE_MANAGEMENT">Waste Management</option>
                  <option value="CONSTRUCTION">Construction</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="SANITATION">Sanitation</option>
                  <option value="ENVIRONMENTAL">Environmental</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Company Description</label>
                <textarea required name="description" rows={3} value={formData.description} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
            </div>
          </section>

          {/* Section: Contact Info */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--on-surface)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
              <Phone size={20} /> Contact Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Contact Phone</label>
                <input required type="tel" name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Website (Optional)</label>
                <input type="url" name="website" value={formData.website} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
            </div>
          </section>

          {/* Section: Location Info */}
          <section>
            <h2 style={{ fontSize: '18px', color: 'var(--on-surface)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
              <MapPin size={20} /> Location & Service Area
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Primary Address</label>
                <input required type="text" name="address" value={formData.address} onChange={handleInputChange} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--outline-variant)' }}>
                <div style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
                  <strong>Map Location:</strong> Currently set to Lat: {formData.locationLat}, Lng: {formData.locationLng} (Lalitpur). 
                  <br /><em>Note: Interactive map component is disabled in this preview.</em>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--on-surface)', fontWeight: 'bold', fontSize: '14px' }}>Service Radius: {formData.serviceRadius} km</label>
                <input 
                  type="range" 
                  name="serviceRadius" 
                  min="1" 
                  max="25" 
                  value={formData.serviceRadius} 
                  onChange={handleInputChange} 
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </section>

          <button disabled={loading} type="submit" style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)', border: 'none', padding: '16px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '16px' }}>
            {loading ? 'Submitting Registration...' : 'Register Vendor Account'}
          </button>

          <div style={{ textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 'bold', textDecoration: 'none' }}>Log in here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

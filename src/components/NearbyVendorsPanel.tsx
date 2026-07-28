'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Phone, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Vendor {
  id: string;
  companyName: string;
  businessType: string;
  contactPhone?: string;
  distance: number;
  isApproved: boolean;
}

interface NearbyVendorsPanelProps {
  issueLat: number;
  issueLng: number;
  issueId?: string;
}

export default function NearbyVendorsPanel({ issueLat, issueLng, issueId }: NearbyVendorsPanelProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/vendors/nearby?lat=${issueLat}&lng=${issueLng}&radius=10`);
        const data = await res.json();
        if (data.success) {
          setVendors(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch nearby vendors', err);
      } finally {
        setLoading(false);
      }
    };

    if (issueLat && issueLng) {
      fetchVendors();
    }
  }, [issueLat, issueLng]);

  return (
    <div className="bg-[#FFFFFF] rounded-[12px] p-6 border border-[#D6CFC0]" style={{ boxShadow: 'var(--shadow-level-1)' }}>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#D6CFC0]">
        <div className="w-10 h-10 rounded-[8px] bg-[#E1F0EA] flex items-center justify-center">
          <MapPin className="w-5 h-5 text-[#157F4A]" />
        </div>
        <h2 className="text-[1.25rem] font-bold text-[#211D17] font-display">Nearby Service Providers</h2>
      </div>

      {loading ? (
        <div className="text-center py-6 text-[#59524A] text-[14px]">Finding nearest providers...</div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-6 text-[#59524A] text-[14px] bg-[#F5F1E9] rounded-[8px]">
          No registered vendors in this area yet.
        </div>
      ) : (
        <div className="flex flex-col">
          {vendors.map((vendor, i) => (
            <div 
              key={vendor.id}
              className={`py-4 ${i !== vendors.length - 1 ? 'border-b border-[#D6CFC0]' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[#211D17] text-[15px]">{vendor.companyName}</h3>
                  {vendor.isApproved && (
                    <span title="Approved Provider">
                      <CheckCircle className="w-4 h-4 text-[#157F4A]" />
                    </span>
                  )}
                </div>
                <span className="text-[12px] font-semibold text-[#0F6E64] bg-[#E1F0EA] px-2 py-0.5 rounded-full">
                  {vendor.distance != null ? vendor.distance.toFixed(1) : '??'} km
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-[#F5F1E9] text-[#59524A] px-2 py-0.5 rounded-[4px]">
                  {vendor.businessType.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3">
                {vendor.contactPhone ? (
                  <div className="flex items-center gap-1.5 text-[#59524A] text-[13px]">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{vendor.contactPhone}</span>
                  </div>
                ) : (
                  <div />
                )}
                <Link 
                  href={`/vendors/${vendor.id}`}
                  className="text-[13px] font-semibold text-[#0F6E64] hover:text-[#14837A] flex items-center gap-1"
                >
                  View Details
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

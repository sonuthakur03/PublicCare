'use client';

import React, { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  vendor: {
    companyName: string;
    businessType?: string;
    logoUrl?: string;
  };
}

interface AdCardProps {
  ad: Ad;
  onAdClick?: (adId: string) => void;
}

export default function AdCard({ ad, onAdClick }: AdCardProps) {
  useEffect(() => {
    // Track impression
    fetch(`/api/v1/ads/${ad.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'IMPRESSION' })
    }).catch(err => console.error('Impression tracking failed', err));
  }, [ad.id]);

  const handleClick = (e: React.MouseEvent) => {
    // Track click
    fetch(`/api/v1/ads/${ad.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLICK' })
    }).catch(err => console.error('Click tracking failed', err));

    if (onAdClick) {
      onAdClick(ad.id);
    }
  };

  return (
    <div 
      className="bg-[#FFFFFF] rounded-[12px] p-4 flex flex-col transition-shadow hover:shadow-[var(--shadow-level-2)]"
      style={{
        border: '1px solid #D6CFC0',
        borderLeft: '3px solid',
        borderImage: 'linear-gradient(180deg, #6B5B95, #0F6E64) 1',
        boxShadow: 'var(--shadow-level-1)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#6B5B95] text-[#FFFFFF]">
          Sponsored
        </span>
        {ad.vendor.businessType && (
          <span className="text-[11px] font-semibold text-[#59524A] uppercase">
            {ad.vendor.businessType.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      <div className="mb-4 flex-1">
        <h3 className="text-[1rem] font-bold text-[#211D17] font-display mb-2 leading-tight">
          {ad.title}
        </h3>
        <p className="text-[#59524A] text-[13px] line-clamp-2">
          {ad.description}
        </p>
      </div>

      {ad.imageUrl && (
        <div className="relative w-full h-24 mb-4 rounded-[8px] overflow-hidden bg-[#F5F1E9]">
          <img 
            src={ad.imageUrl} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="mt-auto">
        <a 
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#0F6E64] hover:bg-[#14837A] text-[#FFFFFF] rounded-[6px] font-semibold text-[13px] transition-colors mb-4"
        >
          <span>Learn More</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <div className="flex items-center gap-2 pt-3 border-t border-[#D6CFC0]">
          {ad.vendor.logoUrl ? (
            <img src={ad.vendor.logoUrl} alt={ad.vendor.companyName} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#EFE9DC] flex items-center justify-center text-[#211D17] font-bold text-[10px]">
              {ad.vendor.companyName.charAt(0)}
            </div>
          )}
          <span className="text-[12px] font-medium text-[#59524A]">
            {ad.vendor.companyName}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Issue, IssueStatus } from '@/types';

interface CivicMapProps {
  issues: Issue[];
  onUpvote?: (issueId: string) => void;
  selectedIssueId?: string | null;
  onSelectIssue?: (issueId: string) => void;
}

export default function CivicMap({ issues, onUpvote, selectedIssueId, onSelectIssue }: CivicMapProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  const LALITPUR_CENTER: [number, number] = [27.6727, 85.3253];
  const LALITPUR_SW: [number, number] = [27.6000, 85.2800];
  const LALITPUR_NE: [number, number] = [27.6950, 85.3750];

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const container = mapContainerRef.current;
      if (!container) return;

      if (!mapInstanceRef.current) {
        const map = L.map(container, {
          center: LALITPUR_CENTER,
          zoom: 14,
          minZoom: 12,
          maxZoom: 18,
          zoomControl: true,
          maxBounds: L.latLngBounds(LALITPUR_SW, LALITPUR_NE),
          maxBoundsViscosity: 0.8
        });

        // Using light CartoDB maps for a warm/light theme. CartoDB Positron is a standard clean light map.
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; Lalitpur Municipality',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      Object.values(markersRef.current).forEach((marker: any) => marker.remove());
      markersRef.current = {};

      const getCustomIcon = (status: IssueStatus) => {
        let color = '#0F6E64';
        let pulse = false;

        if (status === 'CRITICAL') {
          color = '#B3261E';
          pulse = true;
        } else if (status === 'IN_PROGRESS') {
          color = '#B8720B';
        } else if (status === 'RESOLVED') {
          color = '#157F4A';
        }

        const svgHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            ${pulse ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(179, 38, 30, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="background: #FFFFFF; border: 2px solid ${color}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(33,29,23,0.15); z-index: 2;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `;

        return L.divIcon({
          html: svgHtml,
          className: 'custom-leaflet-marker',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -36]
        });
      };

      issues.forEach((issue) => {
        const marker = L.marker([issue.locationLat, issue.locationLng], {
          icon: getCustomIcon(issue.status)
        }).addTo(map);

        const popupContent = document.createElement('div');
        popupContent.style.cssText = 'padding: 8px; max-width: 240px; font-family: var(--font-body), sans-serif; background: #FFFFFF; color: #211D17; border-radius: 8px;';
        
        let statusColor = '#0F6E64';
        let statusBg = '#EFE9DC';
        if (issue.status === 'CRITICAL') { statusColor = '#8C2A22'; statusBg = '#FBE3E0'; }
        if (issue.status === 'IN_PROGRESS') { statusColor = '#7A5108'; statusBg = '#FBEEDD'; }
        if (issue.status === 'RESOLVED') { statusColor = '#0B5850'; statusBg = '#E1F0EA'; }

        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: #F5F1E9; color: #59524A;">
              ${issue.category.replace('_', ' ')}
            </span>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 9999px; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}33;">
              ${issue.status}
            </span>
          </div>
          <h4 style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: #211D17; cursor: pointer;">${issue.title}</h4>
          <p style="font-size: 12px; color: #59524A; margin: 0 0 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${issue.description}
          </p>
          <div style="font-size: 11px; color: #7A7266; margin-bottom: 8px;">
            📍 ${issue.address}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #D6CFC0;">
            <span style="font-size: 12px; font-weight: 600; color: ${issue.netUpvotes >= 3 ? '#C1592B' : '#0F6E64'};">👍 ${issue.netUpvotes} Upvotes</span>
            <button id="view-btn-${issue.id}" style="font-size: 11px; font-weight: 700; color: #0F6E64; background: #EFE9DC; border: 1px solid #D6CFC0; padding: 4px 8px; border-radius: 6px; cursor: pointer;">
              View Details →
            </button>
          </div>
        `;

        popupContent.addEventListener('click', (e) => {
          const btn = (e.target as HTMLElement).closest(`#view-btn-${issue.id}`);
          if (btn) {
            router.push(`/issue/${issue.id}`);
          } else if (onSelectIssue) {
            onSelectIssue(issue.id);
          }
        });

        marker.bindPopup(popupContent);
        markersRef.current[issue.id] = marker;
      });
    });
  }, [issues, onSelectIssue, router]);

  useEffect(() => {
    if (selectedIssueId && mapInstanceRef.current && markersRef.current[selectedIssueId]) {
      const issue = issues.find(i => i.id === selectedIssueId);
      if (issue) {
        mapInstanceRef.current.flyTo([issue.locationLat, issue.locationLng], 16, { duration: 1.2 });
        markersRef.current[selectedIssueId].openPopup();
      }
    }
  }, [selectedIssueId, issues]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '480px', minHeight: '420px', borderRadius: '12px', backgroundColor: '#FFFFFF', padding: '6px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', overflow: 'hidden' }} className="lg:h-full">
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20, backgroundColor: '#FFFFFF', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', pointerEvents: 'auto' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0F6E64' }} className="animate-pulse"></span>
        <span style={{ color: '#211D17', fontWeight: 'bold' }}>Lalitpur Dynamic Civic Map</span>
      </div>

      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20, backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', border: '1px solid #D6CFC0', boxShadow: '0 4px 16px rgba(33,29,23,0.06)', pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#B3261E' }}></span>
          <span style={{ color: '#59524A', fontWeight: 600 }}>Critical (≥3)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0F6E64' }}></span>
          <span style={{ color: '#59524A', fontWeight: 600 }}>Pending</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#B8720B' }}></span>
          <span style={{ color: '#59524A', fontWeight: 600 }}>In Progress</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#157F4A' }}></span>
          <span style={{ color: '#59524A', fontWeight: 600 }}>Resolved</span>
        </div>
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
    </div>
  );
}

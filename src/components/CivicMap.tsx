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

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
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
        let color = '#0284C7';
        let pulse = false;

        if (status === 'CRITICAL') {
          color = '#ef4444';
          pulse = true;
        } else if (status === 'IN_PROGRESS') {
          color = '#f59e0b';
        } else if (status === 'RESOLVED') {
          color = '#22C55E';
        }

        const svgHtml = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            ${pulse ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
            <div style="background: #0f172a; border: 2px solid ${color}; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.6); z-index: 2;">
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
        popupContent.className = 'p-2 max-w-xs font-sans';
        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: rgba(2, 132, 199, 0.15); color: #38bdf8;">
              ${issue.category.replace('_', ' ')}
            </span>
            <span style="font-size: 11px; font-weight: 600; color: ${
              issue.status === 'CRITICAL' ? '#f87171' : issue.status === 'RESOLVED' ? '#22C55E' : '#0284C7'
            };">
              ${issue.status}
            </span>
          </div>
          <h4 style="font-weight: 700; font-size: 14px; margin: 0 0 4px 0; color: #f8fafc; cursor: pointer;">${issue.title}</h4>
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${issue.description}
          </p>
          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
            📍 ${issue.address}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; font-weight: 600; color: #0284C7;">👍 ${issue.netUpvotes} Upvotes</span>
            <button id="view-btn-${issue.id}" style="font-size: 11px; font-weight: 700; color: #38bdf8; background: rgba(2,132,199,0.2); border: 1px solid rgba(2,132,199,0.4); padding: 3px 8px; border-radius: 6px; cursor: pointer;">
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
    <div className="relative w-full h-[480px] lg:h-full min-h-[420px] rounded-2xl glass-panel p-1.5 border border-slate-800 shadow-2xl overflow-hidden">
      <div className="absolute top-4 left-4 z-20 glass-panel px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border border-slate-800 shadow-lg pointer-events-auto">
        <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
        <span className="text-white font-bold">Lalitpur Dynamic Civic Map</span>
      </div>

      <div className="absolute top-4 right-4 z-20 glass-panel px-3 py-2 rounded-xl text-xs flex flex-wrap gap-3 border border-slate-800 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 critical-pulse-badge"></span>
          <span className="text-slate-300 font-medium">Critical (≥3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span className="text-slate-300 font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-300 font-medium">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 font-medium">Resolved</span>
        </div>
      </div>

      <div ref={mapContainerRef} className="w-full h-full rounded-xl" />
    </div>
  );
}

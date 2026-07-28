'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Check } from 'lucide-react';

interface InteractiveMapPickerProps {
  onLocationSelect: (lat: number, lng: number, addressHint: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function InteractiveMapPicker({ onLocationSelect, initialLat = 27.6727, initialLng = 85.3253 }: InteractiveMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const pinMarkerRef = useRef<any>(null);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng
  });

  const LALITPUR_CENTER: [number, number] = [27.6727, 85.3253];

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
          center: [initialLat, initialLng],
          zoom: 15,
          minZoom: 12,
          maxZoom: 18,
          zoomControl: true,
          maxBounds: L.latLngBounds([27.6000, 85.2800], [27.6950, 85.3750]),
          maxBoundsViscosity: 0.8
        });

        // Using light CartoDB maps for a warm/light theme.
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; Lalitpur Municipality',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        const pinIcon = L.divIcon({
          html: `
            <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
              <div style="background: #0F6E64; border: 3px solid #ffffff; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(33, 29, 23, 0.2); animation: bounce 1s infinite alternate;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            </div>
          `,
          className: 'pin-picker-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        });

        const initialMarker = L.marker([initialLat, initialLng], { icon: pinIcon }).addTo(map);
        pinMarkerRef.current = initialMarker;

        // Click to drop pin
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setSelectedCoords({ lat, lng });

          if (pinMarkerRef.current) {
            pinMarkerRef.current.setLatLng([lat, lng]);
          } else {
            pinMarkerRef.current = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
          }

          // Generate address hint based on proximity to Lalitpur landmarks
          let addressHint = 'Lalitpur Ward Area';
          if (lat > 27.6700 && lat < 27.6750 && lng > 85.3200 && lng < 85.3300) {
            addressHint = 'Near Patan Durbar Square, Ward 16';
          } else if (lat > 27.6710 && lat < 27.6770 && lng > 85.3130 && lng < 85.3200) {
            addressHint = 'Near Jawalakhel Chowk, Ward 4';
          } else if (lat > 27.6820 && lng > 85.3150) {
            addressHint = 'Near Kupondole Bagmati Corridor, Ward 1';
          } else if (lat > 27.6750 && lng < 85.3180) {
            addressHint = 'Near Pulchowk Engineering Campus, Ward 3';
          } else if (lat < 27.6680 && lng > 85.3200) {
            addressHint = 'Near Lagankhel Bus Complex, Ward 5';
          }

          onLocationSelect(lat, lng, addressHint);
        });

        mapInstanceRef.current = map;
      }
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#59524A' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F6E64' }}>
          <MapPin style={{ width: '16px', height: '16px' }} />
          Click Map to Pin Location in Lalitpur
        </span>
        <span style={{ fontSize: '11px', color: '#7A7266', fontFamily: 'monospace' }}>
          Pinned ({selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)})
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '12px', backgroundColor: '#FFFFFF', padding: '4px', border: '1px solid #D6CFC0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(33,29,23,0.06)' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

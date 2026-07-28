'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Check, AlertCircle, RefreshCw, Compass } from 'lucide-react';

interface LocationAccessBadgeProps {
  onLocationDetected?: (lat: number, lng: number) => void;
  compact?: boolean;
}

export default function LocationAccessBadge({ onLocationDetected, compact = false }: LocationAccessBadgeProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus('denied');
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('requesting');
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setStatus('granted');
        if (onLocationDetected) {
          onLocationDetected(lat, lng);
        }
      },
      (err) => {
        console.warn('Geolocation permission error:', err.message);
        setStatus('denied');
        setErrorMsg('Location access permission was denied or unavailable.');
        // Fallback default coordinates for Lalitpur
        const fallbackLat = 27.6727;
        const fallbackLng = 85.3253;
        setCoords({ lat: fallbackLat, lng: fallbackLng });
        if (onLocationDetected) {
          onLocationDetected(fallbackLat, fallbackLng);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  useEffect(() => {
    // Auto-check if permission was previously granted
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestLocation();
        }
      }).catch(() => {});
    }
  }, []);

  if (compact) {
    return (
      <button
        onClick={requestLocation}
        disabled={status === 'requesting'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          border: status === 'granted' ? '1px solid #157F4A' : '1px solid #0F6E64',
          backgroundColor: status === 'granted' ? '#E1F0EA' : '#0F6E64',
          color: status === 'granted' ? '#0B5850' : '#FFFFFF',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        title="Detect current location"
      >
        {status === 'requesting' ? (
          <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" />
        ) : (
          <Compass style={{ width: '13px', height: '13px' }} />
        )}
        <span>
          {status === 'granted' && coords
            ? `GPS Active: ${coords.lat}, ${coords.lng}`
            : status === 'requesting'
            ? 'Detecting GPS...'
            : 'Enable Location Access'}
        </span>
      </button>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #D6CFC0',
        padding: '16px',
        boxShadow: '0 4px 16px rgba(33,29,23,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: status === 'granted' ? '#E1F0EA' : '#F5F1E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MapPin
            style={{
              width: '20px',
              height: '20px',
              color: status === 'granted' ? '#157F4A' : '#0F6E64'
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#211D17', margin: 0 }}>
              Citizen Location Access
            </h4>
            {status === 'granted' && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#E1F0EA',
                  color: '#0B5850',
                  border: '1px solid #157F4A'
                }}
              >
                Connected
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#59524A', margin: 0 }}>
            {status === 'granted' && coords
              ? `GPS Coordinates: ${coords.lat}° N, ${coords.lng}° E (Lalitpur Ward Region)`
              : status === 'denied'
              ? errorMsg || 'Location access disabled. Click to grant access for localized reports.'
              : 'Enable location permission to join nearby network chat and auto-tag reports.'}
          </p>
        </div>
      </div>

      <button
        onClick={requestLocation}
        disabled={status === 'requesting'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: status === 'granted' ? '#F5F1E9' : '#0F6E64',
          color: status === 'granted' ? '#211D17' : '#FFFFFF',
          border: status === 'granted' ? '1px solid #D6CFC0' : 'none',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {status === 'requesting' ? (
          <>
            <RefreshCw style={{ width: '14px', height: '14px' }} className="animate-spin" />
            <span>Locating...</span>
          </>
        ) : (
          <>
            <Navigation style={{ width: '14px', height: '14px' }} />
            <span>{status === 'granted' ? 'Update GPS Location' : 'Ask Location Access'}</span>
          </>
        )}
      </button>
    </div>
  );
}

'use client';

import React from 'react';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface StatusChipProps {
  status: string;
}

export default function StatusChip({ status }: StatusChipProps) {
  let bg = '#EFE9DC';
  let text = '#59524A';
  let Icon = null;
  let label = status.replace(/_/g, ' ');

  switch (status) {
    case 'CRITICAL':
      bg = '#FBE3E0';
      text = '#8C2A22';
      Icon = AlertTriangle;
      break;
    case 'IN_PROGRESS':
      bg = '#FBEEDD';
      text = '#7A5108';
      Icon = Clock;
      break;
    case 'RESOLVED':
      bg = '#E1F0EA';
      text = '#0B5850';
      Icon = CheckCircle2;
      break;
    case 'REPORTED':
    default:
      bg = '#EFE9DC';
      text = '#59524A';
      Icon = null;
      break;
  }

  return (
    <span
      style={{
        backgroundColor: bg,
        color: text,
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full"
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
}

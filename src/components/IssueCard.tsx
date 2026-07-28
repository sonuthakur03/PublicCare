'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Issue } from '@/types';
import { ThumbsUp, MapPin, Calendar, AlertTriangle, CheckCircle2, Clock, Share2, Flame, Check, ExternalLink } from 'lucide-react';
import StatusChip from '@/components/StatusChip';

interface IssueCardProps {
  issue: Issue;
  onUpvote: (issueId: string) => Promise<boolean | void>;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function IssueCard({ issue, onUpvote, isSelected = false, onSelect }: IssueCardProps) {
  const router = useRouter();
  const [upvoting, setUpvoting] = useState(false);
  const [votedError, setVotedError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (issue.hasVotedByCurrentUser) return;

    setUpvoting(true);
    setVotedError(false);

    const success = await onUpvote(issue.id);
    if (success === false) {
      setVotedError(true);
    }
    setUpvoting(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/issue/${issue.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNavigateDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/issue/${issue.id}`);
  };

  const formattedCategory = issue.category.replace('_', ' ');

  return (
    <div
      onClick={onSelect}
      className="group relative cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: '#FFFFFF',
        border: isSelected ? '2px solid #0F6E64' : '1px solid #D6CFC0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(33,29,23,0.06)',
        transform: 'translateY(0)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,110,100,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(33,29,23,0.06)';
      }}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span style={{
            backgroundColor: '#E6DFCE',
            color: '#59524A',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {formattedCategory}
          </span>
          {issue.netUpvotes >= 3 && issue.status !== 'RESOLVED' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#FBEAE1', color: '#C1592B', borderRadius: '9999px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <Flame className="w-3.5 h-3.5" />
              Lalitpur Hotspot
            </span>
          )}
        </div>
        <StatusChip status={issue.status} />
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col sm:flex-row gap-6">
        {issue.imageUrl && (
          <div 
            onClick={handleNavigateDetail}
            className="sm:w-[100px] sm:h-[100px] h-[160px] w-full shrink-0 relative group/img cursor-pointer overflow-hidden"
            style={{ borderRadius: '8px', backgroundColor: '#EFE9DC' }}
          >
            <img
              src={issue.imageUrl}
              alt={issue.title}
              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-[#211D17]/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
              <ExternalLink className="w-6 h-6 text-[#FFFFFF]" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 
            onClick={handleNavigateDetail}
            className="line-clamp-1 mb-2 flex items-center gap-2 cursor-pointer transition-colors"
            style={{ fontSize: '16px', fontWeight: 600, color: '#211D17', fontFamily: 'var(--font-display)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#0F6E64'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#211D17'}
          >
            <span>{issue.title}</span>
            <ExternalLink className="w-4 h-4 text-[#D6CFC0] shrink-0" />
          </h3>
          <p className="line-clamp-2 mb-4" style={{ fontSize: '14px', color: '#59524A', fontFamily: 'var(--font-body)' }}>
            {issue.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5 truncate max-w-[240px]">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: '#0F6E64' }} />
              <span className="truncate" style={{ fontSize: '13px', color: '#59524A' }}>{issue.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" style={{ color: '#7A7266' }} />
              <span style={{ fontSize: '13px', color: '#7A7266' }}>{new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Upvote & Action Bar */}
      <div className="mt-5 pt-4 flex items-center justify-between gap-3" style={{ borderTop: '1px solid #D6CFC0' }}>
        <div className="flex items-center gap-3">
          {issue.hasVotedByCurrentUser ? (
            <button
              disabled
              className="flex items-center gap-2 cursor-not-allowed"
              style={{
                borderRadius: '6px',
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: '14px',
                backgroundColor: '#EFE9DC',
                color: '#59524A',
                border: 'none',
              }}
            >
              <Check className="w-4 h-4" />
              <span>Voted ({issue.netUpvotes})</span>
            </button>
          ) : (
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className={`flex items-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-95`}
              style={{
                borderRadius: '6px',
                padding: '10px 20px',
                fontWeight: 600,
                fontSize: '14px',
                backgroundColor: 'transparent',
                ...(issue.netUpvotes >= 3 && issue.status !== 'RESOLVED'
                  ? { border: '1px solid #C1592B', color: '#C1592B' }
                  : { border: '1px solid #0F6E64', color: '#0F6E64' }),
              }}
            >
              <ThumbsUp className={`w-4 h-4 ${upvoting ? 'animate-bounce' : ''}`} />
              <span>Upvote ({issue.netUpvotes})</span>
            </button>
          )}

          {votedError && (
            <span style={{ fontSize: '13px', color: '#B3261E' }}>Already voted!</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleNavigateDetail}
            className="flex items-center gap-1.5 cursor-pointer transition-colors"
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '14px',
              backgroundColor: 'transparent',
              color: '#0F6E64',
              border: 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            <span>View Details</span>
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={handleShare}
            className="cursor-pointer flex items-center justify-center transition-colors"
            title="Share Issue"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#59524A',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F1E9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {copied ? <Check className="w-4 h-4" style={{ color: '#0F6E64' }} /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

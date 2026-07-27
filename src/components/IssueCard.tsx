'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Issue } from '@/types';
import { ThumbsUp, MapPin, Calendar, AlertTriangle, CheckCircle2, Clock, Share2, Flame, Check, ExternalLink } from 'lucide-react';

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

  const getStatusBadge = () => {
    switch (issue.status) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 critical-pulse-badge">
            <AlertTriangle className="w-3.5 h-3.5" />
            CRITICAL PROBLEM
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            PENDING
          </span>
        );
    }
  };

  const formattedCategory = issue.category.replace('_', ' ');

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl glass-panel p-5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'ring-2 ring-sky-500 bg-slate-900/90 shadow-xl shadow-sky-950/20'
          : 'glass-panel-hover'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-800 text-sky-400 border border-slate-700">
            {formattedCategory}
          </span>
          {issue.netUpvotes >= 3 && issue.status !== 'RESOLVED' && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
              <Flame className="w-3 h-3 text-rose-400" />
              Lalitpur Hotspot
            </span>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col sm:flex-row gap-4">
        {issue.imageUrl && (
          <div 
            onClick={handleNavigateDetail}
            className="sm:w-28 sm:h-28 h-40 w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative group/img cursor-pointer"
          >
            <img
              src={issue.imageUrl}
              alt={issue.title}
              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 
            onClick={handleNavigateDetail}
            className="text-base font-bold text-slate-100 group-hover:text-sky-400 transition-colors line-clamp-1 mb-1.5 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{issue.title}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors shrink-0" />
          </h3>
          <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
            {issue.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1 truncate max-w-[240px]">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{issue.address}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Upvote & Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {issue.hasVotedByCurrentUser ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5 text-sky-400" />
              <span>Already Voted ({issue.netUpvotes})</span>
            </button>
          ) : (
            <button
              onClick={handleUpvote}
              disabled={upvoting}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                issue.netUpvotes >= 3
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 active:scale-95'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${upvoting ? 'animate-bounce' : ''}`} />
              <span>Upvote ({issue.netUpvotes})</span>
            </button>
          )}

          {votedError && (
            <span className="text-[11px] text-rose-400 font-semibold">Already voted! (1 vote per session)</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNavigateDetail}
            className="px-2.5 py-1 rounded-lg text-xs font-bold text-sky-400 hover:bg-sky-500/15 transition-all flex items-center gap-1"
          >
            <span>View Details</span>
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            title="Share Issue"
          >
            {copied ? <Check className="w-4 h-4 text-sky-400" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function LegalResourceCoverCard({
  resource,
  onOpenReader,
}) {
  const isPdf = (resource.source_file || '').toLowerCase().endsWith('.pdf');

  // Simple, modern pastel accent color styles per category
  const getCategoryTheme = (category) => {
    switch (category) {
      case 'penalties':
        return {
          pill: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          accent: 'text-amber-400',
          iconBg: 'bg-amber-500/15 text-amber-300',
          topLine: 'bg-gradient-to-r from-amber-400 to-amber-600',
        };
      case 'safety':
        return {
          pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
          accent: 'text-emerald-400',
          iconBg: 'bg-emerald-500/15 text-emerald-300',
          topLine: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
        };
      case 'speed':
        return {
          pill: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
          accent: 'text-rose-400',
          iconBg: 'bg-rose-500/15 text-rose-300',
          topLine: 'bg-gradient-to-r from-rose-400 to-rose-600',
        };
      case 'noise':
        return {
          pill: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
          accent: 'text-purple-400',
          iconBg: 'bg-purple-500/15 text-purple-300',
          topLine: 'bg-gradient-to-r from-purple-400 to-purple-600',
        };
      case 'licensing':
      case 'expressway':
        return {
          pill: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
          accent: 'text-sky-400',
          iconBg: 'bg-sky-500/15 text-sky-300',
          topLine: 'bg-gradient-to-r from-sky-400 to-sky-600',
        };
      case 'registration':
      case 'general':
      default:
        return {
          pill: 'bg-[#d4a843]/10 text-[#f0c96a] border-[#d4a843]/20',
          accent: 'text-[#f0c96a]',
          iconBg: 'bg-[#d4a843]/15 text-[#f0c96a]',
          topLine: 'bg-gradient-to-r from-[#d4a843] to-[#e4b952]',
        };
    }
  };

  const theme = getCategoryTheme(resource.category);

  return (
    <div
      onClick={() => onOpenReader(resource)}
      className="group relative flex flex-col justify-between bg-[#111726]/90 hover:bg-[#151d30] border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-1 select-none overflow-hidden"
    >
      {/* Charming top accent color line */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${theme.topLine}`} />

      {/* Top Section: Header & Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3 pt-1">
          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${theme.pill}`}>
            {resource.badge_label || resource.category}
          </span>

          <span className="text-[11px] font-mono text-slate-400">
            {resource.year ? `Year ${resource.year}` : 'Consolidated'}
          </span>
        </div>

        {/* Minimalist Document Preview Cover */}
        <div className="relative rounded-xl bg-[#0a0f1a] border border-slate-800/80 p-3.5 mb-3 flex flex-col justify-between group-hover:border-slate-700 transition">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${theme.iconBg}`}>
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 truncate">
                {resource.instrument_type.replace('_', ' ')}
              </div>
              <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition">
                {resource.gazette_no ? `Gazette ${resource.gazette_no}` : resource.act_no || 'Principal Statute'}
              </div>
            </div>
          </div>

          {/* Clean decorative document lines */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="truncate max-w-[140px] text-slate-400">
              {resource.issuing_authority?.split('/')[0]?.trim()}
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified</span>
            </span>
          </div>
        </div>

        {/* Title & Short Description */}
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-[#f0c96a] transition-colors leading-snug line-clamp-2">
          {resource.short_title || resource.title}
        </h3>

        <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-normal">
          {resource.description}
        </p>
      </div>

      {/* Bottom Footer: Stats & Direct Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#d4a843]" />
          <span>{resource.sections_count} sections</span>
        </span>

        <div className="flex items-center gap-1.5">
          {isPdf && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/pdf/${resource.id}`, '_blank');
              }}
              className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-[#f0c96a] border border-slate-800 transition"
              title="Open authentic PDF scan"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenReader(resource);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#d4a843] text-slate-200 hover:text-slate-950 text-xs font-semibold border border-slate-700/80 hover:border-[#d4a843] transition active:scale-95"
          >
            <span>Read</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

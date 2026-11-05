import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  FileText,
  ShieldCheck,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function LegalResourceCoverCard({
  resource,
  onOpenReader,
  onExplainAI,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getThemeClasses = (color) => {
    switch (color) {
      case 'gold':
        return {
          cardBg: 'from-[#2e230d] via-[#1a140a] to-[#0a0d14]',
          border: 'border-[#d4a843]/40 group-hover:border-[#d4a843]',
          accent: 'text-[#f0c96a]',
          badgeBg: 'bg-[#d4a843] text-slate-950 font-bold',
          tagBg: 'bg-[#d4a843]/15 text-[#f0c96a] border-[#d4a843]/30',
          glow: 'group-hover:shadow-[0_0_25px_rgba(212,168,67,0.25)]',
        };
      case 'ruby':
        return {
          cardBg: 'from-[#330f18] via-[#1a0a10] to-[#0a0d14]',
          border: 'border-rose-500/40 group-hover:border-rose-400',
          accent: 'text-rose-300',
          badgeBg: 'bg-rose-600 text-white font-bold',
          tagBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.25)]',
        };
      case 'emerald':
        return {
          cardBg: 'from-[#0b291c] via-[#081711] to-[#0a0d14]',
          border: 'border-emerald-500/40 group-hover:border-emerald-400',
          accent: 'text-emerald-300',
          badgeBg: 'bg-emerald-600 text-white font-bold',
          tagBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]',
        };
      case 'purple':
        return {
          cardBg: 'from-[#251233] via-[#13091c] to-[#0a0d14]',
          border: 'border-purple-500/40 group-hover:border-purple-400',
          accent: 'text-purple-300',
          badgeBg: 'bg-purple-600 text-white font-bold',
          tagBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]',
        };
      case 'navy':
        return {
          cardBg: 'from-[#0d2238] via-[#09131f] to-[#0a0d14]',
          border: 'border-sky-500/40 group-hover:border-sky-400',
          accent: 'text-sky-300',
          badgeBg: 'bg-sky-600 text-white font-bold',
          tagBg: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
          glow: 'group-hover:shadow-[0_0_25px_rgba(14,165,233,0.25)]',
        };
      case 'amber':
      default:
        return {
          cardBg: 'from-[#2e1d09] via-[#191007] to-[#0a0d14]',
          border: 'border-amber-500/40 group-hover:border-amber-400',
          accent: 'text-amber-300',
          badgeBg: 'bg-amber-600 text-white font-bold',
          tagBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
        };
    }
  };

  const theme = getThemeClasses(resource.theme_color);

  return (
    <div
      className="group flex flex-col cursor-pointer transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenReader(resource)}
    >
      {/* Visual Book/Statute Cover matching photo layout */}
      <div
        className={`relative aspect-[3/4.2] w-full rounded-2xl bg-gradient-to-b ${theme.cardBg} border ${theme.border} p-4 sm:p-5 flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-300 group-hover:-translate-y-1.5 ${theme.glow}`}
      >
        {/* Subtle decorative spine line on left like a hardcover law book */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-white/5 to-transparent border-r border-white/10" />

        {/* Top Badges row (Mirroring photo's red 'UP TO 20%' badge) */}
        <div className="flex items-start justify-between gap-1.5 z-10 pl-2">
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded bg-black/60 text-slate-300 border border-slate-700/60 backdrop-blur-sm">
            {resource.instrument_type.replace('_', ' ')}
          </span>

          <span
            className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full shadow-md z-10 ${theme.badgeBg}`}
          >
            {resource.badge_label || 'IN FORCE'}
          </span>
        </div>

        {/* Center Legal Seal & Cover Title */}
        <div className="my-auto text-center px-2 z-10 pl-3">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
            <Scale className={`w-6 h-6 stroke-[1.8] ${theme.accent}`} />
          </div>

          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-serif mb-1">
            Democratic Socialist Republic of Sri Lanka
          </div>

          <h3 className="font-serif-legal text-sm sm:text-base font-bold text-slate-100 leading-snug tracking-tight">
            {resource.short_title || resource.title}
          </h3>

          {resource.gazette_no && (
            <div className="mt-1 font-mono text-[11px] font-semibold text-[#f0c96a]">
              Gazette No. {resource.gazette_no}
            </div>
          )}
          {resource.act_no && !resource.gazette_no && (
            <div className="mt-1 font-mono text-[11px] font-semibold text-[#f0c96a]">
              {resource.act_no}
            </div>
          )}
        </div>

        {/* Cover Bottom Authority and Year */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono z-10 pl-2">
          <span>{resource.year || '2024'}</span>
          <span className="truncate max-w-[140px] text-right">
            {resource.issuing_authority?.split('/')[0]?.trim()}
          </span>
        </div>

        {/* Subtle background legal seal watermark */}
        <div className="absolute right-[-20%] bottom-[-10%] opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
          <Scale className="w-48 h-48 stroke-1 text-white" />
        </div>

        {/* Hover Action Overlay (Mirroring photo's 'Check Availability' button) */}
        <div
          className={`absolute inset-0 bg-[#070a10]/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2.5 p-4 transition-all duration-200 ${
            isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenReader(resource);
            }}
            className="w-full max-w-[190px] py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4a843] to-[#e4b952] hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Read Resource</span>
          </button>

          {(resource.source_file || '').endsWith('.pdf') && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/pdf/${resource.id}`, '_blank');
              }}
              className="w-full max-w-[190px] py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[#f0c96a] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              title="Open authentic official PDF scan"
            >
              <FileText className="w-3.5 h-3.5 text-[#d4a843]" />
              <span>View Official PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Caption & Metadata Below Card (Matching photo's book title and price info) */}
      <div className="mt-3 px-1 space-y-1">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight line-clamp-1 group-hover:text-[#f0c96a] transition-colors">
          {resource.short_title || resource.title}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="capitalize font-medium text-slate-300">
            {resource.category}
          </span>
          <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {resource.sections_count} {resource.sections_count === 1 ? 'Section' : 'Sections'}
          </span>
        </div>

        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import {
  Scale,
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  BookMarked,
  Award,
} from 'lucide-react';

export default function LegalResourceCoverCard({
  resource,
  onOpenReader,
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Rich, distinctive authentic legal book cover color palettes
  const getTheme = (color) => {
    switch (color) {
      case 'gold':
        return {
          bgGradient: 'from-[#422907] via-[#2a1904] to-[#120a02]',
          borderColor: 'border-[#d4a843]',
          innerBorder: 'border-[#d4a843]/50',
          accentText: 'text-[#f0c96a]',
          bannerBg: 'bg-gradient-to-r from-[#d4a843] to-[#e4b952] text-slate-950',
          sealBg: 'from-[#f0c96a] via-[#d4a843] to-[#8c591b]',
          glow: 'group-hover:shadow-[0_12px_32px_rgba(212,168,67,0.35)]',
          ribbonBg: 'bg-[#d4a843] text-slate-950',
        };
      case 'ruby':
        return {
          bgGradient: 'from-[#4c0d1b] via-[#2d0710] to-[#150307]',
          borderColor: 'border-rose-500',
          innerBorder: 'border-rose-400/40',
          accentText: 'text-rose-300',
          bannerBg: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white',
          sealBg: 'from-rose-400 via-rose-600 to-rose-900',
          glow: 'group-hover:shadow-[0_12px_32px_rgba(244,63,94,0.35)]',
          ribbonBg: 'bg-rose-600 text-white',
        };
      case 'emerald':
        return {
          bgGradient: 'from-[#0d3824] via-[#082216] to-[#04120b]',
          borderColor: 'border-emerald-500',
          innerBorder: 'border-emerald-400/40',
          accentText: 'text-emerald-300',
          bannerBg: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950',
          sealBg: 'from-emerald-400 via-emerald-600 to-emerald-950',
          glow: 'group-hover:shadow-[0_12px_32px_rgba(16,185,129,0.35)]',
          ribbonBg: 'bg-emerald-600 text-white',
        };
      case 'purple':
        return {
          bgGradient: 'from-[#351547] via-[#210c2e] to-[#0e0414]',
          borderColor: 'border-purple-500',
          innerBorder: 'border-purple-400/40',
          accentText: 'text-purple-300',
          bannerBg: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
          sealBg: 'from-purple-400 via-purple-600 to-purple-950',
          glow: 'group-hover:shadow-[0_12px_32px_rgba(168,85,247,0.35)]',
          ribbonBg: 'bg-purple-600 text-white',
        };
      case 'navy':
        return {
          bgGradient: 'from-[#0e274a] via-[#091830] to-[#040b17]',
          borderColor: 'border-sky-500',
          innerBorder: 'border-sky-400/40',
          accentText: 'text-sky-300',
          bannerBg: 'bg-gradient-to-r from-sky-500 to-sky-600 text-white',
          sealBg: 'from-sky-400 via-sky-600 to-sky-950',
          glow: 'group-hover:shadow-[0_12px_32px_rgba(14,165,233,0.35)]',
          ribbonBg: 'bg-sky-600 text-white',
        };
      case 'amber':
      default:
        return {
          bgGradient: 'from-[#422206] via-[#291403] to-[#120801]',
          borderColor: 'border-amber-500',
          innerBorder: 'border-amber-400/40',
          accentText: 'text-amber-300',
          bannerBg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950',
          sealBg: 'from-amber-400 via-amber-600 to-amber-950',
          glow: 'group-hover:shadow-[0_12px_32px_rgba(245,158,11,0.35)]',
          ribbonBg: 'bg-amber-600 text-white',
        };
    }
  };

  const theme = getTheme(resource.theme_color);
  const isPdf = (resource.source_file || '').toLowerCase().endsWith('.pdf');

  return (
    <div
      className="group flex flex-col cursor-pointer transition-all duration-300 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenReader(resource)}
    >
      {/* 3D Realistic Law Book / Gazette Volume Cover */}
      <div
        className={`relative aspect-[3/4.4] w-full rounded-2xl bg-gradient-to-br ${theme.bgGradient} border-2 ${theme.borderColor} p-3 sm:p-4 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:scale-[1.01] ${theme.glow}`}
      >
        {/* Leather Spine Shadow on the Left */}
        <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/80 via-black/30 to-transparent border-r border-white/10 z-10" />

        {/* Embossed Ornamental Gold Foil Inner Frame */}
        <div
          className={`absolute inset-2 rounded-xl border ${theme.innerBorder} pointer-events-none z-0`}
        >
          {/* Ornamental corner notches */}
          <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#d4a843]" />
          <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#d4a843]" />
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#d4a843]" />
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#d4a843]" />
        </div>

        {/* Top Header Row on Book Cover */}
        <div className="relative z-10 flex items-start justify-between gap-1.5 pl-2 pt-1">
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded bg-black/75 text-slate-200 border border-white/20 backdrop-blur-md shadow-sm">
            {resource.instrument_type.replace('_', ' ')}
          </span>

          <span
            className={`text-[9px] uppercase tracking-wider font-mono font-extrabold px-2 py-0.5 rounded shadow-md ${theme.ribbonBg}`}
          >
            {resource.badge_label || 'OFFICIAL ACT'}
          </span>
        </div>

        {/* Centerpiece: Golden Emblem Seal + Bold Legal Typography */}
        <div className="relative z-10 my-auto text-center px-2 py-2 flex flex-col items-center pl-3">
          {/* Golden Embossed Medallion */}
          <div
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${theme.sealBg} p-0.5 shadow-xl shadow-black/80 mb-2.5 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center`}
          >
            <div className="w-full h-full rounded-full bg-[#0a0f18] flex items-center justify-center border border-[#d4a843]/60">
              <Scale className="w-7 h-7 stroke-[2.2] text-[#f0c96a] drop-shadow-md" />
            </div>
          </div>

          {/* National Authority Label */}
          <div className="text-[9px] uppercase tracking-widest text-[#f0c96a] font-serif font-semibold mb-1 opacity-90 drop-shadow">
            SRI LANKA MOTOR TRAFFIC LAW
          </div>

          {/* Book Title */}
          <h3 className="font-serif-legal text-sm sm:text-base font-black text-white leading-snug tracking-tight px-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
            {resource.short_title || resource.title}
          </h3>

          {/* Gazette / Act Number Gold Ribbon Pill */}
          {(resource.gazette_no || resource.act_no) && (
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/80 border border-[#d4a843]/60 text-[10px] font-mono font-bold text-[#f0c96a] shadow-inner">
              <span>{resource.gazette_no ? `Gazette ${resource.gazette_no}` : resource.act_no}</span>
            </div>
          )}
        </div>

        {/* Cover Bottom Authority and Year Footer */}
        <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-slate-300 font-mono pl-3">
          <span className="font-bold text-[#f0c96a]">
            {resource.year ? `Anno ${resource.year}` : 'Consolidated'}
          </span>
          <span className="truncate max-w-[130px] text-right font-medium opacity-85">
            {resource.issuing_authority?.split('/')[0]?.trim()}
          </span>
        </div>

        {/* Hover Action Overlay: Elegant Frosted Glass Over Cover */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-3 p-4 transition-all duration-300 ${
            isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="text-center mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#f0c96a]">
              Official Statute Volume
            </span>
            <div className="text-xs text-white font-serif font-bold line-clamp-1 mt-0.5">
              {resource.short_title || resource.title}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenReader(resource);
            }}
            className="w-full max-w-[190px] py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4a843] to-[#e4b952] hover:brightness-110 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xl active:scale-95 transition"
          >
            <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Read Resource</span>
          </button>

          {isPdf && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/pdf/${resource.id}`, '_blank');
              }}
              className="w-full max-w-[190px] py-2 px-3 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-[#d4a843]/60 hover:border-[#d4a843] text-[#f0c96a] text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              title="Open authentic official PDF scan"
            >
              <FileText className="w-3.5 h-3.5 text-[#d4a843]" />
              <span>View Official PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Caption & Metadata Below Card */}
      <div className="mt-3 px-1 space-y-1">
        <h4 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-tight line-clamp-1 group-hover:text-[#f0c96a] transition-colors font-serif-legal">
          {resource.short_title || resource.title}
        </h4>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="capitalize font-semibold text-slate-300">
            {resource.category}
          </span>
          <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{resource.sections_count} {resource.sections_count === 1 ? 'Section' : 'Sections'}</span>
          </span>
        </div>

        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>
      </div>
    </div>
  );
}

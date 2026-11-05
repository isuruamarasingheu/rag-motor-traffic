import React, { useState } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Scale,
} from 'lucide-react';

export default function SourceSidebar({
  citations = [],
  isOpen = false,
  onClose,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside
      aria-label="Source Citations Sidebar"
      className="no-print w-80 sm:w-96 flex-shrink-0 bg-[#090d15] border-l border-slate-800/80 flex flex-col h-full z-30 animate-fade-in shadow-2xl transition-all duration-300 select-none"
    >
      {/* Top Header (Same size, padding, and styling as Left Sidebar) */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#d4a843] flex-shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-200 tracking-tight block truncate">
                Source Citations
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30 flex-shrink-0">
                {citations.length} {citations.length === 1 ? 'Section' : 'Sections'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans block truncate">
              Verified Legal Provisions
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          title="Close source sidebar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable Citation Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {citations.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs space-y-2">
            <Scale className="w-8 h-8 mx-auto text-slate-600" />
            <p>No statutory citations recorded for this inquiry.</p>
          </div>
        ) : (
          citations.map((c, i) => (
            <div
              key={i}
              className="rounded-xl bg-[#121826] border border-slate-800/90 hover:border-slate-700/80 transition p-4 space-y-2.5 shadow-sm"
            >
              {/* Citation Title & Copy Button */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800/80">
                <div className="min-w-0 space-y-1">
                  <span className="inline-block font-mono text-[10px] font-bold text-[#f0c96a] bg-[#d4a843]/10 px-2 py-0.5 rounded border border-[#d4a843]/20">
                    {c.id}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-200 leading-snug">
                    {c.citation}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(c.id, c.text)}
                  className="flex items-center gap-1 p-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] border border-slate-800 transition flex-shrink-0"
                  title="Copy statutory excerpt"
                >
                  {copiedId === c.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === c.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Verbatim Statutory Text */}
              <div className="p-3 rounded-lg bg-[#070a10] border-l-2 border-[#d4a843] font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                "{c.text}"
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Guarantee */}
      <div className="p-3 bg-[#0a0e17] border-t border-slate-800 px-5 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strict Grounding Verified</span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          Corpus ID MTA-RAG
        </span>
      </div>
    </aside>
  );
}

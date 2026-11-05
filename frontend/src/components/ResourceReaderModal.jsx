import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Scale,
  Search,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function ResourceReaderModal({
  resource,
  isOpen,
  onClose,
  onAskAI,
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!isOpen || !resource) {
      setDetail(null);
      setSearch('');
      setExpandedSectionId(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch(`/resources/${resource.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resource details');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setDetail(data);
          setLoading(false);
          // Auto-expand first section if available
          if (data.sections && data.sections.length > 0) {
            setExpandedSectionId(data.sections[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching resource details:', err);
        if (isMounted) {
          setDetail(resource); // fallback to basic resource
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, resource]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const sections = detail?.sections || [];

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase().trim();
    return sections.filter(
      (s) =>
        (s.id || '').toLowerCase().includes(q) ||
        (s.citation || '').toLowerCase().includes(q) ||
        (s.heading || '').toLowerCase().includes(q) ||
        (s.text || '').toLowerCase().includes(q) ||
        (s.section || '').toLowerCase().includes(q)
    );
  }, [sections, search]);

  const handleCopy = (id, text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-up">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#0c101a] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <GoldenScaleLogo className="w-10 h-10 rounded-xl" iconSize="w-5 h-5" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30">
                  {resource.badge_label || 'STATUTE RESOURCE'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {resource.gazette_no ? `Gazette ${resource.gazette_no}` : resource.act_no || 'Principal Act'}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400 font-mono">Year {resource.year}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5 tracking-tight font-serif-legal">
                {resource.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const query = `Explain ${resource.short_title || resource.title} in plain English for a citizen, including who it affects, main penalties, and practical rules.`;
                onAskAI(query);
                onClose();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#d4a843] to-[#e4b952] hover:brightness-105 text-slate-950 text-xs font-semibold shadow-md active:scale-95 transition"
              title="Explain this full document with MagaNithi AI"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950/20" />
              <span>Explain in MagaNithi AI</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Provenance & Quick Info Banner */}
        <div className="px-5 py-3 bg-[#111726] border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400">Issuing Authority:</span>
            <span className="font-medium text-slate-200">{resource.issuing_authority}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#d4a843]" />
              <span>{sections.length || resource.sections_count} Indexed Chunks</span>
            </span>
            <span>·</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Statutory Source</span>
            </span>
          </div>
        </div>

        {/* Search Inside Document Toolbar */}
        <div className="p-3 bg-[#0c101a] border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inside this document (e.g. section number, 'fine', 'speed', 'helmet')..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#d4a843] transition"
            />
          </div>
          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing {filteredSections.length} of {sections.length} sections
          </span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Summary Card */}
          <div className="p-4 rounded-xl bg-[#121826] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Statutory Scope & Legal Purpose
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                📁 {resource.source_file}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {resource.description}
            </p>

            {resource.key_provisions && resource.key_provisions.length > 0 && (
              <div className="pt-2 flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-semibold">Key Provisions:</span>
                {resource.key_provisions.map((kp, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-[#f0c96a] border border-slate-800"
                  >
                    {kp}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section Chunks List */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#d4a843]" />
              <div className="text-xs">Loading authentic statutory sections from corpus...</div>
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              {search
                ? `No sections matching "${search}" found inside this document.`
                : 'No section chunks available for this specific legal instrument.'}
            </div>
          ) : (
            filteredSections.map((sec) => {
              const isExpanded = expandedSectionId === sec.id;
              return (
                <div
                  key={sec.id}
                  className="rounded-xl bg-[#111724] border border-slate-800 hover:border-slate-700 transition overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className="text-slate-400 hover:text-white transition flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-[#d4a843]" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-semibold text-[#f0c96a] bg-[#d4a843]/10 px-2 py-0.5 rounded border border-[#d4a843]/20">
                            {sec.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {sec.citation}
                          </span>
                          {sec.part && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {sec.part}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs text-slate-300 font-medium truncate mt-0.5">
                          {sec.heading}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(sec.id, sec.text, e)}
                        className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                        title="Copy verbatim passage"
                      >
                        {copiedId === sec.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const query = `Explain ${sec.citation} (${sec.heading}) from ${resource.short_title} in plain English, with obligations and penalties.`;
                          onAskAI(query);
                          onClose();
                        }}
                        className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#f0c96a] text-[11px] font-medium border border-slate-700 transition"
                        title="Explain this section in MagaNithi AI"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Explain</span>
                      </button>
                    </div>
                  </div>

                  {/* Verbatim Section Text Drawer */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-[#090d16] border-t border-slate-800/80 animate-fade-up">
                      {sec.parent_context && (
                        <div className="text-[10px] text-slate-400 font-mono italic mb-2">
                          ↳ Context: {sec.parent_context}
                        </div>
                      )}
                      <div className="p-3.5 rounded-lg bg-[#070a10] border-l-2 border-[#d4a843] font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {sec.text}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#0a0e17] border-t border-slate-800 flex items-center justify-between px-6 text-xs text-slate-400 flex-shrink-0">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Sri Lanka Legal Corpus Provenance Guarantee</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}

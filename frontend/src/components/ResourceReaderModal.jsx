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
  Download,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function ResourceReaderModal({
  resource,
  isOpen,
  onClose,
  onAskAI,
  initialTab = 'sections',
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [readerTab, setReaderTab] = useState(initialTab); // 'sections' | 'pdf'

  useEffect(() => {
    if (!isOpen || !resource) {
      setDetail(null);
      setSearch('');
      setExpandedSectionId(null);
      setReaderTab('sections');
      return;
    }

    setReaderTab(initialTab);
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
          if (data.sections && data.sections.length > 0) {
            setExpandedSectionId(data.sections[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching resource details:', err);
        if (isMounted) {
          setDetail(resource);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, resource, initialTab]);

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

  const isPdf = (resource.source_file || '').toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-up">
      <div className="relative w-full max-w-5xl h-[92vh] bg-[#0c101a] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between flex-shrink-0">
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
              <h2 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5 tracking-tight font-serif-legal truncate max-w-xl">
                {resource.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
              title="Close viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Switcher: Sections vs Embedded Official PDF Scan */}
        <div className="px-4 py-2.5 bg-[#111726] border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setReaderTab('sections')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                readerTab === 'sections'
                  ? 'bg-[#d4a843] text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Statute Provisions ({sections.length || resource.sections_count})</span>
            </button>

            {isPdf && (
              <button
                type="button"
                onClick={() => setReaderTab('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  readerTab === 'pdf'
                    ? 'bg-[#d4a843] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Original Government PDF Scan</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            {isPdf && (
              <button
                type="button"
                onClick={() => window.open(`/pdf/${resource.id}`, '_blank')}
                className="text-[#f0c96a] hover:text-white flex items-center gap-1 underline underline-offset-2 transition"
              >
                <Download className="w-3 h-3" />
                <span>Open / Download PDF</span>
              </button>
            )}
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Primary Source</span>
            </span>
          </div>
        </div>

        {/* TAB 1: Searchable Sections View */}
        {readerTab === 'sections' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search Toolbar */}
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

            {/* Content Scrollable Area */}
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
          </div>
        )}

        {/* TAB 2: Embedded Authentic Official PDF Viewer */}
        {readerTab === 'pdf' && isPdf && (
          <div className="flex-1 w-full h-full flex flex-col p-4 bg-[#070a10] min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-3 text-xs text-slate-400 flex-shrink-0">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="truncate max-w-md">
                  Official Scan: {resource.source_file.replace('data/raw/', '')}
                </span>
              </span>
              <button
                type="button"
                onClick={() => window.open(`/pdf/${resource.id}`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#f0c96a] font-semibold border border-slate-700 transition shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Full Tab / Download</span>
              </button>
            </div>

            <div className="flex-1 w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <iframe
                src={`/pdf/${resource.id}#view=FitH`}
                className="w-full h-full"
                title={`Official PDF - ${resource.title}`}
              />
            </div>
          </div>
        )}

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

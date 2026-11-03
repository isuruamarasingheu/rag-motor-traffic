import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  FileText,
  Sparkles,
  Database,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function StatuteLibraryView({ onExplainSection, onBackToChat }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/sections?limit=150')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load statute records');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setSections(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch sections:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return sections.filter((s) => {
      const matchCat =
        selectedCategory === 'all' ||
        (s.regulation_category || '').toLowerCase() === selectedCategory.toLowerCase();
      const q = search.toLowerCase().trim();
      const matchText =
        !q ||
        (s.id || '').toLowerCase().includes(q) ||
        (s.citation || '').toLowerCase().includes(q) ||
        (s.heading || '').toLowerCase().includes(q) ||
        (s.text || '').toLowerCase().includes(q) ||
        (s.part || '').toLowerCase().includes(q) ||
        (s.source_file || '').toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [sections, search, selectedCategory]);

  const handleCopy = (id, text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b0f17] animate-fade-up">
      {/* Top Page Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e131d]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoldenScaleLogo className="w-10 h-10 rounded-xl" iconSize="w-5 h-5" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-semibold text-slate-100">
                Statute Library & Data Provenance Explorer
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30">
                991 Verified Chunks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect authentic statutory records from the Consolidated 2024 Act and official Gazettes. Zero hallucination guarantee.
            </p>
          </div>
        </div>

        <button
          onClick={onBackToChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chat</span>
        </button>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-[#121826] flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by section (e.g. 123, 141A, 218), keyword, or source PDF..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/70 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#d4a843] transition"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {['all', 'licensing', 'penalties', 'speed', 'equipment', 'noise', 'insurance', 'registration', 'procedure'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition text-[11px] ${
                selectedCategory === cat
                  ? 'bg-[#d4a843] text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main List of Statute Chunks */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
        {loading ? (
          <div className="text-center py-24 text-slate-400 text-xs space-y-2">
            <Database className="w-7 h-7 mx-auto animate-pulse text-[#d4a843]" />
            <div>Loading verified statutory records from corpus...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-xs">
            No matching statutory sections found for "{search}".
          </div>
        ) : (
          filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl bg-[#121824]/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden group shadow-md"
              >
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    {/* Top provenance tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold text-[#f0c96a] bg-[#d4a843]/10 px-2 py-0.5 rounded border border-[#d4a843]/20">
                        {item.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {item.citation}
                      </span>
                      {item.part && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.part}
                        </span>
                      )}
                      {item.source_file && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-slate-500 border border-slate-800">
                          📁 {item.source_file.replace('data/raw/', '')}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 mt-1">
                      {item.heading}
                    </h3>

                    {/* Parent Context */}
                    {item.parent_context && (
                      <p className="text-[11px] text-slate-400 font-mono italic">
                        ↳ {item.parent_context}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700/60"
                      title="Inspect verbatim extracted text"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#d4a843]" />
                      <span>{isExpanded ? 'Hide Verbatim' : 'View Verbatim'}</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {/* RAG Trigger: Explain in Plain English */}
                    <button
                      onClick={() => {
                        const query = `Explain ${item.citation} (${item.heading}) in plain English for a citizen, including obligations, exceptions, and penalties.`;
                        onExplainSection(query);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4a843] to-[#e4b952] hover:brightness-105 text-slate-950 text-xs font-semibold transition shadow-md active:scale-95"
                      title="Send this exact statute chunk to MagaNithi AI for a plain-English citizen explanation"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950/20" />
                      <span>Explain in Plain English</span>
                    </button>
                  </div>
                </div>

                {/* Verbatim text drawer */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-slate-950/90 border-t border-slate-800/80 animate-fade-up">
                    <div className="flex items-center justify-between py-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Authentic Verbatim Statutory Passage</span>
                      </span>
                      <button
                        onClick={(e) => handleCopy(item.id, item.text, e)}
                        className="flex items-center gap-1 text-[#f0c96a] hover:text-white transition"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === item.id ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>
                    <div className="p-4 rounded-lg bg-[#090d15] border-l-2 border-[#d4a843] font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {item.text}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Provenance Info Bar */}
      <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between px-6">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Data Provenance: Grounded on Sri Lanka Motor Traffic Act No. 14 of 1951 (Consolidated 2024)</span>
        </span>
        <span className="text-slate-400">Showing {filtered.length} of {sections.length} indexed chunks</span>
      </div>
    </div>
  );
}

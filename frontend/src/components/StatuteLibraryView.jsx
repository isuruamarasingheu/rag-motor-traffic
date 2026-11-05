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
  Layers,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter,
  Eye,
  ExternalLink,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';
import LegalResourceCoverCard from './LegalResourceCoverCard';
import ResourceReaderModal from './ResourceReaderModal';

export default function StatuteLibraryView({ onExplainSection, onBackToChat }) {
  // Tab view: 'resources' (visual book covers) vs 'chunks' (991 granular sections)
  const [activeTab, setActiveTab] = useState('resources');

  // Resources state
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Sections state
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showCount, setShowCount] = useState(12);

  // Reader Modal State
  const [selectedResourceForReader, setSelectedResourceForReader] = useState(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Granular section explorer state
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Load Resources Catalog
  useEffect(() => {
    let isMounted = true;
    setLoadingResources(true);

    fetch('/resources?limit=100')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load resources catalog');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setResources(data);
          setLoadingResources(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch resources:', err);
        if (isMounted) setLoadingResources(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Granular Sections
  useEffect(() => {
    let isMounted = true;
    setLoadingSections(true);

    fetch('/sections?limit=150')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load statute records');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setSections(data);
          setLoadingSections(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch sections:', err);
        if (isMounted) setLoadingSections(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered & Sorted Resources (Visual Cover Grid)
  const filteredResources = useMemo(() => {
    let list = [...resources];

    // Filter by Instrument Type
    if (selectedType !== 'all') {
      list = list.filter((r) => (r.instrument_type || '').toLowerCase() === selectedType.toLowerCase());
    }

    // Filter by Subject Category
    if (selectedCategory !== 'all') {
      list = list.filter((r) => (r.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.short_title || '').toLowerCase().includes(q) ||
          (r.gazette_no || '').toLowerCase().includes(q) ||
          (r.act_no || '').toLowerCase().includes(q) ||
          (r.description || '').toLowerCase().includes(q) ||
          (r.badge_label || '').toLowerCase().includes(q) ||
          (r.key_provisions || []).some((kp) => kp.toLowerCase().includes(q))
      );
    }

    // Sort By
    if (sortBy === 'newest') {
      list.sort((a, b) => (b.date_promulgated || '0000').localeCompare(a.date_promulgated || '0000'));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => (a.date_promulgated || '9999').localeCompare(b.date_promulgated || '9999'));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.short_title || a.title || '').localeCompare(b.short_title || b.title || ''));
    } else if (sortBy === 'sections') {
      list.sort((a, b) => (b.sections_count || 0) - (a.sections_count || 0));
    }

    // Pagination / Show Count
    if (showCount !== 'all') {
      list = list.slice(0, Number(showCount));
    }

    return list;
  }, [resources, search, selectedType, selectedCategory, sortBy, showCount]);

  // Filtered Granular Sections
  const filteredSections = useMemo(() => {
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

  const handleOpenReader = (resource) => {
    setSelectedResourceForReader(resource);
    setIsReaderOpen(true);
  };

  const handleExplainWithAI = (resource) => {
    const query = `Explain ${resource.short_title || resource.title} in plain English for a citizen, including who it affects, main penalties, and practical rules.`;
    onExplainSection(query);
  };

  const handleCopySection = (id, text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpandSection = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0d14] text-slate-100 font-sans animate-fade-up">
      {/* Top Page Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0c101a] flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <GoldenScaleLogo className="w-10 h-10 rounded-xl" iconSize="w-5 h-5" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Statute Library & Legal Resources Viewer
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30">
                23 Primary Instruments · 991 Verified Chunks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse official consolidated Acts, amending legislation, and extraordinary gazettes with zero hallucination.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & Back Button */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'resources'
                  ? 'bg-[#d4a843] text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Resources Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('chunks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'chunks'
                  ? 'bg-[#d4a843] text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Section Chunks (991)</span>
            </button>
          </div>

          <button
            onClick={onBackToChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>
        </div>
      </div>

      {/* Top Filter & Sort Bar (Matching photo's toolbar) */}
      <div className="p-4 border-b border-slate-800 bg-[#0e1320] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 flex-shrink-0">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'resources'
                ? "Search by resource name, gazette number (e.g. 2054/09), topic..."
                : "Search section chunks (e.g. 123, 215A, silencer, helmet)..."
            }
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#d4a843] transition"
          />
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Instrument Type Filter */}
          {activeTab === 'resources' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 hidden xl:inline">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#d4a843]"
              >
                <option value="all">All Types</option>
                <option value="principal_act">Principal Act</option>
                <option value="gazette_regulation">Extraordinary Gazettes</option>
                <option value="amendment">Amending Acts</option>
                <option value="procedural_guide">Citizen Guides</option>
              </select>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-slate-400 hidden xl:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-[#d4a843]"
            >
              <option value="all">All Categories</option>
              <option value="penalties">Spot Fines & Penalties</option>
              <option value="speed">Speed & Road Signs</option>
              <option value="safety">Safety & Helmets</option>
              <option value="noise">Noise & Horn Decibels</option>
              <option value="emissions">Emissions & Fitness</option>
              <option value="licensing">Driver Licensing</option>
              <option value="registration">Vehicle Registration</option>
              <option value="expressway">Expressways</option>
            </select>
          </div>

          {/* Sort By Dropdown (Mirroring photo) */}
          {activeTab === 'resources' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-[#f0c96a] font-medium outline-none focus:border-[#d4a843]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title (A-Z)</option>
                <option value="sections">Most Chunks</option>
              </select>
            </div>
          )}

          {/* Show Count Dropdown (Mirroring photo 'Show [40 v]') */}
          {activeTab === 'resources' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400">Show</span>
              <select
                value={showCount}
                onChange={(e) => setShowCount(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[#d4a843]"
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="all">All</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* VIEW 1: Visual Book Cover Grid (Matching photo) */}
        {activeTab === 'resources' && (
          <div>
            {loadingResources ? (
              <div className="text-center py-24 text-slate-400 text-xs space-y-2">
                <Database className="w-8 h-8 mx-auto animate-pulse text-[#d4a843]" />
                <div>Loading legal resources catalog from official sources...</div>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No legal resources found matching "{search}".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
                {filteredResources.map((res) => (
                  <LegalResourceCoverCard
                    key={res.id}
                    resource={res}
                    onOpenReader={handleOpenReader}
                    onExplainAI={handleExplainWithAI}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Granular Section Chunks List (991 chunks) */}
        {activeTab === 'chunks' && (
          <div className="space-y-3">
            {loadingSections ? (
              <div className="text-center py-24 text-slate-400 text-xs space-y-2">
                <Database className="w-8 h-8 mx-auto animate-pulse text-[#d4a843]" />
                <div>Loading verified statutory records from corpus...</div>
              </div>
            ) : filteredSections.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No matching statutory sections found for "{search}".
              </div>
            ) : (
              filteredSections.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#121824]/80 border border-slate-800 hover:border-slate-700 transition overflow-hidden group shadow-md"
                  >
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
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

                        {item.parent_context && (
                          <p className="text-[11px] text-slate-400 font-mono italic">
                            ↳ {item.parent_context}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 self-end lg:self-center">
                        {item.source_file && item.source_file.endsWith('.pdf') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/pdf-file?path=${item.source_file.replace('data/raw/', '')}`, '_blank');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#f0c96a] text-xs font-medium transition border border-slate-700/60"
                            title="Open authentic government PDF scan in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Source PDF</span>
                          </button>
                        )}

                        <button
                          onClick={() => toggleExpandSection(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700/60"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#d4a843]" />
                          <span>{isExpanded ? 'Hide Verbatim' : 'View Verbatim'}</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => {
                            const query = `Explain ${item.citation} (${item.heading}) in plain English for a citizen, including obligations, exceptions, and penalties.`;
                            onExplainSection(query);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4a843] to-[#e4b952] hover:brightness-105 text-slate-950 text-xs font-semibold transition shadow-md active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-slate-950/20" />
                          <span>Explain in Plain English</span>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 bg-slate-950/90 border-t border-slate-800/80 animate-fade-up">
                        <div className="flex items-center justify-between py-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Authentic Verbatim Statutory Passage</span>
                          </span>
                          <button
                            onClick={(e) => handleCopySection(item.id, item.text, e)}
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
        )}
      </div>

      {/* Bottom Provenance Info Bar */}
      <div className="p-3 bg-[#0c101a] border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between px-6 flex-shrink-0">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Data Provenance: Grounded on Sri Lanka Motor Traffic Act No. 14 of 1951 (Consolidated 2024)</span>
        </span>
        <span className="text-slate-400">
          {activeTab === 'resources'
            ? `Showing ${filteredResources.length} of ${resources.length} legal instruments`
            : `Showing ${filteredSections.length} of ${sections.length} indexed chunks`}
        </span>
      </div>

      {/* Resource Reader Modal */}
      <ResourceReaderModal
        resource={selectedResourceForReader}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        onAskAI={(query) => {
          setIsReaderOpen(false);
          onExplainSection(query);
        }}
      />
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ArrowLeft,
  Database,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';
import LegalResourceCoverCard from './LegalResourceCoverCard';
import ResourceReaderModal from './ResourceReaderModal';

export default function StatuteLibraryView({ onExplainSection, onBackToChat }) {
  // Resources state
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showCount, setShowCount] = useState(12);

  // Reader Modal State
  const [selectedResourceForReader, setSelectedResourceForReader] = useState(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

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

  const handleOpenReader = (resource) => {
    setSelectedResourceForReader(resource);
    setIsReaderOpen(true);
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
                23 Official Acts & Gazettes
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse official consolidated Acts, amending legislation, and extraordinary gazettes with zero hallucination.
            </p>
          </div>
        </div>

        {/* Back to Chat Button */}
        <button
          onClick={onBackToChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition self-start md:self-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Chat</span>
        </button>
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
            placeholder="Search by resource title, act number, or gazette number (e.g. 2054/09)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#d4a843] transition"
          />
        </div>

        {/* Center & Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Instrument Type Filter */}
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
              <option value="sections">Most Sections</option>
            </select>
          </div>

          {/* Show Count Dropdown (Mirroring photo 'Show [40 v]') */}
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
        </div>
      </div>

      {/* Main Content Area: Visual Book Cover Grid (Matching photo) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
              />
            ))}
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
          Showing {filteredResources.length} of {resources.length} official legal instruments
        </span>
      </div>

      {/* Resource Reader Modal */}
      <ResourceReaderModal
        resource={selectedResourceForReader}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </div>
  );
}

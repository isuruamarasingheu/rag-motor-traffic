import React, { useState } from 'react';
import {
  Plus,
  BookOpen,
  Bookmark,
  Bell,
  ChevronDown,
  ChevronRight,
  Search,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Sparkles,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

const TOPIC_PRESETS = [
  {
    title: 'Driving Licences (Part VII)',
    query: 'What is the penalty for driving a motor vehicle without a valid driving licence?',
  },
  {
    title: '2019 Fines (Act No. 10)',
    query: 'What are the fines under Motor Traffic Amendment Act No 10 of 2019?',
  },
  {
    title: 'Noise Limits (Gazette 1738/37)',
    query: 'What is the noise emission limit for a motorcycle silencer under the law?',
  },
  {
    title: 'Speed Limits (Section 141A)',
    query: 'What are the penalties for speeding over the speed limit?',
  },
  {
    title: 'Vehicle Seizure (Section 232F)',
    query: 'Can a police officer seize or detain my vehicle on the road?',
  },
  {
    title: 'Disputing Spot Fines (Police Guide)',
    query: 'Can I contest or appeal a traffic fine issued by the police?',
  },
];

export default function Sidebar({
  onSelectQuery,
  onNewQuestion,
  history = [],
  savedCount = 0,
  onOpenActBrowser,
  onOpenSavedAnswers,
  onOpenGazetteUpdates,
  collapsed,
  setCollapsed,
}) {
  const [topicsOpen, setTopicsOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);

  if (collapsed) {
    return (
      <aside className="w-16 bg-[#090d15] text-slate-300 flex flex-col h-full border-r border-slate-800/80 items-center py-4 space-y-6 flex-shrink-0 select-none">
        <button
          onClick={() => setCollapsed(false)}
          className="focus:outline-none"
          title="Expand Sidebar"
        >
          <GoldenScaleLogo className="w-9 h-9 rounded-xl" iconSize="w-5 h-5" />
        </button>

        <button
          onClick={onNewQuestion}
          className="w-10 h-10 rounded-xl bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/40 flex items-center justify-center hover:bg-[#d4a843]/25 transition"
          title="New Question"
        >
          <Plus className="w-4 h-4" />
        </button>

        <nav className="flex flex-col items-center gap-4 flex-1">
          <button
            onClick={onOpenActBrowser}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Read the Act"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenSavedAnswers}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition relative"
            title="Saved Answers"
          >
            <Bookmark className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4a843]" />
            )}
          </button>
          <button
            onClick={onOpenGazetteUpdates}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            title="Gazette Updates"
          >
            <Bell className="w-4 h-4" />
          </button>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-[#090d15] text-slate-300 flex flex-col h-full border-r border-slate-800/80 flex-shrink-0 relative select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <GoldenScaleLogo className="w-8 h-8 rounded-xl" iconSize="w-4 h-4" />
          <span className="text-xs font-semibold text-slate-200 tracking-tight">
            Motor Traffic Law
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={onOpenActBrowser}
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition"
            title="Search the Act"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New Question Action Button */}
      <div className="p-3">
        <button
          onClick={onNewQuestion}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-[#10b981]/30 hover:border-[#10b981]/60 text-slate-100 text-xs font-medium shadow-sm transition active:scale-[0.98] group"
        >
          <Plus className="w-3.5 h-3.5 text-[#10b981] group-hover:scale-110 transition" />
          <span>New question</span>
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="px-2 space-y-0.5">
        <button
          onClick={onOpenActBrowser}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition text-left"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Read the Act</span>
        </button>

        <button
          onClick={onOpenSavedAnswers}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition text-left"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            <span>Saved answers</span>
          </div>
          {savedCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30">
              {savedCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenGazetteUpdates}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition text-left"
        >
          <Bell className="w-3.5 h-3.5 text-slate-400" />
          <span>Gazette updates</span>
        </button>
      </div>

      {/* Accordions Container */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs">
        {/* Topics Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setTopicsOpen(!topicsOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition"
          >
            <span>Topics</span>
            {topicsOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {topicsOpen && (
            <div className="space-y-0.5 pt-0.5">
              {TOPIC_PRESETS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectQuery(t.query)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-left transition truncate text-[11px]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent Accordion */}
        <div className="space-y-1">
          <button
            onClick={() => setRecentOpen(!recentOpen)}
            className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition"
          >
            <span>Recent</span>
            {recentOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {recentOpen && (
            <div className="space-y-0.5 pt-0.5">
              {history.length === 0 ? (
                <div className="px-3 py-2 text-[11px] text-slate-600 italic">
                  No questions asked yet
                </div>
              ) : (
                history.slice(0, 8).map((h, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectQuery(h.question)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-left transition truncate text-[11px] group"
                  >
                    <Clock className="w-3 h-3 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                    <span className="truncate">{h.question}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats Tile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>991 Sections Indexed</span>
          </span>
          <span className="text-[#f0c96a] font-mono text-[10px]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}

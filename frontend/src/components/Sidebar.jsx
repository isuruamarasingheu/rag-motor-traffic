import React from 'react';
import {
  Plus,
  BookOpen,
  Bookmark,
  Calculator,
  Search,
  PanelLeftClose,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function Sidebar({
  activeView = 'chat',
  onNavigate,
  onNewQuestion,
  sessions = [],
  activeSessionId = null,
  onSelectSession,
  onDeleteSession,
  savedCount = 0,
  collapsed,
  setCollapsed,
}) {
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
          onClick={() => {
            onNavigate('chat');
            onNewQuestion();
          }}
          className="w-10 h-10 rounded-xl bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/40 flex items-center justify-center hover:bg-[#d4a843]/25 transition"
          title="New Question"
        >
          <Plus className="w-4 h-4" />
        </button>

        <nav className="flex flex-col items-center gap-4 flex-1">
          <button
            onClick={() => onNavigate('chat')}
            className={`p-2.5 rounded-xl transition ${
              activeView === 'chat'
                ? 'bg-[#d4a843]/20 text-[#f0c96a] border border-[#d4a843]/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Chat Assistant"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('library')}
            className={`p-2.5 rounded-xl transition ${
              activeView === 'library'
                ? 'bg-[#d4a843]/20 text-[#f0c96a] border border-[#d4a843]/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Statute Library"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('calculator')}
            className={`p-2.5 rounded-xl transition ${
              activeView === 'calculator'
                ? 'bg-[#d4a843]/20 text-[#f0c96a] border border-[#d4a843]/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Fine Calculator"
          >
            <Calculator className="w-4 h-4 text-[#d4a843]" />
          </button>

          <button
            onClick={() => onNavigate('saved')}
            className={`p-2.5 rounded-xl transition relative ${
              activeView === 'saved'
                ? 'bg-[#d4a843]/20 text-[#f0c96a] border border-[#d4a843]/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Saved Answers"
          >
            <Bookmark className="w-4 h-4" />
            {savedCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4a843]" />
            )}
          </button>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-[#090d15] text-slate-300 flex flex-col h-full border-r border-slate-800/80 flex-shrink-0 relative select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onNavigate('chat')}
          className="flex items-center gap-2.5 focus:outline-none text-left"
        >
          <GoldenScaleLogo className="w-8 h-8 rounded-xl" iconSize="w-4 h-4" />
          <div>
            <span className="text-xs font-semibold text-slate-200 tracking-tight block">
              Motor Traffic Law
            </span>
            <span className="text-[10px] text-slate-500 font-sans block">
              Sri Lanka Act No. 14
            </span>
          </div>
        </button>
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={() => onNavigate('library')}
            className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800/80 transition"
            title="Explore 991 Sections in Library"
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
          onClick={() => {
            onNavigate('chat');
            onNewQuestion();
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-[#10b981]/30 hover:border-[#10b981]/60 text-slate-100 text-xs font-medium shadow-sm transition active:scale-[0.98] group"
        >
          <Plus className="w-3.5 h-3.5 text-[#10b981] group-hover:scale-110 transition" />
          <span>New question</span>
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <div className="px-2 space-y-1">
        <button
          onClick={() => onNavigate('chat')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left group ${
            activeView === 'chat'
              ? 'bg-slate-800 text-white font-semibold border-l-2 border-[#d4a843]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare
              className={`w-3.5 h-3.5 transition ${
                activeView === 'chat'
                  ? 'text-[#f0c96a]'
                  : 'text-slate-400 group-hover:text-[#d4a843]'
              }`}
            />
            <span>Chat Assistant</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('library')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left group ${
            activeView === 'library'
              ? 'bg-slate-800 text-white font-semibold border-l-2 border-[#d4a843]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen
              className={`w-3.5 h-3.5 transition ${
                activeView === 'library'
                  ? 'text-[#f0c96a]'
                  : 'text-slate-400 group-hover:text-[#d4a843]'
              }`}
            />
            <span>Statute Library</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('calculator')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left group ${
            activeView === 'calculator'
              ? 'bg-slate-800 text-white font-semibold border-l-2 border-[#d4a843]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Calculator
              className={`w-3.5 h-3.5 text-[#d4a843] ${
                activeView === 'calculator' ? 'scale-110' : ''
              }`}
            />
            <span>Fine Calculator</span>
          </div>
          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Spot Fines
          </span>
        </button>

        <button
          onClick={() => onNavigate('saved')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition text-left group ${
            activeView === 'saved'
              ? 'bg-slate-800 text-white font-semibold border-l-2 border-[#d4a843]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark
              className={`w-3.5 h-3.5 transition ${
                activeView === 'saved'
                  ? 'text-[#f0c96a]'
                  : 'text-slate-400 group-hover:text-[#d4a843]'
              }`}
            />
            <span>Saved answers</span>
          </div>
          {savedCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30">
              {savedCount}
            </span>
          )}
        </button>
      </div>

      {/* Conversations (Chat Sessions) List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2 text-xs">
        <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3 text-[#d4a843]" />
            <span>Conversations</span>
          </div>
          {sessions.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
              {sessions.length}
            </span>
          )}
        </div>

        <div className="space-y-1">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-[11px] text-slate-500 italic space-y-1">
              <p>No conversations yet.</p>
              <p className="text-[10px] text-slate-600">Ask a question to start a chat session.</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = activeSessionId === sess.id && activeView === 'chat';
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    onNavigate('chat');
                    if (onSelectSession) onSelectSession(sess.id);
                  }}
                  className={`group relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl cursor-pointer transition select-none ${
                    isActive
                      ? 'bg-slate-800 text-white font-medium border border-[#d4a843]/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                  title={sess.title}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-3.5 h-3.5 flex-shrink-0 transition ${
                        isActive ? 'text-[#f0c96a]' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs truncate block leading-snug">
                        {sess.title}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {sess.turns?.length || 1} {sess.turns?.length === 1 ? 'question' : 'questions'}
                      </span>
                    </div>
                  </div>

                  {/* Delete Session Button (Visible on hover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteSession) onDeleteSession(sess.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-900/80 transition flex-shrink-0"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
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

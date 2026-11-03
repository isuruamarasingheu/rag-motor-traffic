import React, { useState } from 'react';
import { Bookmark, Trash2, ArrowLeft, Copy, Check, ExternalLink, MessageSquare } from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function SavedAnswersView({
  savedAnswers = [],
  onRemove,
  onSelect,
  onBackToChat,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b0f17] animate-fade-up">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e131d]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoldenScaleLogo className="w-10 h-10 rounded-xl" iconSize="w-5 h-5" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-semibold text-slate-100">
                Saved Answers & Citations
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30">
                {savedAnswers.length} Bookmarked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and export your bookmarked legal answers and verified statutory citations.
            </p>
          </div>
        </div>

        <button
          onClick={onBackToChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assistant</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-4">
        {savedAnswers.length === 0 ? (
          <div className="text-center py-24 text-slate-500 text-xs flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Bookmark className="w-6 h-6 opacity-40" />
            </div>
            <span className="text-sm font-medium text-slate-400">No saved answers yet</span>
            <p className="max-w-md text-slate-500 leading-relaxed">
              When MagaNithi AI provides an answer with verified citations, click the "Save" button to bookmark it here for quick reference.
            </p>
            <button
              onClick={onBackToChat}
              className="mt-2 px-4 py-2 rounded-xl bg-[#d4a843] hover:bg-[#e4b952] text-slate-950 font-semibold text-xs transition shadow-md"
            >
              Ask a Legal Question
            </button>
          </div>
        ) : (
          savedAnswers.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition space-y-3.5 shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#d4a843]/15 text-[#f0c96a] flex items-center justify-center text-xs font-bold font-mono">
                    {idx + 1}
                  </div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    {item.question}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(idx, `${item.question}\n\n${item.answer}`)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    title="Copy Answer & Citations"
                  >
                    {copiedId === idx ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onRemove(idx)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Answer content */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
                {item.answer}
              </div>

              {/* Citations & Open in chat action */}
              <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Statutory Sources:
                  </span>
                  {item.citations && item.citations.length > 0 ? (
                    item.citations.map((c, ci) => (
                      <span
                        key={ci}
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-[#d4a843]/10 text-[#f0c96a] border border-[#d4a843]/20"
                      >
                        {c.citation || c.id}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">Sri Lanka Motor Traffic Act</span>
                  )}
                </div>

                <button
                  onClick={() => onSelect(item.question)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#f0c96a] hover:text-white transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open in Chat</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


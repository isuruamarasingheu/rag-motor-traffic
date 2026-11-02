import React from 'react';
import { X, Bookmark, Trash2, ChevronRight, Copy, Check } from 'lucide-react';

export default function SavedAnswersModal({ isOpen, onClose, savedAnswers = [], onRemove, onSelect }) {
  const [copiedId, setCopiedId] = React.useState(null);

  if (!isOpen) return null;

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5 fill-amber-400/20" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Saved Answers</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {savedAnswers.length} saved
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Quickly access legal answers you have bookmarked during this session.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedAnswers.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <span>No saved answers yet. Click the bookmark icon on any answer to save it here.</span>
            </div>
          ) : (
            savedAnswers.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xs font-semibold text-slate-200">
                    {item.question}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(idx, item.answer)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Copy Answer"
                    >
                      {copiedId === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onRemove(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 font-normal">
                  {item.answer}
                </p>

                {item.citations && item.citations.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Citations:</span>
                    {item.citations.map((c, ci) => (
                      <span
                        key={ci}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4a843]/10 text-[#f0c96a] border border-[#d4a843]/20"
                      >
                        {c.citation || c.id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


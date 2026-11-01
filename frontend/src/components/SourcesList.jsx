import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default function SourcesList({ citations }) {
  if (!citations || citations.length === 0) return null;

  const [expandedId, setExpandedId] = useState(citations[0]?.id || null);
  const [copiedId, setCopiedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCopy = (id, text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <BookOpen className="w-5 h-5 text-emerald-700" />
        <h3 className="text-sm font-bold text-slate-900">
          Verified Statutory Sources & Citations ({citations.length})
        </h3>
      </div>

      <div className="space-y-3">
        {citations.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id || idx}
              className="border border-slate-200 rounded-lg overflow-hidden transition hover:border-slate-300"
            >
              <div
                onClick={() => toggleExpand(item.id)}
                className="px-4 py-3 bg-slate-50 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 font-semibold">
                    {item.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {item.citation || item.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(item.id, item.text, e)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                    title="Copy verbatim text"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-white border-t border-slate-100 text-xs leading-relaxed text-slate-700 whitespace-pre-line font-mono bg-slate-50/30">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 font-sans">
                    Verbatim Source Text:
                  </div>
                  {item.text || 'No verbatim text recorded for this unit.'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


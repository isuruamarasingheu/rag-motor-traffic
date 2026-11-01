import React from 'react';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const QUICK_CHIPS = [
  { label: 'Musical horns', text: 'Can I use a musical horn or dual-tone air horn on my private van?' },
  { label: 'Learner driver', text: "Can a learner driver drive alone if they display 'L' plates on the vehicle?" },
  { label: 'Appeal fine', text: 'Can I contest or appeal a traffic fine issued by the police?' },
  { label: 'Out of Scope ↗', text: 'Can a landlord evict a tenant without giving one month prior notice?' },
];

export default function QueryInput({ question, setQuestion, onSubmit, loading, error }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 mb-6 transition focus-within:ring-4 focus-within:ring-slate-900/5 focus-within:border-slate-300">
      <form onSubmit={onSubmit}>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="question-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>💬</span> Ask a Legal Question in Plain English
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            {question.length} / 500
          </span>
        </div>

        <textarea
          id="question-input"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="e.g. What is the maximum permissible noise level for a motorcycle exhaust in Sri Lanka?"
          className="w-full px-3.5 py-2.5 text-slate-900 bg-slate-50/60 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1c3160] focus:border-transparent text-sm leading-relaxed outline-none transition disabled:bg-slate-100 disabled:text-slate-400 resize-none font-normal"
          maxLength={500}
        />

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl animate-fade-up">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick sample chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d4a843]" />
              Quick:
            </span>
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuestion(chip.text)}
                disabled={loading}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition font-medium active:scale-95 disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-end gap-3">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Press Ctrl+Enter
            </span>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#1c3160] to-[#0a1628] hover:from-[#2a4a8f] hover:to-[#1c3160] text-white text-xs font-semibold shadow-md shadow-slate-900/10 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Ask Assistant</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

import React from 'react';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const SAMPLE_QUERIES = [
  {
    label: "Musical Horns",
    text: "Can I use a musical horn or dual-tone air horn on my private van?",
  },
  {
    label: "Learner Driver",
    text: "Can a learner driver drive alone if they display 'L' plates on the vehicle?",
  },
  {
    label: "Dispute Fine",
    text: "Can I contest a wrong traffic fine directly at the police station with the OIC?",
  },
  {
    label: "Tenancy Eviction (Out of Scope)",
    text: "Can a landlord evict a tenant without giving one month prior notice?",
  },
];

export default function QueryInput({ question, setQuestion, onSubmit, loading, error }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      onSubmit(e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
      <form onSubmit={onSubmit}>
        <label htmlFor="question-input" className="block text-sm font-semibold text-slate-800 mb-2">
          Ask a Legal Question in Plain English:
        </label>
        <div className="relative">
          <textarea
            id="question-input"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="e.g. What is the legal penalty for driving without a valid driving licence?"
            className="w-full px-4 py-3 text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm leading-relaxed outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
            <span>Press Ctrl+Enter to submit</span>
            <span>{question.length} / 500 characters</span>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Try sample:
            </span>
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuestion(sample.text)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-medium"
              >
                {sample.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || question.trim().length < 3}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow transition disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Law...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Ask Assistant</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


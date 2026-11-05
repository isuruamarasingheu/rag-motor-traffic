import React, { useRef, useEffect } from 'react';
import {
  ArrowUp,
  Volume2,
  AlertTriangle,
  Car,
  FileText,
  Plus,
  Scale,
  Sparkles,
  BookOpen,
  Calculator,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

const POPULAR_QUESTIONS = [
  {
    icon: Volume2,
    label: 'Motorcycle silencer noise limit',
    query: 'What is the noise emission limit for a motorcycle silencer under the law?',
  },
  {
    icon: AlertTriangle,
    label: 'Driving without licence penalty',
    query: 'What is the penalty for driving a motor vehicle without a valid driving licence?',
  },
  {
    icon: Car,
    label: 'Learner driver alone with L-plates',
    query: 'Can a learner driver drive alone if they display L plates on the vehicle?',
  },
  {
    icon: FileText,
    label: 'Contesting a police spot fine',
    query: 'Can I contest or appeal a traffic fine issued by the police?',
  },
];

export default function QueryHero({
  question,
  setQuestion,
  onSubmit,
  loading,
  error,
  onOpenStatuteLibrary,
  onOpenFineCalculator,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim() && !loading) {
        onSubmit(e);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full px-4 py-8 text-center animate-fade-up">
      {/* Brand Icon & Warm Modern Gemini-style Greeting */}
      <div className="mb-6 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-[#1e1f20] border border-[#333538] flex items-center justify-center mb-4 shadow-sm">
          <GoldenScaleLogo className="w-8 h-8 rounded-xl" iconSize="w-5 h-5" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-normal text-[#f1f3f4] tracking-tight">
          What does the law say?
        </h1>
        <p className="text-sm sm:text-base text-[#9aa0a6] mt-2 font-normal">
          Ask any question about vehicles, driving licences, or police fines in everyday language.
        </p>
      </div>

      {/* Floating Gemini-style Pill Input Bar (Matching Photo 2) */}
      <div className="w-full mb-8">
        <form
          onSubmit={onSubmit}
          className="relative rounded-full bg-[#1e1f20] border border-[#3c4043] focus-within:border-[#8ab4f8] focus-within:bg-[#222426] shadow-2xl px-4 py-3 sm:py-3.5 flex items-center gap-3 transition-all duration-200 text-left"
        >
          <div className="p-1.5 rounded-full text-[#9aa0a6] flex-shrink-0">
            <Plus className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask MagaNithi about traffic fines, licences, road rules..."
            className="flex-1 bg-transparent text-sm sm:text-base text-[#f1f3f4] placeholder:text-[#8e918f] outline-none font-normal"
          />

          <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-[#2c2d30] text-xs text-[#c4c7c5] font-mono select-none">
            <span>MTA 2024</span>
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition flex-shrink-0 ${
              loading
                ? 'bg-slate-700 text-white cursor-wait animate-pulse'
                : 'bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95'
            }`}
            title="Ask MagaNithi"
          >
            {loading ? (
              <Scale className="w-4 h-4 stroke-[2.5] text-slate-950 animate-scale-weigh" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.8]" />
            )}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-2xl text-left">
            {error}
          </div>
        )}
      </div>

      {/* Gemini-style Suggestion Chips */}
      <div className="w-full">
        <div className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left mb-3 pl-1">
          Suggested Topics:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
          {POPULAR_QUESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(item.query);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="flex items-start gap-3 p-3 rounded-2xl bg-[#1e1f20]/80 hover:bg-[#282a2c] border border-[#333538] hover:border-slate-600 transition text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-[#d4a843]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[#9aa0a6] line-clamp-1 mt-0.5">
                    {item.query}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation Pills */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenFineCalculator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] text-xs text-[#f0c96a] font-medium transition"
        >
          <Calculator className="w-3.5 h-3.5 text-[#d4a843]" />
          <span>Spot Fine Calculator</span>
        </button>

        <button
          type="button"
          onClick={onOpenStatuteLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] text-xs text-slate-300 hover:text-white transition"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Statute Library & Gazettes</span>
        </button>
      </div>

      {/* Bottom Legal Notice */}
      <div className="mt-8 text-[11px] text-[#8e918f]">
        MagaNithi provides citation-grounded legal information, not legal advice.
      </div>
    </div>
  );
}

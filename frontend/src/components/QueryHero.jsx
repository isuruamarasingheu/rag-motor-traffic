import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Search,
  BookOpen,
  Mic,
  ChevronDown,
  Sparkles,
  Scale,
  FileText,
  Volume2,
  Car,
  AlertTriangle,
  Calculator,
  Database,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

const POPULAR_QUESTIONS = [
  {
    icon: Volume2,
    label: 'Motorcycle silencer noise',
    query: 'What is the noise emission limit for a motorcycle silencer under the law?',
  },
  {
    icon: AlertTriangle,
    label: 'Driving without licence fine',
    query: 'What is the penalty for driving a motor vehicle without a valid driving licence?',
  },
  {
    icon: Car,
    label: 'Learner driver alone with L-plates',
    query: 'Can a learner driver drive alone if they display L plates on the vehicle?',
  },
  {
    icon: FileText,
    label: 'Challenging a spot fine',
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
  onOpenHowItWorks,
}) {
  const [activeTab, setActiveTab] = useState('ask');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeTab]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (question.trim() && !loading) {
        onSubmit(e);
      }
    }
  };

  const handleMicToggle = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] py-8 px-4 text-center max-w-3xl mx-auto w-full animate-fade-up">
      {/* Top Golden Scale Logo */}


      {/* Main Serif Headline */}
      <h1 className="font-serif-legal text-4xl sm:text-5xl font-normal text-slate-100 tracking-tight mb-7">
        What does the law say?
      </h1>

      {/* Central Query Box */}
      <div className="w-full bg-[#121824]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl focus-within:border-[#d4a843]/70 focus-within:ring-2 focus-within:ring-[#d4a843]/15 transition duration-200 text-left relative group">
        <form onSubmit={onSubmit}>
          <textarea
            ref={textareaRef}
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask about a vehicle, a licence or a fine in plain English..."
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm sm:text-base leading-relaxed outline-none resize-none font-normal disabled:opacity-70"
          />

          {error && (
            <div className="mb-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Bottom Bar inside the box */}
          <div className="pt-3 mt-1 border-t border-slate-800/80 flex items-center justify-between gap-3">
            {/* Mode Pills: Ask / Calculator / Library */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('ask')}
                disabled={loading}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${activeTab === 'ask'
                  ? 'bg-slate-200 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Ask
              </button>
              <button
                type="button"
                onClick={onOpenFineCalculator}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-[#d4a843] hover:bg-slate-800/60 transition flex items-center gap-1"
              >
                <Calculator className="w-3 h-3 text-[#d4a843]" />
                <span>Calculator</span>
              </button>
              <button
                type="button"
                onClick={onOpenStatuteLibrary}
                disabled={loading}
                className="px-3 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Library</span>
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-medium text-slate-300">
                <span>EN</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </div>

              <button
                type="button"
                onClick={handleMicToggle}
                disabled={loading}
                className={`p-2 rounded-xl transition ${isListening
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500 animate-pulse'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                title="Voice Query"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Submit button with animated golden scale weighing when loading */}
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className={`w-9 h-9 rounded-xl text-slate-950 flex items-center justify-center font-bold shadow-lg transition active:scale-95 ${loading
                  ? 'bg-[#d4a843] shadow-[#d4a843]/40 cursor-wait'
                  : 'bg-[#d4a843] hover:bg-[#e4b952] shadow-[#d4a843]/20 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                title={loading ? 'Consulting the law...' : 'Submit Question'}
              >
                {loading ? (
                  <Scale className="w-4 h-4 stroke-[2.5] text-slate-950 animate-scale-weigh" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.8]" />
                )}
              </button>
            </div>
          </div>

          {/* In-place subtle status line when searching without changing the box */}
          {loading && (
            <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-[#f0c96a] animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d4a843] animate-ping" />
                <span>Consulting 991 sections & verifying statutory citations...</span>
              </div>
              <span className="font-mono text-slate-400 text-[10px]">Zero Hallucination Grounding</span>
            </div>
          )}
        </form>
      </div>

      {/* Two Feature Action Cards Below the Box: Ask in Plain English & Fine Calculator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mt-5 text-left">
        {/* Card 1: Ask in plain English */}
        <div
          onClick={() => {
            if (textareaRef.current) textareaRef.current.focus();
          }}
          className="p-4 rounded-2xl bg-[#121824]/70 border border-slate-800/90 hover:border-[#10b981]/50 hover:bg-[#131b29] transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 group-hover:text-white mb-1">
            <Search className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Ask in Your Own Words</span>
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-relaxed">
            Describe your situation in English, Singlish, සිංහල, or தமிழ். Get the verified legal sections and fines that apply.
          </p>
        </div>

        {/* Card 2: Deterministic Fine Calculator */}
        <div
          onClick={onOpenFineCalculator}
          className="p-4 rounded-2xl bg-[#121824]/70 border border-slate-800/90 hover:border-[#d4a843]/50 hover:bg-[#131b29] transition cursor-pointer group shadow-lg"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 group-hover:text-white mb-1">
            <Calculator className="w-3.5 h-3.5 text-[#d4a843]" />
            <span className="flex items-center gap-1.5">
              <span>Traffic Fine Calculator</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Deterministic
              </span>
            </span>
          </div>
          <p className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-relaxed">
            Select 33 official spot fines or 2019 court penalties to calculate exact totals with AI legal actions.
          </p>
        </div>
      </div>



      {/* Footer */}
      <div className="mt-8 text-xs text-slate-500 flex items-center justify-center gap-2">
        <span>Legal information, not legal advice</span>
        <span>·</span>
        <button
          onClick={onOpenHowItWorks}
          className="text-slate-400 hover:text-[#d4a843] underline underline-offset-2 transition"
        >
          How answers are found
        </button>
      </div>
    </div>
  );
}

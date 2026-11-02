import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import QueryHero from './components/QueryHero';
import ResponseCard from './components/ResponseCard';
import StatuteLibraryModal from './components/StatuteLibraryModal';
import FineCalculatorModal from './components/FineCalculatorModal';
import SavedAnswersModal from './components/SavedAnswersModal';
import HowItWorksModal from './components/HowItWorksModal';
import GoldenScaleLogo from './components/GoldenScaleLogo';
import { ArrowUp, Scale, BookOpen, Calculator } from 'lucide-react';

export default function App() {
  const [question, setQuestion] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // New Modals state: Statute Library & Fine Calculator
  const [statuteLibraryOpen, setStatuteLibraryOpen] = useState(false);
  const [fineCalculatorOpen, setFineCalculatorOpen] = useState(false);
  const [savedAnswersOpen, setSavedAnswersOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  // History & Saved Answers with LocalStorage persistence
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('rag_mta_history');
      return saved ? JSON.parse(saved) : [
        { question: 'What is the penalty for driving a motor vehicle without a valid driving licence?' },
        { question: 'What is the noise emission limit for a motorcycle silencer under the law?' },
      ];
    } catch {
      return [];
    }
  });

  const [savedAnswers, setSavedAnswers] = useState(() => {
    try {
      const saved = localStorage.getItem('rag_mta_saved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('rag_mta_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('rag_mta_saved', JSON.stringify(savedAnswers));
    } catch (e) {
      console.error(e);
    }
  }, [savedAnswers]);

  const handleAsk = async (e, customQ = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanQ = (customQ !== null ? customQ : question).trim();

    if (!cleanQ || cleanQ.length < 3) {
      setError('Please enter a question with at least 3 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentQuestion(cleanQ);
    setQuestion(''); // Immediately clear input field so follow-up bar is fresh

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: cleanQ }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let errorMsg = `Server error (${response.status})`;
        if (typeof errData.detail === 'string') {
          errorMsg = errData.detail;
        } else if (Array.isArray(errData.detail) && errData.detail.length > 0) {
          errorMsg = errData.detail.map((d) => d.msg || JSON.stringify(d)).join('; ');
        } else if (errData.detail && typeof errData.detail === 'object') {
          errorMsg = JSON.stringify(errData.detail);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setResult(data);

      // Add to recent history (unique, max 12)
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.question !== cleanQ);
        return [{ question: cleanQ, status: data.status }, ...filtered].slice(0, 12);
      });
    } catch (err) {
      setError(err.message || 'Failed to connect to the legal assistant backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuery = (q) => {
    setQuestion('');
    handleAsk(null, q);
  };

  const handleNewQuestion = () => {
    setQuestion('');
    setCurrentQuestion('');
    setResult(null);
    setError(null);
  };

  const handleSaveAnswer = (q, ans, cites) => {
    const exists = savedAnswers.some((item) => item.question === q);
    if (exists) {
      setSavedAnswers((prev) => prev.filter((item) => item.question !== q));
    } else {
      setSavedAnswers((prev) => [{ question: q, answer: ans, citations: cites }, ...prev]);
    }
  };

  const isCurrentAnswerSaved = result && savedAnswers.some((item) => item.question === currentQuestion);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f17] text-slate-100 antialiased">
      {/* Left Sidebar */}
      <Sidebar
        onSelectQuery={handleSelectQuery}
        onNewQuestion={handleNewQuestion}
        history={history}
        savedCount={savedAnswers.length}
        onOpenStatuteLibrary={() => setStatuteLibraryOpen(true)}
        onOpenFineCalculator={() => setFineCalculatorOpen(true)}
        onOpenSavedAnswers={() => setSavedAnswersOpen(true)}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Working Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#d4a843]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navbar if in answered view */}
        {result && (
          <header className="px-6 py-3 border-b border-slate-800/80 bg-[#0e131d]/80 backdrop-blur-md flex items-center justify-between z-10 animate-fade-up">
            <div className="flex items-center gap-3">
              <button
                onClick={handleNewQuestion}
                className="focus:outline-none"
                title="Return to Home"
              >
                <GoldenScaleLogo className="w-8 h-8 rounded-xl" iconSize="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Sri Lanka Motor Traffic Act Legal Assistant
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setFineCalculatorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-[#f0c96a] hover:text-white hover:border-[#d4a843] transition"
              >
                <Calculator className="w-3.5 h-3.5 text-[#d4a843]" />
                <span className="hidden sm:inline">Calculator</span>
              </button>

              <button
                onClick={() => setStatuteLibraryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Statute Library</span>
              </button>

              <button
                onClick={handleNewQuestion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4a843] hover:bg-[#e4b952] text-slate-950 font-semibold text-xs transition shadow-sm active:scale-95"
              >
                <span>New Question</span>
              </button>
            </div>
          </header>
        )}

        {/* Scrollable Center Canvas */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 w-full relative z-10 flex flex-col justify-between">
          {!result ? (
            /* Hero Landing View - Stays in-place with animated scale on submit button while loading */
            <QueryHero
              question={question}
              setQuestion={setQuestion}
              onSubmit={handleAsk}
              loading={loading}
              error={error}
              onOpenStatuteLibrary={() => setStatuteLibraryOpen(true)}
              onOpenFineCalculator={() => setFineCalculatorOpen(true)}
              onOpenHowItWorks={() => setHowItWorksOpen(true)}
            />
          ) : (
            /* Answered View */
            <div className="max-w-3xl w-full mx-auto space-y-6">
              <ResponseCard
                result={result}
                currentQuestion={currentQuestion}
                onNewQuestion={handleNewQuestion}
                onSaveAnswer={handleSaveAnswer}
                isSaved={isCurrentAnswerSaved}
              />

              {/* Follow-up / re-query bar with empty input and in-place loading scale */}
              <div className="bg-[#121824]/90 border border-slate-700/80 rounded-2xl p-3 shadow-xl flex items-center gap-3 animate-fade-up">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAsk(e);
                  }}
                  disabled={loading}
                  placeholder={loading ? "Consulting the law..." : "Ask a follow-up question or search another traffic topic..."}
                  className="flex-1 bg-transparent px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 outline-none disabled:opacity-60"
                />
                <button
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                  className={`w-9 h-9 rounded-xl text-slate-950 flex items-center justify-center font-bold transition shadow-lg ${
                    loading
                      ? 'bg-[#d4a843] shadow-[#d4a843]/40 cursor-wait'
                      : 'bg-[#d4a843] hover:bg-[#e4b952] shadow-[#d4a843]/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95'
                  }`}
                  title={loading ? "Consulting the law..." : "Ask Question"}
                >
                  {loading ? (
                    <Scale className="w-4 h-4 stroke-[2.5] text-slate-950 animate-scale-weigh" />
                  ) : (
                    <ArrowUp className="w-4 h-4 stroke-[2.8]" />
                  )}
                </button>
              </div>

              {loading && (
                <div className="text-center text-[11px] text-[#f0c96a] flex items-center justify-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#d4a843]" />
                  <span>Consulting 991 sections & verifying statutory citations...</span>
                </div>
              )}
            </div>
          )}

          {/* Minimal Bottom Disclaimer */}
          {result && (
            <footer className="mt-8 text-center text-[11px] text-slate-500 py-3 border-t border-slate-800/80 flex items-center justify-center gap-2">
              <span>Legal information, not legal advice</span>
              <span>·</span>
              <button
                onClick={() => setHowItWorksOpen(true)}
                className="text-slate-400 hover:text-[#d4a843] underline underline-offset-2 transition"
              >
                How answers are found
              </button>
            </footer>
          )}
        </main>
      </div>

      {/* New Interactive Modals */}
      <StatuteLibraryModal
        isOpen={statuteLibraryOpen}
        onClose={() => setStatuteLibraryOpen(false)}
        onExplainSection={(q) => handleSelectQuery(q)}
      />

      <FineCalculatorModal
        isOpen={fineCalculatorOpen}
        onClose={() => setFineCalculatorOpen(false)}
        onLaunchRAGAction={(q) => handleSelectQuery(q)}
      />

      <SavedAnswersModal
        isOpen={savedAnswersOpen}
        onClose={() => setSavedAnswersOpen(false)}
        savedAnswers={savedAnswers}
        onRemove={(idx) => setSavedAnswers((prev) => prev.filter((_, i) => i !== idx))}
        onSelect={(q) => handleSelectQuery(q)}
      />

      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </div>
  );
}

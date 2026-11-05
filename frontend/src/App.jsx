import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import QueryHero from './components/QueryHero';
import ResponseCard from './components/ResponseCard';
import StatuteLibraryView from './components/StatuteLibraryView';
import FineCalculatorView from './components/FineCalculatorView';
import SavedAnswersView from './components/SavedAnswersView';
import HowItWorksModal from './components/HowItWorksModal';
import GoldenScaleLogo from './components/GoldenScaleLogo';
import { ArrowUp, Scale, BookOpen, Calculator } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'library' | 'calculator' | 'saved'
  const [question, setQuestion] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // How it works modal (retained for explaining RAG methodology)
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
    setResult(null); // Clear previous result so fresh query or error displays cleanly
    setCurrentQuestion(cleanQ);
    setQuestion(''); // Immediately clear input field so follow-up bar is fresh
    setCurrentView('chat'); // Always ensure chat view is active when asking

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
    setCurrentView('chat');
    handleAsk(null, q);
  };

  const handleNewQuestion = () => {
    setQuestion('');
    setCurrentQuestion('');
    setResult(null);
    setError(null);
    setCurrentView('chat');
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
      {/* Left Persistent Navigation Sidebar across ALL views */}
      <div className="no-print h-full flex flex-shrink-0">
        <Sidebar
          activeView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onSelectQuery={handleSelectQuery}
          onNewQuestion={handleNewQuestion}
          history={history}
          savedCount={savedAnswers.length}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
      </div>

      {/* Main Working Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Subtle background ambient glow */}
        <div className="no-print absolute top-0 right-1/4 w-96 h-96 bg-[#d4a843]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="no-print absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* View 1: Statute Library Page */}
        {currentView === 'library' && (
          <StatuteLibraryView
            onExplainSection={(q) => {
              setCurrentView('chat');
              handleAsk(null, q);
            }}
            onBackToChat={() => setCurrentView('chat')}
          />
        )}

        {/* View 2: Fine Calculator Page */}
        {currentView === 'calculator' && (
          <FineCalculatorView
            onLaunchRAGAction={(q) => {
              setCurrentView('chat');
              handleAsk(null, q);
            }}
            onBackToChat={() => setCurrentView('chat')}
          />
        )}

        {/* View 3: Saved Answers Page */}
        {currentView === 'saved' && (
          <SavedAnswersView
            savedAnswers={savedAnswers}
            onRemove={(idx) => setSavedAnswers((prev) => prev.filter((_, i) => i !== idx))}
            onSelect={(q) => {
              setCurrentView('chat');
              handleSelectQuery(q);
            }}
            onBackToChat={() => setCurrentView('chat')}
          />
        )}

        {/* View 4: Chat Assistant View */}
        {currentView === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Navbar if in answered view */}
            {result && (
              <header className="no-print px-6 py-3 border-b border-slate-800/80 bg-[#0e131d]/80 backdrop-blur-md flex items-center justify-between z-10 animate-fade-up">
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
                    onClick={() => setCurrentView('calculator')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-[#f0c96a] hover:text-white hover:border-[#d4a843] transition"
                  >
                    <Calculator className="w-3.5 h-3.5 text-[#d4a843]" />
                    <span className="hidden sm:inline">Calculator</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('library')}
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
                  onOpenStatuteLibrary={() => setCurrentView('library')}
                  onOpenFineCalculator={() => setCurrentView('calculator')}
                  onOpenHowItWorks={() => setHowItWorksOpen(true)}
                />
              ) : (
                /* Answered Conversational View (Clean, open stream matching photo 2) */
                <div className="max-w-3xl w-full mx-auto pt-4 pb-44 space-y-6">
                  <ResponseCard
                    result={result}
                    currentQuestion={currentQuestion}
                    onNewQuestion={handleNewQuestion}
                    onSaveAnswer={handleSaveAnswer}
                    isSaved={isCurrentAnswerSaved}
                  />

                  {loading && (
                    <div className="text-center text-xs text-[#f0c96a] flex items-center justify-center gap-2 pt-4 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#d4a843]" />
                      <span>Consulting 991 sections & verifying statutory citations...</span>
                    </div>
                  )}
                </div>
              )}
            </main>

            {/* Fixed Floating Bottom Capsule Prompt Bar (Matching Gemini layout in photo 2) */}
            {result && (
              <div className="no-print fixed bottom-0 left-0 right-0 p-4 pb-5 bg-gradient-to-t from-[#0b0f17] via-[#0b0f17]/95 to-transparent z-20 pointer-events-none">
                <div className="max-w-3xl w-full mx-auto pointer-events-auto">
                  <div className="bg-[#121824]/95 backdrop-blur-md border border-slate-700/80 hover:border-[#d4a843]/50 focus-within:border-[#d4a843] rounded-full pl-5 pr-2 py-2 shadow-2xl flex items-center gap-3 transition">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAsk(e);
                      }}
                      disabled={loading}
                      placeholder={loading ? "Consulting statutory provisions..." : "Ask a follow-up question or search another traffic topic..."}
                      className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none disabled:opacity-60"
                    />
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-block text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                        MTA 1951
                      </span>
                      <button
                        onClick={handleAsk}
                        disabled={loading || !question.trim()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold transition shadow-md ${
                          loading
                            ? 'bg-[#d4a843] shadow-[#d4a843]/40 cursor-wait'
                            : 'bg-[#d4a843] hover:bg-[#e4b952] text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95'
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
                  </div>

                  <div className="text-center text-[11px] text-slate-500 mt-2 flex items-center justify-center gap-2">
                    <span>Sri Lanka Motor Traffic Act No. 14 of 1951 · Citation-Grounded Legal Information</span>
                    <span>·</span>
                    <button
                      onClick={() => setHowItWorksOpen(true)}
                      className="text-slate-400 hover:text-[#d4a843] underline underline-offset-2 transition"
                    >
                      How it works
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Methodology Explainer Modal */}
      <HowItWorksModal
        isOpen={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </div>
  );
}

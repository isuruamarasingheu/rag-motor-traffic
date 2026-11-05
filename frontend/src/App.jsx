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

        {/* View 4: Chat Assistant View (Gemini Style) */}
        {currentView === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#131314]">
            {/* Top Navbar */}
            <header className="no-print px-6 py-3 border-b border-[#2d2f31] bg-[#131314]/90 backdrop-blur-md flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewQuestion}
                  className="focus:outline-none flex items-center gap-2.5"
                  title="Return to Home"
                >
                  <GoldenScaleLogo className="w-8 h-8 rounded-xl" iconSize="w-4 h-4" />
                  <span className="text-sm font-semibold text-[#f1f3f4] tracking-tight">
                    MagaNithi
                  </span>
                </button>
                <span className="text-xs text-[#9aa0a6] hidden sm:inline font-normal">
                  · Sri Lanka Motor Traffic Act Legal Assistant
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('calculator')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] text-xs text-[#f0c96a] font-medium transition"
                  title="Spot Fine Calculator"
                >
                  <Calculator className="w-3.5 h-3.5 text-[#d4a843]" />
                  <span className="hidden sm:inline">Calculator</span>
                </button>

                <button
                  onClick={() => setCurrentView('library')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] text-xs text-[#e3e3e3] font-medium transition"
                  title="Statute Library"
                >
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Library</span>
                </button>

                <button
                  onClick={handleNewQuestion}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs transition shadow-sm active:scale-95"
                  title="New conversation"
                >
                  <ArrowUp className="w-3.5 h-3.5 rotate-45" />
                  <span>New Chat</span>
                </button>
              </div>
            </header>

            {/* Scrollable Center Canvas */}
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 w-full relative z-10 flex flex-col justify-between">
              {!result && !loading ? (
                /* Gemini Landing View */
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
                /* Conversation Stream View */
                <div className="max-w-3xl w-full mx-auto space-y-6 pb-20">
                  {/* User query bubble */}
                  {currentQuestion && (
                    <div className="flex justify-end">
                      <div className="bg-[#1e1f20] border border-[#333538] text-[#f1f3f4] rounded-3xl rounded-tr-sm px-5 py-3 max-w-xl text-sm sm:text-base leading-relaxed shadow-sm">
                        {currentQuestion}
                      </div>
                    </div>
                  )}

                  {/* Loading State (Pulsing Gemini Dots & Status) */}
                  {loading && !result && (
                    <div className="flex items-start gap-3.5 pt-2 animate-fade-up">
                      <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <GoldenScaleLogo className="w-7 h-7 rounded-full" iconSize="w-4 h-4" />
                      </div>
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2 text-xs text-[#8ab4f8] font-mono">
                          <span className="w-2 h-2 rounded-full bg-[#8ab4f8] animate-ping" />
                          <span>Consulting Sri Lanka Motor Traffic Act & Gazette Regulations...</span>
                        </div>
                        <div className="text-sm text-[#9aa0a6] animate-pulse">
                          Verifying statutory section citations against primary corpus...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Answered Response */}
                  {result && (
                    <ResponseCard
                      result={result}
                      currentQuestion=""
                      onNewQuestion={handleNewQuestion}
                      onSaveAnswer={handleSaveAnswer}
                      isSaved={isCurrentAnswerSaved}
                    />
                  )}
                </div>
              )}
            </main>

            {/* Floating Gemini-style Pill Input Bar (Visible in Answered View) */}
            {(result || loading) && (
              <div className="no-print w-full max-w-3xl mx-auto px-4 pb-4 pt-1 z-20">
                <form
                  onSubmit={handleAsk}
                  className="relative rounded-full bg-[#1e1f20] border border-[#3c4043] focus-within:border-[#8ab4f8] focus-within:bg-[#222426] shadow-2xl px-4 py-2.5 sm:py-3 flex items-center gap-3 transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={handleNewQuestion}
                    className="p-1.5 rounded-full text-[#9aa0a6] hover:text-white transition flex-shrink-0"
                    title="Start new conversation"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={loading}
                    placeholder={loading ? "MagaNithi is consulting the law..." : "Ask a follow-up question or search another traffic topic..."}
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
                    title="Send question"
                  >
                    {loading ? (
                      <Scale className="w-4 h-4 stroke-[2.5] text-slate-950 animate-scale-weigh" />
                    ) : (
                      <ArrowUp className="w-4 h-4 stroke-[2.8]" />
                    )}
                  </button>
                </form>

                <div className="text-center text-[11px] text-[#8e918f] mt-2">
                  MagaNithi provides citation-grounded legal information, not formal legal advice.
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

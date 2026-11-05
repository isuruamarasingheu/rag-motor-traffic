import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Copy,
  Check,
  Code,
  ShieldCheck,
  Bookmark,
  Plus,
  ArrowRight,
  Printer,
  Languages,
  Loader2,
} from 'lucide-react';

export default function ResponseCard({
  result,
  currentQuestion,
  onNewQuestion,
  onSaveAnswer,
  isSaved = false,
}) {
  const [activeTab, setActiveTab] = useState('answer');
  const [copiedId, setCopiedId] = useState(null);
  const [answerCopied, setAnswerCopied] = useState(false);

  // Multi-language translation state
  const [selectedLang, setSelectedLang] = useState('en'); // 'en' | 'si' | 'ta'
  const [translations, setTranslations] = useState({}); // { si: '...', ta: '...' }
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  if (!result) return null;

  const { status, answer, citations = [] } = result;

  const handleCopyAnswer = () => {
    const textToCopy = selectedLang === 'en' ? answer : (translations[selectedLang] || answer);
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setAnswerCopied(true);
    setTimeout(() => setAnswerCopied(false), 2000);
  };

  const handleCopyCitation = (id, text, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLanguageChange = async (lang) => {
    setSelectedLang(lang);
    if (lang === 'en' || translations[lang]) return;
    if (!answer) return;

    setTranslating(true);
    setTranslationError(null);
    try {
      let resp;
      try {
        resp = await fetch('/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: answer, target_language: lang }),
        });
      } catch {
        // Network fallback
        resp = null;
      }

      // If proxied route failed or returned 404, fallback directly to backend port 8005
      if (!resp || !resp.ok) {
        resp = await fetch('http://127.0.0.1:8005/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: answer, target_language: lang }),
        });
      }

      if (!resp.ok) {
        throw new Error(`Translation error (${resp.status})`);
      }
      const data = await resp.json();
      setTranslations((prev) => ({ ...prev, [lang]: data.translated_text }));
    } catch (err) {
      console.error('Translation failed:', err);
      setTranslationError('Could not fetch translation.');
    } finally {
      setTranslating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const displayedAnswer = selectedLang === 'en' ? answer : (translations[selectedLang] || answer);

  const getConfig = () => {
    switch (status) {
      case 'answered':
        return {
          title: 'Grounded Legal Information',
          subtitle: `${citations.length} ${citations.length === 1 ? 'section' : 'sections'} verified · Strict Grounding`,
          icon: CheckCircle2,
          iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
          statusBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          statusText: 'ANSWERED · VERIFIED CITATION',
        };
      case 'refused_out_of_scope':
        return {
          title: 'Out of Scope — Motor Traffic Act Only',
          subtitle: 'Query does not pertain to Sri Lankan Motor Traffic Law',
          icon: AlertTriangle,
          iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
          statusBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          statusText: 'REFUSED · OUT OF SCOPE',
        };
      case 'not_found':
      default:
        return {
          title: 'No Matching Provision Found',
          subtitle: 'In-scope query, but no statutory provision was retrieved with sufficient confidence',
          icon: HelpCircle,
          iconBg: 'bg-slate-800 text-slate-400 border border-slate-700',
          statusBadge: 'bg-slate-800 text-slate-300 border-slate-700',
          statusText: 'NOT FOUND IN CORPUS',
        };
    }
  };

  const config = getConfig();
  const IconComp = config.icon;

  return (
    <>
      {/* Interactive Screen UI (Hidden during Print) */}
      <div className="no-print w-full max-w-3xl mx-auto bg-[#121824]/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden mb-6 animate-fade-up">
        {/* Top Bar with Question and Status */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.iconBg}`}>
            <IconComp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${config.statusBadge}`}>
                {config.statusText}
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-200 mt-1">
              {currentQuestion || config.title}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
            title="Download / Print Official Legal Extract (PDF)"
          >
            <Printer className="w-3.5 h-3.5 text-[#d4a843]" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          <button
            onClick={handleCopyAnswer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
            title="Copy Answer"
          >
            {answerCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{answerCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => onSaveAnswer && onSaveAnswer(currentQuestion, answer, citations)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              isSaved
                ? 'bg-[#d4a843]/20 text-[#f0c96a] border-[#d4a843]/40'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
            }`}
            title="Bookmark this answer"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#f0c96a]' : ''}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={onNewQuestion}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
            title="Ask new question"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 bg-slate-900/40 border-b border-slate-800 text-xs font-medium gap-2">
        <button
          onClick={() => setActiveTab('answer')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'answer'
              ? 'border-[#d4a843] text-[#f0c96a]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Answer</span>
        </button>

        <button
          onClick={() => setActiveTab('citations')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'citations'
              ? 'border-[#d4a843] text-[#f0c96a]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified Citations</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {citations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'raw'
              ? 'border-[#d4a843] text-[#f0c96a]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Statute View</span>
        </button>
      </div>

      {/* Tab Panes */}
      <div className="p-5 sm:p-6">
        {/* Pane 1: Answer */}
        {activeTab === 'answer' && (
          <div className="space-y-4">
            {/* Language Selector Pills */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                    selectedLang === 'en'
                      ? 'bg-[#d4a843] text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English (Official)
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('si')}
                  className={`px-2.5 py-1 text-xs rounded-md transition font-medium flex items-center gap-1 ${
                    selectedLang === 'si'
                      ? 'bg-[#d4a843] text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>සිංහල</span>
                  {translating && selectedLang === 'si' && <Loader2 className="w-3 h-3 animate-spin text-slate-950" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ta')}
                  className={`px-2.5 py-1 text-xs rounded-md transition font-medium flex items-center gap-1 ${
                    selectedLang === 'ta'
                      ? 'bg-[#d4a843] text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>தமிழ்</span>
                  {translating && selectedLang === 'ta' && <Loader2 className="w-3 h-3 animate-spin text-slate-950" />}
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {selectedLang === 'en' ? 'Authentic Grounding' : 'Civic Translation (Sources in English)'}
              </span>
            </div>

            {translationError && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                {translationError} (Showing original English text)
              </div>
            )}

            <div className="text-sm leading-relaxed text-slate-200 font-normal whitespace-pre-line space-y-3">
              {displayedAnswer || 'No answer available.'}
            </div>

            {/* Citations Preview Footer */}
            {citations.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Statutory Source:
                  </span>
                  {citations.map((c, i) => (
                    <span
                      key={i}
                      onClick={() => setActiveTab('citations')}
                      className="cursor-pointer text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-[#d4a843]/10 text-[#f0c96a] border border-[#d4a843]/20 hover:border-[#d4a843] transition"
                    >
                      {c.citation || c.id}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('citations')}
                  className="text-[11px] font-semibold text-[#f0c96a] hover:text-white flex items-center gap-1 transition"
                >
                  <span>View verbatim text</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pane 2: Citations */}
        {activeTab === 'citations' && (
          <div className="space-y-4">
            {citations.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No citations retrieved for this response.
              </div>
            ) : (
              citations.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 hover:border-slate-700 transition"
                >
                  <div className="bg-slate-950/60 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#d4a843] flex-shrink-0" />
                      <span className="font-mono text-xs font-semibold text-[#f0c96a]">
                        {c.id}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        · {c.citation}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleCopyCitation(c.id, c.text, e)}
                      className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Copy verbatim passage"
                    >
                      {copiedId === c.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="p-4 text-xs text-slate-300 leading-relaxed font-serif-legal italic border-l-2 border-[#d4a843] m-3 bg-[#0a0e17]/80 rounded-r">
                    "{c.text}"
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pane 3: Raw Statute View */}
        {activeTab === 'raw' && (
          <div>
            {citations.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No raw statutory text available.
              </div>
            ) : (
              <div className="bg-[#090d15] rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto space-y-3 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold pb-1 border-b border-slate-800">
                  Verbatim Primary Corpus Records
                </div>
                {citations.map((c, idx) => (
                  <div key={idx} className="p-3 rounded bg-slate-900/50 border-l-2 border-[#d4a843]">
                    <div className="text-[#f0c96a] font-bold text-xs mb-1">
                      [{c.id}] {c.citation}
                    </div>
                    <div className="text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {c.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Printable Official Legal Extract Document (Shown only when printing to paper or PDF) */}
      <div className="print-only printable-document p-8 text-black bg-white max-w-4xl mx-auto font-serif">
        <div className="text-center pb-4 border-b-2 border-black mb-6">
          <div className="text-xs uppercase tracking-widest font-sans font-bold text-gray-700">
            Democratic Socialist Republic of Sri Lanka
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-black mt-1">
            Official Statutory Extract & Legal Summary
          </h1>
          <div className="text-xs text-gray-600 mt-1 font-sans">
            Motor Traffic Act No. 14 of 1951 (Consolidated to 2024) & Subsidiary Gazette Regulations
          </div>
          <div className="text-[10px] text-gray-500 mt-2 font-mono">
            Extraction Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Ref ID: MTA-RAG-{status.toUpperCase()}
          </div>
        </div>

        <div className="mb-5 bg-gray-50 p-3 border border-gray-300 rounded">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans">
            Citizen Inquiry:
          </div>
          <div className="text-sm italic font-medium text-black mt-1">
            "{currentQuestion || 'Motor Traffic Inquiry'}"
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans mb-1">
            Grounded Legal Information ({selectedLang === 'en' ? 'English (Official)' : selectedLang === 'si' ? 'සිංහල පරිවර්තනය' : 'தமிழ் மொழிபெயர்ப்பு'}):
          </div>
          <div className="text-sm leading-relaxed text-black whitespace-pre-line border-l-2 border-black pl-3 py-1 font-sans">
            {displayedAnswer}
          </div>
        </div>

        {citations.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-700 font-sans mb-2 border-b border-gray-300 pb-1">
              Applicable Statutory Provisions (Authentic Official Authority):
            </div>
            <div className="space-y-4">
              {citations.map((c, i) => (
                <div key={i} className="border border-gray-300 rounded p-3 bg-gray-50">
                  <div className="text-xs font-bold text-black font-sans">
                    [{c.id}] {c.citation}
                  </div>
                  <div className="text-xs italic text-gray-800 mt-1 pl-2 border-l-2 border-gray-400">
                    "{c.text}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-300 text-[10px] text-gray-600 space-y-1 font-sans">
          <div className="font-bold uppercase text-gray-700">Official Statutory Notice & Disclaimer:</div>
          <div>
            {result.disclaimer || "This extract provides verified legal information from Sri Lanka's Motor Traffic Act and subsidiary regulations. It is not formal legal advice or personal counsel."}
          </div>
        </div>
      </div>
    </>
  );
}

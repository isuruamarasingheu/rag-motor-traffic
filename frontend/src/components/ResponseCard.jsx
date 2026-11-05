import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Bookmark,
  Plus,
  ArrowRight,
  Printer,
  Languages,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function ResponseCard({
  result,
  currentQuestion,
  onNewQuestion,
  onSaveAnswer,
  isSaved = false,
}) {
  const [copiedId, setCopiedId] = useState(null);
  const [answerCopied, setAnswerCopied] = useState(false);
  const [expandedCitationId, setExpandedCitationId] = useState(null);

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
        resp = null;
      }

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
          subtitle: `${citations.length} ${citations.length === 1 ? 'section' : 'sections'} verified`,
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

  const activeExpandedCitation = citations.find((c) => c.id === expandedCitationId);

  return (
    <>
      {/* Interactive Conversational Layout (Hidden during Print) */}
      <div className="no-print w-full space-y-6 animate-fade-up">
        {/* User Question Bubble (Right Aligned, modern chat style) */}
        {currentQuestion && (
          <div className="flex justify-end">
            <div className="max-w-2xl bg-[#141d2e] border border-slate-700/70 rounded-2xl rounded-tr-sm px-5 py-3 text-slate-100 text-sm sm:text-base font-medium shadow-md leading-relaxed">
              {currentQuestion}
            </div>
          </div>
        )}

        {/* Assistant Legal Response Stream */}
        <div className="flex items-start gap-3.5 sm:gap-4">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-[#101726] border border-slate-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
            <GoldenScaleLogo className="w-8 h-8 rounded-lg" iconSize="w-4 h-4" />
          </div>

          {/* Response Container */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Top Meta Header: Status badge & Language selector pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${config.statusBadge}`}>
                  {config.statusText}
                </span>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Strict Grounding
                </span>
              </div>

              {/* Multi-language Toggle Pills */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-1 text-xs rounded-lg transition font-medium ${selectedLang === 'en'
                      ? 'bg-[#d4a843] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('si')}
                  className={`px-2.5 py-1 text-xs rounded-lg transition font-medium flex items-center gap-1 ${selectedLang === 'si'
                      ? 'bg-[#d4a843] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span>සිංහල</span>
                  {translating && selectedLang === 'si' && <Loader2 className="w-3 h-3 animate-spin text-slate-950" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ta')}
                  className={`px-2.5 py-1 text-xs rounded-lg transition font-medium flex items-center gap-1 ${selectedLang === 'ta'
                      ? 'bg-[#d4a843] text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span>தமிழ்</span>
                  {translating && selectedLang === 'ta' && <Loader2 className="w-3 h-3 animate-spin text-slate-950" />}
                </button>
              </div>
            </div>

            {translationError && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                {translationError} (Showing original English text)
              </div>
            )}

            {/* Answer Plain Language Text */}
            <div className="text-[15px] sm:text-base leading-relaxed text-slate-100 font-normal space-y-3 whitespace-pre-line">
              {displayedAnswer || 'No answer available.'}
            </div>

            {/* Citations & Evidence Section */}
            {citations.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80 space-y-2.5">


                <div className="flex items-center gap-2 flex-wrap">
                  {citations.map((c, i) => {
                    const isExpanded = expandedCitationId === c.id;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setExpandedCitationId(isExpanded ? null : c.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition border ${isExpanded
                            ? 'bg-[#d4a843] text-slate-950 font-bold border-[#d4a843] shadow-md'
                            : 'bg-slate-900/90 hover:bg-slate-800 text-[#f0c96a] border-slate-800 hover:border-[#d4a843]/60'
                          }`}
                        title="Click to inspect authentic statutory passage"
                      >
                        <span>{c.citation || c.id}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Expanded Verbatim Passage Drawer */}
                {activeExpandedCitation && (
                  <div className="mt-3 p-4 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-200 space-y-2.5 animate-fade-up">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] font-mono">
                      <span className="text-[#f0c96a] font-bold">
                        [{activeExpandedCitation.id}] {activeExpandedCitation.citation}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleCopyCitation(activeExpandedCitation.id, activeExpandedCitation.text, e)}
                          className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                        >
                          {copiedId === activeExpandedCitation.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === activeExpandedCitation.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#060910] border-l-2 border-[#d4a843] font-mono leading-relaxed whitespace-pre-wrap text-slate-300">
                      "{activeExpandedCitation.text}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Action Toolbar (Aligned to Right, New button removed) */}
            <div className="pt-2 flex items-center justify-end gap-2 text-slate-400 flex-wrap">
              <button
                type="button"
                onClick={handleCopyAnswer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition"
                title="Copy Answer"
              >
                {answerCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{answerCopied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition"
                title="Download / Print Official Legal Extract (PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-[#d4a843]" />
                <span>Export PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onSaveAnswer && onSaveAnswer(currentQuestion, answer, citations)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                  isSaved
                    ? 'bg-[#d4a843]/15 text-[#f0c96a] border-[#d4a843]/40'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
                title="Bookmark this answer"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#f0c96a]' : ''}`} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
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
            Grounded Legal Information ({selectedLang === 'en' ? 'English (Official)' : selectedLang === 'si' ? 'සිංහල පරිවර්තනය' : 'தமிழ் மொழிபெයர்ப்பு'}):
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

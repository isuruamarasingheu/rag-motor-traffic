import React, { useState } from 'react';
import {
  Copy,
  Check,
  Bookmark,
  Printer,
  Languages,
  Loader2,
  FileText,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function ResponseCard({
  result,
  currentQuestion,
  onNewQuestion,
  onSaveAnswer,
  isSaved = false,
  isSourceOpen = false,
  onToggleSource,
}) {
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
          statusBadge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          statusText: 'ANSWERED · VERIFIED CITATION',
        };
      case 'refused_out_of_scope':
        return {
          title: 'Out of Scope — Motor Traffic Act Only',
          statusBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          statusText: 'REFUSED · OUT OF SCOPE',
        };
      case 'not_found':
      default:
        return {
          title: 'No Matching Provision Found',
          statusBadge: 'bg-slate-800 text-slate-300 border-slate-700',
          statusText: 'NOT FOUND IN CORPUS',
        };
    }
  };

  const config = getConfig();

  return (
    <>
      {/* Interactive Layout Matching User Sketch (Hidden during Print) */}
      <div className="no-print w-full space-y-4 animate-fade-up">
        {/* User Question Bubble */}
        {currentQuestion && (
          <div className="flex justify-end mb-2">
            <div className="max-w-2xl bg-[#141d2e] border border-slate-700/70 rounded-2xl rounded-tr-sm px-5 py-3 text-slate-100 text-sm sm:text-base font-medium shadow-md leading-relaxed">
              {currentQuestion}
            </div>
          </div>
        )}

        {/* TOP BAR: Logo on Left, Segmented Language Switcher on Right (Divider Below) */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#101726] border border-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
              <GoldenScaleLogo className="w-7 h-7 rounded-md" iconSize="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${config.statusBadge}`}>
              {config.statusText}
            </span>
          </div>

          {/* Segmented Language Selector [ 🌐 | Eng | සිංහ | தமிழ் ] */}
          <div className="flex items-center bg-slate-900/90 rounded-xl border border-slate-800 divide-x divide-slate-800 p-0.5 shadow-sm">
            <div className="px-2 py-1 text-slate-400 flex items-center justify-center">
              <Languages className="w-3.5 h-3.5" />
            </div>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 text-xs font-medium transition ${selectedLang === 'en'
                ? 'bg-[#d4a843] text-slate-950 font-bold rounded-md shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Eng
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('si')}
              className={`px-2.5 py-1 text-xs font-medium transition flex items-center gap-1 ${selectedLang === 'si'
                ? 'bg-[#d4a843] text-slate-950 font-bold rounded-md shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <span>සිංහ</span>
              {translating && selectedLang === 'si' && <Loader2 className="w-3 h-3 animate-spin text-slate-950" />}
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('ta')}
              className={`px-2.5 py-1 text-xs font-medium transition flex items-center gap-1 ${selectedLang === 'ta'
                ? 'bg-[#d4a843] text-slate-950 font-bold rounded-md shadow-sm'
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

        {/* MIDDLE: Answer Text (Clean, spacious, readable) */}
        <div className="text-[15px] sm:text-base leading-relaxed text-slate-100 font-normal py-1 space-y-3 whitespace-pre-line">
          {displayedAnswer || 'No answer available.'}
        </div>

        {/* BOTTOM ROW: Source on Left (Toggles Right Sidebar), Action Icons on Right */}
        <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3">
          {/* Left: Source Button & Icon */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSource}
              className={`text-xs font-semibold tracking-wide transition flex items-center gap-1.5 ${citations.length > 0
                ? 'text-slate-400 hover:text-[#f0c96a] cursor-pointer'
                : 'text-slate-500 cursor-default'
                }`}
              title={
                citations.length > 0
                  ? `${isSourceOpen ? 'Close' : 'Open'} right-side source citations panel`
                  : 'No citation available'
              }
            >
              <span>Source</span>
            </button>

            {citations.length === 0 ? (
              <span className="text-xs text-slate-600 font-mono">—</span>
            ) : (
              <button
                type="button"
                onClick={onToggleSource}
                className={`p-1.5 rounded-lg border transition flex items-center justify-center ${isSourceOpen
                  ? 'bg-[#d4a843]/20 text-[#f0c96a] border-[#d4a843]/50 shadow-sm'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-[#f0c96a] border-slate-800'
                  }`}
                title={
                  isSourceOpen
                    ? 'Close right-side citations sidebar'
                    : `View source citations in right sidebar (${citations.length})`
                }
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Clean Minimalist Icon Buttons [ Copy ] [ Export PDF ] [ Bookmark ] */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <button
              type="button"
              onClick={handleCopyAnswer}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Copy Answer"
            >
              {answerCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Download / Print Official Legal Extract (PDF)"
            >
              <Printer className="w-4 h-4 text-[#d4a843]" />
            </button>

            <button
              type="button"
              onClick={() => onSaveAnswer && onSaveAnswer(currentQuestion, answer, citations)}
              className={`p-2 rounded-xl border transition ${isSaved
                ? 'bg-[#d4a843]/20 text-[#f0c96a] border-[#d4a843]/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
              title="Bookmark this answer"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#f0c96a]' : ''}`} />
            </button>
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
            Motor Traffic Act No. 14 of 1951 (Consolidated Edition 2024) & Subsidiary Gazette Regulations
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

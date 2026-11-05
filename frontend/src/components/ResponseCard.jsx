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
  ChevronDown,
  BookOpen,
  Share2,
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
  const [expandedCitationIdx, setExpandedCitationIdx] = useState(null);

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

  return (
    <>
      {/* Interactive Screen UI - Gemini Modern Streamlined Style */}
      <div className="no-print w-full max-w-3xl mx-auto space-y-6 animate-fade-up">
        {/* User Prompt Message Bubble (Top Right) */}
        {currentQuestion && (
          <div className="flex justify-end">
            <div className="bg-[#1e1f20] border border-[#333538] text-[#f1f3f4] rounded-3xl rounded-tr-sm px-5 py-3 max-w-xl text-sm sm:text-base leading-relaxed shadow-sm">
              {currentQuestion}
            </div>
          </div>
        )}

        {/* MagaNithi Assistant Response Flow (Spacious, Clean, Gemini Style) */}
        <div className="flex items-start gap-3.5 sm:gap-4 pt-2">
          {/* Assistant Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#1e1f20] border border-slate-700/80 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <GoldenScaleLogo className="w-7 h-7 rounded-full" iconSize="w-4 h-4" />
          </div>

          {/* Main Response Content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header Meta: Status & Multi-Language Pills */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-1.5 text-xs text-[#9aa0a6] font-medium">
                {status === 'answered' ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Citation Grounded</span>
                  </span>
                ) : status === 'refused_out_of_scope' ? (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Out of Scope Refusal</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>No Provision Retrieved</span>
                  </span>
                )}
                <span>·</span>
                <span>Motor Traffic Act</span>
              </div>

              {/* Minimalist Multi-Language Pills */}
              <div className="flex items-center gap-1 bg-[#1e1f20] p-0.5 rounded-full border border-[#333538] text-xs">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-0.5 rounded-full transition font-medium ${
                    selectedLang === 'en'
                      ? 'bg-white text-slate-950 font-bold shadow-sm'
                      : 'text-[#9aa0a6] hover:text-white'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('si')}
                  className={`px-2.5 py-0.5 rounded-full transition font-medium flex items-center gap-1 ${
                    selectedLang === 'si'
                      ? 'bg-white text-slate-950 font-bold shadow-sm'
                      : 'text-[#9aa0a6] hover:text-white'
                  }`}
                >
                  <span>සිං</span>
                  {translating && selectedLang === 'si' && <Loader2 className="w-3 h-3 animate-spin" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('ta')}
                  className={`px-2.5 py-0.5 rounded-full transition font-medium flex items-center gap-1 ${
                    selectedLang === 'ta'
                      ? 'bg-white text-slate-950 font-bold shadow-sm'
                      : 'text-[#9aa0a6] hover:text-white'
                  }`}
                >
                  <span>த</span>
                  {translating && selectedLang === 'ta' && <Loader2 className="w-3 h-3 animate-spin" />}
                </button>
              </div>
            </div>

            {translationError && (
              <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-xl p-2.5">
                {translationError} (Showing original English text)
              </div>
            )}

            {/* Answer Text - Clean Typography with natural line height */}
            <div className="text-[15px] sm:text-base leading-relaxed text-[#e3e3e3] whitespace-pre-line font-normal">
              {displayedAnswer || 'No response available.'}
            </div>

            {/* Gemini-style Interactive Source Chips */}
            {citations.length > 0 && (
              <div className="pt-3 border-t border-[#2d2f31] space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9aa0a6] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#d4a843]" />
                  <span>Verified Statutory Citations ({citations.length}):</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {citations.map((c, i) => {
                    const isExpanded = expandedCitationIdx === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setExpandedCitationIdx(isExpanded ? null : i)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono transition shadow-sm ${
                          isExpanded
                            ? 'bg-[#d4a843]/20 border-[#d4a843] text-[#f0c96a]'
                            : 'bg-[#1e1f20] hover:bg-[#282a2c] border-[#333538] hover:border-slate-600 text-slate-200'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#d4a843]" />
                        <span>{c.citation || c.id}</span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Expanded Verbatim Passage Drawer */}
                {expandedCitationIdx !== null && citations[expandedCitationIdx] && (
                  <div className="p-3.5 rounded-2xl bg-[#1e1f20] border border-[#333538] text-xs space-y-2 animate-fade-up">
                    <div className="flex items-center justify-between font-mono text-[#f0c96a] font-semibold">
                      <span>[{citations[expandedCitationIdx].id}] {citations[expandedCitationIdx].citation}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCitation(citations[expandedCitationIdx].id, citations[expandedCitationIdx].text, e)}
                        className="p-1 rounded text-slate-400 hover:text-white transition flex items-center gap-1"
                        title="Copy verbatim passage"
                      >
                        {copiedId === citations[expandedCitationIdx].id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === citations[expandedCitationIdx].id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-slate-300 font-mono italic leading-relaxed pl-3 border-l-2 border-[#d4a843] bg-[#141517] p-2.5 rounded-r-xl">
                      "{citations[expandedCitationIdx].text}"
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gemini Minimalist Action Bar */}
            <div className="pt-2 flex items-center gap-1 text-[#9aa0a6]">
              <button
                type="button"
                onClick={handleCopyAnswer}
                className="p-2 rounded-full hover:bg-[#1e1f20] hover:text-white transition"
                title="Copy response"
              >
                {answerCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2 rounded-full hover:bg-[#1e1f20] hover:text-[#d4a843] transition"
                title="Export Official PDF Extract"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onSaveAnswer && onSaveAnswer(currentQuestion, answer, citations)}
                className="p-2 rounded-full hover:bg-[#1e1f20] hover:text-white transition"
                title="Bookmark answer"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'text-[#f0c96a] fill-[#f0c96a]' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onNewQuestion}
                className="p-2 rounded-full hover:bg-[#1e1f20] hover:text-white transition ml-1"
                title="Start a new conversation"
              >
                <Plus className="w-4 h-4" />
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

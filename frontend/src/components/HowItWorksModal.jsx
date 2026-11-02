import React from 'react';
import { X, ShieldCheck, Database, Cpu, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function HowItWorksModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Citation Grounding & Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Undergraduate Capstone Research: Zero-Hallucination Legal RAG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Database className="w-4 h-4 text-[#d4a843]" />
              <span>1. Verified Primary Legal Corpus (991 Sections)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Every retrieved record originates directly from official Sri Lankan Government gazettes and the Consolidated Motor Traffic Act (2024 Edition) verified against LawNet and Parliament Acts. No synthetic or generated statutes exist in the corpus.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>2. Hybrid Retrieval with Reciprocal Rank Fusion (RRF)</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Combines dense semantic vector search (<code className="text-[#f0c96a]">text-embedding-3-small</code>) with lexical keyword matching (BM25 with statutory section boosting). Query expansion translates colloquial citizen wording to official statutory phrasing.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>3. Grounded Generation & Automated Citation Verification</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              The LLM generator is strictly restricted to state only what is contained in the retrieved text and quote key clauses verbatim. Every cited section ID is programmatically cross-verified against the corpus before the answer is displayed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span>4. Scope Restriction & Hallucination Prevention</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Non-traffic questions (e.g. criminal law, property, general knowledge) are classified at the gate and strictly refused. If retrieval confidence falls below threshold, the system says "I could not find a relevant provision" instead of guessing.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 text-center text-[11px] text-slate-500">
          This system provides legal information, not legal advice. For formal legal representation, consult a qualified attorney-at-law.
        </div>
      </div>
    </div>
  );
}

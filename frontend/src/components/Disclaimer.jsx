import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function Disclaimer() {
  return (
    <footer className="mt-8 pt-4 pb-8 border-t border-slate-200 text-xs text-slate-500">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold">Legal Information Disclaimer:</strong> This system provides citation-grounded legal information derived strictly from Sri Lanka's Motor Traffic Act No. 14 of 1951, amendments, and official gazette regulations. It does not provide legal advice or establish an attorney-client relationship. For official representation, court proceedings, or specific legal disputes, consult a qualified attorney-at-law.
          </p>
        </div>
        <div className="mt-3 text-center text-[11px] text-slate-400">
          Academic Research Project: Grounded RAG for Sri Lankan Motor Traffic Legislation • Phase 9
        </div>
      </div>
    </footer>
  );
}


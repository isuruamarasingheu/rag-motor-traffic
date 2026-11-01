import React from 'react';
import { Scale, ShieldCheck, BookOpen } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-md">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Sri Lanka Motor Traffic Legal Assistant
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Citation-Grounded Citizen Legal Information System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <BookOpen className="w-3.5 h-3.5" />
            MTA No. 14 of 1951
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Grounded
          </span>
        </div>
      </div>
    </header>
  );
}


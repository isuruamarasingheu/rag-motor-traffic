import React from 'react';
import { Scale, ChevronRight, BookOpen, AlertTriangle } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Scale className="w-4 h-4 text-slate-700" />
        <span className="hidden sm:inline text-slate-600">Sri Lanka Legal System</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
        <span className="text-slate-700 font-semibold">Motor Traffic Act No. 14 of 1951</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">Q&amp;A Assistant</span>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 text-xs">
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
          <BookOpen className="w-3 h-3 text-slate-500" />
          979 Verified Sections
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-medium text-[11px]">
          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
          <span>Legal Info · Not Advice</span>
        </span>
      </div>
    </header>
  );
}

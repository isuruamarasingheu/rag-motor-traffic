import React from 'react';
import { Scale, Plus, Volume2, Car, FileText, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export const SUGGESTED_QUERIES = [
  {
    icon: Volume2,
    label: 'Motorcycle noise limits',
    query: 'What is the noise emission limit for a motorcycle silencer under the law?',
  },
  {
    icon: Car,
    label: 'Learner driver L-plate rules',
    query: 'Can a learner driver drive alone if they display L plates on the vehicle?',
  },
  {
    icon: FileText,
    label: 'Disputing traffic fine',
    query: 'Can I contest or appeal a traffic fine issued by the police?',
  },
  {
    icon: ShieldCheck,
    label: 'Vehicle registration docs',
    query: 'What documents are required for motor vehicle registration in Sri Lanka?',
  },
  {
    icon: AlertCircle,
    label: 'Driving without licence',
    query: 'What is the penalty for driving a motor vehicle without a valid driving licence?',
  },
];

export default function Sidebar({ onSelectQuery, onNewQuestion, history = [] }) {
  return (
    <aside className="w-64 bg-[#0a1628] text-slate-200 flex flex-col h-full border-r border-slate-800/80 shadow-xl flex-shrink-0 relative overflow-hidden select-none">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-[#2a4a8f]/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#d4a843]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4a843] to-[#9a6e1a] text-slate-950 flex items-center justify-center shadow-lg shadow-[#d4a843]/20 flex-shrink-0">
            <Scale className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
              LegalAid LK
            </h1>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              Motor Traffic Act Assistant
            </p>
          </div>
        </div>
      </div>

      {/* New Question Action Button */}
      <div className="p-3 relative z-10">
        <button
          onClick={onNewQuestion}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#1c3160] to-[#2a4a8f] hover:from-[#233c75] hover:to-[#355bb0] text-white text-xs font-semibold shadow-md shadow-black/20 border border-slate-700/50 transition duration-150 active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Question</span>
        </button>
      </div>

      {/* Suggested Queries */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 relative z-10 text-xs">
        <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Suggested Queries
        </div>
        {SUGGESTED_QUERIES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectQuery(item.query)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition text-left group"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#d4a843] transition flex-shrink-0" />
              <span className="truncate leading-snug">{item.label}</span>
            </button>
          );
        })}

        {/* History Section if queries exist */}
        {history.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-2.5 border-t border-slate-800/80 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Recent Inquiries</span>
            </div>
            {history.slice(0, 6).map((h, i) => (
              <button
                key={i}
                onClick={() => onSelectQuery(h.question)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 text-left transition truncate"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 flex-shrink-0" />
                <span className="truncate">{h.question}</span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 relative z-10">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg py-1.5 px-1">
            <div className="text-xs font-bold text-[#f0c96a]">991</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">Sections</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg py-1.5 px-1">
            <div className="text-xs font-bold text-[#f0c96a]">0.391</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">MRR</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg py-1.5 px-1">
            <div className="text-xs font-bold text-[#f0c96a]">0.467</div>
            <div className="text-[9px] text-slate-400 uppercase tracking-wider">R@5</div>
          </div>
        </div>
      </div>
    </aside>
  );
}


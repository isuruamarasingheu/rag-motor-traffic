import React from 'react';
import { X, Bell, FileText, ChevronRight, AlertTriangle, ShieldCheck } from 'lucide-react';

const GAZETTE_UPDATES = [
  {
    tag: 'Act No. 10 of 2019',
    title: 'Major Traffic Offence Fine Revisions',
    date: 'Certified 20 June 2019',
    badge: 'Statutory Amendment',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    summary: 'Substantially increased fines for 7 primary traffic offences: driving without a licence (Rs. 25,000–30,000 under Section 123), driving without insurance (Rs. 25,000–50,000 under Section 218), speeding up to Rs. 25,000, and mobile phone usage while driving.',
    query: 'What are the fines under Motor Traffic Amendment Act No 10 of 2019?',
  },
  {
    tag: 'Gazette 1738/37',
    title: 'Motor Vehicle Noise Emission Standards',
    date: '28 October 2011',
    badge: 'Gazette Regulation',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    summary: 'Specifies maximum permissible sound pressure levels in decibels dB(A) for vehicle silencers, exhaust systems, and horns across motor cycles, passenger vehicles, and heavy lorries.',
    query: 'What is the noise emission limit for a motorcycle silencer under the law?',
  },
  {
    tag: 'Gazette 2147/43',
    title: 'Spot Fine Offence Schedules & Demerit Points',
    date: '31 October 2019',
    badge: 'Police Enforcement',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    summary: 'Detailed schedule of 33 minor traffic contraventions eligible for spot-fine payment at designated post offices, including licence production within 14 days.',
    query: 'What are the rules and deadlines for paying a spot fine ticket?',
  },
  {
    tag: 'Gazette 1986/11',
    title: 'Mandatory Protective Helmets Standard',
    date: '30 September 2016',
    badge: 'Road Safety',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    summary: 'Mandates that motorcycle riders and pillion passengers must wear safety helmets conforming to Sri Lanka Standard SLS 517 with proper chin strap fastening.',
    query: 'What are the legal helmet standards for motorcyclists in Sri Lanka?',
  },
];

export default function GazetteUpdatesModal({ isOpen, onClose, onSelectTopic }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Gazette & Amendment Updates</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  Consolidated 2024
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Key statutory amendments and Extraordinary Gazettes integrated into this assistant.
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
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {GAZETTE_UPDATES.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-2 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {item.tag}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">{item.date}</span>
              </div>

              <h3 className="text-xs font-semibold text-white group-hover:text-[#f0c96a] transition">
                {item.title}
              </h3>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {item.summary}
              </p>

              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => {
                    onSelectTopic(item.query);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f0c96a] hover:text-white transition"
                >
                  <span>Query this update</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

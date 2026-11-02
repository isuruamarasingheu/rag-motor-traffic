import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, ExternalLink, ChevronRight, Scale, ShieldCheck } from 'lucide-react';

const ACT_SECTIONS_INDEX = [
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s123-1',
    section: 'Section 123(1)',
    heading: 'Prohibition of driving without a valid driving licence',
    category: 'licensing',
    summary: 'No person shall drive a motor vehicle of any class unless they hold a valid driving licence. Minimum age is 18 for light vehicles, 21 for heavy vehicles.',
  },
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s123-5',
    section: 'Section 123(5)',
    heading: 'Penalty for driving without a driving licence (2019 Amendment)',
    category: 'penalties',
    summary: 'Fine of Rs. 25,000 to Rs. 30,000 on first conviction; Rs. 30,000 to Rs. 50,000 on second or subsequent conviction (Act No. 10 of 2019).',
  },
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s123-2',
    section: 'Section 123(2)',
    heading: 'Learner driver regulations and instructor supervision',
    category: 'licensing',
    summary: 'Learner permit holders must display standard L plates and be accompanied by a licensed instructor holding a valid instructor licence.',
  },
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s135-1',
    section: 'Section 135(1)',
    heading: 'Duty to carry and produce driving licence on demand',
    category: 'licensing',
    summary: 'Drivers must carry their driving licence and produce it immediately upon demand by a police officer. Failure to carry carries a fine of Rs. 2,500 to Rs. 5,000.',
  },
  {
    part: 'Part VIII: Rules of the Road',
    id: 'MTA-1951-s141A',
    section: 'Section 141A',
    heading: 'Penalties for exceeding speed limits',
    category: 'speed',
    summary: 'Graduated fines based on percentage over limit: up to 20% (Rs. 3,000–5,000); 20–30% (Rs. 5,000–10,000); 30–50% (Rs. 10,000–15,000); >50% (Rs. 15,000–25,000).',
  },
  {
    part: 'Part VIII: Rules of the Road',
    id: 'MTA-1951-s151',
    section: 'Section 151',
    heading: 'Driving under the influence of intoxicating liquor or drugs',
    category: 'offences',
    summary: 'Strict prohibition of driving under the influence. Fines up to Rs. 25,000 to Rs. 100,000 with imprisonment and licence cancellation.',
  },
  {
    part: 'Part VIII: Rules of the Road',
    id: 'MTA-1951-s152A',
    section: 'Section 152A',
    heading: 'Prohibition on use of mobile communication devices while driving',
    category: 'offences',
    summary: 'Prohibits holding or using a mobile phone or handheld wireless telephone while operating a motor vehicle on any road.',
  },
  {
    part: 'Part VI: Third-Party Risks Insurance',
    id: 'MTA-1951-s99',
    section: 'Section 99 & 218',
    heading: 'Mandatory third-party risks insurance policy',
    category: 'insurance',
    summary: 'Motor vehicles cannot be used without valid third-party insurance. Breach carries fine of Rs. 25,000 to Rs. 50,000 under Section 218.',
  },
  {
    part: 'Part X: Offences and Powers',
    id: 'MTA-1951-s232F',
    section: 'Section 232F',
    heading: 'Police powers of detention and vehicle seizure',
    category: 'police_powers',
    summary: 'Police officers and examiners may seize and detain motor vehicles operated in breach of fitness, registration, or safety provisions.',
  },
  {
    part: 'Part X: Offences and Powers',
    id: 'MTA-1951-s215A',
    section: 'Section 215A',
    heading: 'Spot fine procedure and liability of the offender',
    category: 'procedure',
    summary: 'Prescribed minor offences eligible for spot fine notices payable within 14 days at designated post offices.',
  },
  {
    part: 'Subsidiary Gazette Regulations',
    id: 'GAZ-1738-37-reg-3',
    section: 'Gazette 1738/37, Reg 3',
    heading: 'Motor vehicle noise emission standards (exhaust & silencers)',
    category: 'noise',
    summary: 'Prescribes maximum permissible exhaust decibel (dB) limits across vehicle classes (e.g., 85 dB(A) for motorcycles at designated distances).',
  },
  {
    part: 'Subsidiary Gazette Regulations',
    id: 'GAZ-1986-11-reg-2',
    section: 'Gazette 1986/11, Reg 2',
    heading: 'Protective helmets standard (SLS 517 certification)',
    category: 'safety',
    summary: 'Riders and pillion passengers of motorcycles must wear protective helmets conforming to Sri Lanka Standard SLS 517.',
  },
  {
    part: 'Procedural Guides',
    id: 'PROC-PG-POL-4',
    section: 'Police Procedure 4',
    heading: 'Procedure for contesting or appealing an issued spot-fine ticket',
    category: 'procedure',
    summary: 'Citizens may contest a disputed traffic ticket by reporting to the Officer-in-Charge (OIC Traffic) before the 14-day court filing deadline.',
  },
];

export default function ActBrowserModal({ isOpen, onClose, onSelectSection }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = useMemo(() => {
    return ACT_SECTIONS_INDEX.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = search.toLowerCase().trim();
      const matchText =
        !q ||
        item.section.toLowerCase().includes(q) ||
        item.heading.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.part.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [search, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4a843]/10 border border-[#d4a843]/30 text-[#d4a843] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Motor Traffic Act & Gazette Repository</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30">
                  991 Verified Sections
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Browse official statutory provisions of the Motor Traffic Act No. 14 of 1951, amendments, and gazettes.
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

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-800 bg-[#121826] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by section number (e.g. 123, 141A, 232F) or keyword..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/70 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#d4a843] transition"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {['all', 'licensing', 'penalties', 'noise', 'speed', 'procedure'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg font-medium capitalize whitespace-nowrap transition text-[11px] ${
                  selectedCategory === cat
                    ? 'bg-[#d4a843] text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching statutory sections found for "{search}".
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition group flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-semibold text-[#f0c96a] bg-[#d4a843]/10 px-2 py-0.5 rounded border border-[#d4a843]/20">
                      {item.section}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.part}
                    </span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white transition">
                    {item.heading}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">
                    {item.summary}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onSelectSection(`What does ${item.section} say about ${item.heading}?`);
                    onClose();
                  }}
                  className="flex-shrink-0 self-end sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-[#d4a843] text-slate-300 hover:text-slate-950 text-[11px] font-semibold transition border border-slate-700/60 hover:border-[#d4a843]"
                >
                  <span>Query Section</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span>Corpus: Consolidated Motor Traffic Act (2024), Amendments & Gazettes</span>
          <span className="text-slate-400">Showing {filtered.length} of {ACT_SECTIONS_INDEX.length} key indexed provisions</span>
        </div>
      </div>
    </div>
  );
}

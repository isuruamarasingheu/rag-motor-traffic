import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen, ChevronRight, ChevronDown, Copy, Check, FileText } from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

const ACT_SECTIONS_INDEX = [
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s123-1',
    section: 'Section 123(1)',
    heading: 'Prohibition of driving without a valid driving licence',
    category: 'licensing',
    summary: 'No person shall drive a motor vehicle of any class unless they hold a valid driving licence. Minimum age is 18 for light vehicles, 21 for heavy vehicles.',
    verbatim: '(1) Subject to the provisions of subsection (2)— (a) no person shall drive a motor vehicle of any class on a road unless he is the holder of an driving licence subject to a probation period which is valid for motor vehicles of that class; (b) no person shall employ or permit any other person to drive a motor vehicle of any class on a road unless the person so employed or permitted is the holder of an driving licence...',
  },
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s123-5',
    section: 'Section 123(5)',
    heading: 'Penalty for driving without a driving licence (2019 Amendment)',
    category: 'penalties',
    summary: 'Fine of Rs. 25,000 to Rs. 30,000 on first conviction; Rs. 30,000 to Rs. 50,000 on second or subsequent conviction (Act No. 10 of 2019).',
    verbatim: '(5) (a) A person who contravenes the provisions of paragraph (a) of subsection (1) shall be guilty of an offence and shall on conviction be liable to a fine not less than twenty five thousand rupees and not exceeding thirty thousand rupees and on a second or subsequent conviction to a fine not less than thirty thousand rupees and not exceeding fifty thousand rupees.',
  },
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s123-2',
    section: 'Section 123(2)',
    heading: 'Learner driver regulations and instructor supervision',
    category: 'licensing',
    summary: 'Learner permit holders must display standard L plates and be accompanied by a licensed instructor holding a valid instructor licence.',
    verbatim: '(2) A person who has completed eighteen years of age may learn to drive a motor vehicle other than a motor coach or lorry under the authority of a learner\'s permit, provided that an instructor holding a valid licence occupies the seat next to him and standard L plates are exhibited...',
  },
  {
    part: 'Part VII: Driving Licences',
    id: 'MTA-1951-s135-1',
    section: 'Section 135(1)',
    heading: 'Duty to carry and produce driving licence on demand',
    category: 'licensing',
    summary: 'Drivers must carry their driving licence and produce it immediately upon demand by a police officer. Failure to carry carries a fine of Rs. 2,500 to Rs. 5,000.',
    verbatim: '(1) The driver of a motor vehicle shall always carry his driving licence on his person or in the motor vehicle and shall, when on demand made by a police officer, forthwith produce the licence and permit it to be inspected... (1A) Any person who fails to carry a valid Learner\'s Permit and Driving Licence shall be liable to a fine not less than two thousand five hundred rupees and not exceeding five thousand rupees.',
  },
  {
    part: 'Part VIII: Rules of the Road',
    id: 'MTA-1951-s141A',
    section: 'Section 141A',
    heading: 'Penalties for exceeding speed limits',
    category: 'speed',
    summary: 'Graduated fines based on percentage over limit: up to 20% (Rs. 3,000–5,000); 20–30% (Rs. 5,000–10,000); 30–50% (Rs. 10,000–15,000); >50% (Rs. 15,000–25,000).',
    verbatim: '141A. (1) Any person who contravenes the provisions of sections 140, 141 and 142 shall on conviction be liable: (a) in excess of prescribed speed limit up to twenty per centum, fine not less than 3,000 rupees and not exceeding 5,000 rupees; (b) in excess of 20% and less than 30%, fine not less than 5,000 rupees and not exceeding 10,000 rupees; (c) in excess of 30% and less than 50%, fine not less than 10,000 rupees and not exceeding 15,000 rupees; (d) in excess of 50%, fine not less than 15,000 rupees and not exceeding 25,000 rupees.',
  },
  {
    part: 'Part VIII: Rules of the Road',
    id: 'MTA-1951-s151',
    section: 'Section 151',
    heading: 'Driving under the influence of intoxicating liquor or drugs',
    category: 'offences',
    summary: 'Strict prohibition of driving under the influence. Fines up to Rs. 25,000 to Rs. 100,000 with imprisonment and licence cancellation.',
    verbatim: '151. (1) No person shall drive a motor vehicle on a road after consuming intoxicating liquor or drugs to such an extent as to be incapable of having proper control of the vehicle. (2) Causing death or grievous hurt while driving under the influence carries imprisonment and mandatory licence cancellation.',
  },
  {
    part: 'Part VIII: Rules of the Road',
    id: 'MTA-1951-s152A',
    section: 'Section 152A',
    heading: 'Prohibition on use of mobile communication devices while driving',
    category: 'offences',
    summary: 'Prohibits holding or using a mobile phone or handheld wireless telephone while operating a motor vehicle on any road.',
    verbatim: '152A. No person shall while driving a motor vehicle on a road use any cellular mobile phone or any other communication device unless such device is equipped with a hands-free device enabling operation without taking either hand off the steering mechanism.',
  },
  {
    part: 'Part VI: Third-Party Risks Insurance',
    id: 'MTA-1951-s99',
    section: 'Section 99 & 218',
    heading: 'Mandatory third-party risks insurance policy',
    category: 'insurance',
    summary: 'Motor vehicles cannot be used without valid third-party insurance. Breach carries fine of Rs. 25,000 to Rs. 50,000 under Section 218.',
    verbatim: '218. A person who contravenes the provisions of section 99 shall be guilty of an offence and shall on conviction be liable to a fine not less than twenty five thousand rupees and not exceeding fifty thousand rupees or to imprisonment for a term not exceeding one month or to both such fine and imprisonment.',
  },
  {
    part: 'Part X: Offences and Powers',
    id: 'MTA-1951-s232F',
    section: 'Section 232F',
    heading: 'Police powers of detention and vehicle seizure',
    category: 'police_powers',
    summary: 'Police officers and examiners may seize and detain motor vehicles operated in breach of fitness, registration, or safety provisions.',
    verbatim: '232F. (1) A police officer or an examiner may detain any motor vehicle on any road where he has reason to suspect that such vehicle is being driven in contravention of registration, licensing or safety requirements, until satisfaction of inspection or production of relevant certificates.',
  },
  {
    part: 'Part X: Offences and Powers',
    id: 'MTA-1951-s215A',
    section: 'Section 215A',
    heading: 'Spot fine procedure and liability of the offender',
    category: 'procedure',
    summary: 'Prescribed minor offences eligible for spot fine notices payable within 14 days at designated post offices.',
    verbatim: '215A. (1) Where a police officer detects a person committing any offence specified in the Second Schedule, he may serve on such person a notice specifying the fine to be paid at any post office within fourteen days, in lieu of prosecution before a Magistrate.',
  },
  {
    part: 'Subsidiary Gazette Regulations',
    id: 'GAZ-1738-37-reg-3',
    section: 'Gazette 1738/37, Reg 3',
    heading: 'Motor vehicle noise emission standards (exhaust & silencers)',
    category: 'noise',
    summary: 'Prescribes maximum permissible exhaust decibel (dB) limits across vehicle classes (e.g., 85 dB(A) for motorcycles at designated distances).',
    verbatim: 'Reg 3. (1) No person shall use or cause to be used any motor vehicle whose exhaust noise emission level exceeds the permissible maximum noise limits specified in Schedule I (85 dB(A) for motor cycles, 88 dB(A) for light motor vehicles, and 92 dB(A) for heavy lorries).',
  },
  {
    part: 'Subsidiary Gazette Regulations',
    id: 'GAZ-1986-11-reg-2',
    section: 'Gazette 1986/11, Reg 2',
    heading: 'Protective helmets standard (SLS 517 certification)',
    category: 'safety',
    summary: 'Riders and pillion passengers of motorcycles must wear protective helmets conforming to Sri Lanka Standard SLS 517.',
    verbatim: 'Reg 2. Every person driving or riding pillion on a motorcycle on any road shall wear a protective helmet bearing the SLS 517 certification mark and securely fastened by a chin strap.',
  },
  {
    part: 'Procedural Guides',
    id: 'PROC-PG-POL-4',
    section: 'Police Procedure 4',
    heading: 'Procedure for contesting or appealing an issued spot-fine ticket',
    category: 'procedure',
    summary: 'Citizens may contest a disputed traffic ticket by reporting to the Officer-in-Charge (OIC Traffic) before the 14-day court filing deadline.',
    verbatim: 'Procedural Rule: If a citizen disputes a traffic ticket issued on the road, they should immediately report in person to the Officer-in-Charge (OIC Traffic) of the relevant police station before the expiry of the 14-day payment window to present objection or request formal summary trial before the Magistrate.',
  },
];

export default function ActBrowserModal({ isOpen, onClose, onSelectSection }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopyVerbatim = (id, text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-up">
      <div className="bg-[#0f1420] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <GoldenScaleLogo className="w-9 h-9 rounded-xl" iconSize="w-5 h-5" />
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching statutory sections found for "{search}".
            </div>
          ) : (
            filtered.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition overflow-hidden"
                >
                  <div className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-semibold text-[#f0c96a] bg-[#d4a843]/10 px-2 py-0.5 rounded border border-[#d4a843]/20">
                          {item.section}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.part}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-slate-200">
                        {item.heading}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">
                        {item.summary}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition border border-slate-700/60"
                        title="Read verbatim statutory text"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#d4a843]" />
                        <span>{isExpanded ? 'Hide Statute' : 'Read Statute'}</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => {
                          onSelectSection(`What does ${item.section} say about ${item.heading}?`);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4a843] hover:bg-[#e4b952] text-slate-950 text-[11px] font-semibold transition shadow-sm active:scale-95"
                        title="Ask the assistant to explain this section"
                      >
                        <span>Ask Assistant</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Verbatim Statute Excerpt Expandable Drawer */}
                  {isExpanded && item.verbatim && (
                    <div className="px-4 pb-4 pt-1 bg-slate-950/70 border-t border-slate-800/80 animate-fade-up">
                      <div className="flex items-center justify-between py-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        <span>Verbatim Statute Clause</span>
                        <button
                          onClick={(e) => handleCopyVerbatim(item.id, item.verbatim, e)}
                          className="flex items-center gap-1 text-[#f0c96a] hover:text-white transition"
                        >
                          {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === item.id ? 'Copied' : 'Copy Excerpt'}</span>
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0a0e17] border-l-2 border-[#d4a843] font-serif-legal italic text-xs text-slate-300 leading-relaxed">
                        "{item.verbatim}"
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span>Corpus: Consolidated Motor Traffic Act (2024), Amendments & Gazettes</span>
          <span className="text-slate-400">Showing {filtered.length} of {ACT_SECTIONS_INDEX.length} key provisions</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  RotateCcw,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

export default function FineCalculatorView({ onLaunchRAGAction, onBackToChat }) {
  const [fines, setFines] = useState([]);
  const [selectedFineIds, setSelectedFineIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch('/fines')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load fines');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setFines(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load fine catalog:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFine = (id) => {
    setSelectedFineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleReset = () => {
    setSelectedFineIds(new Set());
  };

  const calculation = useMemo(() => {
    const selected = fines.filter((f) => selectedFineIds.has(f.id));
    let spotTotal = 0;
    let courtMinTotal = 0;
    let courtMaxTotal = 0;
    let totalDemeritPoints = 0;
    let spotCount = 0;
    let courtCount = 0;

    selected.forEach((f) => {
      totalDemeritPoints += f.points || 0;
      if (f.spot_fine) {
        spotTotal += f.min_amount;
        spotCount += 1;
      } else {
        courtMinTotal += f.min_amount;
        courtMaxTotal += f.max_amount;
        courtCount += 1;
      }
    });

    return {
      selected,
      spotTotal,
      courtMinTotal,
      courtMaxTotal,
      totalDemeritPoints,
      spotCount,
      courtCount,
    };
  }, [fines, selectedFineIds]);

  const filteredFines = useMemo(() => {
    if (activeCategory === 'all') return fines;
    return fines.filter((f) => f.category === activeCategory);
  }, [fines, activeCategory]);

  const selectedOffenceNames = calculation.selected.map((s) => s.name).join(', ');

  const handlePayProcedure = () => {
    const q =
      calculation.selected.length > 0
        ? `What is the exact payment procedure and deadline to pay my traffic fine for (${selectedOffenceNames}) at a post office, and what happens to my driving licence?`
        : 'What is the exact procedure, deadline and post office rules for paying a traffic spot fine in Sri Lanka?';
    onLaunchRAGAction(q);
  };

  const handleDisputeProcedure = () => {
    const q =
      calculation.selected.length > 0
        ? `How can I legally contest or dispute an issued traffic fine for (${selectedOffenceNames}) if I believe the police officer was mistaken or did not use proper measuring equipment?`
        : 'How can a driver contest or appeal a police traffic ticket in Sri Lanka before the Magistrate Court?';
    onLaunchRAGAction(q);
  };

  const handleNonPaymentConsequences = () => {
    const q =
      calculation.selected.length > 0
        ? `What are the legal consequences under Section 215A if I fail to pay the fine for (${selectedOffenceNames}) within the 14-day statutory period?`
        : 'What are the legal consequences and court penalties if a driver does not pay a traffic spot fine within 14 days under Section 215A?';
    onLaunchRAGAction(q);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b0f17] animate-fade-up">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e131d]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GoldenScaleLogo className="w-10 h-10 rounded-xl" iconSize="w-5 h-5" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-semibold text-slate-100">
                Deterministic Traffic Fine Calculator
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Gazette 2054/09 & Act No. 10 of 2019
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculate official statutory fines, spot payment totals, and court ranges with verified section references.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {calculation.selected.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ({calculation.selected.length})</span>
            </button>
          )}

          <button
            onClick={onBackToChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assistant</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Column: Offence Picker List */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 overflow-hidden">
          {/* Category Tabs */}
          <div className="p-3 bg-[#121826] border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'All Offences' },
              { id: 'licence', label: 'Licence & Driver' },
              { id: 'speed', label: 'Speeding Limits' },
              { id: 'equipment', label: 'Noise & Equipment' },
              { id: 'insurance', label: 'Insurance' },
              { id: 'registration', label: 'Registration' },
              { id: 'rules', label: 'Road Rules' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition text-[11px] ${
                  activeCategory === c.id
                    ? 'bg-[#d4a843] text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Offence Cards */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
            {loading ? (
              <div className="text-center py-20 text-slate-500 text-xs flex flex-col items-center gap-2">
                <Calculator className="w-6 h-6 animate-pulse text-[#d4a843]" />
                <span>Loading statutory fine schedules...</span>
              </div>
            ) : filteredFines.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No offences found in this category.
              </div>
            ) : (
              filteredFines.map((f) => {
                const isChecked = selectedFineIds.has(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleFine(f.id)}
                    className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-[#d4a843]/10 border-[#d4a843]/50 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="mt-0.5 text-[#d4a843]">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 fill-[#d4a843] text-slate-950" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-slate-100">
                          {f.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              f.spot_fine
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {f.spot_fine ? 'Spot Fine (Post Office)' : 'Court Conviction'}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#f0c96a]">
                            {f.spot_fine
                              ? `Rs. ${f.min_amount.toLocaleString()}`
                              : `Rs. ${f.min_amount.toLocaleString()} - ${f.max_amount.toLocaleString()}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-mono text-[#d4a843] font-medium">{f.section}</span>
                        <span>·</span>
                        <span>{f.act}</span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                        {f.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Calculated Total & AI Actions */}
        <div className="w-full lg:w-96 bg-slate-950/70 p-5 flex flex-col justify-between overflow-y-auto space-y-5 border-t lg:border-t-0 border-slate-800">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#d4a843]" />
              <span>Calculated Summary</span>
            </h2>

            {/* Tally Box */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Selected Offences:</span>
                <span className="font-bold text-white font-mono">
                  {calculation.selected.length} items
                </span>
              </div>

              {/* Spot fines tally */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-300 font-medium">Spot Fines Total:</span>
                  <div className="text-[10px] text-slate-500">Payable at Post Office within 14 days</div>
                </div>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  Rs. {calculation.spotTotal.toLocaleString()}
                </span>
              </div>

              {/* Court fines tally */}
              {calculation.courtCount > 0 && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-300 font-medium">Court Penalty Range:</span>
                    <div className="text-[10px] text-amber-400/80">Requires Magistrate Court appearance</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    Rs. {calculation.courtMinTotal.toLocaleString()} - {calculation.courtMaxTotal.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Demerit points tally if applicable */}
              {calculation.totalDemeritPoints > 0 && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Demerit Points Accumulated:</span>
                  <span className="font-bold font-mono text-rose-400">
                    {calculation.totalDemeritPoints} points
                  </span>
                </div>
              )}
            </div>

            {/* Selected List Pills */}
            {calculation.selected.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Offences in Calculation:
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {calculation.selected.map((s) => (
                    <div
                      key={s.id}
                      className="text-[11px] p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="truncate text-slate-300 pr-2">{s.name}</span>
                      <span className="text-[#f0c96a] font-mono flex-shrink-0 text-[10px]">
                        Rs. {s.min_amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* The 3 RAG AI Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f0c96a]">
              <Sparkles className="w-3.5 h-3.5 fill-[#f0c96a]" />
              <span>RAG AI Action Assistance:</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Ask MagaNithi AI to explain the exact legal rules for this calculation:
            </p>

            {/* Action 1: How to pay */}
            <button
              onClick={handlePayProcedure}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-[#131b29] border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-white text-xs transition active:scale-98 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">📮</span>
                <div className="text-left">
                  <div className="font-semibold text-[11px]">How to Pay This Fine</div>
                  <div className="text-[9px] text-slate-400">Post Office & 14-day licence rules</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
            </button>

            {/* Action 2: How to dispute */}
            <button
              onClick={handleDisputeProcedure}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-[#131b29] border border-slate-700/80 hover:border-amber-500/50 text-slate-200 hover:text-white text-xs transition active:scale-98 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-400">⚖️</span>
                <div className="text-left">
                  <div className="font-semibold text-[11px]">How to Dispute or Contest</div>
                  <div className="text-[9px] text-slate-400">Reporting to OIC & Court Trial</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />
            </button>

            {/* Action 3: Non-payment consequences */}
            <button
              onClick={handleNonPaymentConsequences}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-[#131b29] border border-slate-700/80 hover:border-rose-500/50 text-slate-200 hover:text-white text-xs transition active:scale-98 group"
            >
              <div className="flex items-center gap-2">
                <span className="text-rose-400">⚠️</span>
                <div className="text-left">
                  <div className="font-semibold text-[11px]">Consequences of Non-Payment</div>
                  <div className="text-[9px] text-slate-400">Section 215A & vehicle detention</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 transition" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

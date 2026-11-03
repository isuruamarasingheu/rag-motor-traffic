import React, { useState, useMemo, useEffect } from 'react';
import {
  RotateCcw,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Check,
  Calculator,
} from 'lucide-react';
import GoldenScaleLogo from './GoldenScaleLogo';

const VEHICLE_CLASSES = [
  { id: 'motorcycle', label: 'Motorcycle', sinhala: 'මෝටර්සයිකල්' },
  { id: 'three_wheeler', label: 'Three-wheeler', sinhala: 'ත්‍රිරෝද රථය' },
  { id: 'light_vehicle', label: 'Light vehicle', sinhala: 'සැහැල්ලු රථය' },
  { id: 'heavy_vehicle', label: 'Heavy vehicle', sinhala: 'බර වාහන' },
];

const GROUPS = [
  'LICENSING',
  'DOCUMENTATION',
  'SAFETY EQUIPMENT',
  'VEHICLE CONDITION',
  'RECKLESS DRIVING',
];

export default function FineCalculatorView({ onLaunchRAGAction, onBackToChat }) {
  const [fines, setFines] = useState([]);
  const [selectedVehicleClass, setSelectedVehicleClass] = useState('motorcycle');
  const [selectedFineIds, setSelectedFineIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

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

  // Filter fines visible for currently selected vehicle class
  const availableFines = useMemo(() => {
    return fines.filter((f) => {
      if (!f.vehicle_classes || f.vehicle_classes.length === 0) return true;
      return f.vehicle_classes.includes(selectedVehicleClass);
    });
  }, [fines, selectedVehicleClass]);

  // Compute live totals based on visible selected offences
  const calculation = useMemo(() => {
    const visibleIds = new Set(availableFines.map((f) => f.id));
    const selected = fines.filter((f) => selectedFineIds.has(f.id) && visibleIds.has(f.id));
    let spotTotal = 0;
    let courtMinTotal = 0;
    let courtMaxTotal = 0;
    let spotCount = 0;
    let courtCount = 0;

    selected.forEach((f) => {
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
      spotCount,
      courtCount,
    };
  }, [fines, selectedFineIds, availableFines]);

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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0d14] text-slate-100 font-sans animate-fade-up">
      {/* Top Header matching photo layout with System Yellow theme */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-[#0c101a] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <GoldenScaleLogo className="w-9 h-9 rounded-xl" iconSize="w-4 h-4" />
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                Spot fine calculator
              </h1>
              <span className="text-xs text-slate-400 font-normal">
                Motor Traffic Act schedule
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] font-mono px-3 py-1 rounded-full bg-[#d4a843]/15 text-[#f0c96a] border border-[#d4a843]/30 font-medium">
            Gazette 2271/13 · 2026
          </span>

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

      {/* Main Working Area: Left List + Right Calculated Summary */}
      <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
        {/* Left / Center Section: Exact Layout from Photos with System Yellow Palette */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 space-y-6">
          {/* Vehicle Class Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-slate-200 tracking-wide">
              Vehicle class
            </h2>

            {/* Pill Selectors with System Yellow Active State */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {VEHICLE_CLASSES.map((vc) => {
                const isSelected = selectedVehicleClass === vc.id;
                return (
                  <button
                    key={vc.id}
                    onClick={() => setSelectedVehicleClass(vc.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border text-left transition select-none ${
                      isSelected
                        ? 'border-[#d4a843]/80 bg-[#d4a843]/10 text-white shadow-sm ring-1 ring-[#d4a843]/40'
                        : 'border-slate-800 bg-[#0e131e]/70 text-slate-300 hover:border-slate-700 hover:bg-[#111724]'
                    }`}
                  >
                    {/* Radio indicator circle */}
                    <div
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition ${
                        isSelected
                          ? 'border-[#f0c96a] bg-[#d4a843]'
                          : 'border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-semibold leading-tight">
                        {vc.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {vc.sinhala}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              Class controls which offences appear: helmet rules only show for motorcycles, three-wheeler overload only for three-wheelers, and so on.
            </p>
          </div>

          {/* Select Offences Header */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <h2 className="text-xs font-semibold text-slate-200 tracking-wide">
              Select offences
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {availableFines.length} available
            </span>
          </div>

          {/* Grouped Offence Cards in 2-Column Grid */}
          <div className="space-y-6 pb-12">
            {GROUPS.map((group) => {
              const groupFines = availableFines.filter((f) => f.group === group);
              if (groupFines.length === 0) return null;

              return (
                <div key={group} className="space-y-2.5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#d4a843] font-semibold px-0.5">
                    {group}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                    {groupFines.map((f) => {
                      const isChecked = selectedFineIds.has(f.id);
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleFine(f.id)}
                          className={`rounded-2xl border p-3.5 sm:p-4 transition cursor-pointer flex items-start gap-3 select-none ${
                            isChecked
                              ? 'border-[#d4a843]/70 bg-[#d4a843]/10 shadow-md ring-1 ring-[#d4a843]/30'
                              : 'border-slate-800/80 bg-[#0e131f]/80 hover:border-slate-700/80 hover:bg-[#111726]'
                          }`}
                        >
                          {/* Custom Checkbox on the left */}
                          <div
                            className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center flex-shrink-0 transition ${
                              isChecked
                                ? 'bg-[#d4a843] border-[#f0c96a] text-slate-950'
                                : 'border-slate-600 bg-transparent'
                            }`}
                          >
                            {isChecked && (
                              <Check className="w-3 h-3 stroke-[3]" />
                            )}
                          </div>

                          {/* Offence Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="text-xs font-semibold text-slate-100 leading-snug">
                                {f.name}
                              </h3>
                              <span
                                className={`text-xs font-mono font-semibold whitespace-nowrap flex-shrink-0 ${
                                  f.is_court_only
                                    ? 'text-slate-400'
                                    : 'text-[#f0c96a]'
                                }`}
                              >
                                {f.amount_display || (f.spot_fine ? `Rs ${f.min_amount.toLocaleString()}` : 'court only')}
                              </span>
                            </div>

                            {/* Sinhala description under title */}
                            {f.sinhala_name && (
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                {f.sinhala_name}
                              </p>
                            )}

                            {/* Section reference at bottom */}
                            <div className="text-[10px] font-mono text-slate-500 tracking-wider pt-0.5">
                              {f.section}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Summary & RAG Actions Panel */}
        <div className="w-full xl:w-96 bg-[#0c101a] border-t xl:border-t-0 xl:border-l border-slate-800/80 p-5 flex flex-col justify-between flex-shrink-0 overflow-y-auto space-y-5">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#d4a843]" />
              <span>Calculated Summary</span>
            </h2>

            {/* Tally Card */}
            <div className="p-4 rounded-2xl bg-[#111726] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Selected Offences:</span>
                <span className="font-bold text-white font-mono">
                  {calculation.selected.length} items
                </span>
              </div>

              {/* Spot Total */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-200 font-medium">Spot Fines Total:</span>
                  <div className="text-[10px] text-slate-400">Payable at Post Office within 14 days</div>
                </div>
                <span className="text-base font-bold font-mono text-[#f0c96a]">
                  Rs {calculation.spotTotal.toLocaleString()}
                </span>
              </div>

              {/* Court range if applicable */}
              {calculation.courtCount > 0 && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-200 font-medium">Court Penalty Range:</span>
                    <div className="text-[10px] text-amber-400/90">Requires Magistrate Court appearance</div>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    Rs {calculation.courtMinTotal.toLocaleString()} - {calculation.courtMaxTotal.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Selected offences pills */}
            {calculation.selected.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Included in Calculation:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {calculation.selected.map((s) => (
                    <div
                      key={s.id}
                      className="text-[11px] p-2 rounded-xl bg-[#111726] border border-slate-800/80 flex items-center justify-between"
                    >
                      <span className="truncate text-slate-300 pr-2">{s.name}</span>
                      <span className="text-[#f0c96a] font-mono flex-shrink-0 text-[10px]">
                        {s.amount_display || `Rs ${s.min_amount.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RAG AI Action Assistance Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f0c96a]">
              <Sparkles className="w-3.5 h-3.5 fill-[#f0c96a]" />
              <span>RAG AI Legal Assistance:</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Ask MagaNithi AI to explain the exact statutory rules for this selection:
            </p>

            {/* Action 1: How to pay */}
            <button
              onClick={handlePayProcedure}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#111726] hover:bg-[#161f33] border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white text-xs transition active:scale-98 group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📮</span>
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
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#111726] hover:bg-[#161f33] border border-slate-800 hover:border-amber-500/50 text-slate-200 hover:text-white text-xs transition active:scale-98 group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚖️</span>
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
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#111726] hover:bg-[#161f33] border border-slate-800 hover:border-rose-500/50 text-slate-200 hover:text-white text-xs transition active:scale-98 group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚠️</span>
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

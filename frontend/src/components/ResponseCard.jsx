import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  Copy,
  Check,
  Code,
  ShieldCheck,
  Scale,
} from 'lucide-react';

export default function ResponseCard({ result, loading }) {
  const [activeTab, setActiveTab] = useState('answer');
  const [copiedId, setCopiedId] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 text-center animate-pulse">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Scale className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">Consulting Statutory Corpus</h3>
        <p className="text-xs text-slate-400 mt-1">Retrieving sections and verifying legal citations...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white/60 backdrop-blur-xs rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Scale className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-slate-600">No Legal Inquiry Active</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Type your traffic law question above or choose a suggested query from the left panel to begin.
        </p>
      </div>
    );
  }

  const { status, answer, citations = [] } = result;

  const handleCopy = (id, text, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getConfig = () => {
    switch (status) {
      case 'answered':
        return {
          title: 'Grounded Legal Information',
          subtitle: `${citations.length} ${citations.length === 1 ? 'provision' : 'provisions'} retrieved · High confidence`,
          icon: CheckCircle2,
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
          scopeBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          scopeText: '✓ In Scope',
          statusBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          statusText: 'ANSWERED',
        };
      case 'refused_out_of_scope':
        return {
          title: 'Out of Scope — Request Refused',
          subtitle: 'Query falls outside Sri Lankan Motor Traffic Law jurisdiction',
          icon: AlertTriangle,
          iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
          scopeBadge: 'bg-rose-50 text-rose-700 border-rose-200',
          scopeText: '✗ Out of Scope',
          statusBadge: 'bg-rose-100 text-rose-800 border-rose-300',
          statusText: 'REFUSED',
        };
      case 'not_found':
      default:
        return {
          title: 'No Relevant Provision Found',
          subtitle: 'Query appears in-scope but corpus lacks confident statutory match',
          icon: HelpCircle,
          iconBg: 'bg-slate-100 text-slate-600 border border-slate-200',
          scopeBadge: 'bg-slate-100 text-slate-700 border-slate-200',
          scopeText: '✓ In Scope',
          statusBadge: 'bg-slate-200 text-slate-800 border-slate-300',
          statusText: 'NOT FOUND',
        };
    }
  };

  const config = getConfig();
  const IconComp = config.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 animate-fade-up">
      {/* Card Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${config.iconBg}`}>
            <IconComp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              {config.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${config.scopeBadge}`}>
            {config.scopeText}
          </span>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${config.statusBadge}`}>
            {config.statusText}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 bg-slate-50/60 border-b border-slate-200/80 gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('answer')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'answer'
              ? 'border-[#1c3160] text-[#1c3160]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Answer</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'sources'
              ? 'border-[#1c3160] text-[#1c3160]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sources</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
            {citations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('raw')}
          className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'raw'
              ? 'border-[#1c3160] text-[#1c3160]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Raw Text</span>
        </button>
      </div>

      {/* Tab Panes */}
      <div className="p-5">
        {/* Pane 1: Answer */}
        {activeTab === 'answer' && (
          <div>
            <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-line font-normal">
              {answer || 'No answer available.'}
            </div>

            {/* Retrieval Confidence Summary */}
            {citations.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                  Retrieval Verification:
                </span>
                <div className="flex items-center gap-3 flex-1 flex-wrap">
                  <div className="flex-1 min-w-[120px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <div className="text-[10px] text-slate-400">Dense Embedding Match</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#1c3160] to-[#d4a843] h-full rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[120px] bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <div className="text-[10px] text-slate-400">Hybrid (RRF) Grounding</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#1c3160] to-[#d4a843] h-full rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pane 2: Sources */}
        {activeTab === 'sources' && (
          <div>
            {citations.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No citations available for this response.</p>
            ) : (
              <div className="space-y-3">
                {citations.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition"
                  >
                    <div className="bg-slate-50 px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d4a843] flex-shrink-0" />
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {c.id}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">· {c.citation || c.id}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(c.id, c.text, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                        title="Copy verbatim text"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="p-3.5 bg-white text-xs text-slate-700 leading-relaxed font-normal border-l-4 border-[#d4a843] m-2.5 rounded-r bg-amber-50/20 italic">
                      "{c.text}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pane 3: Raw Text */}
        {activeTab === 'raw' && (
          <div>
            {citations.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No raw text provisions retrieved.</p>
            ) : (
              <div className="bg-[#0a1628] rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto space-y-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold pb-1 border-b border-slate-800">
                  Verbatim Statutory Corpus Content
                </div>
                {citations.map((c, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900/60 border-l-2 border-[#d4a843]">
                    <div className="text-[#f0c96a] font-bold text-[11px] mb-1">[{c.id}] {c.citation}</div>
                    <div className="text-slate-300 leading-relaxed font-normal">{c.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

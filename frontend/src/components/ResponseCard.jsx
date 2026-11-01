import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, FileText } from 'lucide-react';

export default function ResponseCard({ result }) {
  if (!result) return null;

  const { status, answer, citations } = result;

  const getStatusConfig = () => {
    switch (status) {
      case 'answered':
        return {
          title: 'Grounded Legal Information',
          subtitle: 'Derived strictly from verified statutory text',
          icon: CheckCircle2,
          containerClass: 'border-emerald-200 bg-emerald-50/40',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          titleColor: 'text-emerald-950',
        };
      case 'refused_out_of_scope':
        return {
          title: 'Out of Scope — Refusal',
          subtitle: 'Only Sri Lankan Motor Traffic Law is supported',
          icon: AlertTriangle,
          containerClass: 'border-amber-200 bg-amber-50/50',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          titleColor: 'text-amber-950',
        };
      case 'not_found':
      default:
        return {
          title: 'No Relevant Provision Found',
          subtitle: 'Corpus does not contain a confident match for this question',
          icon: HelpCircle,
          containerClass: 'border-slate-200 bg-slate-50',
          badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
          titleColor: 'text-slate-900',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  return (
    <div className={`rounded-xl border p-6 mb-6 shadow-sm transition ${config.containerClass}`}>
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 mb-4 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-white shadow-sm border border-slate-200/60">
            <IconComponent className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${config.titleColor}`}>
              {config.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {citations && citations.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white font-semibold text-slate-700 border border-slate-200 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              {citations.length} {citations.length === 1 ? 'Citation' : 'Citations'}
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${config.badgeClass} uppercase tracking-wider`}>
            {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-line font-normal">
        {answer || 'No answer text provided.'}
      </div>
    </div>
  );
}


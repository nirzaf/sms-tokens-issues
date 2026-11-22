import { ArrowRight } from 'lucide-react';
import type { AuditReportSummary, IssueCategory } from '../types/sms';

interface ExecutiveSummaryProps {
  summary: AuditReportSummary;
  snapshotDate: string;
  activeCategory: IssueCategory | 'ALL';
  onFilterByCategory: (category: IssueCategory | 'ALL') => void;
  onJumpToMatrix: () => void;
}

export function ExecutiveSummary({
  summary,
  snapshotDate,
  activeCategory,
  onFilterByCategory,
  onJumpToMatrix,
}: ExecutiveSummaryProps) {
  const formattedDate = snapshotDate.split('T')[0] || snapshotDate;

  return (
    <section id="summary" className="scroll-mt-28 pt-8 pb-6">
      <div className="max-w-3xl">
        <p className="text-xs font-medium text-slate-500 mb-2">
          <span>PHCC Dataverse SMS Templates</span>
          <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
          <span className="tabular-nums">Snapshot {formattedDate}</span>
          <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
          <span className="tabular-nums">
            {summary.totalTemplates} verbatim templates across {summary.totalModes} consultation modes
          </span>
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 text-balance">
          English & Arabic SMS Token Consistency Audit
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600">
          Every English and Arabic appointment template compared side by side—verbatim from Dataverse.
          Click any metric card, defect row, yellow placeholder token, or matrix badge to trace issues
          directly to the exact source message.
        </p>
      </div>

      {/* Clickable KPI Cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => onFilterByCategory('ALL')}
          className={`text-left p-4 rounded-lg border transition-colors cursor-pointer group ${
            activeCategory === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-900 border-slate-200 hover:border-slate-400'
          }`}
        >
          <div
            className={`text-xs font-medium ${
              activeCategory === 'ALL' ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            Audited Scope
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold tabular-nums">
              {summary.totalTemplates}
            </span>
            <span
              className={`text-xs ${
                activeCategory === 'ALL' ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              templates
            </span>
          </div>
          <div
            className={`mt-2 text-xs flex items-center justify-between ${
              activeCategory === 'ALL' ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            <span className="tabular-nums">
              {summary.inconsistentPairs}/{summary.totalPairSlots} pairs flagged
            </span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onFilterByCategory('typo_malformed')}
          className={`text-left p-4 rounded-lg border transition-colors cursor-pointer group ${
            activeCategory === 'typo_malformed'
              ? 'bg-red-50 border-red-500 ring-1 ring-red-500'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="text-xs font-medium text-red-700">Typo / Broken</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {summary.pairsByCategory.typo_malformed}
            </span>
            <span className="text-xs text-slate-500">pairs</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>#PA#, NMAE, quotes</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-600 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onFilterByCategory('swapped_missing')}
          className={`text-left p-4 rounded-lg border transition-colors cursor-pointer group ${
            activeCategory === 'swapped_missing'
              ? 'bg-rose-50 border-rose-500 ring-1 ring-rose-500'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="text-xs font-medium text-rose-700">Swapped / Truncated</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {summary.pairsByCategory.swapped_missing}
            </span>
            <span className="text-xs text-slate-500">pairs</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Swaps, cuts, missing</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-600 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onFilterByCategory('en_ar_mismatch')}
          className={`text-left p-4 rounded-lg border transition-colors cursor-pointer group ${
            activeCategory === 'en_ar_mismatch'
              ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500'
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="text-xs font-medium text-orange-700">EN/AR Mismatches</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {summary.pairsByCategory.en_ar_mismatch}
            </span>
            <span className="text-xs text-slate-500">pairs</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Different EN vs AR</span>
            <ArrowRight className="w-3.5 h-3.5 text-orange-600 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => onFilterByCategory('casing_drift')}
          className={`text-left p-4 rounded-lg border transition-colors cursor-pointer group ${
            activeCategory === 'casing_drift'
              ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="text-xs font-medium text-blue-700">Casing Drift</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {summary.pairsByCategory.casing_drift}
            </span>
            <span className="text-xs text-slate-500">pairs</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>#PName# vs #PNAME#</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
        </button>

        <button
          type="button"
          onClick={onJumpToMatrix}
          className="text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-400 transition-colors cursor-pointer group"
        >
          <div className="text-xs font-medium text-slate-600">Token Variants</div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold text-slate-950 tabular-nums">
              {summary.uniqueTokenVariants}
            </span>
            <span className="text-xs text-slate-500">distinct</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span className="tabular-nums">{summary.totalTokenOccurrences} total uses</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 opacity-70 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </div>
        </button>
      </div>

      {/* Visual Legend for Yellow Token Highlighting + Layered Severity Cues */}
      <div
        aria-label="Token highlight legend"
        className="mt-4 px-4 py-3 bg-white border border-slate-200 rounded-lg flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-700"
      >
        <span className="font-semibold text-slate-900">Token Legend:</span>

        <span className="inline-flex items-center gap-2">
          <mark className="sms-token pointer-events-none">#PMAP#</mark>
          <span>Consistent token</span>
        </span>

        <span className="inline-flex items-center gap-2">
          <mark className="sms-token sms-token--critical pointer-events-none">#PA#</mark>
          <span>Typo, broken, swapped, or misplaced</span>
        </span>

        <span className="inline-flex items-center gap-2">
          <mark className="sms-token sms-token--mismatch pointer-events-none">#PFacility#</mark>
          <span>EN/AR token name mismatch</span>
        </span>

        <span className="inline-flex items-center gap-2">
          <mark className="sms-token sms-token--casing pointer-events-none">#PName#</mark>
          <span>Casing drift</span>
        </span>

        <span className="inline-flex items-center gap-2">
          <mark className="sms-token sms-token--drift pointer-events-none">#FACILITY_E#</mark>
          <span>Within-mode schema drift</span>
        </span>
      </div>
    </section>
  );
}

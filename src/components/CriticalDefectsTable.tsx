import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { CriticalDefectItem, TemplateLanguage } from '../types/sms';

interface CriticalDefectsTableProps {
  defects: CriticalDefectItem[];
  onJumpToSource: (
    pairId: string,
    token: string | null,
    language: TemplateLanguage | 'Both',
    originLabel: string
  ) => void;
}

const DEFECT_BADGE_STYLES: Record<CriticalDefectItem['defectType'], string> = {
  'Typo / Broken': 'bg-red-50 text-red-800 border-red-200',
  'Swapped / Misplaced': 'bg-rose-50 text-rose-800 border-rose-200',
  'Truncated / Missing': 'bg-amber-50 text-amber-900 border-amber-300',
  'Schema Drift': 'bg-violet-50 text-violet-800 border-violet-200',
};

export function CriticalDefectsTable({
  defects,
  onJumpToSource,
}: CriticalDefectsTableProps) {
  return (
    <section id="critical-defects" className="scroll-mt-28 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-slate-950">
            Top Critical Defects at a Glance
          </h2>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            · {defects.length} high-impact findings verified from source
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Click any row to scroll directly to the verbatim source SMS and highlight the defect.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <th className="py-2.5 px-4 whitespace-nowrap">Template</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                <th className="py-2.5 px-3">Defect Summary</th>
                <th className="py-2.5 px-3">Why It Matters</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {defects.map((defect) => (
                <tr
                  key={defect.id}
                  className="hover:bg-amber-50/40 transition-colors"
                >
                  <td className="py-2.5 px-4 align-top whitespace-nowrap">
                    <div className="font-mono text-xs font-semibold text-slate-900">
                      {defect.mode} · {defect.smsType}
                    </div>
                    <div className="text-xs text-slate-500">{defect.language}</div>
                  </td>
                  <td className="py-2.5 px-3 align-top whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-semibold rounded border ${DEFECT_BADGE_STYLES[defect.defectType]}`}
                    >
                      {defect.defectType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <div className="text-[13px] font-semibold text-slate-900 leading-snug">
                      {defect.summary}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <div className="text-xs text-slate-600 leading-relaxed max-w-md">
                      {defect.impact}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 align-top text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() =>
                        onJumpToSource(
                          defect.pairId,
                          defect.token,
                          defect.language,
                          'Top Critical Defects'
                        )
                      }
                      aria-label={`View source message for ${defect.pairId} ${defect.summary}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-900 hover:text-white rounded transition-colors cursor-pointer whitespace-nowrap"
                    >
                      View Source Message
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

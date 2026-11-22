import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { CriticalDefectItem } from '../types/sms';
import { evidenceAnchor, type JumpToSource } from '../utils/sourceNavigation';

interface CriticalDefectsTableProps {
  defects: CriticalDefectItem[];
  onJumpToSource: JumpToSource;
}

const DEFECT_BADGE_STYLES: Record<CriticalDefectItem['defectType'], string> = {
  'Typo / Broken': 'bg-red-50 text-red-800 border-red-200',
  'Swapped / Misplaced': 'bg-rose-50 text-rose-800 border-rose-200',
  'Truncated / Missing': 'bg-amber-50 text-amber-900 border-amber-300',
  'Schema Drift': 'bg-violet-50 text-violet-800 border-violet-200',
  'Content difference': 'bg-orange-50 text-orange-800 border-orange-200',
  Formatting: 'bg-slate-100 text-slate-800 border-slate-200',
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
            · {defects.length} critical findings in this snapshot; delivery impact not verified
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Open a finding or a source link to view the evidence, then return to this table.
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
                    <button type="button" id={evidenceAnchor('finding', defect.id)}
                      onClick={(event) => onJumpToSource(defect.pairId, defect.token, defect.language,
                        'Critical Findings', event.currentTarget.id)}
                      className="text-left text-[13px] font-semibold text-slate-900 leading-snug underline">
                      {defect.summary}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 align-top">
                    <div className="text-xs text-slate-600 leading-relaxed max-w-md">
                      {defect.impact}
                    </div>
                  </td>
                  <td className="py-2.5 px-4 align-top text-right whitespace-nowrap">
                    {(defect.evidence ?? [{ pairId: defect.pairId, language: defect.language }])
                      .map((source, index) => {
                        const anchor = evidenceAnchor('finding-source', defect.id, index);
                        return (
                          <button key={anchor} id={anchor} type="button"
                            onClick={() => onJumpToSource(source.pairId,
                              source.pairId === defect.pairId ? defect.token : null,
                              source.language, 'Critical Findings', anchor)}
                            className="m-0.5 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 rounded hover:bg-slate-200">
                            {source.pairId} · {source.language === 'Both' ? 'Compare sources' : source.language}
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        );
                      })}
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

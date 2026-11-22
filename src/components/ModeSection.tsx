import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import type {
  ModeAnalysis,
  SemanticFieldId,
  TemplateLanguage,
  TemplatePairAnalysis,
} from '../types/sms';
import { TemplatePairCard } from './TemplatePairCard';

interface ModeSectionProps {
  mode: ModeAnalysis;
  visiblePairs: TemplatePairAnalysis[];
  isExpanded: boolean;
  flashedPairId: string | null;
  pairSelections: Record<
    string,
    {
      fieldId: SemanticFieldId | null;
      token: string | null;
      language: TemplateLanguage | null;
    }
  >;
  onToggleExpand: () => void;
  onSelectToken: (
    pairId: string,
    token: string,
    fieldId: SemanticFieldId,
    language: TemplateLanguage | null
  ) => void;
  onClearSelection: (pairId: string) => void;
  onFilterByExactToken: (token: string) => void;
  onJumpToTokenMatrix: (fieldId: SemanticFieldId, token: string) => void;
}

export function ModeSection({
  mode,
  visiblePairs,
  isExpanded,
  flashedPairId,
  pairSelections,
  onToggleExpand,
  onSelectToken,
  onClearSelection,
  onFilterByExactToken,
  onJumpToTokenMatrix,
}: ModeSectionProps) {
  if (visiblePairs.length === 0) return null;

  return (
    <section
      id={`mode-${mode.code}`}
      className="scroll-mt-32 border border-slate-200 rounded-lg bg-slate-50/50 overflow-hidden"
    >
      {/* Collapsible Mode Header */}
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        className="w-full px-4 sm:px-5 py-3.5 bg-white hover:bg-slate-50/80 transition-colors flex flex-wrap items-center justify-between gap-3 text-left cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
          )}
          <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-900 text-white shrink-0">
            {mode.code}
          </span>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-slate-950 leading-snug">
              {mode.name}
            </h3>
            <p className="text-xs text-slate-500 truncate">{mode.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 tabular-nums shrink-0">
          <span>{mode.templateCount} templates</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span
            className={
              mode.inconsistentPairCount > 0
                ? 'font-semibold text-orange-700'
                : 'font-semibold text-emerald-700'
            }
          >
            {mode.inconsistentPairCount}/{mode.pairs.length} pairs flagged
          </span>
          {mode.criticalCount > 0 && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="font-semibold text-red-700">
                {mode.criticalCount} critical
              </span>
            </>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4 border-t border-slate-200">
          {/* Within-Mode Schema Drift Summary */}
          {mode.schemaDriftNotes.length > 0 && (
            <div className="px-4 py-3 rounded-md bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Info className="w-3.5 h-3.5 text-violet-600 shrink-0" aria-hidden="true" />
                <span>Within-Mode Schema Summary ({mode.code})</span>
              </div>
              <ul className="space-y-1 pl-5 list-disc text-slate-600">
                {mode.schemaDriftNotes.map((note, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pair Comparison Cards */}
          <div className="space-y-4">
            {visiblePairs.map((pair) => (
              <TemplatePairCard
                key={pair.pairId}
                pair={pair}
                isFlashed={flashedPairId === pair.pairId}
                externalSelection={pairSelections[pair.pairId] ?? null}
                onSelectToken={onSelectToken}
                onClearSelection={onClearSelection}
                onFilterByExactToken={onFilterByExactToken}
                onJumpToTokenMatrix={onJumpToTokenMatrix}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

import { ArrowUpRight, Filter, X } from 'lucide-react';
import type {
  SemanticFieldId,
  TemplateLanguage,
  TokenMatrixFieldGroup,
  TokenVisualSeverity,
} from '../types/sms';

interface GlobalTokenMatrixProps {
  groups: TokenMatrixFieldGroup[];
  selectedMatrixToken: {
    fieldId: SemanticFieldId;
    token: string;
  } | null;
  onSelectMatrixToken: (
    selection: { fieldId: SemanticFieldId; token: string } | null
  ) => void;
  onJumpToSource: (
    pairId: string,
    token: string,
    language: TemplateLanguage,
    originLabel: string
  ) => void;
  onFilterByExactToken: (token: string) => void;
}

const SEVERITY_CLASS: Record<TokenVisualSeverity, string> = {
  consistent: '',
  drift: 'sms-token--drift',
  casing: 'sms-token--casing',
  mismatch: 'sms-token--mismatch',
  critical: 'sms-token--critical',
};

export function GlobalTokenMatrix({
  groups,
  selectedMatrixToken,
  onSelectMatrixToken,
  onJumpToSource,
  onFilterByExactToken,
}: GlobalTokenMatrixProps) {
  const totalVariants = groups.reduce((s, g) => s + g.variantCount, 0);
  const totalUses = groups.reduce((s, g) => s + g.totalOccurrences, 0);

  return (
    <section id="token-matrix" className="scroll-mt-28 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-950">
            Global Token Fragmentation Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {totalVariants} distinct token spellings across {groups.length} semantic fields ({totalUses} total token occurrences). Click any token badge to inspect every source message using it.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
        {groups.map((group) => {
          const activeVariant =
            selectedMatrixToken?.fieldId === group.fieldId
              ? group.variants.find((v) => v.token === selectedMatrixToken.token) ??
                null
              : null;

          return (
            <div
              key={group.fieldId}
              id={`matrix-field-${group.fieldId}`}
              className="scroll-mt-32 p-4 sm:px-5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                {/* Field Label & Fragmentation Summary */}
                <div className="lg:col-span-3">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-display text-sm font-bold text-slate-950">
                      {group.fieldLabel}
                    </h3>
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        group.variantCount > 2
                          ? 'text-orange-700'
                          : group.variantCount === 1
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                      }`}
                    >
                      {group.variantCount}{' '}
                      {group.variantCount === 1 ? 'variant' : 'variants'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {group.meaning}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                    {group.totalOccurrences} uses across templates
                  </p>
                </div>

                {/* Clickable Token Variant Badges */}
                <div className="lg:col-span-9 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {group.variants.map((variant) => {
                      const isSelected = activeVariant?.token === variant.token;
                      return (
                        <button
                          key={variant.token}
                          type="button"
                          onClick={() =>
                            onSelectMatrixToken(
                              isSelected
                                ? null
                                : { fieldId: group.fieldId, token: variant.token }
                            )
                          }
                          aria-expanded={isSelected}
                          aria-label={`Inspect ${variant.token} used ${variant.count} ${variant.count === 1 ? 'time' : 'times'} in ${group.fieldLabel}`}
                          className={`sms-token ${SEVERITY_CLASS[variant.severity]} ${
                            isSelected ? 'sms-token--active' : ''
                          } gap-1.5`}
                        >
                          <span>{variant.token}</span>
                          <span className="text-[11px] font-sans font-bold text-slate-700 tabular-nums">
                            ({variant.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Expanded Source Links Tray for Clicked Token */}
                  {activeVariant && (
                    <div
                      role="region"
                      aria-label={`Source templates containing ${activeVariant.token}`}
                      className="p-3.5 rounded-md bg-slate-50 border border-slate-300 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-slate-950">
                              {activeVariant.token}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-700 tabular-nums">
                              {activeVariant.count}{' '}
                              {activeVariant.count === 1
                                ? 'occurrence'
                                : 'occurrences'}{' '}
                              ({activeVariant.enCount} EN, {activeVariant.arCount}{' '}
                              AR)
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {activeVariant.note}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              onFilterByExactToken(activeVariant.token)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
                            Filter all {activeVariant.count} in Comparisons
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectMatrixToken(null)}
                            aria-label={`Close source links for ${activeVariant.token}`}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {activeVariant.occurrences.map((occ, idx) => (
                          <button
                            key={`${occ.pairId}-${occ.language}-${idx}`}
                            type="button"
                            onClick={() =>
                              onJumpToSource(
                                occ.pairId,
                                occ.token,
                                occ.language,
                                `Token Matrix (${activeVariant.token})`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 hover:border-slate-900 hover:text-slate-950 text-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <span className="font-mono font-semibold">
                              {occ.mode}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span>{occ.smsType}</span>
                            <span className="text-slate-500">
                              ({occ.language === 'English' ? 'EN' : 'AR'})
                            </span>
                            <ArrowUpRight
                              className="w-3 h-3 text-slate-400"
                              aria-hidden="true"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

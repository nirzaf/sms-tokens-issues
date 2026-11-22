import { useState } from 'react';
import {
  AlertCircle,
  Filter,
  Grid2x2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  PairStatusBadge,
  SemanticFieldId,
  TemplateLanguage,
  TemplatePairAnalysis,
  TokenVisualSeverity,
} from '../types/sms';
import { FIELD_MAP } from '../utils/analyzer';
import { VerbatimTemplateBody } from './VerbatimTemplateBody';
import { evidenceAnchor, type JumpToSource } from '../utils/sourceNavigation';

interface TemplatePairCardProps {
  pair: TemplatePairAnalysis;
  isFlashed: boolean;
  externalSelection: {
    fieldId: SemanticFieldId | null;
    token: string | null;
    language: TemplateLanguage | null;
  } | null;
  onSelectToken: (
    pairId: string,
    token: string,
    fieldId: SemanticFieldId,
    language: TemplateLanguage | null
  ) => void;
  onClearSelection: (pairId: string) => void;
  onFilterByExactToken: (token: string) => void;
  onJumpToTokenMatrix: (fieldId: SemanticFieldId, token: string, originId?: string) => void;
  onJumpToSource: JumpToSource;
}

const STATUS_STYLES: Record<PairStatusBadge, string> = {
  'Source text differs': 'bg-orange-50 text-orange-800 border-orange-200',
  'Formatting difference': 'bg-slate-100 text-slate-800 border-slate-200',
  Consistent: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'EN/AR Mismatch': 'bg-orange-50 text-orange-800 border-orange-200',
  'Casing Drift': 'bg-blue-50 text-blue-800 border-blue-200',
  'Schema Drift': 'bg-violet-50 text-violet-800 border-violet-200',
  'Typo / Broken': 'bg-red-50 text-red-800 border-red-200',
  'Swapped / Misplaced': 'bg-rose-50 text-rose-800 border-rose-200',
  'Truncated / Missing': 'bg-amber-50 text-amber-900 border-amber-300',
};

const ROW_STATUS_TEXT: Record<TokenVisualSeverity, string> = {
  consistent: 'text-emerald-700',
  drift: 'text-violet-700',
  casing: 'text-blue-700',
  mismatch: 'text-orange-700',
  critical: 'text-red-700 font-semibold',
};

const MINI_TOKEN_SEVERITY: Record<TokenVisualSeverity, string> = {
  consistent: '',
  drift: 'sms-token--drift',
  casing: 'sms-token--casing',
  mismatch: 'sms-token--mismatch',
  critical: 'sms-token--critical',
};

export function TemplatePairCard({
  pair,
  isFlashed,
  externalSelection,
  onSelectToken,
  onClearSelection,
  onFilterByExactToken,
  onJumpToTokenMatrix,
  onJumpToSource,
}: TemplatePairCardProps) {
  const [tableOpen, setTableOpen] = useState(true);

  const selectedFieldId = externalSelection?.fieldId ?? null;
  const selectedToken = externalSelection?.token ?? null;
  const selectedLanguage = externalSelection?.language ?? null;

  const selectedRow =
    selectedFieldId !== null
      ? pair.fieldRows.find((r) => r.fieldId === selectedFieldId) ?? null
      : null;

  const activeTokenValue =
    selectedToken ?? selectedRow?.enToken ?? selectedRow?.arToken ?? null;

  const activeFieldDef = selectedFieldId ? FIELD_MAP[selectedFieldId] : null;

  // Determine structural callouts (swapped, misplaced, truncated, stray quote, concatenated, missing)
  const structuralAlerts = pair.issues.filter(
    (issue) =>
      issue.category === 'swapped_missing' ||
      issue.category === 'typo_malformed' ||
      issue.category === 'schema_drift' ||
      issue.category === 'content_difference' ||
      issue.category === 'formatting'
  );

  return (
    <article
      id={`pair-${pair.pairId}`}
      tabIndex={-1}
      data-testid={`pair-card-${pair.pairId}`}
      className={`scroll-mt-32 bg-white border border-slate-200 rounded-lg overflow-hidden transition-shadow ${
        isFlashed ? 'card-flash-target' : ''
      }`}
    >
      {/* Pair Header */}
      <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3 className="font-display text-sm sm:text-[15px] font-bold text-slate-950 whitespace-nowrap">
            {pair.mode} · {pair.smsType}
          </h3>
          {!pair.isMissingPair && (
            <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
              {pair.en?.tokens.length ?? 0} EN / {pair.ar?.tokens.length ?? 0} AR tokens
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {pair.tokenSetsMatch && (
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded border border-slate-300">
              Exact token sets match
            </span>
          )}
          {pair.statuses.map((st) => (
            <span
              key={st}
              className={`px-2 py-0.5 text-[11px] font-semibold rounded border whitespace-nowrap ${STATUS_STYLES[st]}`}
            >
              {st}
            </span>
          ))}
        </div>
      </div>

      {/* Missing Pair Explicit Banner */}
      {pair.isMissingPair ? (
        <div className="p-5 bg-amber-50/40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-md border border-dashed border-amber-300 bg-white">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                English · {pair.mode} {pair.smsType}
              </div>
              <p className="text-sm font-semibold text-amber-900">
                Not in supplied snapshot
              </p>
              <p className="text-xs text-slate-600 mt-1">
                The supplied snapshot contains no English {pair.smsType.toLowerCase()} template for mode {pair.mode}.
              </p>
            </div>
            <div className="p-4 rounded-md border border-dashed border-amber-300 bg-white">
              <div className="text-xs font-semibold text-slate-500 mb-1">
                Arabic · {pair.mode} {pair.smsType}
              </div>
              <p className="text-sm font-semibold text-amber-900">
                Not in supplied snapshot
              </p>
              <p className="text-xs text-slate-600 mt-1">
                The supplied snapshot contains no Arabic {pair.smsType.toLowerCase()} template for mode {pair.mode}. Whether live coverage is required or available is not verified.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Side-by-Side Verbatim Messages: English (LTR) vs Arabic (RTL) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* English Column */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-semibold text-slate-700">
                  English
                </span>
                <span className="text-[11px] text-slate-400">
                  Verbatim · LTR
                </span>
              </div>
              {pair.en ? (
                <>
                  <VerbatimTemplateBody
                  body={pair.en.body}
                  sourceTemplateKey={pair.en.key}
                  language="English"
                  tokenMap={pair.enTokenMap}
                  selectedFieldId={selectedFieldId}
                  selectedToken={selectedToken}
                  selectedLanguage={selectedLanguage}
                  onTokenClick={(tok, fid, lang) =>
                    onSelectToken(pair.pairId, tok, fid, lang)
                  }
                  />
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer underline">Show exact English source text</summary>
                    <pre lang="en" dir="ltr"
                      className="mt-1 whitespace-pre-wrap break-words rounded border p-2">{pair.en.body}</pre>
                  </details>
                </>
              ) : (
                <p className="text-xs text-red-700 font-medium">
                  English template missing for this slot.
                </p>
              )}
            </div>

            {/* Arabic Column */}
            <div className="p-4 sm:p-5 bg-slate-50/30">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-semibold text-slate-700">
                  Arabic
                </span>
                <span className="text-[11px] text-slate-400">
                  Verbatim · RTL
                </span>
              </div>
              {pair.ar ? (
                <>
                  <VerbatimTemplateBody
                  body={pair.ar.body}
                  sourceTemplateKey={pair.ar.key}
                  language="Arabic"
                  tokenMap={pair.arTokenMap}
                  selectedFieldId={selectedFieldId}
                  selectedToken={selectedToken}
                  selectedLanguage={selectedLanguage}
                  onTokenClick={(tok, fid, lang) =>
                    onSelectToken(pair.pairId, tok, fid, lang)
                  }
                  />
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer underline">Show exact Arabic source text</summary>
                    <pre lang="ar" dir="rtl"
                      className="mt-1 whitespace-pre-wrap break-words rounded border p-2">{pair.ar.body}</pre>
                  </details>
                </>
              ) : (
                <p className="text-xs text-red-700 font-medium">
                  Arabic template missing for this slot.
                </p>
              )}
            </div>
          </div>

          {/* Inline Two-Way Token Inspector Bar (Opens on Token or Row Click) */}
          {selectedRow && activeFieldDef && (
            <div
              role="region"
              aria-label={`Token details for ${activeFieldDef.label}`}
              className="mx-4 sm:mx-5 mb-3 p-3.5 rounded-md bg-amber-50/70 border border-amber-300 text-xs text-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-slate-950 text-[13px]">
                      {activeFieldDef.label}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-600">{activeFieldDef.meaning}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">EN:</span>
                      {selectedRow.enToken ? (
                        <mark
                          className={`sms-token pointer-events-none ${
                            MINI_TOKEN_SEVERITY[
                              pair.enTokenMap[selectedRow.enToken]?.severity ?? 'consistent'
                            ]
                          }`}
                        >
                          {selectedRow.enToken}
                        </mark>
                      ) : (
                        <span className="text-red-700 font-semibold">Missing</span>
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">AR:</span>
                      {selectedRow.arToken ? (
                        <mark
                          className={`sms-token pointer-events-none ${
                            MINI_TOKEN_SEVERITY[
                              pair.arTokenMap[selectedRow.arToken]?.severity ?? 'consistent'
                            ]
                          }`}
                        >
                          {selectedRow.arToken}
                        </mark>
                      ) : (
                        <span className="text-red-700 font-semibold">Missing</span>
                      )}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed pt-0.5">
                    {selectedRow.explanation}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeTokenValue && (
                    <>
                      <button
                        type="button"
                        id={evidenceAnchor('template-matrix', pair.pairId, selectedRow.fieldId)}
                        onClick={(event) =>
                          onJumpToTokenMatrix(selectedRow.fieldId, activeTokenValue, event.currentTarget.id)
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Grid2x2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Jump to Token Matrix
                      </button>
                      <button
                        type="button"
                        onClick={() => onFilterByExactToken(activeTokenValue)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Filter className="w-3.5 h-3.5" aria-hidden="true" />
                        Filter all using {activeTokenValue}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onClearSelection(pair.pairId)}
                    aria-label="Close token details"
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Key Structural & Content Callouts (Plain-English Explanations) */}
          {structuralAlerts.length > 0 && (
            <div className="mx-4 sm:mx-5 mb-3 px-3.5 py-2.5 rounded-md bg-red-50/50 border border-red-200/80 space-y-1.5">
              {structuralAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-2 text-xs leading-relaxed text-slate-800"
                >
                  <AlertCircle
                    className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                      alert.severity === 'critical'
                        ? 'text-red-600'
                        : 'text-violet-600'
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold text-slate-950">
                      {alert.title}:
                    </span>{' '}
                    <span>{alert.explanation}</span>
                    {alert.interpretation && <p>Interpretation: {alert.interpretation}</p>}
                    {alert.runtimeStatus && <p>Runtime: {alert.runtimeStatus}</p>}
                    <div className="flex flex-wrap gap-2">
                      {(alert.evidence ?? [{ pairId: pair.pairId, language: alert.language }])
                        .map((source, index) => {
                          const anchor = evidenceAnchor('pair-alert', pair.pairId, alert.id, index);
                          return (
                            <button key={anchor} id={anchor} type="button"
                              onClick={() => onJumpToSource(source.pairId,
                                source.pairId === pair.pairId ? alert.token ?? null : null,
                                source.language, 'Finding explanation', anchor)}
                              className="underline underline-offset-2">
                              {source.pairId} · {source.language === 'Both' ? 'Compare sources' : source.language}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Compact Token Mapping & Plain-English Explanation Table */}
          <div className="border-t border-slate-200">
            <button
              type="button"
              onClick={() => setTableOpen((prev) => !prev)}
              aria-expanded={tableOpen}
              className="w-full px-4 sm:px-5 py-2 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>
                Token Mapping & Plain-English Explanation ({pair.fieldRows.length}{' '}
                fields) — choose a token or an evidence action
              </span>
              {tableOpen ? (
                <ChevronUp className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
            </button>

            {tableOpen && (
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                      <th className="py-2 px-4 whitespace-nowrap">Field</th>
                      <th className="py-2 px-3 whitespace-nowrap">English Token</th>
                      <th className="py-2 px-3 whitespace-nowrap">Arabic Token</th>
                      <th className="py-2 px-3 whitespace-nowrap">Status</th>
                      <th className="py-2 px-4">Plain-English Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pair.fieldRows.map((row) => {
                      const isRowSelected = selectedFieldId === row.fieldId;
                      const enSev = row.enToken
                        ? pair.enTokenMap[row.enToken]?.severity ?? row.severity
                        : 'critical';
                      const arSev = row.arToken
                        ? pair.arTokenMap[row.arToken]?.severity ?? row.severity
                        : 'critical';

                      return (
                        <tr
                          key={row.fieldId}
                          className={`transition-colors ${
                            isRowSelected
                              ? 'bg-amber-50/90'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-2 px-4 font-semibold text-slate-800 whitespace-nowrap align-top">
                            <button
                              type="button"
                              onClick={() =>
                                onSelectToken(
                                  pair.pairId,
                                  row.enToken ?? row.arToken ?? '',
                                  row.fieldId,
                                  null
                                )
                              }
                              className="text-left hover:underline cursor-pointer"
                            >
                              {row.fieldLabel}
                            </button>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap align-top">
                            {row.enToken ? (
                              <button
                                type="button"
                                id={evidenceAnchor('mapping-token-en', pair.pairId, row.fieldId)}
                                onClick={(event) => onJumpToSource(pair.pairId, row.enToken,
                                  'English', 'Token mapping', event.currentTarget.id)}
                                className={`sms-token ${MINI_TOKEN_SEVERITY[enSev]} ${
                                  isRowSelected &&
                                  (selectedLanguage === 'English' ||
                                    selectedLanguage === null)
                                    ? 'sms-token--active'
                                    : ''
                                }`}
                              >
                                {row.enToken}
                              </button>
                            ) : (
                              <span className="text-red-700 font-semibold">
                                — Missing
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap align-top">
                            {row.arToken ? (
                              <button
                                type="button"
                                id={evidenceAnchor('mapping-token-ar', pair.pairId, row.fieldId)}
                                onClick={(event) => onJumpToSource(pair.pairId, row.arToken,
                                  'Arabic', 'Token mapping', event.currentTarget.id)}
                                className={`sms-token ${MINI_TOKEN_SEVERITY[arSev]} ${
                                  isRowSelected &&
                                  (selectedLanguage === 'Arabic' ||
                                    selectedLanguage === null)
                                    ? 'sms-token--active'
                                    : ''
                                }`}
                              >
                                {row.arToken}
                              </button>
                            ) : (
                              <span className="text-red-700 font-semibold">
                                — Missing
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap align-top">
                            <span
                              className={`font-medium ${ROW_STATUS_TEXT[row.severity]}`}
                            >
                              {row.statusLabel}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-slate-600 leading-relaxed align-top">
                            {row.explanation}
                            <button type="button" id={evidenceAnchor('mapping-explanation', pair.pairId, row.fieldId)}
                              onClick={(event) => onJumpToSource(pair.pairId, row.enToken ?? row.arToken,
                                row.enToken ? 'English' : row.arToken ? 'Arabic' : 'Both',
                                'Mapping explanation', event.currentTarget.id)}
                              className="ml-2 underline underline-offset-2">
                              View evidence
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
}

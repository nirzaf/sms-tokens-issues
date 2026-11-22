import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CriticalDefectsTable } from './components/CriticalDefectsTable';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { FilterToolbar } from './components/FilterToolbar';
import { GlobalTokenMatrix } from './components/GlobalTokenMatrix';
import { ModeSection } from './components/ModeSection';
import { ReturnBar } from './components/ReturnBar';
import { StickyNav } from './components/StickyNav';
import type {
  ConsultationModeCode,
  FullAuditReport,
  IssueCategory,
  SemanticFieldId,
  SmsType,
  TemplateLanguage,
} from './types/sms';
import { analyzeTemplatesMarkdown, getTokenField } from './utils/analyzer';
import {
  DEFAULT_FILTERS,
  hasAnyActiveFilter,
  pairMatchesFilters,
  type PairFilterState,
} from './utils/filterPairs';
import { MODE_ORDER } from './utils/templateParser';
import {
  resolveSourceDestination,
  type JumpToSource,
  type PairSourceSelection,
} from './utils/sourceNavigation';

type PairSelections = Record<string, PairSourceSelection>;
type MatrixSelection = { fieldId: SemanticFieldId; token: string } | null;
type ViewSnapshot = {
  label: string;
  anchorId: string | null;
  scrollY: number;
  filters: PairFilterState;
  expandedModes: Record<ConsultationModeCode, boolean>;
  pairSelections: PairSelections;
  selectedMatrixToken: MatrixSelection;
};
type ScrollRequest = { anchorIds: string[]; fallbackY?: number; focus: boolean };

const DATASET_PATH = '/assets/aistudio/DATAVERSE_SMS_TEMPLATES_20261119_615c15d2.md';

function buildExpandedState(expanded: boolean): Record<ConsultationModeCode, boolean> {
  return MODE_ORDER.reduce(
    (acc, code) => {
      acc[code] = expanded;
      return acc;
    },
    {} as Record<ConsultationModeCode, boolean>
  );
}

export default function App() {
  const [report, setReport] = useState<FullAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PairFilterState>(DEFAULT_FILTERS);
  const [expandedModes, setExpandedModes] = useState<Record<ConsultationModeCode, boolean>>(
    () => buildExpandedState(true)
  );

  const [flashedPairId, setFlashedPairId] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const [pairSelections, setPairSelections] = useState<PairSelections>({});
  const [selectedMatrixToken, setSelectedMatrixToken] = useState<MatrixSelection>(null);
  const [returnPoints, setReturnPoints] = useState<ViewSnapshot[]>([]);
  const returnPoint = returnPoints.at(-1) ?? null;
  const [scrollRequest, setScrollRequest] = useState<ScrollRequest | null>(null);
  const [showBackToSummary, setShowBackToSummary] = useState(false);

  const loadDataset = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!DATASET_PATH) {
        throw new Error('No internal dataset is packaged in this build. Open the approved private report.');
      }
      const res = await fetch(DATASET_PATH);
      if (!res.ok) {
        throw new Error(`Failed to load templates (${res.status} ${res.statusText})`);
      }
      const markdown = await res.text();
      const analyzed = analyzeTemplatesMarkdown(markdown);
      setReport(analyzed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load Dataverse SMS templates.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDataset();
  }, [loadDataset]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShowBackToSummary(y > 380);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const triggerFlash = useCallback((pairId: string) => {
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    setFlashedPairId(pairId);
    flashTimerRef.current = window.setTimeout(() => {
      setFlashedPairId(null);
      flashTimerRef.current = null;
    }, 1800);
  }, []);

  const scrollToElementId = useCallback((id: string) => {
    setScrollRequest({ anchorIds: [id], focus: false });
  }, []);

  useEffect(() => {
    if (!scrollRequest) return;
    const frame = window.requestAnimationFrame(() => {
      const target = scrollRequest.anchorIds
        .map((id) => document.getElementById(id))
        .find((element) => element !== null);
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant' : 'smooth';
      if (target) {
        if (scrollRequest.focus) target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior, block: 'start' });
      } else if (scrollRequest.fallbackY !== undefined) {
        window.scrollTo({ top: scrollRequest.fallbackY, behavior });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [scrollRequest]);

  const rememberView = useCallback((label: string, anchorId?: string) => {
    const activeId = document.activeElement instanceof HTMLElement
      ? document.activeElement.id : '';
    setReturnPoints((points) => [...points, {
      label, anchorId: anchorId ?? (activeId || null), scrollY: window.scrollY,
      filters, expandedModes, pairSelections, selectedMatrixToken,
    }]);
  }, [filters, expandedModes, pairSelections, selectedMatrixToken]);

  const hasActiveFilters = useMemo(() => hasAnyActiveFilter(filters), [filters]);

  const filteredModes = useMemo(() => {
    if (!report) return [];
    return report.modes.map((mode) => ({
      mode,
      visiblePairs: mode.pairs.filter((p) => pairMatchesFilters(p, filters)),
    }));
  }, [report, filters]);

  const visiblePairsCount = useMemo(
    () => filteredModes.reduce((sum, item) => sum + item.visiblePairs.length, 0),
    [filteredModes]
  );

  const visibleTemplatesCount = useMemo(
    () =>
      filteredModes.reduce(
        (sum, item) =>
          sum +
          item.visiblePairs.reduce(
            (s, p) => s + (p.en ? 1 : 0) + (p.ar ? 1 : 0),
            0
          ),
        0
      ),
    [filteredModes]
  );

  const allExpanded = useMemo(
    () => MODE_ORDER.every((code) => expandedModes[code]),
    [expandedModes]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setExpandedModes(buildExpandedState(true));
  }, []);

  const handleToggleExpandAll = useCallback(() => {
    setExpandedModes(buildExpandedState(!allExpanded));
  }, [allExpanded]);

  const handleJumpToSection = useCallback(
    (sectionId: string) => {
      scrollToElementId(sectionId);
    },
    [scrollToElementId]
  );

  const handleJumpToMode = useCallback(
    (mode: ConsultationModeCode) => {
      if (!report) return;
      rememberView('Previous View');

      // Ensure zero dead links: if current filters hide all pairs of this mode, clear conflicting filters
      const targetMode = report.modes.find((m) => m.code === mode);
      const anyVisibleUnderCurrent = targetMode?.pairs.some((p) =>
        pairMatchesFilters(p, filters)
      );

      if (!anyVisibleUnderCurrent) {
        setFilters(DEFAULT_FILTERS);
      } else if (filters.modeFilter !== 'ALL' && filters.modeFilter !== mode) {
        setFilters((prev) => ({ ...prev, modeFilter: mode }));
      }

      setExpandedModes((prev) => ({ ...prev, [mode]: true }));
      scrollToElementId(`mode-${mode}`);
    },
    [report, filters, rememberView, scrollToElementId]
  );

  const handleFilterByCategoryFromSummary = useCallback(
    (category: IssueCategory | 'ALL') => {
      rememberView('Executive Summary');
      setFilters((prev) => ({
        ...DEFAULT_FILTERS,
        categoryFilter: prev.categoryFilter === category && category !== 'ALL' ? 'ALL' : category,
      }));
      setExpandedModes(buildExpandedState(true));
      scrollToElementId('comparisons');
    },
    [rememberView, scrollToElementId]
  );

  const handleJumpToSource = useCallback<JumpToSource>(
    (pairId, token, language, originLabel, originId, occurrenceIndex) => {
      if (!report) return;
      const targetPair = report.allPairs.find((p) => p.pairId === pairId);
      if (!targetPair) return;

      rememberView(originLabel, originId);

      // Automatically clear filters if target pair would be hidden
      if (!pairMatchesFilters(targetPair, filters)) {
        setFilters(DEFAULT_FILTERS);
      }

      setExpandedModes((prev) => ({ ...prev, [targetPair.mode]: true }));

      const destination = resolveSourceDestination(targetPair, language, token, occurrenceIndex);
      const resolvedLang: TemplateLanguage | null = language === 'Both' ? null : language;
      // Do not highlight a non-occurrence or carry a stale selection into a source jump.
      setPairSelections((prev) => {
        const next = { ...prev };
        delete next[pairId];
        if (destination.kind === 'counterpart-missing' || destination.kind === 'occurrence-unavailable') {
          next[pairId] = { fieldId: null, token: null, language: resolvedLang, sourceNotice: destination.kind };
        } else if (token && (destination.kind === 'token' || (language === 'Both' && !targetPair.isMissingPair))) {
          let fieldId: SemanticFieldId | null = null;
          try {
            fieldId = getTokenField(token);
          } catch {
            fieldId = null;
          }
          next[pairId] = {
            fieldId, token, language: resolvedLang,
            sourceSegmentIndex: destination.kind === 'token' ? destination.segmentIndex : undefined,
          };
        }
        return next;
      });
      setScrollRequest({ anchorIds: destination.anchorIds, focus: true });
      triggerFlash(pairId);
    },
    [report, filters, rememberView, triggerFlash]
  );

  const handleSelectTokenInPair = useCallback(
    (
      pairId: string,
      token: string,
      fieldId: SemanticFieldId,
      language: TemplateLanguage | null
    ) => {
      setPairSelections((prev) => {
        const current = prev[pairId];
        if (
          current &&
          current.fieldId === fieldId &&
          current.token === token &&
          current.language === language
        ) {
          const next = { ...prev };
          delete next[pairId];
          return next;
        }
        return {
          ...prev,
          [pairId]: { fieldId, token, language },
        };
      });
    },
    []
  );

  const handleClearPairSelection = useCallback((pairId: string) => {
    setPairSelections((prev) => {
      const next = { ...prev };
      delete next[pairId];
      return next;
    });
  }, []);

  const handleFilterByExactToken = useCallback(
    (token: string) => {
      rememberView('Previous View');
      setFilters({
        ...DEFAULT_FILTERS,
        exactTokenFilter: token,
      });
      setExpandedModes(buildExpandedState(true));
      scrollToElementId('comparisons');
    },
    [rememberView, scrollToElementId]
  );

  const handleJumpToTokenMatrix = useCallback(
    (fieldId: SemanticFieldId, token: string, originId?: string) => {
      rememberView('Template Comparison', originId);
      setSelectedMatrixToken({ fieldId, token });
      scrollToElementId(`matrix-field-${fieldId}`);
    },
    [rememberView, scrollToElementId]
  );

  const handleReturnPrevious = useCallback(() => {
    if (!returnPoint) return;
    setFilters(returnPoint.filters);
    setExpandedModes(returnPoint.expandedModes);
    setPairSelections(returnPoint.pairSelections);
    setSelectedMatrixToken(returnPoint.selectedMatrixToken);
    setReturnPoints((points) => points.slice(0, -1));
    setScrollRequest({
      anchorIds: returnPoint.anchorId ? [returnPoint.anchorId] : [],
      fallbackY: returnPoint.scrollY,
      focus: true,
    });
  }, [returnPoint]);

  const handleBackToSummary = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="h-24 bg-white border-b border-slate-200" />
        <main className="max-w-[1320px] mx-auto px-4 sm:px-6 py-10 space-y-6">
          <div className="h-8 w-80 bg-slate-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 bg-white border border-slate-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-white border border-slate-200 rounded-lg animate-pulse" />
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 text-center space-y-3">
          <h1 className="font-display text-lg font-bold text-slate-950">
            Unable to Load SMS Templates
          </h1>
          <p className="text-sm text-slate-600">
            {error ?? 'The Dataverse SMS template dataset could not be parsed.'}
          </p>
          <button
            type="button"
            onClick={() => void loadDataset()}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <StickyNav
        modes={report.modes}
        activeModeFilter={filters.modeFilter}
        hasActiveFilters={hasActiveFilters}
        allExpanded={allExpanded}
        onJumpToSection={handleJumpToSection}
        onJumpToMode={handleJumpToMode}
        onResetFilters={handleResetFilters}
        onToggleExpandAll={handleToggleExpandAll}
      />

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 pb-20">
        <ExecutiveSummary
          summary={report.summary}
          snapshotDate={report.snapshotDate}
          activeCategory={filters.categoryFilter}
          onFilterByCategory={handleFilterByCategoryFromSummary}
          onJumpToMatrix={() => handleJumpToSection('token-matrix')}
        />

        <CriticalDefectsTable
          defects={report.criticalDefects}
          onJumpToSource={handleJumpToSource}
        />

        <section id="comparisons" className="scroll-mt-28 py-6 space-y-4">
          <FilterToolbar
            modeFilter={filters.modeFilter}
            smsTypeFilter={filters.smsTypeFilter}
            categoryFilter={filters.categoryFilter}
            searchQuery={filters.searchQuery}
            exactTokenFilter={filters.exactTokenFilter}
            onlyInconsistent={filters.onlyInconsistent}
            visiblePairsCount={visiblePairsCount}
            totalPairsCount={report.summary.totalPairSlots}
            visibleTemplatesCount={visibleTemplatesCount}
            allExpanded={allExpanded}
            onModeChange={(val) =>
              setFilters((prev) => ({ ...prev, modeFilter: val }))
            }
            onSmsTypeChange={(val) =>
              setFilters((prev) => ({ ...prev, smsTypeFilter: val }))
            }
            onCategoryChange={(val) =>
              setFilters((prev) => ({ ...prev, categoryFilter: val }))
            }
            onSearchChange={(val) =>
              setFilters((prev) => ({ ...prev, searchQuery: val }))
            }
            onClearExactToken={() =>
              setFilters((prev) => ({ ...prev, exactTokenFilter: null }))
            }
            onOnlyInconsistentChange={(val) =>
              setFilters((prev) => ({ ...prev, onlyInconsistent: val }))
            }
            onResetFilters={handleResetFilters}
            onExpandAll={() => setExpandedModes(buildExpandedState(true))}
            onCollapseAll={() => setExpandedModes(buildExpandedState(false))}
          />

          {visiblePairsCount === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-10 text-center space-y-3">
              <p className="font-display text-base font-bold text-slate-900">
                No template pairs match the current filters
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Adjust the search query, consultation mode, SMS type, or issue category, or reset all filters to inspect all 78 templates.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredModes.map(({ mode, visiblePairs }) => (
                <ModeSection
                  key={mode.code}
                  mode={mode}
                  visiblePairs={visiblePairs}
                  isExpanded={expandedModes[mode.code]}
                  flashedPairId={flashedPairId}
                  pairSelections={pairSelections}
                  onToggleExpand={() =>
                    setExpandedModes((prev) => ({
                      ...prev,
                      [mode.code]: !prev[mode.code],
                    }))
                  }
                  onSelectToken={handleSelectTokenInPair}
                  onClearSelection={handleClearPairSelection}
                  onFilterByExactToken={handleFilterByExactToken}
                  onJumpToTokenMatrix={handleJumpToTokenMatrix}
                  onJumpToSource={handleJumpToSource}
                />
              ))}
            </div>
          )}
        </section>

        <GlobalTokenMatrix
          groups={report.tokenMatrix}
          selectedMatrixToken={selectedMatrixToken}
          onSelectMatrixToken={setSelectedMatrixToken}
          onJumpToSource={handleJumpToSource}
          onFilterByExactToken={handleFilterByExactToken}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Dataverse SMS Template Audit · {report.summary.totalTemplates} verbatim templates across {report.summary.totalModes} consultation modes
          </span>
          <button
            type="button"
            onClick={handleBackToSummary}
            className="font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          >
            Back to top
          </button>
        </div>
      </footer>

      <ReturnBar
        returnPoint={returnPoint}
        showBackToSummary={showBackToSummary}
        onReturnPrevious={handleReturnPrevious}
        onDismissReturn={() => setReturnPoints([])}
        onBackToSummary={handleBackToSummary}
      />
    </div>
  );
}

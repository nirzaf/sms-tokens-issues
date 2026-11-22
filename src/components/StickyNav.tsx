import { RotateCcw, ChevronsUpDown } from 'lucide-react';
import type { ConsultationModeCode, ModeAnalysis } from '../types/sms';

interface StickyNavProps {
  modes: ModeAnalysis[];
  activeModeFilter: ConsultationModeCode | 'ALL';
  hasActiveFilters: boolean;
  allExpanded: boolean;
  onJumpToSection: (sectionId: string) => void;
  onJumpToMode: (mode: ConsultationModeCode) => void;
  onResetFilters: () => void;
  onToggleExpandAll: () => void;
}

export function StickyNav({
  modes,
  activeModeFilter,
  hasActiveFilters,
  allExpanded,
  onJumpToSection,
  onJumpToMode,
  onResetFilters,
  onToggleExpandAll,
}: StickyNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Row 1: Strict 3-zone Top Bar Contract */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-6">
        <a
          href="#summary"
          onClick={(e) => {
            e.preventDefault();
            onJumpToSection('summary');
          }}
          className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Dataverse SMS Audit
        </a>

        <nav
          aria-label="Report sections"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#summary"
            onClick={(e) => {
              e.preventDefault();
              onJumpToSection('summary');
            }}
            className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            Executive Summary
          </a>
          <a
            href="#critical-defects"
            onClick={(e) => {
              e.preventDefault();
              onJumpToSection('critical-defects');
            }}
            className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            Top Critical Defects
          </a>
          <a
            href="#comparisons"
            onClick={(e) => {
              e.preventDefault();
              onJumpToSection('comparisons');
            }}
            className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            All Comparisons
          </a>
          <a
            href="#token-matrix"
            onClick={(e) => {
              e.preventDefault();
              onJumpToSection('token-matrix');
            }}
            className="hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            Global Token Matrix
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleExpandAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" aria-hidden="true" />
              {allExpanded ? 'Collapse Modes' : 'Expand All Modes'}
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Compact Quick-Jump Consultation Mode Bar */}
      <div className="border-t border-slate-100 bg-slate-50/90">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0 pr-1">
            Jump to mode:
          </span>
          <div className="flex items-center gap-1.5 shrink-0" role="navigation" aria-label="Consultation modes">
            {modes.map((m) => {
              const isSelected = activeModeFilter === m.code;
              const hasCritical = m.criticalCount > 0;
              return (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => onJumpToMode(m.code)}
                  title={`${m.code} (${m.templateCount} templates, ${m.inconsistentPairCount} inconsistent pairs)`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:text-slate-950'
                  }`}
                >
                  <span className="font-mono">{m.code}</span>
                  <span
                    className={`tabular-nums text-[11px] font-medium ${
                      isSelected
                        ? 'text-slate-300'
                        : hasCritical
                          ? 'text-red-700'
                          : 'text-slate-500'
                    }`}
                  >
                    {m.templateCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

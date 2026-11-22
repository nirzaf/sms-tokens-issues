import { Search, X, RotateCcw, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import type {
  ConsultationModeCode,
  IssueCategory,
  SmsType,
} from '../types/sms';
import { MODE_META, MODE_ORDER, SMS_TYPE_ORDER } from '../utils/templateParser';

interface FilterToolbarProps {
  modeFilter: ConsultationModeCode | 'ALL';
  smsTypeFilter: SmsType | 'ALL';
  categoryFilter: IssueCategory | 'ALL';
  searchQuery: string;
  exactTokenFilter: string | null;
  onlyInconsistent: boolean;
  visiblePairsCount: number;
  totalPairsCount: number;
  visibleTemplatesCount: number;
  allExpanded: boolean;
  onModeChange: (val: ConsultationModeCode | 'ALL') => void;
  onSmsTypeChange: (val: SmsType | 'ALL') => void;
  onCategoryChange: (val: IssueCategory | 'ALL') => void;
  onSearchChange: (val: string) => void;
  onClearExactToken: () => void;
  onOnlyInconsistentChange: (val: boolean) => void;
  onResetFilters: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const CATEGORY_OPTIONS: Array<{ value: IssueCategory | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All Issue Categories' },
  { value: 'typo_malformed', label: 'Typo / Malformed Tokens' },
  { value: 'swapped_missing', label: 'Swapped / Misplaced / Truncated / Missing' },
  { value: 'en_ar_mismatch', label: 'EN/AR Token Name Mismatches' },
  { value: 'casing_drift', label: 'Casing Drift' },
  { value: 'schema_drift', label: 'Within-Mode Schema Drift' },
];

export function FilterToolbar({
  modeFilter,
  smsTypeFilter,
  categoryFilter,
  searchQuery,
  exactTokenFilter,
  onlyInconsistent,
  visiblePairsCount,
  totalPairsCount,
  visibleTemplatesCount,
  onModeChange,
  onSmsTypeChange,
  onCategoryChange,
  onSearchChange,
  onClearExactToken,
  onOnlyInconsistentChange,
  onResetFilters,
  onExpandAll,
  onCollapseAll,
}: FilterToolbarProps) {
  const hasFilters =
    modeFilter !== 'ALL' ||
    smsTypeFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    searchQuery.trim() !== '' ||
    exactTokenFilter !== null ||
    onlyInconsistent;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-950">
            All Template Comparisons (English vs. Arabic)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            Showing {visiblePairsCount} of {totalPairsCount} appointment pairs ({visibleTemplatesCount} templates)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" aria-hidden="true" />
            Expand All
          </button>
          <button
            type="button"
            onClick={onCollapseAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" aria-hidden="true" />
            Collapse All
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            disabled={!hasFilters}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              hasFilters
                ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-1">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <label htmlFor="sms-search-input" className="sr-only">
            Search by token or template text
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="sms-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search token (#PFACILITYNMAE#) or text..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Consultation Mode */}
        <div className="md:col-span-3">
          <label htmlFor="mode-select" className="sr-only">
            Filter by Consultation Mode
          </label>
          <select
            id="mode-select"
            value={modeFilter}
            onChange={(e) =>
              onModeChange(e.target.value as ConsultationModeCode | 'ALL')
            }
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
          >
            <option value="ALL">All Consultation Modes (10)</option>
            {MODE_ORDER.map((m) => (
              <option key={m} value={m}>
                {m} — {MODE_META[m].name}
              </option>
            ))}
          </select>
        </div>

        {/* Issue Category */}
        <div className="md:col-span-3">
          <label htmlFor="category-select" className="sr-only">
            Filter by Issue Category
          </label>
          <select
            id="category-select"
            value={categoryFilter}
            onChange={(e) =>
              onCategoryChange(e.target.value as IssueCategory | 'ALL')
            }
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Only Inconsistent Toggle */}
        <div className="md:col-span-2 flex items-center">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md w-full justify-center hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={onlyInconsistent}
              onChange={(e) => onOnlyInconsistentChange(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
            <span className="whitespace-nowrap">Inconsistent Only</span>
          </label>
        </div>
      </div>

      {/* SMS Type Segmented Control + Exact Token Filter Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div
          className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md overflow-x-auto max-w-full"
          role="group"
          aria-label="Filter by SMS Type"
        >
          <button
            type="button"
            onClick={() => onSmsTypeChange('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
              smsTypeFilter === 'ALL'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All SMS Types
          </button>
          {SMS_TYPE_ORDER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSmsTypeChange(t)}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
                smsTypeFilter === t
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {exactTokenFilter && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded-md text-xs text-slate-900">
            <span>Filtering exact token:</span>
            <mark className="sms-token pointer-events-none">{exactTokenFilter}</mark>
            <button
              type="button"
              onClick={onClearExactToken}
              aria-label={`Clear token filter ${exactTokenFilter}`}
              className="text-slate-600 hover:text-slate-950 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

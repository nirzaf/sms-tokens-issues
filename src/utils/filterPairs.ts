import type {
  ConsultationModeCode,
  IssueCategory,
  SmsType,
  TemplatePairAnalysis,
} from '../types/sms';

export interface PairFilterState {
  modeFilter: ConsultationModeCode | 'ALL';
  smsTypeFilter: SmsType | 'ALL';
  categoryFilter: IssueCategory | 'ALL';
  searchQuery: string;
  exactTokenFilter: string | null;
  onlyInconsistent: boolean;
}

export const DEFAULT_FILTERS: PairFilterState = {
  modeFilter: 'ALL',
  smsTypeFilter: 'ALL',
  categoryFilter: 'ALL',
  searchQuery: '',
  exactTokenFilter: null,
  onlyInconsistent: false,
};

export function pairMatchesFilters(
  pair: TemplatePairAnalysis,
  filters: PairFilterState
): boolean {
  if (filters.modeFilter !== 'ALL' && pair.mode !== filters.modeFilter) {
    return false;
  }
  if (filters.smsTypeFilter !== 'ALL' && pair.smsType !== filters.smsTypeFilter) {
    return false;
  }
  if (filters.onlyInconsistent && pair.isConsistent) {
    return false;
  }
  if (
    filters.categoryFilter !== 'ALL' &&
    !pair.categories.includes(filters.categoryFilter)
  ) {
    return false;
  }
  if (filters.exactTokenFilter !== null) {
    const hasEn = pair.en?.tokens.includes(filters.exactTokenFilter) ?? false;
    const hasAr = pair.ar?.tokens.includes(filters.exactTokenFilter) ?? false;
    if (!hasEn && !hasAr) {
      return false;
    }
  }
  const q = filters.searchQuery.trim().toLowerCase();
  if (q !== '') {
    const haystack = [
      pair.pairId,
      pair.mode,
      pair.smsType,
      pair.en?.body ?? '',
      pair.ar?.body ?? '',
      ...pair.issues.map((i) => `${i.title} ${i.explanation}`),
      ...pair.fieldRows.map(
        (r) => `${r.fieldLabel} ${r.enToken ?? ''} ${r.arToken ?? ''} ${r.explanation}`
      ),
    ]
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(q)) {
      return false;
    }
  }

  return true;
}

export function hasAnyActiveFilter(filters: PairFilterState): boolean {
  return (
    filters.modeFilter !== 'ALL' ||
    filters.smsTypeFilter !== 'ALL' ||
    filters.categoryFilter !== 'ALL' ||
    filters.searchQuery.trim() !== '' ||
    filters.exactTokenFilter !== null ||
    filters.onlyInconsistent
  );
}

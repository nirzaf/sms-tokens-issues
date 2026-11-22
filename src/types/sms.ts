export type ConsultationModeCode =
  | 'RO'
  | 'TL'
  | 'VD'
  | 'DR'
  | 'EP'
  | 'BS'
  | 'BST'
  | 'CV'
  | 'BL'
  | 'SC';

export type SmsType = 'Confirmation' | 'Cancellation' | 'Reschedule' | 'Reminder';

export type TemplateLanguage = 'English' | 'Arabic';

export type SemanticFieldId =
  | 'patient_name'
  | 'patient_id'
  | 'facility'
  | 'clinic'
  | 'doctor'
  | 'date'
  | 'day'
  | 'time'
  | 'from_date'
  | 'from_day'
  | 'from_time'
  | 'to_date'
  | 'to_day'
  | 'to_time'
  | 'map'
  | 'extra_msg'
  | 'phone'
  | 'overseas_phone';

export type IssueCategory =
  | 'typo_malformed'
  | 'swapped_missing'
  | 'en_ar_mismatch'
  | 'casing_drift'
  | 'schema_drift'
  | 'content_difference'
  | 'formatting'
  | 'coverage';

export type TokenVisualSeverity =
  | 'consistent'
  | 'casing'
  | 'drift'
  | 'mismatch'
  | 'critical';

export type PairStatusBadge =
  | 'Source text differs'
  | 'Formatting difference'
  | 'Absent from snapshot'
  | 'Consistent'
  | 'EN/AR Mismatch'
  | 'Casing Drift'
  | 'Schema Drift'
  | 'Typo / Broken'
  | 'Swapped / Misplaced'
  | 'Truncated / Missing';

export interface ParsedTemplate {
  key: string; // e.g. "CV-Cancellation-Arabic"
  pairId: string; // e.g. "CV-Cancellation"
  mode: ConsultationModeCode;
  smsType: SmsType;
  language: TemplateLanguage;
  heading: string;
  sourceLine?: number; // One-based Markdown heading location; not record metadata.
  body: string; // Verbatim template string from source file
  tokens: string[]; // Ordered list of exact #TOKEN# strings found in body
}

export interface TokenOccurrenceIssue {
  token: string;
  fieldId: SemanticFieldId;
  fieldLabel: string;
  severity: TokenVisualSeverity;
  categories: IssueCategory[];
  counterpartToken: string | null;
  explanation: string;
}

export interface PairFieldMappingRow {
  fieldId: SemanticFieldId;
  fieldLabel: string;
  enToken: string | null;
  arToken: string | null;
  severity: TokenVisualSeverity;
  categories: IssueCategory[];
  statusLabel: string;
  explanation: string;
}

export interface PairIssueDetail {
  displayDefectType?: CriticalDefectItem['defectType'];
  relatedTokens?: string[];
  interpretation?: string;
  evidenceConfidence?: 'Observed in snapshot';
  runtimeStatus?: 'Not verified';
  evidence?: { pairId: string; language: TemplateLanguage | 'Both' }[];
  id: string;
  category: IssueCategory;
  severity: 'critical' | 'warning' | 'info';
  language: TemplateLanguage | 'Both';
  token?: string;
  fieldId?: SemanticFieldId;
  title: string;
  explanation: string;
}

export interface TemplatePairAnalysis {
  pairId: string; // e.g. "RO-Confirmation"
  mode: ConsultationModeCode;
  smsType: SmsType;
  en: ParsedTemplate | null;
  ar: ParsedTemplate | null;
  isMissingPair: boolean;
  statuses: PairStatusBadge[];
  categories: IssueCategory[];
  isConsistent: boolean;
  tokenSetsMatch?: boolean;
  hasCriticalDefect: boolean;
  fieldRows: PairFieldMappingRow[];
  issues: PairIssueDetail[];
  enTokenMap: Record<string, TokenOccurrenceIssue>;
  arTokenMap: Record<string, TokenOccurrenceIssue>;
}

export interface ModeAnalysis {
  code: ConsultationModeCode;
  name: string;
  description: string;
  templateCount: number;
  pairCount: number;
  missingPairCount: number;
  inconsistentPairCount: number;
  criticalCount: number;
  schemaDriftNotes: string[];
  pairs: TemplatePairAnalysis[];
}

export interface CriticalDefectItem {
  id: string;
  pairId: string;
  mode: ConsultationModeCode;
  smsType: SmsType;
  language: TemplateLanguage | 'Both';
  defectType: 'Missing placeholder' | 'Typo / Broken' | 'Swapped / Misplaced' | 'Truncated / Missing' | 'Schema Drift' | 'Content difference' | 'Formatting';
  token: string | null;
  fieldId: SemanticFieldId | null;
  summary: string;
  impact: string;
  evidence?: PairIssueDetail['evidence'];
  evidenceConfidence?: PairIssueDetail['evidenceConfidence'];
  runtimeStatus?: PairIssueDetail['runtimeStatus'];
  interpretation?: string;
}

export interface TokenMatrixOccurrence {
  occurrenceIndex?: number;
  severity?: TokenVisualSeverity;
  issueIds?: string[];
  pairId: string;
  mode: ConsultationModeCode;
  smsType: SmsType;
  language: TemplateLanguage;
  token: string;
}

export interface TokenMatrixVariant {
  token: string;
  count: number;
  enCount: number;
  arCount: number;
  severity: TokenVisualSeverity;
  note: string;
  occurrences: TokenMatrixOccurrence[];
}

export interface TokenMatrixFieldGroup {
  fieldId: SemanticFieldId;
  fieldLabel: string;
  meaning: string;
  variantCount: number;
  totalOccurrences: number;
  hasTypos: boolean;
  variants: TokenMatrixVariant[];
}

export interface AuditReportSummary {
  totalTemplates: number;
  expectedTemplates: number;
  totalModes: number;
  totalPairSlots: number;
  populatedPairs: number;
  missingPairs: number;
  consistentPairs: number;
  inconsistentPairs: number;
  populatedPairsWithFindings: number;
  uniqueTokenVariants: number;
  totalTokenOccurrences: number;
  countsByCategory: Record<IssueCategory, number>;
  pairsByCategory: Record<IssueCategory, number>;
  criticalDefectCount: number;
  criticalPairCount: number;
  criticalMessageCount: number;
}

export interface FullAuditReport {
  snapshotDate: string;
  summary: AuditReportSummary;
  modes: ModeAnalysis[];
  allPairs: TemplatePairAnalysis[];
  criticalDefects: CriticalDefectItem[];
  tokenMatrix: TokenMatrixFieldGroup[];
}

import type {
  AuditReportSummary,
  ConsultationModeCode,
  CriticalDefectItem,
  FullAuditReport,
  IssueCategory,
  ModeAnalysis,
  PairFieldMappingRow,
  PairIssueDetail,
  PairStatusBadge,
  ParsedTemplate,
  SemanticFieldId,
  SmsType,
  TemplateLanguage,
  TemplatePairAnalysis,
  TokenMatrixFieldGroup,
  TokenMatrixOccurrence,
  TokenMatrixVariant,
  TokenOccurrenceIssue,
  TokenVisualSeverity,
} from '../types/sms';
import {
  MODE_META,
  MODE_ORDER,
  SMS_TYPE_ORDER,
  parseTemplatesMarkdown,
  tokenizeTemplateBody,
} from './templateParser';

export interface FieldDefinition {
  id: SemanticFieldId;
  label: string;
  meaning: string;
}

export const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    id: 'patient_name',
    label: 'Patient Name',
    meaning: 'Full name of the patient receiving the appointment SMS',
  },
  {
    id: 'patient_id',
    label: 'Patient ID',
    meaning: 'Patient medical record or Health Card identifier',
  },
  {
    id: 'facility',
    label: 'Facility / Health Center',
    meaning: 'Health center or swabbing station name where the service occurs',
  },
  {
    id: 'clinic',
    label: 'Clinic / Appt Type',
    meaning: 'Specific clinic department or appointment service type',
  },
  {
    id: 'doctor',
    label: 'Doctor',
    meaning: 'Assigned physician or clinician name',
  },
  {
    id: 'date',
    label: 'Appointment Date',
    meaning: 'Calendar date of the scheduled or cancelled appointment',
  },
  {
    id: 'day',
    label: 'Appointment Day',
    meaning: 'Day of the week (e.g., Sunday, Monday)',
  },
  {
    id: 'time',
    label: 'Appointment Time',
    meaning: 'Scheduled start time of the appointment',
  },
  {
    id: 'from_date',
    label: 'Original Date (From)',
    meaning: 'Previous appointment date before rescheduling (CV Reschedule)',
  },
  {
    id: 'from_day',
    label: 'Original Day (From)',
    meaning: 'Previous day of week before rescheduling (CV Reschedule)',
  },
  {
    id: 'from_time',
    label: 'Original Time (From)',
    meaning: 'Previous appointment time before rescheduling (CV Reschedule)',
  },
  {
    id: 'to_date',
    label: 'New Date (To)',
    meaning: 'New rescheduled appointment date (CV Reschedule)',
  },
  {
    id: 'to_day',
    label: 'New Day (To)',
    meaning: 'New rescheduled day of week (CV Reschedule)',
  },
  {
    id: 'to_time',
    label: 'New Time (To)',
    meaning: 'New rescheduled appointment time (CV Reschedule)',
  },
  {
    id: 'map',
    label: 'Map Location Link',
    meaning: 'URL pointing to the health center map location',
  },
  {
    id: 'extra_msg',
    label: 'Extra Message',
    meaning: 'Optional clinic-specific instruction or custom text',
  },
  {
    id: 'phone',
    label: 'Phone Number',
    meaning: 'Local contact helpline for rescheduling or inquiries',
  },
  {
    id: 'overseas_phone',
    label: 'Overseas Phone',
    meaning: 'International helpline number for patients outside Qatar',
  },
];

export const FIELD_MAP: Record<SemanticFieldId, FieldDefinition> =
  FIELD_DEFINITIONS.reduce(
    (acc, def) => {
      acc[def.id] = def;
      return acc;
    },
    {} as Record<SemanticFieldId, FieldDefinition>
  );

export const TOKEN_TO_FIELD: Record<string, SemanticFieldId> = {
  // Patient Name
  '#PNAME#': 'patient_name',
  '#PName#': 'patient_name',
  '#Pname#': 'patient_name',
  '#PANAME#': 'patient_name',
  '#NAME#': 'patient_name',
  '#NameA#': 'patient_name',

  // Patient ID
  '#PID#': 'patient_id',

  // Facility / Health Center
  '#PFACILITY#': 'facility',
  '#PFacility#': 'facility',
  '#Pfacility#': 'facility',
  '#PFACiLITY#': 'facility',
  '#PFACILITYID#': 'facility',
  '#PAFACILITY#': 'facility',
  '#PFACILITYNMAE#': 'facility',
  '#PAFACILITYNMAE#': 'facility',
  '#PAFACILITYNAME#': 'facility',
  '#FACILITY_E#': 'facility',
  '#FACILITY_A#': 'facility',
  '#HCName#': 'facility',
  '#AHCName#': 'facility',

  // Clinic / Appt Type
  '#PClinic#': 'clinic',
  '#Pclinic#': 'clinic',
  '#PAPPTTYPE#': 'clinic',
  '#APPTTYPEA#': 'clinic',
  '#CLINIC_NAME#': 'clinic',
  '#ClinicName#': 'clinic',
  '#AClinicname#': 'clinic',

  // Doctor
  '#PDoctor#': 'doctor',
  '#PDOCTOR#': 'doctor',

  // Date
  '#PDate#': 'date',
  '#PDATE#': 'date',
  '#PADATE#': 'date',
  '#PAPPTDATE#': 'date',
  '#ApptDate#': 'date',
  '#Date#': 'date',
  '#DateA#': 'date',
  '#PA#': 'date', // Truncated #PADATE# in CV-Cancellation AR

  // Day
  '#PDay#': 'day',
  '#PDAY#': 'day',
  '#PADAY#': 'day',
  '#ApptDay#': 'day',
  '#Day#': 'day',
  '#DayA#': 'day',

  // Time
  '#PTime#': 'time',
  '#PTIME#': 'time',
  '#PATIME#': 'time',
  '#PAPPTTIME#': 'time',
  '#ApptTime#': 'time',
  '#Time#': 'time',
  '#ATime#': 'time',

  // Reschedule From (CV)
  '#PFDATE#': 'from_date',
  '#PFADATE#': 'from_date',
  '#PFDAY#': 'from_day',
  '#PFADAY#': 'from_day',
  '#PFTIME#': 'from_time',
  '#PFATIME#': 'from_time',

  // Reschedule To (CV)
  '#PTDATE#': 'to_date',
  '#PTADATE#': 'to_date',
  '#PTDAY#': 'to_day',
  '#PTADAY#': 'to_day',
  '#PTTIME#': 'to_time',
  '#PTATIME#': 'to_time',

  // Map
  '#PMAP#': 'map',
  '#PAMAP#': 'map',

  // Extra message
  '#PEXTRAMSG#': 'extra_msg',
  '#PAEMSG#': 'extra_msg',
  '#PMsg#': 'extra_msg',
  '#PMSG#': 'extra_msg',
  '#PMSGA#': 'extra_msg',

  // Phone
  '#PPHONE#': 'phone',
  '#PPHONEOVS#': 'overseas_phone',
  '#POVRPHONE#': 'overseas_phone',
};

const SEVERITY_RANK: Record<TokenVisualSeverity, number> = {
  consistent: 0,
  drift: 1,
  casing: 2,
  mismatch: 3,
  critical: 4,
};

function maxSeverity(
  a: TokenVisualSeverity,
  b: TokenVisualSeverity
): TokenVisualSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

export function getTokenField(token: string): SemanticFieldId {
  const mapped = TOKEN_TO_FIELD[token];
  if (!mapped) {
    throw new Error(`Unmapped token encountered in dataset: ${token}`);
  }
  return mapped;
}

function isTypoToken(token: string): { isTypo: boolean; reason: string } {
  if (token === '#PA#') {
    return {
      isTypo: true,
      reason:
        'The snapshot contains #PA#. Its date context suggests #PADATE#, but supported keys and rendered output are not verified.',
    };
  }
  if (/NMAE/i.test(token)) {
    const corrected = token.replace(/NMAE/i, 'NAME');
    return {
      isTypo: true,
      reason: `Misspelled token ${token} contains "NMAE"; ${corrected} is a candidate spelling. Replacement support is unverified.`,
    };
  }
  if (/^#[A-Z]+[a-z][A-Z]+#$/.test(token)) {
    return {
      isTypo: true,
      reason: `Malformed mixed-case typo ${token} (lowercase "i" inside all-caps token) differs in casing from ${token.toUpperCase()}.`,
    };
  }
  return { isTypo: false, reason: '' };
}

function hasSwappedArabicDateTime(body: string): {
  swapped: boolean;
  timeToken?: string;
  dateToken?: string;
} {
  const match = body.match(/بتاريخ\s*(#P?A?TIME#)\s*الساعة\s*(#P?A?DATE#)/);
  if (match) {
    return { swapped: true, timeToken: match[1], dateToken: match[2] };
  }
  return { swapped: false };
}

function hasMisplacedPmsga(body: string): boolean {
  return /بتاريخ\s*#PMSGA#/.test(body);
}

function findLeadingQuoteTokens(body: string): string[] {
  const matches = [...body.matchAll(/"(#[A-Za-z0-9_]+#)/g)];
  return matches.map((m) => m[1]);
}

function findConcatenatedPairs(body: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const matches = [...body.matchAll(/(#[A-Za-z0-9_]+#)(#[A-Za-z0-9_]+#)/g)];
  for (const m of matches) {
    pairs.push([m[1], m[2]]);
  }
  return pairs;
}

function isGenericReminderTemplate(tpl: ParsedTemplate | null): boolean {
  if (!tpl || tpl.smsType !== 'Reminder') return false;
  return (
    tpl.tokens.includes('#FACILITY_E#') ||
    tpl.tokens.includes('#FACILITY_A#') ||
    tpl.tokens.includes('#CLINIC_NAME#')
  );
}

function isEpCancellationSchemaSwitch(tpl: ParsedTemplate | null): boolean {
  if (!tpl || tpl.mode !== 'EP' || tpl.smsType !== 'Cancellation') return false;
  return (
    tpl.tokens.includes('#HCName#') ||
    tpl.tokens.includes('#AHCName#') ||
    tpl.tokens.includes('#ClinicName#')
  );
}

function isAbruptlyTruncatedAr(
  en: ParsedTemplate | null,
  ar: ParsedTemplate | null
): { truncated: boolean; severity: 'severe' | 'tail' | 'none'; explanation: string } {
  if (!ar) return { truncated: false, severity: 'none', explanation: '' };

  if (en && en.tokens.length >= 8 && ar.tokens.length <= 5 && /#PTIME#\s*$/.test(ar.body)) {
    return {
      truncated: true,
      severity: 'severe',
      explanation: `Arabic confirmation cuts off abruptly right after "الساعة #PTIME#", omitting Appointment Day, Date, Map Link, Extra Message, Phone Number, and 30-minute arrival instructions (${ar.tokens.length} tokens vs ${en.tokens.length} in English).`,
    };
  }

  if (/و\s*3:00\s*$/.test(ar.body)) {
    return {
      truncated: true,
      severity: 'tail',
      explanation:
        'Arabic message is cut off mid-phrase at "و 3:00", dropping "مساءا. شكرا جزيلاً" (PM closing time and sign-off) present in the Reschedule and Cancellation templates.',
    };
  }

  return { truncated: false, severity: 'none', explanation: '' };
}

function detectModeSchemaDriftNotes(
  mode: ConsultationModeCode,
  templates: ParsedTemplate[]
): string[] {
  const notes: string[] = [];
  const enTemplates = templates.filter((t) => t.language === 'English');
  const arTemplates = templates.filter((t) => t.language === 'Arabic');

  // Check Facility token variants within EN and within AR
  const enFacilitySet = new Set<string>();
  const arFacilitySet = new Set<string>();
  for (const t of enTemplates) {
    for (const tok of t.tokens) {
      if (getTokenField(tok) === 'facility') enFacilitySet.add(tok);
    }
  }
  for (const t of arTemplates) {
    for (const tok of t.tokens) {
      if (getTokenField(tok) === 'facility') arFacilitySet.add(tok);
    }
  }

  if (enFacilitySet.size > 1) {
    notes.push(
      `English Facility token drifts across ${enFacilitySet.size} variants in ${mode}: ${[...enFacilitySet].join(', ')}.`
    );
  }
  if (arFacilitySet.size > 1) {
    notes.push(
      `Arabic Facility token drifts across ${arFacilitySet.size} variants in ${mode}: ${[...arFacilitySet].join(', ')}.`
    );
  }

  // Generic reminder drift check
  const reminderPairTemplates = templates.filter((t) => t.smsType === 'Reminder');
  if (reminderPairTemplates.some((t) => isGenericReminderTemplate(t))) {
    const modeSpecificPhone =
      mode === 'BL'
        ? '50657883 / 51098065'
        : mode === 'BS' || mode === 'BST'
          ? '800-1112'
          : mode === 'CV'
            ? '40277077'
            : '#PPHONE#';
    const extraContext =
      mode === 'BST'
        ? ' Even worse, BST is a telephone consultation (prepare 15 min ahead), yet the generic Reminder instructs patients to arrive in person 30 min early.'
        : '';
    notes.push(
      `${mode}-Reminder switches to a generic-looking schema (#FACILITY_E#/#FACILITY_A#, #CLINIC_NAME#, #ApptDate#/#ApptDay#/#ApptTime#) and hardcodes helpline 107 instead of ${modeSpecificPhone}.${extraContext}`
    );
  }

  if (mode === 'EP') {
    notes.push(
      'EP-Cancellation abandons the #P*#/#PA*# schema used in Confirmation and Reschedule, switching to #NAME#/#HCName#/#ClinicName# (EN) and inconsistent prefix/suffix Arabic tokens (#NameA#, #AHCName#, #AClinicname#, #ATime#, #DayA#, #DateA#).'
    );
    notes.push(
      'EP-Reminder is completely absent from Dataverse in both English and Arabic.'
    );
  }

  if (mode === 'RO') {
    notes.push(
      'RO-Confirmation EN uses lowercase #Pname#/#Pfacility#/#Pclinic# while other RO English templates use #PName#/#PFacility#/#PClinic#, and RO-Reminder EN switches #PDay# to #PDAY#.'
    );
  }

  if (mode === 'SC') {
    notes.push(
      'SC-Confirmation EN uses lowercase #Pname#/#Pfacility#/#Pclinic# while Cancellation and Reschedule use #PName#/#PFacility#/#PClinic#; SC-Reschedule AR uses #PEXTRAMSG# (unlike RO Arabic which uses #PAEMSG#).'
    );
  }

  if (mode === 'TL' || mode === 'VD') {
    notes.push(
      `Arabic uses #PAPPTTYPE#, #PAPPTTIME#, #PAPPTDATE#, and #PMSGA# while English uses #PClinic#, #PTime#, #PDate#, and ${mode === 'TL' ? '#PMsg#' : '#PMSG#'}.`
    );
  }

  return notes;
}

function withEvidence(issue: PairIssueDetail, pairId: string): PairIssueDetail {
  return {
    ...issue,
    evidenceConfidence: 'Observed in snapshot',
    runtimeStatus: 'Not verified',
    interpretation: issue.interpretation ?? 'Compare this source difference against approved wording or the replacement-key contract before changing it.',
    evidence: issue.evidence ?? [{ pairId, language: issue.language }],
  };
}

const CONTENT_REVIEW: Record<string, { title: string; observation: string; interpretation: string; compare: string[]; language?: TemplateLanguage; severity: 'critical' | 'warning' }> = {
  'BST-Reminder': {
    title: 'Phone consultation versus clinic arrival',
    observation: 'BST Confirmation and Reschedule describe a phone consultation and ask for preparation 15 minutes early. Reminder asks for clinic arrival 30 minutes early.',
    interpretation: 'Confirm the approved appointment modality and preparation instruction; either message may need business review.',
    compare: ['BST-Confirmation', 'BST-Reschedule'], severity: 'critical',
  },
  'CV-Reminder': {
    title: 'Reminder lead time differs',
    observation: 'CV Reminder asks for arrival 30 minutes early. Confirmation and Reschedule ask for 15 minutes.',
    interpretation: 'Confirm the approved lead time; the export does not establish which timing is intended.',
    compare: ['CV-Confirmation', 'CV-Reschedule'], severity: 'warning',
  },
  'RO-Reschedule': {
    title: 'Arabic reminder wording in a reschedule',
    observation: 'Arabic uses reminder wording (ارجو التذكير) without explicitly saying the appointment was rescheduled. English explicitly says it was rescheduled.',
    interpretation: 'Confirm equivalent event wording in both languages.',
    compare: [], language: 'Arabic', severity: 'critical',
  },
  'BL-Reminder': {
    title: 'Survey preparation and contact differ',
    observation: 'BL Reminder uses 107 and does not mention the blindness survey or the glasses and identification instructions visible in Confirmation and Reschedule.',
    interpretation: 'Confirm whether Reminder needs the survey context, preparation details, or separate contact route.',
    compare: ['BL-Confirmation', 'BL-Reschedule'], severity: 'warning',
  },
  'EP-Cancellation': {
    title: 'Cancellation contact route differs',
    observation: 'EP Cancellation lists 107; Confirmation and Reschedule list 40271030, 40271014, and 40271102.',
    interpretation: 'Confirm which contact route applies to the cancellation; the export does not establish that the difference is wrong.',
    compare: ['EP-Confirmation', 'EP-Reschedule'], severity: 'warning',
  },
};

function findTokenProseJoins(body: string): string[] {
  const segments = tokenizeTemplateBody(body);
  const matches: string[] = [];
  for (const [index, segment] of segments.entries()) {
    if (segment.type !== 'token') continue;
    const preceding = segments[index - 1];
    const following = segments[index + 1];
    const left = preceding?.type === 'text' ? preceding.value.match(/[\p{L}\p{N}]+$/u)?.[0] : undefined;
    const right = following?.type === 'text' ? following.value.match(/^[\p{L}\p{N}]+/u)?.[0] : undefined;
    if (left) matches.push(left + segment.value);
    if (right) matches.push(segment.value + right);
  }
  return matches;
}

function curatedSourceIssues(pairId: string, en: ParsedTemplate | null, ar: ParsedTemplate | null): PairIssueDetail[] {
  const findings: PairIssueDetail[] = [];
  const review = CONTENT_REVIEW[pairId];
  if (review && en && ar) findings.push({
    id: `${pairId}-content-review`, category: 'content_difference', severity: review.severity,
    language: review.language ?? 'Both', title: review.title, explanation: review.observation,
    interpretation: review.interpretation,
    evidence: [pairId, ...review.compare].map((id) => ({ pairId: id, language: 'Both' as const })),
  });
  for (const template of [en, ar]) {
    if (!template) continue;
    const actual = findTokenProseJoins(template.body);
    if (pairId === 'BL-Reschedule' && template.language === 'English') {
      actual.push(...['have.HC', '51098065Thank You'].filter((sample) => template.body.includes(sample)));
    }
    if (!actual.length) continue;
    findings.push({
      id: `${pairId}-prose-joins-${template.language}`, category: 'formatting',
      severity: pairId === 'BL-Reschedule' && template.language === 'English' ? 'warning' : 'info',
      language: template.language, title: 'No separator at source word boundaries',
      explanation: `${template.language} contains these exact joins: ${[...new Set(actual)].join(', ')}.`,
      interpretation: 'This is literal adjacency only. Check intended spacing and resolved values; Arabic attachment may be intentional.',
    });
  }
  return findings;
}

function buildPairAnalysis(
  mode: ConsultationModeCode,
  smsType: SmsType,
  en: ParsedTemplate | null,
  ar: ParsedTemplate | null,
  modeTemplates: ParsedTemplate[]
): TemplatePairAnalysis {
  const pairId = `${mode}-${smsType}`;

  if (!en && !ar) {
    const missingIssue: PairIssueDetail = {
      id: `${pairId}-missing-pair`,
      category: 'swapped_missing',
      severity: 'critical',
      language: 'Both',
      title: `Missing ${pairId} templates (EN & AR)`,
      explanation: `No English or Arabic template for ${pairId} appears in the supplied snapshot. Required coverage, fallback, and delivery are not verified.`,
    };
    return {
      pairId,
      mode,
      smsType,
      en: null,
      ar: null,
      isMissingPair: true,
      statuses: ['Truncated / Missing'],
      categories: ['swapped_missing'],
      isConsistent: false,
      hasCriticalDefect: true,
      fieldRows: [],
      issues: [withEvidence(missingIssue, pairId)],
      tokenSetsMatch: false,
      enTokenMap: {},
      arTokenMap: {},
    };
  }

  const issues: PairIssueDetail[] = curatedSourceIssues(pairId, en, ar);

  const categoriesSet = new Set<IssueCategory>();
  const statusesSet = new Set<PairStatusBadge>();
  for (const issue of issues) {
    categoriesSet.add(issue.category);
    statusesSet.add(issue.category === 'formatting' ? 'Formatting difference' : 'Source text differs');
  }

  const enByField = new Map<SemanticFieldId, string>();
  const arByField = new Map<SemanticFieldId, string>();

  for (const tok of en?.tokens ?? []) {
    const f = getTokenField(tok);
    if (!enByField.has(f)) enByField.set(f, tok);
  }
  for (const tok of ar?.tokens ?? []) {
    const f = getTokenField(tok);
    if (!arByField.has(f)) arByField.set(f, tok);
  }

  // Structural / body-level checks
  const arSwapped = ar ? hasSwappedArabicDateTime(ar.body) : { swapped: false };
  const arMisplacedPmsga = ar ? hasMisplacedPmsga(ar.body) : false;
  const enQuotes = en ? findLeadingQuoteTokens(en.body) : [];
  const arQuotes = ar ? findLeadingQuoteTokens(ar.body) : [];
  const enConcats = en ? findConcatenatedPairs(en.body) : [];
  const arConcats = ar ? findConcatenatedPairs(ar.body) : [];
  const arTrunc = isAbruptlyTruncatedAr(en, ar);
  const genericReminder = isGenericReminderTemplate(en) || isGenericReminderTemplate(ar);
  const epCancelDrift = isEpCancellationSchemaSwitch(en) || isEpCancellationSchemaSwitch(ar);
  const reversedParensAr = ar ? ar.body.includes(') (#') : false;

  // Check within-mode English facility/name casing drift for this pair
  const modeEnFacilities = new Set(
    modeTemplates
      .filter((t) => t.language === 'English' && !isGenericReminderTemplate(t))
      .flatMap((t) => t.tokens)
      .filter((tok) => getTokenField(tok) === 'facility')
  );
  const modeEnExtraMsgs = new Set(
    modeTemplates
      .filter((t) => t.language === 'English')
      .flatMap((t) => t.tokens)
      .filter((tok) => getTokenField(tok) === 'extra_msg')
  );

  // Detect BST-Reschedule EN switching facility from #PFACILITY# to #PFACILITYID#
  const bstFacilityDriftEn =
    mode === 'BST' && smsType === 'Reschedule' && en?.tokens.includes('#PFACILITYID#');

  if (genericReminder) {
    categoriesSet.add('schema_drift');
    statusesSet.add('Schema Drift');
    issues.push({
      id: `${pairId}-generic-reminder`,
      category: 'schema_drift',
      severity: 'warning',
      language: 'Both',
      fieldId: 'facility',
      title: 'Reminder uses different token names and contact text',
      explanation: `${pairId} switches to a generic-looking Reminder template (#FACILITY_E#/#FACILITY_A#, #CLINIC_NAME#, #ApptDate#/#ApptDay#/#ApptTime#) and shows 107; compare the contact text in the same-mode non-reminders.`,
    });
  }

  if (epCancelDrift) {
    categoriesSet.add('schema_drift');
    statusesSet.add('Schema Drift');
    issues.push({
      id: `${pairId}-ep-cancel-drift`,
      category: 'schema_drift',
      severity: 'warning',
      language: 'Both',
      fieldId: 'facility',
      title: 'EP Cancellation uses different token names',
      explanation: `EP-Cancellation switches from #PNAME#/#PFACILITY# to #NAME#/#HCName#/#ClinicName# (EN) and mixes suffix/prefix Arabic names (#NameA#, #DayA#, #DateA# vs #AHCName#, #AClinicname#, #ATime#).`,
    });
  }

  if (bstFacilityDriftEn) {
    categoriesSet.add('schema_drift');
    statusesSet.add('Schema Drift');
    issues.push({
      id: `${pairId}-bst-facility-drift`,
      category: 'schema_drift',
      severity: 'warning',
      language: 'English',
      token: '#PFACILITYID#',
      fieldId: 'facility',
      title: 'Facility token switches to #PFACILITYID# in Reschedule',
      explanation: `BST-Reschedule English switches Facility to #PFACILITYID#, whereas BST-Confirmation uses #PFACILITY# and BST-Cancellation uses #PFACiLITY#.`,
    });
  }

  if (arSwapped.swapped) {
    categoriesSet.add('swapped_missing');
    statusesSet.add('Swapped / Misplaced');
    issues.push({
      id: `${pairId}-swapped-datetime`,
      category: 'swapped_missing',
      severity: 'critical',
      language: 'Arabic',
      token: arSwapped.timeToken,
      relatedTokens: [arSwapped.timeToken, arSwapped.dateToken].filter((value): value is string => !!value),
      fieldId: 'time',
      title: `Swapped Date and Time tokens in Arabic (${arSwapped.timeToken} / ${arSwapped.dateToken})`,
      explanation: `Arabic places ${arSwapped.timeToken} immediately after "بتاريخ" (Date) and ${arSwapped.dateToken} after "الساعة" (Time), suggesting a date/time placement reversal. The replacement values were not observed.`,
    });
  }

  if (arMisplacedPmsga) {
    categoriesSet.add('swapped_missing');
    statusesSet.add('Swapped / Misplaced');
    issues.push({
      id: `${pairId}-misplaced-pmsga`,
      category: 'swapped_missing',
      severity: 'critical',
      language: 'Arabic',
      token: '#PMSGA#',
      fieldId: 'extra_msg',
      title: 'Misplaced #PMSGA# interrupts Arabic date phrase',
      explanation: `Arabic inserts #PMSGA# (extra message) right between "بتاريخ" (on date) and "#PDAY# #PAPPTDATE#", splitting the appointment date sentence in half.`,
    });
  }

  if (arTrunc.truncated) {
    categoriesSet.add('swapped_missing');
    statusesSet.add('Truncated / Missing');
    issues.push({
      id: `${pairId}-truncated-ar`,
      category: 'swapped_missing',
      severity: 'critical',
      language: 'Arabic',
      title:
        arTrunc.severity === 'severe'
          ? 'Arabic message abruptly truncated after #PTIME#'
          : 'Arabic message truncated mid-sentence at "و 3:00"',
      explanation: arTrunc.explanation,
    });
  }

  for (const [language, quotes, joins] of [
    ['English', enQuotes, enConcats], ['Arabic', arQuotes, arConcats],
  ] as const) {
    quotes.forEach((token, index) => {
      categoriesSet.add('typo_malformed');
      statusesSet.add('Typo / Broken');
      issues.push({
        id: `${pairId}-stray-quote-${language}-${index}`, category: 'typo_malformed',
        severity: 'warning', language, token, fieldId: getTokenField(token),
        title: `Stray double quote before ${token}`,
        explanation: `${language} contains a stray opening quotation mark before ${token} in the source.`,
      });
    });
    joins.forEach(([first, second], index) => {
      categoriesSet.add('formatting');
      statusesSet.add('Formatting difference');
      issues.push({
        id: `${pairId}-concat-${language}-${index}`, category: 'formatting',
        severity: 'warning', language, token: first, relatedTokens: [first, second], fieldId: getTokenField(first),
        title: `Adjacent placeholders ${first}${second}`,
        explanation: `${language} joins these exact placeholders without a literal separator in the source.`,
        interpretation: 'Confirm the intended separator and whether the renderer or data supplies one.',
      });
    });
  }

  if (reversedParensAr) {
    categoriesSet.add('typo_malformed');
    statusesSet.add('Typo / Broken');
    issues.push({
      id: `${pairId}-reversed-parens`,
      category: 'typo_malformed',
      severity: 'warning',
      language: 'Arabic',
      token: '#POVRPHONE#',
      fieldId: 'overseas_phone',
      title: 'Broken parentheses ") (#POVRPHONE#" in Arabic',
      explanation:
        'Arabic wraps #POVRPHONE# with malformed parentheses ") (#POVRPHONE#", in the supplied source. Rendered RTL output was not inspected.',
    });
  }

  // Build ordered field mapping rows
  const orderedFieldIds: SemanticFieldId[] = FIELD_DEFINITIONS.map((d) => d.id).filter(
    (fid) => enByField.has(fid) || arByField.has(fid)
  );

  const fieldRows: PairFieldMappingRow[] = [];
  const enTokenMap: Record<string, TokenOccurrenceIssue> = {};
  const arTokenMap: Record<string, TokenOccurrenceIssue> = {};

  for (const fieldId of orderedFieldIds) {
    const def = FIELD_MAP[fieldId];
    const enTok = enByField.get(fieldId) ?? null;
    const arTok = arByField.get(fieldId) ?? null;

    let rowSeverity: TokenVisualSeverity = 'consistent';
    const rowCategories = new Set<IssueCategory>();
    const explanations: string[] = [];
    let statusLabel = 'Consistent';

    let enSeverity: TokenVisualSeverity = 'consistent';
    let arSeverity: TokenVisualSeverity = 'consistent';
    const enCats = new Set<IssueCategory>();
    const arCats = new Set<IssueCategory>();
    const enNotes: string[] = [];
    const arNotes: string[] = [];

    // 1. Check missing in one language
    if (enTok && !arTok) {
      rowSeverity = maxSeverity(rowSeverity, 'critical');
      enSeverity = maxSeverity(enSeverity, 'critical');
      rowCategories.add('swapped_missing');
      enCats.add('swapped_missing');
      categoriesSet.add('swapped_missing');
      statusesSet.add('Truncated / Missing');
      statusLabel = 'Missing in AR';
      const msg =
        arTrunc.severity === 'severe'
          ? `English includes ${enTok} (${def.label}), but Arabic is abruptly truncated after #PTIME# and omits this field.`
          : `English includes ${enTok} (${def.label}), while Arabic omits the ${def.label.toLowerCase()} placeholder completely.`;
      explanations.push(msg);
      enNotes.push(msg);

      if (arTrunc.severity !== 'severe') {
        issues.push({
          id: `${pairId}-missing-ar-${fieldId}`,
          category: 'swapped_missing',
          severity: 'critical',
          language: 'Arabic',
          token: enTok,
          fieldId,
          title: `Arabic omits ${def.label} (${enTok})`,
          explanation: msg,
        });
      }
    } else if (!enTok && arTok) {
      rowSeverity = maxSeverity(rowSeverity, 'critical');
      arSeverity = maxSeverity(arSeverity, 'critical');
      rowCategories.add('swapped_missing');
      arCats.add('swapped_missing');
      categoriesSet.add('swapped_missing');
      statusesSet.add('Truncated / Missing');
      statusLabel = 'Missing in EN';
      const msg = `Arabic includes ${arTok} (${def.label}), while English omits this field.`;
      explanations.push(msg);
      arNotes.push(msg);
      issues.push({
        id: `${pairId}-missing-en-${fieldId}`,
        category: 'swapped_missing',
        severity: 'critical',
        language: 'English',
        token: arTok,
        fieldId,
        title: `English omits ${def.label} (${arTok})`,
        explanation: msg,
      });
    } else if (enTok && arTok) {
      // Both exist — check exact match vs casing vs name mismatch
      if (enTok === arTok) {
        // Exact match!
      } else if (enTok.toLowerCase() === arTok.toLowerCase()) {
        rowSeverity = maxSeverity(rowSeverity, 'casing');
        enSeverity = maxSeverity(enSeverity, 'casing');
        arSeverity = maxSeverity(arSeverity, 'casing');
        rowCategories.add('casing_drift');
        enCats.add('casing_drift');
        arCats.add('casing_drift');
        categoriesSet.add('casing_drift');
        statusesSet.add('Casing Drift');
        statusLabel = 'Casing Drift';
        const msg = `English uses ${enTok} while Arabic uses ${arTok} — the spellings differ only in casing; support for either key is unverified.`;
        explanations.push(msg);
        enNotes.push(msg);
        arNotes.push(msg);
        issues.push({
          id: `${pairId}-casing-${fieldId}`, category: 'casing_drift', severity: 'info',
          language: 'Both', relatedTokens: [enTok, arTok], fieldId, title: 'Token casing differs', explanation: msg,
        });
      } else {
        rowSeverity = maxSeverity(rowSeverity, 'mismatch');
        enSeverity = maxSeverity(enSeverity, 'mismatch');
        arSeverity = maxSeverity(arSeverity, 'mismatch');
        rowCategories.add('en_ar_mismatch');
        enCats.add('en_ar_mismatch');
        arCats.add('en_ar_mismatch');
        categoriesSet.add('en_ar_mismatch');
        statusesSet.add('EN/AR Mismatch');
        statusLabel = 'EN/AR Mismatch';
        const msg = `English uses ${enTok} while Arabic uses ${arTok} for ${def.label} in the same appointment type and SMS type.`;
        explanations.push(msg);
        enNotes.push(msg);
        arNotes.push(msg);
        issues.push({
          id: `${pairId}-mapping-${fieldId}`, category: 'en_ar_mismatch', severity: 'info',
          language: 'Both', relatedTokens: [enTok, arTok], fieldId, title: 'EN/AR token mapping differs', explanation: msg,
          interpretation: 'Different tokens may intentionally select localized values; validate the mapping before renaming either key.',
        });
      }
    }

    // 2. Check typos on EN or AR token
    if (enTok) {
      const enTypo = isTypoToken(enTok);
      if (enTypo.isTypo) {
        rowSeverity = maxSeverity(rowSeverity, 'critical');
        enSeverity = maxSeverity(enSeverity, 'critical');
        rowCategories.add('typo_malformed');
        enCats.add('typo_malformed');
        categoriesSet.add('typo_malformed');
        statusesSet.add('Typo / Broken');
        statusLabel = 'Typo / Broken';
        explanations.unshift(enTypo.reason);
        enNotes.unshift(enTypo.reason);
        issues.push({
          id: `${pairId}-typo-en-${enTok}`,
          category: 'typo_malformed',
          severity: 'critical',
          language: 'English',
          token: enTok,
          fieldId,
          title: `Malformed/misspelled English token ${enTok}`,
          explanation: enTypo.reason,
        });
      }
    }

    if (arTok) {
      const arTypo = isTypoToken(arTok);
      if (arTypo.isTypo) {
        rowSeverity = maxSeverity(rowSeverity, 'critical');
        arSeverity = maxSeverity(arSeverity, 'critical');
        rowCategories.add('typo_malformed');
        arCats.add('typo_malformed');
        categoriesSet.add('typo_malformed');
        statusesSet.add('Typo / Broken');
        statusLabel = arTok === '#PA#' ? 'Truncated Token' : 'Typo / Broken';
        explanations.unshift(arTypo.reason);
        arNotes.unshift(arTypo.reason);
        issues.push({
          id: `${pairId}-typo-ar-${arTok}`,
          category: 'typo_malformed',
          severity: 'critical',
          language: 'Arabic',
          token: arTok,
          fieldId,
          title:
            arTok === '#PA#'
              ? 'Truncated Arabic token #PA# (incomplete #PADATE#)'
              : `Malformed/misspelled Arabic token ${arTok}`,
          explanation: arTypo.reason,
        });
      }
    }

    // 3. Layer structural token-specific critical cues (swapped, misplaced, stray quote, concatenated)
    if (arTok && arSwapped.swapped && (fieldId === 'date' || fieldId === 'time')) {
      rowSeverity = maxSeverity(rowSeverity, 'critical');
      arSeverity = maxSeverity(arSeverity, 'critical');
      rowCategories.add('swapped_missing');
      arCats.add('swapped_missing');
      statusLabel = 'Swapped in AR';
      const swapMsg =
        fieldId === 'time'
          ? `Arabic places ${arTok} right after "بتاريخ" (Date), swapping Time into the Date slot.`
          : `Arabic places ${arTok} right after "الساعة" (Time), swapping Date into the Time slot.`;
      explanations.unshift(swapMsg);
      arNotes.unshift(swapMsg);
    }

    if (arTok === '#PMSGA#' && arMisplacedPmsga) {
      rowSeverity = maxSeverity(rowSeverity, 'critical');
      arSeverity = maxSeverity(arSeverity, 'critical');
      rowCategories.add('swapped_missing');
      arCats.add('swapped_missing');
      statusLabel = 'Misplaced in AR';
      const misMsg =
        'Arabic places #PMSGA# between "بتاريخ" (Date) and "#PDAY# #PAPPTDATE#", corrupting the date sentence.';
      explanations.unshift(misMsg);
      arNotes.unshift(misMsg);
    }

    if (arTok && arQuotes.includes(arTok)) {
      rowSeverity = maxSeverity(rowSeverity, 'critical');
      arSeverity = maxSeverity(arSeverity, 'critical');
      rowCategories.add('typo_malformed');
      arCats.add('typo_malformed');
      statusLabel = 'Malformed Quote';
      const qMsg = `Stray opening double quote immediately before ${arTok} ("${arTok}).`;
      explanations.unshift(qMsg);
      arNotes.unshift(qMsg);
    }

    if (
      arTok &&
      arConcats.some(([a, b]) => a === arTok || b === arTok)
    ) {
      rowSeverity = maxSeverity(rowSeverity, 'critical');
      arSeverity = maxSeverity(arSeverity, 'critical');
      rowCategories.add('typo_malformed');
      arCats.add('typo_malformed');
      if (statusLabel === 'Consistent' || statusLabel === 'Casing Drift') {
        statusLabel = 'Concatenated';
      }
      const cPair = arConcats.find(([a, b]) => a === arTok || b === arTok)!;
      const cMsg = `Concatenated without space in Arabic (${cPair[0]}${cPair[1]}), merging Facility and Day together.`;
      explanations.unshift(cMsg);
      arNotes.unshift(cMsg);
    }

    if (arTok === '#POVRPHONE#' && reversedParensAr) {
      arSeverity = maxSeverity(arSeverity, 'critical');
      arCats.add('typo_malformed');
      arNotes.unshift('Broken parentheses ") (#POVRPHONE#" around overseas phone token.');
    }

    // 4. Schema drift cues on tokens (when not already overridden by critical/mismatch)
    if (genericReminder && (fieldId === 'facility' || fieldId === 'clinic' || fieldId === 'date' || fieldId === 'day' || fieldId === 'time')) {
      rowSeverity = maxSeverity(rowSeverity, 'drift');
      enSeverity = maxSeverity(enSeverity, 'drift');
      arSeverity = maxSeverity(arSeverity, 'drift');
      rowCategories.add('schema_drift');
      enCats.add('schema_drift');
      arCats.add('schema_drift');
      if (statusLabel === 'Consistent') {
        statusLabel = 'Schema Drift';
      }
      const dMsg = `Uses generic Reminder placeholder instead of the ${mode} schema used in Confirmation/Cancellation/Reschedule.`;
      explanations.push(dMsg);
      enNotes.push(dMsg);
      arNotes.push(dMsg);
    }

    if (epCancelDrift) {
      rowSeverity = maxSeverity(rowSeverity, 'drift');
      enSeverity = maxSeverity(enSeverity, 'drift');
      arSeverity = maxSeverity(arSeverity, 'drift');
      rowCategories.add('schema_drift');
      enCats.add('schema_drift');
      arCats.add('schema_drift');
    }

    if (bstFacilityDriftEn && fieldId === 'facility') {
      rowSeverity = maxSeverity(rowSeverity, 'drift');
      enSeverity = maxSeverity(enSeverity, 'drift');
      rowCategories.add('schema_drift');
      enCats.add('schema_drift');
      enNotes.push(
        'Drifts from #PFACILITY# (BST-Confirmation) and #PFACiLITY# (BST-Cancellation) to #PFACILITYID#.'
      );
    }

    // Note cross-mode / within-mode extra info if consistent
    if (explanations.length === 0) {
      explanations.push(
        `English and Arabic both use ${enTok} identically for ${def.label}.`
      );
    }

    if (enTok) {
      enTokenMap[enTok] = {
        token: enTok,
        fieldId,
        fieldLabel: def.label,
        severity: enSeverity,
        categories: [...enCats],
        counterpartToken: arTok,
        explanation:
          enNotes.length > 0
            ? enNotes.join(' ')
            : `Matches Arabic token ${arTok ?? '(none)'} for ${def.label}.`,
      };
    }

    if (arTok) {
      arTokenMap[arTok] = {
        token: arTok,
        fieldId,
        fieldLabel: def.label,
        severity: arSeverity,
        categories: [...arCats],
        counterpartToken: enTok,
        explanation:
          arNotes.length > 0
            ? arNotes.join(' ')
            : `Matches English token ${enTok ?? '(none)'} for ${def.label}.`,
      };
    }

    fieldRows.push({
      fieldId,
      fieldLabel: def.label,
      enToken: enTok,
      arToken: arTok,
      severity: rowSeverity,
      categories: [...rowCategories],
      statusLabel,
      explanation: explanations.join(' '),
    });
  }

  // Also check within-mode casing drift for #PFACiLITY# or #PMsg# vs #PMSG#
  if (modeEnFacilities.size > 1 && en?.tokens.includes('#PFACiLITY#')) {
    categoriesSet.add('casing_drift');
    statusesSet.add('Casing Drift');
  }
  if (modeEnExtraMsgs.size > 1) {
    categoriesSet.add('casing_drift');
  }

  const statuses: PairStatusBadge[] =
    statusesSet.size === 0 ? ['Consistent'] : sortBadges([...statusesSet]);
  const categories = [...categoriesSet];
  const enTokens = new Set(en?.tokens ?? []);
  const arTokens = new Set(ar?.tokens ?? []);
  const tokenSetsMatch = !!en && !!ar && enTokens.size === arTokens.size &&
    [...enTokens].every((token) => arTokens.has(token));
  const isConsistent = categories.length === 0;
  const hasCriticalDefect = issues.some((issue) => issue.severity === 'critical');

  for (const row of fieldRows) {
    const applicable = issues.filter((issue) => issue.fieldId === row.fieldId ||
      [row.enToken, row.arToken].some((token) => token && issue.relatedTokens?.includes(token)));
    if (applicable.some((issue) => issue.severity === 'critical')) row.severity = 'critical';
    else if (row.severity === 'critical') row.severity = applicable.length ? 'mismatch' : 'drift';
    for (const issue of applicable) {
      if (!row.categories.includes(issue.category)) row.categories.push(issue.category);
    }
  }

  for (const [language, map] of [['English', enTokenMap], ['Arabic', arTokenMap]] as const) {
    for (const info of Object.values(map)) {
      const applicable = issues.filter((issue) => (issue.language === language || issue.language === 'Both') &&
        (issue.token === info.token || issue.relatedTokens?.includes(info.token) || (!issue.token && !issue.relatedTokens && issue.fieldId === info.fieldId)));
      if (applicable.some((issue) => issue.severity === 'critical')) info.severity = 'critical';
      else if (info.severity === 'critical') info.severity = applicable.length ? 'mismatch' : 'drift';
    }
  }

  return {
    pairId,
    mode,
    smsType,
    en,
    ar,
    isMissingPair: false,
    statuses,
    categories,
    isConsistent,
    hasCriticalDefect,
    fieldRows,
    issues: issues.map((issue) => withEvidence(issue, pairId)),
    tokenSetsMatch,
    enTokenMap,
    arTokenMap,
  };
}

const BADGE_ORDER: PairStatusBadge[] = [
  'Typo / Broken',
  'Swapped / Misplaced',
  'Truncated / Missing',
  'EN/AR Mismatch',
  'Casing Drift',
  'Schema Drift',
  'Source text differs',
  'Formatting difference',
  'Consistent',
];

function sortBadges(badges: PairStatusBadge[]): PairStatusBadge[] {
  return badges.sort(
    (a, b) => BADGE_ORDER.indexOf(a) - BADGE_ORDER.indexOf(b)
  );
}

/**
 * Dynamically extracts the "Top Critical Defects at a Glance" directly from the analyzed pairs,
 * ordered by patient & system risk severity.
 */
function buildCriticalDefects(allPairs: TemplatePairAnalysis[]): CriticalDefectItem[] {
  return allPairs.flatMap((pair) => pair.issues.filter((issue) => issue.severity === 'critical').map((issue) => ({
    id: issue.id,
    pairId: pair.pairId, mode: pair.mode, smsType: pair.smsType, language: issue.language,
    defectType: issue.category === 'content_difference' ? 'Content difference' as const :
      issue.category === 'formatting' ? 'Formatting' as const :
      issue.category === 'swapped_missing' ? (issue.token ? 'Swapped / Misplaced' as const : 'Truncated / Missing' as const) :
      issue.category === 'schema_drift' ? 'Schema Drift' as const : 'Typo / Broken' as const,
    token: issue.token ?? null, fieldId: issue.fieldId ?? null,
    summary: issue.title, impact: issue.explanation, evidence: issue.evidence,
  })));
}

function buildTokenMatrix(
  allTemplates: ParsedTemplate[],
  allPairs: TemplatePairAnalysis[]
): TokenMatrixFieldGroup[] {
  const pairLookup = new Map<string, TemplatePairAnalysis>();
  for (const p of allPairs) pairLookup.set(p.pairId, p);

  const byField = new Map<
    SemanticFieldId,
    Map<string, TokenMatrixOccurrence[]>
  >();

  for (const def of FIELD_DEFINITIONS) {
    byField.set(def.id, new Map());
  }

  for (const tpl of allTemplates) {
    const occurrencesBySpelling = new Map<string, number>();
    for (const tok of tpl.tokens) {
      const fieldId = getTokenField(tok);
      const tokenMap = byField.get(fieldId)!;
      if (!tokenMap.has(tok)) tokenMap.set(tok, []);
      const occurrenceIndex = occurrencesBySpelling.get(tok) ?? 0;
      occurrencesBySpelling.set(tok, occurrenceIndex + 1);
      const pair = pairLookup.get(tpl.pairId);
      const info = (tpl.language === 'English' ? pair?.enTokenMap : pair?.arTokenMap)?.[tok];
      tokenMap.get(tok)!.push({
        occurrenceIndex,
        severity: info?.severity ?? 'consistent',
        issueIds: pair?.issues.filter((issue) => (issue.language === tpl.language || issue.language === 'Both') &&
          (issue.token === tok || issue.relatedTokens?.includes(tok) || (!issue.token && !issue.relatedTokens && info && issue.fieldId === info.fieldId))).map((issue) => issue.id),
        pairId: tpl.pairId,
        mode: tpl.mode,
        smsType: tpl.smsType,
        language: tpl.language,
        token: tok,
      });
    }
  }

  const groups: TokenMatrixFieldGroup[] = [];

  for (const def of FIELD_DEFINITIONS) {
    const tokenMap = byField.get(def.id)!;
    if (tokenMap.size === 0) continue;

    const variants: TokenMatrixVariant[] = [];
    let totalOccurrences = 0;
    let hasTypos = false;

    for (const [token, occurrences] of tokenMap.entries()) {
      totalOccurrences += occurrences.length;
      const enCount = occurrences.filter((o) => o.language === 'English').length;
      const arCount = occurrences.filter((o) => o.language === 'Arabic').length;

      // Determine worst visual severity across all occurrences of this exact token
      let worstSeverity: TokenVisualSeverity = 'consistent';
      const typoCheck = isTypoToken(token);
      if (typoCheck.isTypo) {
        worstSeverity = 'critical';
        hasTypos = true;
      }

      let note = '';
      if (typoCheck.isTypo) {
        note = typoCheck.reason;
      } else if (enCount > 0 && arCount === 0) {
        note = 'Used exclusively in English templates.';
      } else if (arCount > 0 && enCount === 0) {
        note = 'Used exclusively in Arabic templates.';
      } else {
        note = `Shared across English (${enCount}) and Arabic (${arCount}) templates.`;
      }

      variants.push({
        token,
        count: occurrences.length,
        enCount,
        arCount,
        severity: worstSeverity,
        note,
        occurrences,
      });
    }

    // Sort variants: critical typos first, then by descending usage count, then alphabetically
    variants.sort((a, b) => {
      const aTypo = isTypoToken(a.token).isTypo ? 1 : 0;
      const bTypo = isTypoToken(b.token).isTypo ? 1 : 0;
      if (aTypo !== bTypo) return bTypo - aTypo;
      if (b.count !== a.count) return b.count - a.count;
      return a.token.localeCompare(b.token);
    });

    groups.push({
      fieldId: def.id,
      fieldLabel: def.label,
      meaning: def.meaning,
      variantCount: variants.length,
      totalOccurrences,
      hasTypos,
      variants,
    });
  }

  return groups;
}

/**
 * Main entry point: parses raw Dataverse SMS markdown verbatim and produces
 * the complete dynamic audit report.
 */
export function analyzeTemplatesMarkdown(markdown: string): FullAuditReport {
  const { snapshotDate, templates } = parseTemplatesMarkdown(markdown);

  const byKey = new Map<string, ParsedTemplate>();
  for (const t of templates) {
    byKey.set(t.key, t);
  }

  const modes: ModeAnalysis[] = [];
  const allPairs: TemplatePairAnalysis[] = [];

  for (const modeCode of MODE_ORDER) {
    const modeTemplates = templates.filter((t) => t.mode === modeCode);
    const pairs: TemplatePairAnalysis[] = [];

    for (const smsType of SMS_TYPE_ORDER) {
      const en = byKey.get(`${modeCode}-${smsType}-English`) ?? null;
      const ar = byKey.get(`${modeCode}-${smsType}-Arabic`) ?? null;
      const pair = buildPairAnalysis(modeCode, smsType, en, ar, modeTemplates);
      pairs.push(pair);
      allPairs.push(pair);
    }

    const missingPairCount = pairs.filter((p) => p.isMissingPair).length;
    const inconsistentPairCount = pairs.filter((p) => !p.isConsistent).length;
    const criticalCount = pairs.filter((p) => p.hasCriticalDefect).length;

    modes.push({
      code: modeCode,
      name: MODE_META[modeCode].name,
      description: MODE_META[modeCode].description,
      templateCount: modeTemplates.length,
      pairCount: pairs.length - missingPairCount,
      missingPairCount,
      inconsistentPairCount,
      criticalCount,
      schemaDriftNotes: detectModeSchemaDriftNotes(modeCode, modeTemplates),
      pairs,
    });
  }

  const criticalDefects = buildCriticalDefects(allPairs);
  const tokenMatrix = buildTokenMatrix(templates, allPairs);

  const countsByCategory: Record<IssueCategory, number> = {
    typo_malformed: 0,
    swapped_missing: 0,
    en_ar_mismatch: 0,
    casing_drift: 0,
    schema_drift: 0,
    content_difference: 0,
    formatting: 0,
  };

  const pairsByCategory: Record<IssueCategory, number> = {
    typo_malformed: 0,
    swapped_missing: 0,
    en_ar_mismatch: 0,
    casing_drift: 0,
    schema_drift: 0,
    content_difference: 0,
    formatting: 0,
  };

  for (const pair of allPairs) {
    for (const cat of pair.categories) {
      pairsByCategory[cat]++;
    }
    for (const issue of pair.issues) countsByCategory[issue.category]++;

  }

  const uniqueTokenVariants = tokenMatrix.reduce(
    (sum, g) => sum + g.variantCount,
    0
  );
  const totalTokenOccurrences = tokenMatrix.reduce(
    (sum, g) => sum + g.totalOccurrences,
    0
  );

  const summary: AuditReportSummary = {
    totalTemplates: templates.length,
    expectedTemplates: MODE_ORDER.length * SMS_TYPE_ORDER.length * 2,
    totalModes: MODE_ORDER.length,
    totalPairSlots: allPairs.length,
    populatedPairs: allPairs.filter((p) => !p.isMissingPair).length,
    missingPairs: allPairs.filter((p) => p.isMissingPair).length,
    consistentPairs: allPairs.filter((p) => p.isConsistent).length,
    inconsistentPairs: allPairs.filter((p) => !p.isConsistent).length,
    uniqueTokenVariants,
    totalTokenOccurrences,
    countsByCategory,
    pairsByCategory,
    criticalDefectCount: criticalDefects.length,
    criticalPairCount: allPairs.filter((pair) => pair.hasCriticalDefect).length,
    criticalMessageCount: allPairs.reduce((count, pair) => count +
      ([pair.en, pair.ar].filter((tpl) => tpl && pair.issues.some((issue) => issue.severity === 'critical' &&
        (issue.language === tpl.language || issue.language === 'Both'))).length), 0),
  };

  return {
    snapshotDate,
    summary,
    modes,
    allPairs,
    criticalDefects,
    tokenMatrix,
  };
}

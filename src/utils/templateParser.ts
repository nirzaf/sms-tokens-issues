import type {
  ConsultationModeCode,
  ParsedTemplate,
  SmsType,
  TemplateLanguage,
} from '../types/sms';

export const MODE_ORDER: ConsultationModeCode[] = [
  'RO',
  'TL',
  'VD',
  'DR',
  'EP',
  'BS',
  'BST',
  'CV',
  'BL',
  'SC',
];

export const SMS_TYPE_ORDER: SmsType[] = [
  'Confirmation',
  'Cancellation',
  'Reschedule',
  'Reminder',
];

export const MODE_META: Record<
  ConsultationModeCode,
  { name: string; description: string }
> = {
  RO: {
    name: 'Routine Outpatient',
    description: 'Standard primary health center clinic appointments',
  },
  TL: {
    name: 'Telephone Consultation',
    description: 'Scheduled phone consultations with clinic staff',
  },
  VD: {
    name: 'Video Consultation',
    description: 'Remote video consultations with health center clinics',
  },
  DR: {
    name: 'Drive-Through Swabbing',
    description: 'COVID-19 drive-through swabbing station visits',
  },
  EP: {
    name: 'Epidemiology Study',
    description: 'COVID-19 epidemiology study appointments (missing Reminder pair)',
  },
  BS: {
    name: 'Bowel Screening (In-Person)',
    description: 'In-person Bowel Cancer Screening clinic appointments',
  },
  BST: {
    name: 'Bowel Screening (Telephone)',
    description: 'Phone consultation appointments for Bowel Cancer Screening',
  },
  CV: {
    name: 'CV templates',
    description: 'Messages describe clinic visits and include a patient ID and contact helpline',
  },
  BL: {
    name: 'Blindness Survey',
    description: 'National Assessment of Blindness Survey ophthalmology appointments',
  },
  SC: {
    name: 'SC templates',
    description: 'Messages describe health center appointments; the official mode label is not in the snapshot',
  },
};

const VALID_MODES = new Set<string>(MODE_ORDER);
const VALID_SMS_TYPES = new Set<string>(SMS_TYPE_ORDER);
const VALID_LANGUAGES = new Set<string>(['English', 'Arabic']);

/**
 * Extracts all `#TOKEN#` placeholders verbatim in order of appearance.
 */
export function extractTokens(body: string): string[] {
  const matches = body.match(/#[A-Za-z0-9_]+#/g);
  return matches ? [...matches] : [];
}

/**
 * Splits a verbatim template body into alternating plain-text and `#TOKEN#` segments
 * without altering a single character, whitespace, or punctuation mark.
 */
export interface BodySegment {
  type: 'text' | 'token';
  value: string;
  index: number;
  hasLeadingQuote?: boolean;
  isConcatenatedLeft?: boolean;
  isConcatenatedRight?: boolean;
}

export function tokenizeTemplateBody(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  const regex = /#[A-Za-z0-9_]+#/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let segIndex = 0;

  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: body.slice(lastIndex, match.index),
        index: segIndex++,
      });
    }

    const tokenValue = match[0];
    const prevChar = match.index > 0 ? body[match.index - 1] : '';
    const nextChar = body[match.index + tokenValue.length] ?? '';

    segments.push({
      type: 'token',
      value: tokenValue,
      index: segIndex++,
      hasLeadingQuote: prevChar === '"',
      isConcatenatedLeft: prevChar === '#',
      isConcatenatedRight: nextChar === '#',
    });

    lastIndex = match.index + tokenValue.length;
  }

  if (lastIndex < body.length) {
    segments.push({
      type: 'text',
      value: body.slice(lastIndex),
      index: segIndex++,
    });
  }

  return segments;
}

/**
 * Parses the Dataverse SMS Templates markdown file strictly verbatim.
 * Discards technical metadata (Template ID, Created, Modified, Status, raw numeric codes)
 * and retains the labels, a heading line location, and exact template body text.
 */
export function parseTemplatesMarkdown(markdown: string): {
  snapshotDate: string;
  templates: ParsedTemplate[];
} {
  const normalized = markdown.replace(/\r\n/g, '\n');

  const snapshotMatch = normalized.match(/\*\*Snapshot:\*\*\s*([^\n]+)/);
  const snapshotDate = snapshotMatch ? snapshotMatch[1].trim() : '2026-11-19';

  const templates: ParsedTemplate[] = [];
  // Match each "## <MODE>-<SMS TYPE> SMS-<LANGUAGE>" block followed by its ```text ... ``` block
  const sectionRegex =
    /^##\s+([A-Z]+)-(Confirmation|Cancellation|Reschedule|Reminder)\s+SMS-(English|Arabic)\s*\n[\s\S]*?```text\n([\s\S]*?)\n```/gm;

  let match: RegExpExecArray | null;
  while ((match = sectionRegex.exec(normalized)) !== null) {
    const modeRaw = match[1];
    const smsTypeRaw = match[2];
    const languageRaw = match[3];
    const verbatimBody = match[4];

    if (
      !VALID_MODES.has(modeRaw) ||
      !VALID_SMS_TYPES.has(smsTypeRaw) ||
      !VALID_LANGUAGES.has(languageRaw)
    ) {
      continue;
    }

    const mode = modeRaw as ConsultationModeCode;
    const smsType = smsTypeRaw as SmsType;
    const language = languageRaw as TemplateLanguage;
    const pairId = `${mode}-${smsType}`;

    templates.push({
      key: `${pairId}-${language}`,
      pairId,
      mode,
      smsType,
      language,
      heading: `${mode}-${smsType} SMS-${language}`,
      sourceLine: normalized.slice(0, match.index).split('\n').length,
      body: verbatimBody,
      tokens: extractTokens(verbatimBody),
    });
  }

  return { snapshotDate, templates };
}

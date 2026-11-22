import type { SemanticFieldId, TemplateLanguage, TemplatePairAnalysis } from '../types/sms';
import { tokenizeTemplateBody } from './templateParser';

export type PairSourceSelection = {
  fieldId: SemanticFieldId | null;
  token: string | null;
  language: TemplateLanguage | null;
  sourceSegmentIndex?: number;
  sourceNotice?: 'counterpart-missing' | 'occurrence-unavailable';
};

export type SourceDestination =
  | { kind: 'token'; anchorIds: string[]; segmentIndex: number }
  | { kind: 'message' | 'pair' | 'counterpart-missing' | 'occurrence-unavailable'; anchorIds: string[] };

export type JumpToSource = (
  pairId: string,
  token: string | null,
  language: TemplateLanguage | 'Both',
  originLabel: string,
  originId?: string,
  occurrenceIndex?: number,
) => void;

export function evidenceAnchor(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts.map((part) => encodeURIComponent(String(part)))].join(':');
}

export function sourceMessageAnchor(templateKey: string): string {
  return `source-${templateKey}`;
}

export function sourceTokenAnchor(templateKey: string, segmentIndex: number): string {
  return `source-token-${templateKey}-${segmentIndex}`;
}

export function resolveSourceDestination(
  pair: TemplatePairAnalysis,
  language: TemplateLanguage | 'Both',
  token: string | null,
  occurrenceIndex = 0,
): SourceDestination {
  const card = `pair-${pair.pairId}`;
  const template = language === 'English' ? pair.en : language === 'Arabic' ? pair.ar : null;
  if (!template) return { kind: 'pair', anchorIds: [card] };
  const message = sourceMessageAnchor(template.key);
  const messageAnchors = [message, card];
  if (!token) return { kind: 'message', anchorIds: messageAnchors };

  const matches = tokenizeTemplateBody(template.body)
    .filter((part) => part.type === 'token' && part.value === token);
  if (!matches.length) return { kind: 'counterpart-missing', anchorIds: messageAnchors };
  const segment = matches[occurrenceIndex];
  if (!segment) return { kind: 'occurrence-unavailable', anchorIds: messageAnchors };
  return {
    kind: 'token',
    anchorIds: [sourceTokenAnchor(template.key, segment.index), ...messageAnchors],
    segmentIndex: segment.index,
  };
}

export function resolveSourceAnchors(
  pair: TemplatePairAnalysis,
  language: TemplateLanguage | 'Both',
  token: string | null,
  occurrenceIndex = 0,
): string[] {
  return resolveSourceDestination(pair, language, token, occurrenceIndex).anchorIds;
}

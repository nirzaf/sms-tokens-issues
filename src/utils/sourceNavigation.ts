import type { TemplateLanguage, TemplatePairAnalysis } from '../types/sms';
import { tokenizeTemplateBody } from './templateParser';

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

export function resolveSourceAnchors(
  pair: TemplatePairAnalysis,
  language: TemplateLanguage | 'Both',
  token: string | null,
  occurrenceIndex = 0,
): string[] {
  const card = `pair-${pair.pairId}`;
  const template = language === 'English' ? pair.en : language === 'Arabic' ? pair.ar : null;
  if (!template) return [card];
  const message = sourceMessageAnchor(template.key);
  const segment = token
    ? tokenizeTemplateBody(template.body)
        .filter((part) => part.type === 'token' && part.value === token)[occurrenceIndex]
    : undefined;
  return segment ? [sourceTokenAnchor(template.key, segment.index), message, card] : [message, card];
}

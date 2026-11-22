import { parseTemplatesMarkdown } from '../src/utils/templateParser.ts';

/** Allowlist snapshot date, section headings, fences and complete verbatim bodies.
 * Blank metadata lines rather than deleting them so original evidence lines survive.
 */
export function buildReportDataset(original: string): string {
  const normalized = original.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const safeLines = lines.map(() => '');
  const source = parseTemplatesMarkdown(normalized);
  const header = /^##\s+[A-Z]+-(?:Confirmation|Cancellation|Reschedule|Reminder)\s+SMS-(?:English|Arabic)\s*$/;
  const snapshot = /^-\s+\*\*Snapshot:\*\*\s*(\d{4}-\d{2}-\d{2})(?=T|\s|$)/;
  let section = false;
  let body = false;
  let sections = 0;
  let bodies = 0;

  for (const [index, line] of lines.entries()) {
    if (body) {
      safeLines[index] = line;
      if (line === '```') {
        body = false;
        section = false;
        bodies++;
      }
      continue;
    }
    if (header.test(line)) {
      if (section) throw new Error('A source section has no complete message body.');
      safeLines[index] = line;
      section = true;
      sections++;
    } else if (section && line === '```text') {
      safeLines[index] = line;
      body = true;
    } else if (sections === 0) {
      const date = snapshot.exec(line)?.[1];
      if (date) safeLines[index] = `- **Snapshot:** ${date}`;
    }
  }

  const result = safeLines.join('\n');
  const sanitized = parseTemplatesMarkdown(result);
  if (body || section || sections !== 78 || bodies !== sections ||
      source.templates.length !== sections || sanitized.templates.length !== sections ||
      new Set(sanitized.templates.map((item) => item.key)).size !== sections ||
      source.templates.some((item, index) => {
        const copy = sanitized.templates[index];
        return item.key !== copy.key || item.body !== copy.body;
      })) {
    throw new Error('The sanitized report must preserve all 78 original template bodies.');
  }
  return result;
}

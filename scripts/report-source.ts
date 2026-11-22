import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The exact audited November snapshot, not the historical browser asset copy. */
export const REPORT_SOURCE_PATH = fileURLToPath(
  new URL('../DATAVERSE_SMS_TEMPLATES_20261119.md', import.meta.url),
);
export const REPORT_SOURCE_SHA256 = 'eeecc5cafa897fe2a53d7cab33d9366e71d4f27e13e1b0770c434ce74d99aede';

export function verifyReportSourceBytes(bytes: Uint8Array): string {
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== REPORT_SOURCE_SHA256) {
    throw new Error('Report source differs from the approved snapshot; review and repin a new snapshot explicitly.');
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function readCanonicalReportSource(): string {
  return verifyReportSourceBytes(fs.readFileSync(REPORT_SOURCE_PATH));
}

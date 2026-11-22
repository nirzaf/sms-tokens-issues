import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildReportDataset } from './report-dataset';
import { parseTemplatesMarkdown } from '../src/utils/templateParser';

const raw = fs.readFileSync('DATAVERSE_SMS_TEMPLATES_20261119.md', 'utf8');

test('offline dataset retains all 78 exact bodies and source lines but no export metadata', () => {
  const sanitized = buildReportDataset(raw);
  const source = parseTemplatesMarkdown(raw);
  const result = parseTemplatesMarkdown(sanitized);
  const rawLines = raw.replace(/\r\n/g, '\n').split('\n');
  const cleanLines = sanitized.split('\n');
  assert.equal(cleanLines.length, rawLines.length);
  assert.equal(result.snapshotDate, '2026-11-19');
  assert.equal(result.templates.length, 78);
  const keyAndBody = ({ key, body }: { key: string; body: string }) => [key, body];
  assert.deepEqual(result.templates.map(keyAndBody), source.templates.map(keyAndBody));
  for (const [index, line] of rawLines.entries()) {
    if (/^- \*\*(?:Template ID|SMS type|Language|Consultation mode|Status|Created|Modified|Source|Template count):/.test(line)) {
      assert.equal(cleanLines[index], '', `Metadata at original line ${index + 1}`);
    }
    if (/^(?:##|\x60\x60\x60)/.test(line)) assert.equal(cleanLines[index], line);
  }
});

test('offline dataset refuses missing template sections rather than silently dropping them', () => {
  assert.throws(
    () => buildReportDataset(raw.slice(0, raw.lastIndexOf('\n## '))),
    /preserve all 78/,
  );
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildReportDataset } from './report-dataset';
import { parseTemplatesMarkdown } from '../src/utils/templateParser';
import { analyzeTemplatesMarkdown } from '../src/utils/analyzer';
import type { AuditReportSummary, ParsedTemplate } from '../src/types/sms';
import { readCanonicalReportSource, verifyReportSourceBytes } from './report-source.ts';
import { standaloneReport, writePrivateReport } from './export-offline.mjs';

const raw = readCanonicalReportSource();

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

test('canonical input rejects one changed byte even when the complete shape is unchanged', () => {
  const changed = Buffer.from(raw);
  const offset = changed.findIndex((byte) => byte === 0x23);
  assert.notEqual(offset, -1);
  changed[offset] ^= 1;
  assert.throws(() => verifyReportSourceBytes(changed), /differs from the approved snapshot/);
  assert.equal(verifyReportSourceBytes(Buffer.from(raw)), raw);
});

test('analysis and sanitized projection share canonical counts, unique keys and source heading lines', () => {
  const source = parseTemplatesMarkdown(raw).templates;
  const projection = parseTemplatesMarkdown(buildReportDataset(raw)).templates;
  const keys = new Set(source.map((template) => template.key));
  const independent = [...raw.matchAll(/^## (\w+)-(Confirmation|Cancellation|Reschedule|Reminder) SMS-(English|Arabic)\s*$/gm)];
  assert.equal(independent.length, 78);
  assert.equal(keys.size, independent.length);
  assert.equal(source.filter((template) => template.language === 'English').length, 39);
  assert.equal(source.filter((template) => template.language === 'Arabic').length, 39);
  const evidence = ({ key, body, sourceLine }: ParsedTemplate) => [key, body, sourceLine];
  assert.deepEqual(projection.map(evidence), source.map(evidence));
  const report = analyzeTemplatesMarkdown(raw);
  const projectedReport = analyzeTemplatesMarkdown(buildReportDataset(raw));
  const counts = ({ totalTemplates, totalModes, totalPairSlots, populatedPairs, missingPairs, uniqueTokenVariants, totalTokenOccurrences }: AuditReportSummary) => [
    totalTemplates, totalModes, totalPairSlots, populatedPairs, missingPairs, uniqueTokenVariants, totalTokenOccurrences,
  ];
  assert.deepEqual(counts(report.summary), [78, 10, 40, 39, 1, 72, 511]);
  assert.deepEqual(counts(projectedReport.summary), counts(report.summary));
});

test('standalone packaging rejects altered dataset, extra bundles and remote resources', () => {
  const embedded = `data:text/plain;charset=utf-8;base64,${Buffer.from('Synthetic body').toString('base64')}`;
  const index = '<meta charset="UTF-8"><script type="module" src="/assets/a.js"></script><link rel="stylesheet" href="/assets/a.css">';
  const read = (name: string) => name.endsWith('.js') ? `const dataset = "${embedded}";` : '.offline { color: black }';
  const good = standaloneReport(index, read, 'Synthetic body');
  assert.match(good, /Content-Security-Policy/);
  assert.throws(() => standaloneReport(index, read, 'Altered body'), /approved sanitized snapshot/);
  assert.throws(
    () => standaloneReport(index + '<script type="module" src="/assets/b.js"></script>', read, 'Synthetic body'),
    /exactly one script and one stylesheet/,
  );
  assert.throws(() => standaloneReport(index.replace(/<link[^>]+>/, ''), read, 'Synthetic body'), /exactly one/);
  assert.throws(
    () => standaloneReport(index, (file: string) => file.endsWith('.css') ? 'a{background:url(https://example.invalid/a.png)}' : read(file), 'Synthetic body'),
    /stylesheet needs extra assets/,
  );
});

test('private report output refuses to overwrite a pre-existing file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sms-offline-exclusive-'));
  const output = path.join(dir, 'sms_template_inconsistency_report.html');
  try {
    writePrivateReport(output, 'First synthetic report');
    assert.throws(() => writePrivateReport(output, 'Replacement'), { code: 'EEXIST' });
    assert.equal(fs.readFileSync(output, 'utf8'), 'First synthetic report');
    if (process.platform !== 'win32') assert.equal(fs.statSync(output).mode & 0o077, 0);
  } finally {
    // This is only the disposable synthetic test's own generated file.
    if (fs.existsSync(output)) fs.unlinkSync(output);
    fs.rmdirSync(dir);
  }
});

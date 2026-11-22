import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeTemplatesMarkdown } from './analyzer';
import { parseTemplatesMarkdown, tokenizeTemplateBody } from './templateParser';

const MD_PATH = path.resolve(
  process.cwd(),
  'public/assets/aistudio/DATAVERSE_SMS_TEMPLATES_20261119_615c15d2.md'
);
const RAW_MARKDOWN = fs.readFileSync(MD_PATH, 'utf8');

test('parses all 78 templates verbatim without metadata leakage', () => {
  const { templates, snapshotDate } = parseTemplatesMarkdown(RAW_MARKDOWN);
  assert.equal(templates.length, 78);
  assert.equal(snapshotDate, '2026-11-19T08:08:38Z');

  for (const tpl of templates) {
    assert.ok(!tpl.body.includes('Template ID:'), `Metadata leaked in ${tpl.key}`);
    assert.ok(!tpl.body.includes('stateCode='), `Status leaked in ${tpl.key}`);
    assert.ok(tpl.body.length > 20, `Body unexpectedly short in ${tpl.key}`);
  }
});

test('tokenizeTemplateBody reconstructs every verbatim body byte-for-byte', () => {
  const { templates } = parseTemplatesMarkdown(RAW_MARKDOWN);
  for (const tpl of templates) {
    const reconstructed = tokenizeTemplateBody(tpl.body)
      .map((s) => s.value)
      .join('');
    assert.equal(
      reconstructed,
      tpl.body,
      `Segment reconstruction drifted for ${tpl.key}`
    );
  }
});

test('analyzes all 10 modes, 39 populated pairs, and 1 missing EP-Reminder pair', () => {
  const report = analyzeTemplatesMarkdown(RAW_MARKDOWN);
  assert.equal(report.summary.totalTemplates, 78);
  assert.equal(report.summary.totalModes, 10);
  assert.equal(report.summary.totalPairSlots, 40);
  assert.equal(report.summary.populatedPairs, 39);
  assert.equal(report.summary.missingPairs, 1);

  const epReminder = report.allPairs.find((p) => p.pairId === 'EP-Reminder');
  assert.ok(epReminder);
  assert.equal(epReminder.isMissingPair, true);
  assert.ok(epReminder.statuses.includes('Truncated / Missing'));
});

test('verifies exact counts and detection of critical defects from attached MD file', () => {
  const report = analyzeTemplatesMarkdown(RAW_MARKDOWN);
  const byId = new Map(report.allPairs.map((p) => [p.pairId, p]));

  // 1. #PA# in CV-Cancellation AR
  const cvCanc = byId.get('CV-Cancellation')!;
  assert.ok(cvCanc.ar?.tokens.includes('#PA#'));
  assert.equal(cvCanc.arTokenMap['#PA#'].severity, 'critical');
  assert.ok(cvCanc.statuses.includes('Typo / Broken'));

  // 2. #PFACILITYNMAE# (3) & #PAFACILITYNMAE# (2) & #PAFACILITYNAME# (1)
  const facilityGroup = report.tokenMatrix.find((g) => g.fieldId === 'facility')!;
  assert.equal(
    facilityGroup.variants.find((v) => v.token === '#PFACILITYNMAE#')?.count,
    3
  );
  assert.equal(
    facilityGroup.variants.find((v) => v.token === '#PAFACILITYNMAE#')?.count,
    2
  );
  assert.equal(
    facilityGroup.variants.find((v) => v.token === '#PAFACILITYNAME#')?.count,
    1
  );

  // 3. BST-Cancellation EN #PFACiLITY# and BST-Reschedule EN #PFACILITYID#
  const bstCanc = byId.get('BST-Cancellation')!;
  assert.ok(bstCanc.en?.tokens.includes('#PFACiLITY#'));
  assert.equal(bstCanc.enTokenMap['#PFACiLITY#'].severity, 'critical');
  const bstResch = byId.get('BST-Reschedule')!;
  assert.ok(bstResch.categories.includes('schema_drift'));

  // 4. Swapped Date/Time in DR-Reminder AR, EP-Confirmation AR, EP-Reschedule AR
  for (const pid of ['DR-Reminder', 'EP-Confirmation', 'EP-Reschedule']) {
    const p = byId.get(pid)!;
    assert.ok(
      p.statuses.includes('Swapped / Misplaced'),
      `${pid} should flag Swapped / Misplaced`
    );
  }

  // 5. Misplaced #PMSGA# in TL-Confirmation AR and VD-Confirmation AR (but NOT VD-Reschedule AR)
  assert.ok(byId.get('TL-Confirmation')!.statuses.includes('Swapped / Misplaced'));
  assert.ok(byId.get('VD-Confirmation')!.statuses.includes('Swapped / Misplaced'));
  assert.ok(!byId.get('VD-Reschedule')!.statuses.includes('Swapped / Misplaced'));

  // 6. Truncated SC-Confirmation AR (5 tokens vs 10 EN) and BS-Confirmation AR tail cut-off
  const scConf = byId.get('SC-Confirmation')!;
  assert.equal(scConf.en?.tokens.length, 10);
  assert.equal(scConf.ar?.tokens.length, 5);
  assert.ok(scConf.statuses.includes('Truncated / Missing'));

  const bsConf = byId.get('BS-Confirmation')!;
  assert.ok(bsConf.statuses.includes('Truncated / Missing'));

  // 7. Stray double quote "#PAPPTDATE# in TL-Cancellation AR and VD-Cancellation AR
  assert.ok(byId.get('TL-Cancellation')!.statuses.includes('Typo / Broken'));
  assert.ok(byId.get('VD-Cancellation')!.statuses.includes('Typo / Broken'));

  // 8. Concatenated #PFACILITY##PDAY# in BL-Confirmation AR and BL-Cancellation AR
  assert.ok(byId.get('BL-Confirmation')!.statuses.includes('Formatting difference'));
  assert.ok(byId.get('BL-Cancellation')!.statuses.includes('Formatting difference'));

  // 9. Missing #PNAME# in DR-Cancellation AR and DR-Reschedule AR
  assert.ok(byId.get('DR-Cancellation')!.statuses.includes('Truncated / Missing'));
  assert.ok(byId.get('DR-Reschedule')!.statuses.includes('Truncated / Missing'));

  // 10. Consistent EN/AR pairs: BL-Reschedule & BS-Cancellation
  assert.equal(byId.get('BL-Reschedule')!.isConsistent, false);
  assert.ok(byId.get('BL-Reschedule')!.issues.some((issue) => issue.category === 'formatting'));
  assert.equal(byId.get('BS-Cancellation')!.isConsistent, true);
  assert.equal(report.summary.consistentPairs, 1);
  assert.equal(report.summary.inconsistentPairs, 39);
});


test('separates snapshot observations, source severity, and token spelling inventory', () => {
  const report = analyzeTemplatesMarkdown(RAW_MARKDOWN);
  const byId = new Map(report.allPairs.map((pair) => [pair.pairId, pair]));
  for (const pair of report.allPairs) {
    assert.equal(pair.hasCriticalDefect, pair.issues.some((issue) => issue.severity === 'critical'));
    assert.equal(new Set(pair.issues.map((issue) => issue.id)).size, pair.issues.length);
  }
  assert.equal(report.allPairs.flatMap((pair) => pair.issues).filter((issue) => issue.id.includes('-prose-joins-')).length, 28);
  const missing = byId.get('EP-Reminder')!.issues[0];
  assert.match(missing.explanation, /supplied snapshot/);
  assert.equal(missing.runtimeStatus, 'Not verified');
  for (const pairId of ['BST-Reminder', 'CV-Reminder', 'RO-Reschedule', 'BL-Reminder', 'EP-Cancellation']) {
    assert.ok(byId.get(pairId)!.issues.some((issue) => issue.category === 'content_difference' && issue.evidence?.length));
  }
  assert.equal(report.summary.criticalPairCount, new Set(report.criticalDefects.map((item) => item.pairId)).size);
  assert.equal(report.summary.criticalDefectCount, report.criticalDefects.length);
  const name = report.tokenMatrix.flatMap((group) => group.variants).find((item) => item.token === '#PNAME#')!;
  assert.equal(name.severity, 'consistent');
  assert.equal(name.count, 40);
  assert.ok(name.occurrences.every((occurrence) => typeof occurrence.occurrenceIndex === 'number'));
});

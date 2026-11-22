import test from 'node:test';
import assert from 'node:assert/strict';
import type { TemplatePairAnalysis } from '../types/sms';
import { parseTemplatesMarkdown } from './templateParser';
import { evidenceAnchor, resolveSourceAnchors } from './sourceNavigation';

const markdown = [
  '# Snapshot', '', '## BL-Confirmation SMS-Arabic', '',
  '- **Template ID:** hidden-test-metadata',
  '```text', '#Token# / #Token#  ', '```',
].join('\r\n');
const [ar] = parseTemplatesMarkdown(markdown).templates;
const pair = {
  pairId: 'BL-Confirmation', mode: 'BL', smsType: 'Confirmation',
  en: null, ar, isMissingPair: false, statuses: [], categories: [],
  isConsistent: false, hasCriticalDefect: false, fieldRows: [], issues: [],
  enTokenMap: {}, arTokenMap: {},
} satisfies TemplatePairAnalysis;

test('source headings retain original one-based line without exposing record metadata', () => {
  assert.equal(ar.sourceLine, 3);
  assert.equal(ar.body, '#Token# / #Token#  ');
  assert.equal(ar.tokens.length, 2);
  assert.ok(!Object.values(ar).includes('hidden-test-metadata'));
  assert.equal(parseTemplatesMarkdown(markdown.replaceAll('\r\n', '\n')).templates[0].sourceLine, 3);
});

test('source jumps select the requested occurrence in the right language', () => {
  assert.deepEqual(resolveSourceAnchors(pair, 'Arabic', '#Token#', 1), [
    'source-token-BL-Confirmation-Arabic-2', 'source-BL-Confirmation-Arabic', 'pair-BL-Confirmation',
  ]);
  assert.deepEqual(resolveSourceAnchors(pair, 'Arabic', '#NotPresent#'), [
    'source-BL-Confirmation-Arabic', 'pair-BL-Confirmation',
  ]);
  assert.deepEqual(resolveSourceAnchors(pair, 'English', '#Token#'), ['pair-BL-Confirmation']);
  const absent = { ...pair, ar: null, pairId: 'EP-Reminder' };
  assert.deepEqual(resolveSourceAnchors(absent, 'Both', null), ['pair-EP-Reminder']);
});

test('matrix return anchors distinguish repeated occurrences and bilingual evidence', () => {
  const en0 = evidenceAnchor('matrix', '#Token#', 'BL-Confirmation', 'English', 0);
  const en1 = evidenceAnchor('matrix', '#Token#', 'BL-Confirmation', 'English', 1);
  const ar0 = evidenceAnchor('matrix', '#Token#', 'BL-Confirmation', 'Arabic', 0);
  assert.equal(new Set([en0, en1, ar0]).size, 3);
  assert.equal(en0, evidenceAnchor('matrix', '#Token#', 'BL-Confirmation', 'English', 0));
});

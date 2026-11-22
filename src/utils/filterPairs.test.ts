import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { analyzeTemplatesMarkdown } from './analyzer';
import { DEFAULT_FILTERS, hasAnyActiveFilter, pairMatchesFilters } from './filterPairs';

const MD_PATH = path.resolve(
  process.cwd(),
  'public/assets/aistudio/DATAVERSE_SMS_TEMPLATES_20261119_615c15d2.md'
);
const RAW_MARKDOWN = fs.readFileSync(MD_PATH, 'utf8');

test('filterPairs filters by mode, smsType, category, exactToken, search, and inconsistent-only accurately', () => {
  const report = analyzeTemplatesMarkdown(RAW_MARKDOWN);

  assert.equal(hasAnyActiveFilter(DEFAULT_FILTERS), false);

  const allMatching = report.allPairs.filter((p) =>
    pairMatchesFilters(p, DEFAULT_FILTERS)
  );
  assert.equal(allMatching.length, 40);

  const onlyInconsistent = report.allPairs.filter((p) =>
    pairMatchesFilters(p, { ...DEFAULT_FILTERS, onlyInconsistent: true })
  );
  assert.equal(onlyInconsistent.length, 38);

  const exactNmae = report.allPairs.filter((p) =>
    pairMatchesFilters(p, { ...DEFAULT_FILTERS, exactTokenFilter: '#PFACILITYNMAE#' })
  );
  assert.equal(exactNmae.length, 3);
  assert.deepEqual(
    exactNmae.map((p) => p.pairId),
    ['CV-Confirmation', 'CV-Cancellation', 'CV-Reschedule']
  );

  const searchPa = report.allPairs.filter((p) =>
    pairMatchesFilters(p, { ...DEFAULT_FILTERS, searchQuery: '#PA#' })
  );
  assert.equal(searchPa.length, 1);
  assert.equal(searchPa[0].pairId, 'CV-Cancellation');
});

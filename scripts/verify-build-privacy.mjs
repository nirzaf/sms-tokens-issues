import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildReportDataset } from './report-dataset.ts';
import { readCanonicalReportSource } from './report-source.ts';
import { parseTemplatesMarkdown } from '../src/utils/templateParser.ts';

const htmlFile = process.argv[2];
if (!htmlFile) throw new Error('Pass the generated private standalone HTML path.');
const raw = readCanonicalReportSource();
const expected = buildReportDataset(raw);
const original = parseTemplatesMarkdown(raw).templates;
const recordIds = [...raw.matchAll(/^- \*\*Template ID:\*\*\s*`?([0-9a-f-]{36})/gim)]
  .map((row) => row[1].toLowerCase());
assert.equal(new Set(recordIds).size, 78, 'Expected 78 fixture record identifiers.');

function checkNoIdentifiers(text, surface) {
  const lowered = text.toLowerCase();
  assert.ok(!recordIds.some((id) => lowered.includes(id)), `${surface} contains an original record identifier.`);
}

for (const dir of ['dist', 'private-dist']) {
  const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter((file) => file.isFile());
  assert.equal(files.length, 3, `${dir}: Expected HTML, JS and CSS only.`);
  for (const file of files) {
    assert.match(file.name, /\.(html|js|css)$/);
    const content = fs.readFileSync(path.join(file.parentPath, file.name), 'utf8');
    checkNoIdentifiers(content, dir);
    if (dir === 'dist') {
      assert.doesNotMatch(content, /data:text\/plain;charset=utf-8;base64,/);
      assert.ok(!original.some(({ body }) =>
        content.includes(body) || content.includes(JSON.stringify(body).slice(1, -1))
      ), 'A complete original message body is included in public output.');
      if (file.name.endsWith('.js')) assert.match(content, /No internal dataset is packaged/);
    }
  }
}
const html = fs.readFileSync(htmlFile, 'utf8');
const embedded = [...html.matchAll(/data:text\/plain;charset=utf-8;base64,([A-Za-z0-9+/]+={0,2})/g)];
assert.equal(embedded.length, 1);
const decoded = Buffer.from(embedded[0][1], 'base64').toString('utf8');
assert.equal(decoded === expected, true, 'Embedded dataset differs from the approved projection.');
checkNoIdentifiers(html, 'standalone HTML');
checkNoIdentifiers(decoded, 'embedded dataset');
assert.doesNotMatch(decoded, /^- \*\*(?:Template ID|Consultation mode|Status|Created|Modified):/m);
assert.doesNotMatch(html, /DATAVERSE_SMS_TEMPLATES_[^"']{0,120}\.md/);
const skeleton = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
assert.doesNotMatch(skeleton, /(?:src|href|srcset)\s*=|https?:\/\//i);
assert.match(skeleton, /Content-Security-Policy/);
assert.equal(fs.statSync(htmlFile).mode & 0o077, 0, 'Standalone report is not owner-only.');
console.log('PASS static privacy: 78 exact sanitized messages; no original IDs; public build contains no dataset; no external markup assets.');

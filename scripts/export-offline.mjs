import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReportDataset } from './report-dataset.ts';
import { readCanonicalReportSource } from './report-source.ts';

const csp = "default-src 'none'; connect-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'";
const dataUrl = /data:text\/plain;charset=utf-8;base64,([A-Za-z0-9+/]+={0,2})/g;

export function standaloneReport(index, readAsset, expectedDataset) {
  let html = index.replace(/<link\b[^>]*\bhref="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>/gi, '');
  const scriptTag = /<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc="([^"]+)")[^>]*><\/script>/gi;
  const stylesheetTag = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>/gi;
  if ([...html.matchAll(scriptTag)].length !== 1 || [...html.matchAll(stylesheetTag)].length !== 1 ||
      /<(?:script|link|iframe|object|embed|img|audio|video|source)\b/i.test(
        html.replace(scriptTag, '').replace(stylesheetTag, ''),
      )) {
    throw new Error('Expected exactly one script and one stylesheet and no additional required resources.');
  }
  function bundle(url, ext) {
    if (!new RegExp(`^/assets/[A-Za-z0-9._-]+\\.${ext}$`).test(url)) {
      throw new Error(`Expected a single local Vite ${ext} bundle.`);
    }
    return readAsset(url.slice(1));
  }
  html = html.replace(scriptTag, (_tag, url) => {
    const js = bundle(url, 'js');
    const datasets = [...js.matchAll(dataUrl)];
    if (datasets.length !== 1 || datasets[0][1] !== Buffer.from(expectedDataset).toString('base64')) {
      throw new Error('The built dataset does not exactly match the approved sanitized snapshot. Rebuild privately.');
    }
    if (/<\/script|\bimport\s*\(|\bnew\s+(?:Shared)?Worker\s*\(/i.test(js)) {
      throw new Error('The script needs extra assets or contains an inline closing tag.');
    }
    return `<script type="module">${js}</script>`;
  }).replace(stylesheetTag, (_tag, url) => {
    const css = bundle(url, 'css');
    if (/<\/style|@import\s/i.test(css) ||
        [...css.matchAll(/\burl\(\s*(['"]?)(.*?)\1\s*\)/gi)].some(([, , value]) => !value.startsWith('data:'))) {
      throw new Error('The stylesheet needs extra assets or contains an inline closing tag.');
    }
    return `<style>${css}</style>`;
  });
  const meta = /<meta charset="UTF-8"\s*\/?>/i;
  if (!meta.test(html)) throw new Error('Offline policy could not be installed after the charset declaration.');
  return html.replace(meta, (tag) =>
    `${tag}\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`);
}

export function writePrivateReport(output, html) {
  if (!output || path.basename(output) !== 'sms_template_inconsistency_report.html') {
    throw new Error('Supply a private output path ending in sms_template_inconsistency_report.html.');
  }
  const parent = fs.statSync(path.dirname(output));
  if (!parent.isDirectory() ||
      (process.platform !== 'win32' && (parent.mode & 0o077) !== 0)) {
    throw new Error('Choose an owner-only output directory for the private report.');
  }
  fs.writeFileSync(output, html, { flag: 'wx', mode: 0o600 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const expected = buildReportDataset(readCanonicalReportSource());
  const dist = path.resolve('private-dist');
  const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  const readAsset = (file) => fs.readFileSync(path.join(dist, file), 'utf8');
  writePrivateReport(process.argv[2], standaloneReport(index, readAsset, expected));
  console.log('Wrote one private, self-contained offline report.');
}

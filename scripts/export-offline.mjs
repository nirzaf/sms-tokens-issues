import fs from 'node:fs';
import path from 'node:path';

const output = process.argv[2];
if (!output || path.basename(output) !== 'sms_template_inconsistency_report.html') {
  throw new Error('Supply a private output path ending in sms_template_inconsistency_report.html.');
}
let html = fs.readFileSync('private-dist/index.html', 'utf8');
function readBundle(url, ext) {
  if (!new RegExp(`^/assets/[A-Za-z0-9._-]+\\.${ext}$`).test(url)) {
    throw new Error(`Expected a single local Vite ${ext} bundle.`);
  }
  return fs.readFileSync(path.join('private-dist', url.slice(1)), 'utf8');
}

const scriptTag = /<script\b(?=[^>]*\btype="module")(?=[^>]*\bsrc="([^"]+)")[^>]*><\/script>/gi;
const stylesheetTag = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="([^"]+)")[^>]*>/gi;
html = html.replace(/<link\b[^>]*\bhref="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>/gi, '');
if ([...html.matchAll(scriptTag)].length !== 1 || [...html.matchAll(stylesheetTag)].length !== 1) {
  throw new Error('Expected one script and one stylesheet; refusing to produce a partial report.');
}
html = html.replace(scriptTag, (_tag, url) => {
  const js = readBundle(url, 'js');
  if (/<\/script/i.test(js)) throw new Error('Script contains an inline closing tag.');
  return `<script type="module">${js}</script>`;
}).replace(stylesheetTag, (_tag, url) => {
  const css = readBundle(url, 'css');
  if (/<\/style/i.test(css) || /@import\s/i.test(css)) {
    throw new Error('Stylesheet contains an external import or inline closing tag.');
  }
  return `<style>${css}</style>`;
});
if (/<script\b[^>]*\bsrc=|<link\b[^>]*\bhref=|<(?:iframe|object|embed)\b/i.test(html)) {
  throw new Error('Unbundled resource found; refusing to produce an offline report.');
}
const csp = "default-src 'none'; connect-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'";
html = html.replace(/<meta charset="UTF-8"\s*\/>/i, (tag) =>
  `${tag}\n    <meta http-equiv="Content-Security-Policy" content="${csp}">`);
if (!html.includes('Content-Security-Policy')) throw new Error('Offline policy was not installed.');
fs.writeFileSync(output, html, { flag: 'wx', mode: 0o600 });
console.log('Wrote one private, self-contained offline report.');

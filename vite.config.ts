import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { buildReportDataset } from './scripts/report-dataset.ts';

import { readCanonicalReportSource, REPORT_SOURCE_PATH } from './scripts/report-source.ts';
const datasetDeclaration = /^const DATASET_PATH = ['"]\/assets\/aistudio\/DATAVERSE_SMS_TEMPLATES_20261119_615c15d2\.md['"];$/m;

export default defineConfig(({ mode }) => {
  const privateReport = mode === 'private-report';
  // Never copy internal export files into dist. Explicit private builds keep
  // derived text in a distinct owner-only output directory for offline export.
  if (privateReport && process.platform !== 'win32') process.umask(0o077);
  return {
    publicDir: false,
    plugins: [
      {
        name: 'embed-allowlisted-sms-dataset-in-private-build-only',
        enforce: 'pre',
        transform(code, id) {
          if (path.resolve(id) !== path.resolve(import.meta.dirname, 'src/App.tsx')) return;
          if (!datasetDeclaration.test(code)) throw new Error('Could not locate the report dataset declaration.');
          let dataUrl = '';
          if (privateReport) {
            this.addWatchFile(REPORT_SOURCE_PATH);
            const dataset = buildReportDataset(readCanonicalReportSource());
            dataUrl = `data:text/plain;charset=utf-8;base64,${Buffer.from(dataset).toString('base64')}`;
          }
          return code.replace(datasetDeclaration, () => `const DATASET_PATH = ${JSON.stringify(dataUrl)};`);
        },
      },
      react(),
      tailwindcss(),
    ],
    build: { cssCodeSplit: false, outDir: privateReport ? 'private-dist' : 'dist' },
    resolve: { alias: { '@': import.meta.dirname } },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/DATAVERSE_SMS_TEMPLATES_*.md'] },
    },
  };
});

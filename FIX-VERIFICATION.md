# SMS template audit remediation verification

Baseline: GitHub `main` `a42bdd4527261bbadff3a7ddeee7026f338aede8`.
Local branch: `codex/sms-atomic-remediation`. This is unpushed branch-local
verification, not a release or a change to Dataverse, SMS sending, replacement
keys or appointment rules. The tested 20-file candidate (before adding this
receipt) has SHA-256 manifest
`a1a6e6f53d6c8709ae27aeffcdba35e9f952b81ee443d658ca43d53be41c389e`
(sorted paths; each row is path, NUL, file SHA-256, newline).

## Task disposition

| Task | Status | Evidence |
| --- | --- | --- |
| SEC-01 | Blocked on owner decision | The existing public repository and history contain two tracked original snapshot copies. No authorization for that public distribution or independently verified hosted deployment. Both copies are unchanged; default-build exclusion is not containment. |
| SRC-01 | Implemented and tested | Local analysis, projection tests and the private build read one exact checksum-gated source. The historic copy is not a second fixture; it is left in place pending the source owner's decision. Altered-byte and incomplete-source tests fail closed. |
| ACC-01–05 | Implemented and tested | Snapshot-only absence; explicit defect classifications; suspected spellings and delivery uncertainty; added source observations; separate rule-based and exact-token-set metrics. |
| NAV-01 | Implemented; source and unit checked | Source heading lines and exact message/occurrence target IDs remain distinct; absent counterparts have a message-level fallback; no record IDs required. |
| NAV-02 | Offline browser and unit checks passed | Real Chrome covered the six snapshot interaction scenarios and a separate synthetic duplicate-occurrence scenario below. |
| OFF-01 | Static, executable packaging and offline browser checks passed | One-file generation, exact source projection, privacy scans, refusal of altered/extra/incomplete input, and non-overwrite behavior passed. The independent local Chrome run opened the standalone artifact directly via `file://` with no external requests or browser errors observed. |
| OFF-02 | Implemented | Default no-dataset behavior, neutral metadata and controlled/private build instructions documented separately. |
| QA-01/DOC-01 | Automated and offline browser checks complete; policy gates open | Local evidence below. Sender contract, approved bilingual wording, runtime routing and release approval remain unverified and outside this source audit. |

## Executed checks

- Node `24.22.3`, npm `11.19.1`. In a new owner-only scratch directory with
  only package metadata, `npm ci --ignore-scripts --no-audit --no-fund` passed
  (179 dependencies). No install scripts or dependency bypass flags were used.
- `npm test`: **17 passed**, 0 failures; `npm run lint` (TypeScript) passed.
- `npm run build` and `npm run build:private` passed with Vite 8.3.8.
- `npm run export:offline -- <owner-only-destination>` generated one HTML
  (404,010 bytes, mode 0600). The second invocation refused to overwrite it.
  `node scripts/verify-build-privacy.mjs <report>` passed: exact embedded
  projection; 78 original record IDs absent; public artifact has no source
  text or dataset; no separate resource in standalone HTML markup.
- `git diff --check` passed. Both source copies are untouched; private
  artifacts and dependencies are excluded from Git.
- Independent Mac Chrome `158.0.8127.37` opened the frozen candidate's
  standalone HTML via `file://`. Build input identity was checked against
  the 27-file production manifest SHA-256
  `b9f3cfb304ef3d1a33a28ac60f47e542e78879098462a8b46556a94bfb13db2b`;
  the canonical data checksum was checked separately. Chrome verified all
  78 exact bodies and source
  heading lines, all 511 token occurrences and all 40 mode/type slots. No
  external request or browser error was observed during the check.
- Six browser scenarios passed: matrix navigation from a non-home mode with
  filters, tray and focus restored on return; navigation through a
  category-hidden mode note; restoration of a previously collapsed section;
  existing-message fallback when the Arabic counterpart is absent; return
  navigation from both SC language headings; and 390px RTL, keyboard and
  reduced-motion behavior.
- The source has no repeated identical spelling within a single message.
  A separate in-memory synthetic Chrome case verified occurrence indices 0
  and 1 each focus the distinct target, mark exactly one token, and restore
  the exact originating button on return, with zero external requests.
  Unit tests also cover these indices. The canonical source was not changed.
  The earlier cloud Chromium startup was blocked by local socket permissions;
  no sandbox was weakened.

## Comparison and scope

The snapshot still contains **78** exact bodies, **39** populated bilingual
pairs and **1** absent slot of **40**, **72** literal token spellings and
**511** occurrences. **38 of 39** populated pairs have at least one implemented
rule observation. The **18** high-priority findings span **15** pairs and **19**
messages; these count different things and are not failed or delivered SMS
totals. Coverage review is separate from high-priority source findings.

Touched areas: snapshot/build/export tooling under `scripts/`; `vite.config.ts`
and `index.html`; audit types, analyzer/filter/navigation and tests under
`src/`; UI components, README and this receipt. The report still contains
internal message text. It is not approved for upload, hosting or public release,
and public-source custody/history questions remain open.

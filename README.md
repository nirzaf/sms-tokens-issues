# Dataverse SMS template audit

This is an internal, point-in-time audit. Treat the original Dataverse exports
and their rendered message bodies as internal. A public repository can
expose tracked source and history even when the default deployed assets contain
no templates. A default build is not a containment measure. Public-source
authorization has not been verified. Do not publish or share any of that
content without approval. This report distinguishes stored differences
from actual delivery behavior.

## Local verification

Use Node 24 and npm 11.19.1. The npm lockfile is authoritative.

```sh
npm ci --ignore-scripts
npm test
npm run lint
npm run build
```

The default Vite build (`dist/`) deliberately contains **no internal dataset**
and displays a notice instead of the report. The same is true of
`npm run dev`. Neither needs raw source input. Both development commands
bind to loopback. The full source-based tests need the exact approved snapshot
in a restricted checkout.
Do not substitute a private build for a public or automated deployment.

## Single-file private offline report

Use an owner-only checkout with the approved root export
`DATAVERSE_SMS_TEMPLATES_20261119.md` available. The private build reads, but does
not alter, that file. It refuses any byte change against the frozen snapshot
checksum; an updated snapshot requires explicit review and repinning. The
legacy browser asset copy is not a separate test fixture or build source. It
remains untouched pending the source owner’s custody decision. The private
projection retains all 78 exact template bodies, their headings,
and the snapshot calendar date, while removing export IDs, metadata timestamps,
numeric codes and status fields. Source line offsets are retained with blank
padding. Neither build copies the raw source files into its output.

```sh
umask 077
private_dir=$(mktemp -d)
npm run build:private
npm run export:offline -- "$private_dir/sms_template_inconsistency_report.html"
```

The intermediate `private-dist/` directory and final HTML both contain internal
template bodies. Keep them private; do not upload or serve them. Open the HTML
directly without a web server. Its assets and minimized dataset are embedded,
and its document policy prevents external resource loads. The export command
requires a new owner-only destination and does not overwrite an existing
report or accept a stale build. `npm run dev:private` is the separate restricted
loopback development mode, not a hosted deployment command. Obtain or
generate a private report only through an approved internal access path.

Optional static privacy check after both builds and export:

```sh
node scripts/verify-build-privacy.mjs "$private_dir/sms_template_inconsistency_report.html"
```

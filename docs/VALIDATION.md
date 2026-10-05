# Validation and limits

The 0.1.0-local.2 implementation passed TypeScript typecheck/build, official n8n-node CLI lint, unsuppressed official ESLint rules, and 78 mocked tests on October 5, 2026. The repository publication checkout is checked again before its initial commit. No actual customer credentials, provider inference, paid evidence requests or purchases are used by these tests.

Run from a clean checkout using Node 24 and npm:

```sh
npm ci --ignore-scripts
npm run typecheck
npm run build
npm test
npm run lint
node node_modules/eslint/bin/eslint.js . --no-inline-config
npm pack --ignore-scripts
```

Native headless validation used n8n 2.40.7, n8n-core 2.40.3, n8n-workflow 2.40.1 and Node 24.19.0. The actual PackageDirectoryLoader, Workflow and ExecuteContext loaded the client and ran the free quote fixture. The actual AI-tool conversion, schema and DynamicStructuredTool accepted the node; an explicit fixture callback connected model arguments to node execution. Credential policy was excluded from model arguments; model-only authorization and changed property/key requests were rejected. An exact approved synthetic request reached only a mocked authenticated transport.

That native fixture is narrower than an end-to-end AI-agent scheduler or editor test. Neither editor installation, a full agent/model conversation, real credential validation nor live fulfillment was tested. Native runtime settings were an in-memory fixture; no config/key/account was created, no listener started, and no network connection attempted.

Paid approvals default to empty. Tests cover exact scope/key/expiry binding, malformed and oversized policies, forged model arguments, all-item preflight, expiry between items, stable idempotency, fixed destinations, disabled redirects, safe errors and response redaction. Credential editors remain trusted. This is not authenticated customer consent, a server-side budget limit, or independent receipt signature verification.

The npm package remains private and unpublished. No active GitHub Actions workflow, npm credential, trusted publisher, or Creator Portal submission is included. Passing local checks does not establish n8n approval or replace a later registry package scan. Internal review receipts and machine-specific harness files are intentionally not part of the public repository.

# Validation and limits

The 0.1.0 release preparation retains the tested 0.1.0-local.2 runtime implementation. TypeScript typecheck/build, 78 mocked tests, official n8n-node CLI lint and unsuppressed ESLint all passed again on October 6, 2026. No actual customer credentials, provider inference, paid evidence requests or purchases are used by these tests.

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

The October 5 headless fixture was narrower than an end-to-end AI-agent scheduler or editor test. Its settings were in memory and it started no listener or account. The following October 6 tests close the editor and native-agent execution gaps using isolated fixtures.

## Actual editor and full-agent tests — October 6, 2026

An isolated n8n 2.40.7 server, fresh local SQLite database and synthetic local owner
were exercised using headless Chromium. The existing compiled client was loaded
through n8n's custom-node development directory. Both the ordinary node and its
generated AI Tool appeared in the editor. A manual-trigger quote workflow was
executed through the editor's Execute workflow button and reported success. The
tool's parameter dialog, expressions and operation selector were visually checked.

Six separate workflows used n8n's actual AI Agent 3.1, OpenAI Chat Model node 1.3,
generated CivicDataForge Tool, native credentials and workflow engine. A
deterministic OpenAI-compatible model on loopback returned a tool call, received
the actual tool result, then returned a final answer. This is a complete native
agent/tool execution path with a synthetic model, not a custom argument-to-node
callback or a test of a live LLM's reasoning.

| Scenario | Native result | CDF mock requests |
|---|---|---:|
| Free scope check | `scope_ready_not_evidence` returned to agent | 1 quote |
| Exact approved evidence | `REVIEW_REQUIRED`, explicit verification limits, stable key | 1 evidence |
| Empty approval policy | `OPERATOR_APPROVAL_REQUIRED` returned to agent | 0 |
| Model changes property | `OPERATOR_APPROVAL_REQUIRED` returned to agent | 0 |
| Model changes request key | `OPERATOR_APPROVAL_REQUIRED` returned to agent | 0 |
| Usage read | Authenticated usage returned to agent | 1 usage |

Every scenario contained two model turns and one actual n8n tool invocation.
Denial scenarios complete the agent workflow with an error tool result; workflow
success does not mean paid evidence succeeded. Stored execution results and
transport logs were checked separately. The three compiled runtime files matched
the release working tree byte for byte.

CDF responses were mocked at n8n's outbound transport boundary; node logic,
credential resolution/authentication and tool invocation remained real. External
socket connections were blocked, including attempted n8n background registry
refreshes. The model endpoint was loopback-only. No paid calls occurred. The native credential-test endpoint also returned OK after one authenticated mocked GET to `/api/v1/usage`; no evidence execution occurred. See [machine-readable native validation](native-validation.json).

This validates custom-node development loading, not npm registry installation or
n8n Cloud availability. Actual customer credentials, live model/provider behavior,
paid fulfillment and external review remain separate. Test-only owner credentials,
database, runtime instrumentation and raw execution state are not published.

Paid approvals default to empty. Tests cover exact scope/key/expiry binding, malformed and oversized policies, forged model arguments, all-item preflight, expiry between items, stable idempotency, fixed destinations, disabled redirects, safe errors and response redaction. Credential editors remain trusted. This is not authenticated customer consent, a server-side budget limit, or independent receipt signature verification.

## Published 0.1.0 verification — October 6, 2026

[GitHub Actions run 37446661910](https://github.com/equinoxaifinance-rgb/n8n-nodes-civicdataforge/actions/runs/37446661910) published version 0.1.0 with provenance from commit `78b540e67095475543d5ffda4b469c36ee182bec`. The registry tarball SHA-256 is `d89a5403ad2644ce8a3291a76d63b760bcdbd26ca7123fe9e8351efb594c94d7`, identical to the reviewed candidate. All 11 installed files matched the registry artifact.

Official scanner 0.38.0 returned explicit `passed: true` after checking provenance metadata, fetching the attested source and analyzing source plus registry package with inline suppressions disabled. A fresh install with n8n-workflow 2.40.1 loaded the node and credential, exercised the free-quote fixture, and blocked unapproved paid execution before transport. npm signature auditing passed with 160 verified registry signatures and 26 verified attestations across that fresh installation. A separate live free check through the actual node and native n8n HTTP helper returned `scope_ready_not_evidence`; no payment or evidence collection occurred.

Version 0.1.1 changes documentation and version metadata only. Prior native editor/agent results apply to unchanged runtime bytes; registry scanning must still run for each published version. n8n verification remains pending. The workflow creates neither a trusted-publisher relationship nor a Creator Portal submission. Internal review receipts and machine-specific harness files remain outside this repository.

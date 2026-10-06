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

The npm release is prepared but unpublished. A manually dispatched provenance
workflow is included; no npm credential, trusted-publisher relationship or Creator
Portal submission is created by it. Passing local checks does not establish n8n
approval or replace the registry package scan. Internal review receipts and
machine-specific harness files are intentionally not part of the public repository.

# CivicDataForge n8n node

This TypeScript client connects to CivicDataForge's existing REST service. Version 0.1.0 is prepared for publication; npm publication and n8n verification remain pending. It is not an approved community node, partnership, hosted agent, or paid-service entitlement. The release workflow runs only on an explicit manual dispatch bound to an exact version and commit.

## Operations

| Operation | Service endpoint | Authorization and effect |
|---|---|---|
| Check Property Scope (default) | POST `/api/quote` | No key; free scope check, no evidence collection or purchase |
| Get Property Evidence | POST `/api/v1/evidence` | Customer CDF API key, exact unexpired operator approval in the selected credential, Customer Authorized acknowledgment, stable caller idempotency key; potentially billable execution under existing entitlement |
| Get Usage | GET `/api/v1/usage` | Customer CDF key; reads usage without collecting evidence |

All calls use `https://civicdataforge.pages.dev`. No arbitrary host, redirects, MCP, Apify token, checkout, subscription, account provisioning, trigger or schedule is exposed. n8n credentials store the key; do not embed it in workflow JSON. Credential testing reads usage only. CDF onboarding/terms: https://civicdataforge.pages.dev/connect-agent . Service and n8n hosting charges are separate from this MIT client.

Scope: one public US property address, exact supported jurisdiction/city, and two-letter state per item. The UI is not a promise of jurisdiction coverage; the service rejects unsupported inputs. Inputs are intentionally narrower than the full CDF API. `retentionDays:0` is a request field, not a promise that n8n execution history or downstream providers delete data. Configure your own execution retention before processing sensitive information.

## Start free, then connect paid evidence

1. After npm publication, install `n8n-nodes-civicdataforge` in a self-hosted n8n instance that permits community nodes. The MIT connector has no license fee; n8n hosting and CDF evidence are separate costs. n8n Cloud availability requires separate n8n verification.
2. Import [the inactive free example](https://github.com/equinoxaifinance-rgb/n8n-nodes-civicdataforge/blob/main/examples/free-property-scope.workflow.json), enter one public address/city/state and execute manually. No credential is needed. Expect `scope_ready_not_evidence`, not government records.
3. For this node's authenticated operations, review and subscribe to the [CivicDataForge AWS Marketplace offer](https://aws.amazon.com/marketplace/pp/prodview-6sjgyotxqa22o). Choose **Set up your account**, complete subscription activation and securely save the CDF API key shown once. The listing currently advertises **$0.10 per successful evidence request**, with failed requests and identical retries unbilled; the live listing and your accepted terms control. A delivered review-required or no-match packet is not necessarily a failed request.
4. In n8n, create a **CivicDataForge API** credential and paste only your CDF key into **API Key**. Leave **Approved Evidence Requests** as `[]` initially. Test the credential or select **Get Usage** to check access without collecting evidence. Never enter an AWS secret, Apify token or payment credential.
5. Before a paid run, obtain customer authority, review every input item and configure the exact static approval described below. Select **Get Property Evidence**, select that credential, set the matching address/city/state and stable idempotency key, and acknowledge **Customer Authorized**. Execute one reviewed request first; inspect decision, completeness and source evidence before scaling.

The free quote's `handoff.url` points to the separate Apify purchase route. Following that route does **not** provision a CDF credential for this node. The separate $4.99 delivered permit audit also is not an API-key subscription. Use the AWS activation route above for the node, or contact [CDF support](mailto:civicdataforgehq@gmail.com) if activation or key recovery is needed. Send a request ID and error code, never your key. **Get Usage** reads service-reported usage; it does not set a spending cap or independently verify your invoice.

## Free checks and evidence

Free output is `scope_ready_not_evidence`. It binds submitted inputs locally, validates the quote schema/task/charge flag/expiry and allowlisted handoff. It does not independently verify the address, retrieve permits or initiate the linked purchase. After changing scope or expiry, obtain a new quote.

Paid execution is a distinct manually selected operation. Customer Authorized is only an acknowledgment, not independently authenticated customer consent and never sufficient authorization. A model can produce this boolean; it cannot grant itself approval. Obtain actual customer/order authority outside this node first. A CDF credential alone is not blanket permission to run arbitrary paid workloads. Each workflow input item can produce a separate request; review the whole input count before execution.

Provide a stable 8–128-character logical request key using letters, digits, underscore, period, colon or hyphen. Same key and exact body are used on an intentional retry. A changed request needs separately reviewed scope and a distinct key. Conflicting reuse within one batch fails before any HTTP request. The node does not auto-retry, poll, purchase or invent keys. n8n workflow-level retry settings can still rerun the node; leave retries disabled until you have reviewed the exact body/key and outcome.

HTTP409 means conflict, in-progress or failed retained request; inspect status/support rather than assigning a new key to force another billable attempt. A transport timeout has unknown outcome. 429/502 and other failures never become a no-match result. Raw upstream error messages, headers and credential values are not emitted by node error handling.

Evidence output preserves decision, completeness, source packet and receipt. NO_PUBLISHED_MATCH is not legal clearance or proof of illegality; REVIEW_REQUIRED, SOURCE_UNAVAILABLE and SCOPE_INCOMPLETE remain distinct. Receipt hashes provide integrity references, not independent authenticity or compliance certification. Existing server commercial terms control billing.

The output's verification fields explicitly distinguish envelope validation from cryptographic receipt verification and independent subject binding; the latter two are false. Source fields remain provider-reported. This node supports AI-tool use (`usableAsTool: true`) with no lint suppression. Paid execution additionally requires a matching operator-controlled credential policy. The host tool schema reads `$fromAI` arguments from node parameters, not credential fields. The included example is inactive and selects only the free quote operation.

## Operator approval for paid tool use

The selected CDF credential contains **Approved Evidence Requests**, default `[]` (paid execution denied). An authorized operator must enter a static JSON array outside the model invocation. Do not put expressions in this field or delegate credential editing to the model. Obtain customer authority separately; this local policy is not proof of customer consent.

Each entry must have exactly `address`, `city`, `state`, `idempotencyKey`, and `expiresAt`. Example shape (expired deliberately; replace only after reviewing a real request):

```json
[{"address":"400 S Orange Ave","city":"Orlando","state":"FL","idempotencyKey":"reviewed-order-001","expiresAt":"2026-01-01T12:00:00.000Z"}]
```

At most 25 entries and 40,000 characters are accepted. Expiry must be an exact UTC ISO timestamp and more than zero but no more than 24 hours in the future at execution. The normalized property, fixed task/purpose/retention body and stable key must match. Duplicate policy keys, extra fields, wildcard addresses and malformed policies are rejected. All items are preflighted before any HTTP call; expiry is rechecked before each request. A node argument named approvedEvidenceRequests or authorized cannot supply this credential policy. Missing policy blocks existing paid workflows until an operator reviews them. Free quote and authenticated usage remain available without paid approval.

Use a dedicated credential with the smallest reviewed scope and remove expired entries. This is a local client boundary, not server-side budget enforcement: anyone who can edit credentials or execute arbitrary code with the API key is outside this protection. Repeated approved calls reuse the same key; server idempotency governs replay/retention. There is no local one-shot ledger or independent payment receipt verification. Model changes to address, city, state or key do not expand the approval.

## When a request stops

| Error | Next action |
|---|---|
| `VALID_CDF_CREDENTIAL_REQUIRED`, `AUTHENTICATION_FAILED`, `ACCESS_DENIED` | Check the selected CDF credential and active entitlement. If activation is pending or the key is lost/revoked, contact support; do not substitute another provider's token. |
| `OPERATOR_APPROVAL_REQUIRED`, `INVALID_OPERATOR_POLICY`, `CUSTOMER_AUTHORIZATION_REQUIRED` | Have the operator review customer authority, exact scope/key, static policy and expiry. The model cannot approve itself. |
| `INVALID_PROPERTY_SCOPE`, `SCOPE_OR_KEY_REJECTED` | Check address, exact supported city/jurisdiction, two-letter state and request-key format. Run the free check again after corrections. |
| `IDEMPOTENCY_CONFLICT_OR_PENDING`, `TRANSPORT_ERROR_OUTCOME_UNKNOWN` | Stop and inspect the prior outcome or contact support. Retain the original body/key; a new key may cause another billable execution. |
| `LIMIT_REACHED`, `UPSTREAM_UNAVAILABLE`, `SERVICE_UNAVAILABLE` | Inspect service access/limits or contact support before retrying. These errors do not mean that no government record exists. |
| `INVALID_QUOTE_CONTRACT`, `INVALID_QUOTE_TIME`, `INVALID_EVIDENCE_CONTRACT`, `INVALID_USAGE_CONTRACT`, `HTTP_REQUEST_FAILED` | Stop, retain the safe error code and request context, and report a possible service/client mismatch. Do not bypass validation. |

## Existing work reused

The free quote mapping is adapted from the MIT client in approved n8n template20002:
https://n8n.io/workflows/20002-validate-us-property-request-scope-with-civicdataforge-and-http-request/

Its approved artifact SHA256 is `a0b4f9e8236da318d6367a83517a95b15e4564d4dd1120d74c631a8707260559`. The separately hashed repository workflow remains a distinct artifact. Existing guide: https://github.com/equinoxaifinance-rgb/civicdataforge-mcp/blob/main/guides/n8n/README.md . This package adds a named node and optional first-party authenticated operations; it does not resubmit or replace that template.

API contract: https://civicdataforge.pages.dev/openapi/civicdataforge-evidence-api-v1.json . Inspected deployed handler limits idempotency keys to128, while the static OpenAPI says200; this client uses128. Do not silently copy the looser schema limit.

## Development and review

Pinned official n8n CLI and workflow packages are development dependencies; the node has no external runtime dependency beyond n8n's host peer. Install with lifecycle scripts disabled: `npm ci --ignore-scripts`. Run `npm run typecheck`, `npm run build`, `npm test`, and `npm run lint`. Tests mock all network transport, including paid paths and credentials. See [validation notes](https://github.com/equinoxaifinance-rgb/n8n-nodes-civicdataforge/blob/main/docs/VALIDATION.md) for results and limitations; tests do not establish live paid fulfillment. Actual editor and full-agent fixture coverage is described in the validation notes.

The programmatic adapter is a deliberate implementation choice for whole-batch validation, item linking, explicit charge gating and fixed error redaction. n8n recommends declarative REST nodes; reviewer feedback may require a declarative rewrite. No acceptance is implied by lint/typecheck results.

## Release and installation

The 0.1.0 release is prepared but is not yet available from npm. Do not interpret
this repository's public visibility as a published or n8n-verified package.
After registry publication, self-hosted n8n users can install
`n8n-nodes-civicdataforge` through Settings > Community nodes, subject to their
instance policy. n8n Cloud discovery requires n8n's separate verification.

For local development, build the package and load its compiled nodes/credentials
through n8n's custom-node development path. Select CivicDataForge > Check Property
Scope, enter the public address, city and state, and execute. No CDF credential is
required for this free operation. In an AI Agent, attach CivicDataForge Tool and
let the model fill address/city/state. Keep paid operations separately selected
and operator-approved as described above. The inactive example workflow does not
purchase evidence or enable a schedule.

[Release procedure](https://github.com/equinoxaifinance-rgb/n8n-nodes-civicdataforge/blob/main/docs/RELEASE.md) describes the first-publication bootstrap,
exact trusted-publisher setup, registry readback and Creator Portal submission.
The manual `.github/workflows/publish.yml` checks the exact requested commit and
version, runs all local checks, and uses GitHub Actions provenance. No token or
trusted-publisher relationship is included. Do not dispatch it until the npm
maintainer and exact publishing authorization are established.

Official requirements:
https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes
https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines

License covers this client only, not hosted CDF services, private collection/normalization code, source-data rights, credentials, n8n or paid fulfillment.

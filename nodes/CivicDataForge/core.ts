// Dependency-free transport/validation core; inputs derive from template 20002.
export const BASE = 'https://civicdataforge.pages.dev';
export type Operation = 'quote' | 'evidence' | 'usage';
export type RecordValue = Record<string, unknown>;
export interface Plan { operation: Operation; path: string; method: 'GET' | 'POST'; body?: RecordValue; idempotencyKey?: string }
export interface Response { statusCode: number; body: unknown; headers?: Record<string, unknown> }
export interface Transport { (plan: Plan): Promise<Response> }
export class SafeFailure extends Error { constructor(public code: string) { super(code); } }
function fail(code: string): never { throw new SafeFailure(code); }
export function validateCredential(value: unknown): string {
  if (typeof value !== 'string' || !/^cdf_(live|test)_[A-Za-z0-9_-]{40,}$/.test(value)) fail('VALID_CDF_CREDENTIAL_REQUIRED');
  return value;
}
function object(value: unknown): value is RecordValue { return !!value && typeof value === 'object' && !Array.isArray(value); }
function text(v: unknown, max: number): string {
  if (typeof v !== 'string' || !v.trim() || v.length > max || [...v].some(c => c.charCodeAt(0) < 32) || /\{\{|\}\}/.test(v)) throw new SafeFailure('INVALID_INPUT');
  return v.trim();
}
export function plan(input: RecordValue): Plan {
  const operation = input.operation;
  if (operation === 'usage') return { operation, path: '/api/v1/usage', method: 'GET' };
  if (operation !== 'quote' && operation !== 'evidence') throw new SafeFailure('UNKNOWN_OPERATION');
  const address = text(input.address, 500), city = text(input.city, 100), state = text(input.state, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(state) || !/^\d+[A-Z]?\s+\S+/i.test(address.normalize('NFKD'))) throw new SafeFailure('INVALID_PROPERTY_SCOPE');
  const body = { task: 'us_property_decision', subject: { address, city, state }, purpose: 'Public property evidence research', retentionDays: 0 };
  if (operation === 'quote') return { operation, path: '/api/quote', method: 'POST', body };
  if (input.customerAuthorized !== true) throw new SafeFailure('CUSTOMER_AUTHORIZATION_REQUIRED');
  const idempotencyKey = text(input.idempotencyKey, 128);
  if (!/^[A-Za-z0-9_.:-]{8,128}$/.test(idempotencyKey)) throw new SafeFailure('INVALID_IDEMPOTENCY_KEY');
  return { operation, path: '/api/v1/evidence', method: 'POST', body, idempotencyKey };
}
export function validateBatch(plans: Plan[]): void {
  const seen = new Map<string, string>();
  for (const p of plans) {
    if (p.operation !== 'evidence') continue;
    const body = JSON.stringify(p.body), key = p.idempotencyKey!;
    if (seen.has(key) && seen.get(key) !== body) throw new SafeFailure('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_INPUT');
    seen.set(key, body);
  }
}
// This policy comes only from the operator-selected credential, never tool arguments.
// Every approval binds a single normalized request and stable server idempotency key.
export function validatePaidPolicy(plans: Plan[], raw: unknown, at = Date.now()): void {
  const paid = plans.filter(p => p.operation === 'evidence');
  if (!paid.length) return;
  if (typeof raw !== 'string' || raw.length > 40000 || /\{\{|\}\}/.test(raw)) fail('OPERATOR_APPROVAL_REQUIRED');
  let entries: unknown;
  try { entries = JSON.parse(raw); } catch { fail('INVALID_OPERATOR_POLICY'); }
  if (!Array.isArray(entries) || entries.length > 25) fail('INVALID_OPERATOR_POLICY');
  const approved = new Map<string, {body: string; expires: number}>();
  for (const entry of entries) {
    if (!object(entry) || Object.keys(entry).sort().join(',') !== 'address,city,expiresAt,idempotencyKey,state') fail('INVALID_OPERATOR_POLICY');
    if (typeof entry.expiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(entry.expiresAt)) fail('INVALID_OPERATOR_POLICY');
    const expires = Date.parse(entry.expiresAt);
    if (!Number.isFinite(expires) || new Date(expires).toISOString() !== entry.expiresAt) fail('INVALID_OPERATOR_POLICY');
    let request: Plan;
    try { request = plan({...entry, operation:'evidence', customerAuthorized:true}); } catch { fail('INVALID_OPERATOR_POLICY'); }
    const key = request.idempotencyKey!;
    if (approved.has(key)) fail('INVALID_OPERATOR_POLICY');
    approved.set(key, {body:JSON.stringify(request.body), expires});
  }
  for (const p of paid) {
    const approval = approved.get(p.idempotencyKey!);
    if (!approval || approval.body !== JSON.stringify(p.body) || approval.expires <= at || approval.expires > at + 86400000) fail('OPERATOR_APPROVAL_REQUIRED');
  }
}
export function redact(value: unknown, secret = ''): unknown {
  if (typeof value === 'string') {
    let result = secret ? value.split(secret).join('[REDACTED]') : value;
    result = result.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
    return result;
  }
  if (Array.isArray(value)) return value.map(v => redact(v, secret));
  if (object(value)) return Object.fromEntries(Object.entries(value).filter(([k]) => !/^(authorization|api[_-]?key|token|password|secret|key_prefix)$/i.test(k) && !(secret && k.includes(secret)) && !/Bearer\s/i.test(k)).map(([k, v]) => [k, redact(v, secret)]));
  return value;
}
function bodyObject(response: Response): RecordValue {
  let b = response.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { fail('RESPONSE_NOT_JSON'); } }
  if (!object(b)) throw new SafeFailure('INVALID_RESPONSE');
  return b;
}
export function mapResponse(p: Plan, response: Response, at = Date.now()): RecordValue {
  if (!Number.isInteger(response.statusCode)) throw new SafeFailure('INVALID_HTTP_RESPONSE');
  if (response.statusCode !== 200) {
    // Never expose upstream exception text/body/headers or turn failure into no-match.
    const codes: Record<number, string> = {401:'AUTHENTICATION_FAILED',403:'ACCESS_DENIED',409:'IDEMPOTENCY_CONFLICT_OR_PENDING',413:'REQUEST_TOO_LARGE',422:'SCOPE_OR_KEY_REJECTED',429:'LIMIT_REACHED',502:'UPSTREAM_UNAVAILABLE',503:'SERVICE_UNAVAILABLE'};
    throw new SafeFailure(codes[response.statusCode] || 'HTTP_REQUEST_FAILED');
  }
  const b = bodyObject(response);
  if (p.operation === 'quote') {
    if (b.charged !== false || b.schema_version !== 'civicdataforge.agent-quote.v1' || b.input_contract_version !== 'civicdataforge.evidence-input.v2' || b.task !== 'us_property_decision' || b.quote_state !== 'READY' || typeof b.quote_id !== 'string' || !/^cdfq_[a-f0-9]{24}$/.test(b.quote_id)) throw new SafeFailure('INVALID_QUOTE_CONTRACT');
    const issued = typeof b.issued_at === 'string' ? Date.parse(b.issued_at) : NaN, expires = typeof b.expires_at === 'string' ? Date.parse(b.expires_at) : NaN;
    if (!Number.isFinite(issued) || !Number.isFinite(expires) || issued > at + 60000 || expires <= at || expires <= issued || expires - issued > 900001) throw new SafeFailure('INVALID_QUOTE_TIME');
    if (!object(b.purchase) || b.purchase.store_url !== 'https://apify.com/civicdataforge/civicdataforge-evidence-gateway') throw new SafeFailure('INVALID_PURCHASE_DESTINATION');
    return { state:'scope_ready_not_evidence', evidenceRetrieved:false, paymentAttempted:false, quoteId:b.quote_id, issuedAt:b.issued_at, expiresAt:b.expires_at, submittedScope:p.body, scopeBinding:'Locally bound input; quote does not independently echo or verify the address.', handoff:{ url:b.purchase.store_url, automaticPurchase:false } };
  }
  if (p.operation === 'usage') {
    if (b.schema_version !== 'civicdataforge.api-usage.v1' || b.access_state !== 'ACTIVE') throw new SafeFailure('INVALID_USAGE_CONTRACT');
    return { state:'usage_read', paymentAttempted:false, usage:redact(b) };
  }
  const decisions = ['EVIDENCE_FOUND','NO_PUBLISHED_MATCH','REVIEW_REQUIRED','SOURCE_UNAVAILABLE','SCOPE_INCOMPLETE'];
  if (b.schema_version !== 'civicdataforge.evidence-api-response.v1' || b.task !== 'us_property_decision' || typeof b.request_id !== 'string' || !b.request_id || !decisions.includes(String(b.decision)) || typeof b.complete_for_bounded_scope !== 'boolean' || typeof b.receipt_hash !== 'string' || !/^[a-f0-9]{64}$/i.test(b.receipt_hash) || !object(b.evidence_packet)) throw new SafeFailure('INVALID_EVIDENCE_CONTRACT');
  return { state:'evidence_response', decision:b.decision, completeForBoundedScope:b.complete_for_bounded_scope, billableExecutionRequested:true, evidence:b, verification:{envelopeValidated:true,receiptCryptographicallyVerified:false,subjectIndependentlyBound:false}, claimBoundary:'Provider-reported source evidence; envelope validation is not receipt verification or independent address binding. No-match is not clearance or proof of illegality.' };
}
export async function run(p: Plan, transport: Transport, secret = ''): Promise<RecordValue> {
  let response: Response;
  try { response = await transport(p); } catch { fail('TRANSPORT_ERROR_OUTCOME_UNKNOWN'); }
  return redact(mapResponse(p, response), secret) as RecordValue;
}

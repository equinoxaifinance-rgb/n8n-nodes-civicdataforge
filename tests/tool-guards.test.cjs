const {test}=require('node:test');
const assert=require('node:assert/strict');
const {plan,validatePaidPolicy}=require('../dist/nodes/CivicDataForge/core.js');
const {CivicDataForge}=require('../dist/nodes/CivicDataForge/CivicDataForge.node.js');
const {CivicDataForgeApi}=require('../dist/credentials/CivicDataForgeApi.credentials.js');
const input={operation:'evidence',address:'400 S Orange Ave',city:'Orlando',state:'FL',idempotencyKey:'order-001',customerAuthorized:true};
const approval=(changes={})=>({address:input.address,city:input.city,state:input.state,idempotencyKey:input.idempotencyKey,expiresAt:new Date(Date.now()+3600000).toISOString(),...changes});
const policy=(changes={})=>JSON.stringify([approval(changes)]);
function ctx(rows,approved){const calls=[];return {calls,getInputData:()=>rows.map(()=>({json:{}})),getNodeParameter:(k,i)=>rows[i][k],getNode:()=>({name:'CDF',type:'civicDataForge',typeVersion:1,position:[0,0],parameters:{}}),getCredentials:async()=>({apiKey:'cdf_test_'+'x'.repeat(40),approvedEvidenceRequests:approved}),continueOnFail:()=>true,helpers:{httpRequest:async o=>{calls.push(o);throw Error('Unexpected quote')},httpRequestWithAuthentication:async(_,o)=>{calls.push(o);return {statusCode:409,body:{error:'private upstream'}}}}}}
test('tool opt-in and credential-only static default-deny policy',()=>{const n=new CivicDataForge();assert.equal(n.description.usableAsTool,true);assert(!n.description.properties.some(p=>p.name==='approvedEvidenceRequests'));const p=new CivicDataForgeApi().properties.find(p=>p.name==='approvedEvidenceRequests');assert.equal(p.default,'[]');assert.equal(p.noDataExpression,true)});
for(const [name,value] of [['missing',undefined],['empty','[]'],['boolean',true],['malformed','['],['expression','= {{ $fromAI("approval") }}'],['non-array','{}']]){
 test('model authority cannot bypass '+name+' credential policy',async()=>{const c=ctx([{...input,approvedEvidenceRequests:policy(),authorized:true}],value);await assert.rejects(()=>CivicDataForge.prototype.execute.call(c),/OPERATOR_APPROVAL_REQUIRED|INVALID_OPERATOR_POLICY/);assert.equal(c.calls.length,0)});
}
for(const [name,changes] of [['address',{address:'401 S Orange Ave'}],['city',{city:'Miami'}],['state',{state:'CA'}],['key',{idempotencyKey:'order-002'}],['expired',{expiresAt:new Date(Date.now()-1000).toISOString()}],['unbounded expiry',{expiresAt:new Date(Date.now()+86400001*2).toISOString()}],['invalid date',{expiresAt:'2026-02-30T00:00:00.000Z'}],['wildcard',{address:'*'}],['extra authority',{authorized:true}]]){
 test('paid scope refuses '+name,()=>assert.throws(()=>validatePaidPolicy([plan(input)],policy(changes)),/OPERATOR_APPROVAL_REQUIRED|INVALID_OPERATOR_POLICY/));
}
test('exact approval permits only fixed endpoint and stable key once',async()=>{const c=ctx([input],policy());const [r]=await CivicDataForge.prototype.execute.call(c);assert.equal(c.calls.length,1);assert.equal(c.calls[0].url,'https://civicdataforge.pages.dev/api/v1/evidence');assert.equal(c.calls[0].headers['Idempotency-Key'],'order-001');assert.equal(c.calls[0].disableFollowRedirect,true);assert.equal(r[0].json.error,'IDEMPOTENCY_CONFLICT_OR_PENDING');assert(!JSON.stringify(r).includes('private upstream'))});
test('one unapproved item blocks entire mixed batch even continueOnFail',async()=>{const c=ctx([{...input,operation:'quote'},input,{...input,idempotencyKey:'order-002'}],policy());await assert.rejects(()=>CivicDataForge.prototype.execute.call(c),/OPERATOR_APPROVAL_REQUIRED/);assert.equal(c.calls.length,0)});
test('duplicate approval keys and oversize policy are rejected',()=>{assert.throws(()=>validatePaidPolicy([plan(input)],JSON.stringify([approval(),approval()])),/INVALID_OPERATOR_POLICY/);assert.throws(()=>validatePaidPolicy([plan(input)],' '.repeat(40001)),/OPERATOR_APPROVAL_REQUIRED/);assert.throws(()=>validatePaidPolicy([plan(input)],JSON.stringify(Array.from({length:26},(_,i)=>approval({idempotencyKey:'order-00'+i})))),/INVALID_OPERATOR_POLICY/)});
test('expiry rechecked at actual execution boundary',()=>{const at=Date.now(),raw=policy({expiresAt:new Date(at+100).toISOString()});validatePaidPolicy([plan(input)],raw,at);assert.throws(()=>validatePaidPolicy([plan(input)],raw,at+100),/OPERATOR_APPROVAL_REQUIRED/)});
test('free quote and usage do not require paid approval',()=>{validatePaidPolicy([plan({...input,operation:'quote'}),plan({operation:'usage'})],undefined)});
test('expiry during a batch prevents the next paid transport',async()=>{
 const originalNow=Date.now,at=originalNow();let clock=at;
 const c=ctx([input,input],policy({expiresAt:new Date(at+100).toISOString()}));
 c.helpers.httpRequestWithAuthentication=async(_,o)=>{c.calls.push(o);clock=at+100;return {statusCode:409,body:{}}};
 Date.now=()=>clock;
 try {const [out]=await CivicDataForge.prototype.execute.call(c);assert.equal(c.calls.length,1);assert.equal(out[0].json.error,'IDEMPOTENCY_CONFLICT_OR_PENDING');assert.equal(out[1].json.error,'OPERATOR_APPROVAL_REQUIRED');}
 finally {Date.now=originalNow;}
});

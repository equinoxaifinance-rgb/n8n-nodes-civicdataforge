import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export class CivicDataForgeApi implements ICredentialType {
  name = 'civicDataForgeApi';
  displayName = 'CivicDataForge API';
  icon = {light:'file:cdf.svg',dark:'file:cdf.svg'} as const;
  documentationUrl = 'https://civicdataforge.pages.dev/connect-agent';
  properties: INodeProperties[] = [
    { displayName:'API Key', name:'apiKey', type:'string', typeOptions:{password:true}, default:'', required:true, description:'Customer-owned CivicDataForge key. Never enter an Apify token.' },
    { displayName:'Approved Evidence Requests', name:'approvedEvidenceRequests', type:'string', noDataExpression:true, typeOptions:{rows:6}, default:'[]', description:'Operator-only static JSON array, at most 25 entries. Each entry requires address, city, state, idempotencyKey and expiresAt (UTC ISO timestamp within 24 hours). Empty denies all paid requests. Obtain customer authority separately; do not use expressions. See package README.' },
  ];
  authenticate: IAuthenticateGeneric = { type:'generic', properties:{headers:{Authorization:'=Bearer {{$credentials.apiKey}}'}} };
  test: ICredentialTestRequest = { request:{baseURL:'https://civicdataforge.pages.dev',url:'/api/v1/usage',method:'GET',disableFollowRedirect:true,timeout:20000} };
}

import { NodeOperationError, NodeConnectionTypes } from 'n8n-workflow';
import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, IHttpRequestOptions } from 'n8n-workflow';
import { BASE, plan, validateBatch, validateCredential, validatePaidPolicy, run, SafeFailure, type Response } from './core';

export class CivicDataForge implements INodeType {
  description: INodeTypeDescription = {
    displayName:'CivicDataForge', name:'civicDataForge', group:['transform'], version:1,
    usableAsTool:true,
    icon:{light:'file:cdf.svg',dark:'file:cdf.svg'}, subtitle:'={{$parameter["operation"]}}',
    description:'Check property scope or retrieve authorized official-source evidence', defaults:{name:'CivicDataForge'},
    inputs:[NodeConnectionTypes.Main], outputs:[NodeConnectionTypes.Main],
    credentials:[{name:'civicDataForgeApi',required:true,displayOptions:{show:{operation:['evidence','usage']}}}],
    properties:[
      {displayName:'Operation',name:'operation',type:'options',noDataExpression:true,default:'quote',options:[
        {name:'Check Property Scope',value:'quote',description:'Check free scope without evidence execution or purchase',action:'Check property scope'},
        {name:'Get Property Evidence',value:'evidence',description:'Execute a potentially billable customer-authorized request',action:'Get property evidence'},
        {name:'Get Usage',value:'usage',description:'Read current credential usage without evidence execution',action:'Get usage'},
      ]},
      {displayName:'Address',name:'address',type:'string',default:'',required:true,displayOptions:{show:{operation:['quote','evidence']}},description:'Public street address beginning with a house number'},
      {displayName:'City',name:'city',type:'string',default:'',required:true,displayOptions:{show:{operation:['quote','evidence']}},description:'Exact supported jurisdiction; county boundaries are not inferred'},
      {displayName:'State',name:'state',type:'string',default:'',required:true,displayOptions:{show:{operation:['quote','evidence']}},description:'Two-letter US state code'},
      {displayName:'Customer Authorized',name:'customerAuthorized',type:'boolean',noDataExpression:true,default:false,displayOptions:{show:{operation:['evidence']}},description:'Whether customer authority was obtained outside this node. This assertion alone cannot enable paid execution; an exact unexpired approval in the selected credential is also required.'},
      {displayName:'Idempotency Key',name:'idempotencyKey',type:'string',default:'',required:true,displayOptions:{show:{operation:['evidence']}},description:'Stable caller-owned logical request ID, 8–128 letters, digits, underscore, period, colon or hyphen. Reuse only for the identical request.'},
    ],
  };
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    // Validate the complete batch before making any request.
    let plans;
    let secret = '';
    let operatorPolicy: unknown;
    try {
      plans = items.map((_, i) => {
        const operation = this.getNodeParameter('operation', i) as string;
        return plan({operation,...(operation === 'usage' ? {} : {address:this.getNodeParameter('address', i),city:this.getNodeParameter('city', i),state:this.getNodeParameter('state', i)}),...(operation === 'evidence' ? {customerAuthorized:this.getNodeParameter('customerAuthorized', i),idempotencyKey:this.getNodeParameter('idempotencyKey', i)} : {})});
      });
      validateBatch(plans);
      if (plans.some(p => p.operation !== 'quote')) {
        const credentials = await this.getCredentials('civicDataForgeApi');
        secret = validateCredential(credentials.apiKey);
        operatorPolicy = credentials.approvedEvidenceRequests;
      }
      validatePaidPolicy(plans, operatorPolicy);
    } catch (error) { throw new NodeOperationError(this.getNode(), error instanceof SafeFailure ? error.code : 'INVALID_INPUT'); }
    const output: INodeExecutionData[] = [];
    for (let i = 0; i < plans.length; i++) {
      try {
        const p = plans[i];
        // Recheck expiry immediately before each request, including later batch items.
        validatePaidPolicy([p], operatorPolicy);
        const result = await run(p, async request => {
          const options: IHttpRequestOptions = {url:BASE + request.path,method:request.method,json:true,returnFullResponse:true,ignoreHttpStatusErrors:true,disableFollowRedirect:true,timeout:request.operation === 'evidence' ? 270000 : 20000,headers:{Accept:'application/json',...(request.idempotencyKey ? {'Idempotency-Key':request.idempotencyKey} : {})},...(request.body ? {body:request.body} : {})};
          return (request.operation === 'quote' ? await this.helpers.httpRequest(options) : await this.helpers.httpRequestWithAuthentication.call(this, 'civicDataForgeApi', options)) as Response;
        }, secret);
        output.push({json:result as IDataObject,pairedItem:{item:i}});
      } catch (error) {
        const code = error instanceof SafeFailure ? error.code : 'REQUEST_FAILED';
        if (this.continueOnFail()) output.push({json:{error:code,outcome:'not_confirmed'},pairedItem:{item:i}});
        else throw new NodeOperationError(this.getNode(), code, {itemIndex:i});
      }
    }
    return [output];
  }
}

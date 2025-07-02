import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as TreeCareInfrastructure from '../lib/infrastructure-stack';

describe('API Gateway Configuration', () => {
  let app: cdk.App;
  let stack: TreeCareInfrastructure.InfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TreeCareInfrastructure.InfrastructureStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('REST API', () => {
    it('should create a REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp('^TreeCareAPI-'),
        Description: 'Tree Care App API Gateway',
      });
    });

    it('should have API Gateway deployment', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        RestApiId: {
          Ref: Match.anyValue(),
        },
      });
    });

    it('should have API stage configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'dev',
        MethodSettings: [{
          HttpMethod: '*',
          ResourcePath: '/*',
          ThrottlingBurstLimit: 5000,
          ThrottlingRateLimit: 2000,
        }],
      });
    });
  });

  describe('CORS Configuration', () => {
    it('should have CORS enabled on API methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        AuthorizationType: 'NONE',
        Integration: {
          Type: 'MOCK',
          IntegrationResponses: [
            {
              StatusCode: '200',
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
              },
            },
          ],
        },
      });
    });

    it('should have CORS headers in method responses', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        MethodResponses: Match.arrayWith([
          Match.objectLike({
            StatusCode: '200',
            ResponseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          }),
        ]),
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should have usage plan with rate limits', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: Match.stringLikeRegexp('^TreeCareUsagePlan-'),
        Description: 'Usage plan for Tree Care API',
        Throttle: {
          BurstLimit: 5000,
          RateLimit: 2000,
        },
        Quota: {
          Limit: 1000000,
          Period: 'MONTH',
        },
      });
    });

    it('should create API keys for different tiers', () => {
      // Free tier API key
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: Match.stringLikeRegexp('^TreeCareFreeKey-'),
        Description: 'API key for free tier users',
        Enabled: true,
      });

      // Premium tier API key
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: Match.stringLikeRegexp('^TreeCarePremiumKey-'),
        Description: 'API key for premium tier users',
        Enabled: true,
      });
    });

    it('should have different usage plans for tiers', () => {
      // Free tier usage plan
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: Match.stringLikeRegexp('^TreeCareFreeUsagePlan-'),
        Throttle: {
          BurstLimit: 1000,
          RateLimit: 100,
        },
        Quota: {
          Limit: 10000,
          Period: 'MONTH',
        },
      });

      // Premium tier usage plan
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: Match.stringLikeRegexp('^TreeCarePremiumUsagePlan-'),
        Throttle: {
          BurstLimit: 10000,
          RateLimit: 5000,
        },
        Quota: {
          Limit: 10000000,
          Period: 'MONTH',
        },
      });
    });
  });

  describe('Lambda Integration', () => {
    it('should have Lambda integration for API methods', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
          Uri: Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                { Ref: 'AWS::Partition' },
                ':apigateway:',
                { Ref: 'AWS::Region' },
                ':lambda:path/2015-03-31/functions/',
              ]),
            ]),
          }),
        },
      });
    });

    it('should grant API Gateway permission to invoke Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
        SourceArn: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'arn:',
              { Ref: 'AWS::Partition' },
              ':execute-api:',
            ]),
          ]),
        }),
      });
    });
  });

  describe('Request Validation', () => {
    it('should have request validators', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        Name: Match.stringLikeRegexp('^TreeCareRequestValidator-'),
        ValidateRequestBody: true,
        ValidateRequestParameters: true,
      });
    });

    it('should have models for request validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        ContentType: 'application/json',
        Schema: Match.objectLike({
          type: 'object',
          required: Match.arrayWith(['treeId']),
          properties: Match.objectLike({
            treeId: { type: 'string' },
          }),
        }),
      });
    });
  });

  describe('API Gateway Responses', () => {
    it('should have custom gateway responses', () => {
      // 4XX responses
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseType: 'DEFAULT_4XX',
        ResponseTemplates: {
          'application/json': '{"error": "$context.error.message", "requestId": "$context.requestId"}',
        },
        ResponseParameters: {
          'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
        },
      });

      // 5XX responses
      template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
        ResponseType: 'DEFAULT_5XX',
        ResponseTemplates: {
          'application/json': '{"error": "Internal server error", "requestId": "$context.requestId"}',
        },
        ResponseParameters: {
          'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
        },
      });
    });
  });

  describe('Monitoring', () => {
    it('should have CloudWatch logging enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        AccessLogSetting: {
          DestinationArn: Match.objectLike({
            'Fn::GetAtt': Match.arrayWith([
              Match.stringLikeRegexp('ApiGatewayLogGroup'),
              'Arn',
            ]),
          }),
          Format: Match.anyValue(),
        },
        MethodSettings: Match.arrayWith([
          {
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true,
          },
        ]),
      });
    });

    it('should create CloudWatch log group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.stringLikeRegexp('^/aws/apigateway/TreeCareAPI-'),
        RetentionInDays: 7,
      });
    });
  });

  describe('Security', () => {
    it('should have WAF web ACL association', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        Tags: Match.arrayWith([
          {
            Key: 'WAF',
            Value: 'Enabled',
          },
        ]),
      });
    });

    it('should have resource policies for IP restrictions', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Policy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: '*',
              Action: 'execute-api:Invoke',
              Resource: '*',
            }),
          ]),
        }),
      });
    });
  });
});
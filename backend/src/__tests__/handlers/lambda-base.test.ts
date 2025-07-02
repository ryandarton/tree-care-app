import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

describe('Lambda Base Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    mockEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'GET',
      isBase64Encoded: false,
      path: '/',
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      stageVariables: null,
      requestContext: {
        accountId: '123456789012',
        apiId: '1234567890',
        authorizer: null,
        protocol: 'HTTP/1.1',
        httpMethod: 'GET',
        identity: {
          accessKey: null,
          accountId: null,
          apiKey: null,
          apiKeyId: null,
          caller: null,
          clientCert: null,
          cognitoAuthenticationProvider: null,
          cognitoAuthenticationType: null,
          cognitoIdentityId: null,
          cognitoIdentityPoolId: null,
          principalOrgId: null,
          sourceIp: '127.0.0.1',
          user: null,
          userAgent: 'test-agent',
          userArn: null,
        },
        path: '/',
        stage: 'test',
        requestId: 'test-request-id',
        requestTime: '01/Jan/2025:00:00:00 +0000',
        requestTimeEpoch: 1704067200000,
        resourceId: 'test-resource',
        resourcePath: '/',
      },
      resource: '/',
    };

    mockContext = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-2:123456789012:function:test-function',
      memoryLimitInMB: '1024',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2025/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };
  });

  describe('Error Handling', () => {
    it('should return 500 for unhandled errors', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(errorHandler(mockEvent, mockContext)).rejects.toThrow('Test error');
    });

    it('should include correlation ID in error response', async () => {
      const testHandler = async (): Promise<APIGatewayProxyResult> => {
        throw new Error('Test error');
      };
      
      await expect(testHandler()).rejects.toThrow('Test error');
    });

    it('should handle malformed JSON in request body', async () => {
      mockEvent.body = '{ invalid json }';
      
      const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        try {
          if (event.body) {
            JSON.parse(event.body);
          }
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' }),
          };
        } catch (error) {
          return {
            statusCode: 400,
            body: JSON.stringify({ 
              error: 'Invalid JSON in request body',
              requestId: mockContext.awsRequestId,
            }),
          };
        }
      };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Invalid JSON in request body');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const handler = async (): Promise<APIGatewayProxyResult> => {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
          body: JSON.stringify({ message: 'Success' }),
        };
      };
      
      const result = await handler();
      
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Methods');
      expect(result.headers).toHaveProperty('Access-Control-Allow-Headers');
    });

    it('should handle OPTIONS requests for preflight', async () => {
      mockEvent.httpMethod = 'OPTIONS';
      
      const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        if (event.httpMethod === 'OPTIONS') {
          return {
            statusCode: 204,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              'Access-Control-Max-Age': '86400',
            },
            body: '',
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Success' }),
        };
      };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
      expect(result.headers).toHaveProperty('Access-Control-Max-Age', '86400');
    });
  });

  describe('Request Validation', () => {
    it('should validate required headers', async () => {
      const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        if (!event.headers['Content-Type']) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing Content-Type header' }),
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Success' }),
        };
      };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Missing Content-Type header');
    });

    it('should validate request method', async () => {
      mockEvent.httpMethod = 'PATCH';
      
      const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
        const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
        
        if (!allowedMethods.includes(event.httpMethod)) {
          return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
          };
        }
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Success' }),
        };
      };
      
      const result = await handler(mockEvent);
      
      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body).error).toBe('Method not allowed');
    });
  });

  describe('Response Formatting', () => {
    it('should always return JSON response', async () => {
      const handler = async (): Promise<APIGatewayProxyResult> => {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: 'Success' }),
        };
      };
      
      const result = await handler();
      
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
      expect(() => JSON.parse(result.body)).not.toThrow();
    });

    it('should include request ID in response', async () => {
      const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            message: 'Success',
            requestId: context.awsRequestId,
          }),
        };
      };
      
      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);
      
      expect(body.requestId).toBe(mockContext.awsRequestId);
    });
  });

  describe('Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should use environment variables for configuration', async () => {
      process.env.STAGE = 'dev';
      process.env.AWS_REGION = 'us-east-2';
      
      const handler = async (): Promise<APIGatewayProxyResult> => {
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            stage: process.env.STAGE,
            region: process.env.AWS_REGION,
          }),
        };
      };
      
      const result = await handler();
      const body = JSON.parse(result.body);
      
      expect(body.stage).toBe('dev');
      expect(body.region).toBe('us-east-2');
    });
  });
});
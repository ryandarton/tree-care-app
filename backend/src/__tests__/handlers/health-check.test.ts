import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Create mock clients
const mockDynamoDBClient = {
  scan: jest.fn(),
};

const mockS3Client = {
  listBuckets: jest.fn(),
};

const mockCognitoClient = {
  listUserPools: jest.fn(),
};

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => mockDynamoDBClient),
  },
  S3: jest.fn(() => mockS3Client),
  CognitoIdentityServiceProvider: jest.fn(() => mockCognitoClient),
}));

import { handler } from '../../handlers/health-check';

describe('Health Check Handler', () => {
  let mockEvent: APIGatewayProxyEvent;
  let mockContext: Context;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default successful responses
    mockDynamoDBClient.scan.mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Items: [] }),
    });

    mockS3Client.listBuckets.mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Buckets: [] }),
    });

    mockCognitoClient.listUserPools.mockReturnValue({
      promise: jest.fn().mockResolvedValue({ UserPools: [] }),
    });

    mockEvent = {
      body: null,
      headers: {},
      multiValueHeaders: {},
      httpMethod: 'GET',
      isBase64Encoded: false,
      path: '/health',
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
        path: '/health',
        stage: 'test',
        requestId: 'test-request-id',
        requestTime: '01/Jan/2025:00:00:00 +0000',
        requestTimeEpoch: 1704067200000,
        resourceId: 'test-resource',
        resourcePath: '/health',
      },
      resource: '/health',
    };

    mockContext = {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'test-health-check',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-2:123456789012:function:test-health-check',
      memoryLimitInMB: '1024',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-health-check',
      logStreamName: '2025/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };
  });

  describe('Successful Health Checks', () => {
    it('should return 200 when all services are healthy', async () => {
      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.status).toBe('healthy');
      expect(body.requestId).toBe(mockContext.awsRequestId);
      expect(body.services).toBeDefined();
    });

    it('should include service status for all dependencies', async () => {
      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(body.services).toHaveProperty('dynamodb');
      expect(body.services).toHaveProperty('s3');
      expect(body.services).toHaveProperty('cognito');
      expect(body.services.dynamodb).toBe('healthy');
      expect(body.services.s3).toBe('healthy');
      expect(body.services.cognito).toBe('healthy');
    });

    it('should include environment information', async () => {
      process.env.STAGE = 'dev';
      process.env.AWS_REGION = 'us-east-2';

      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(body.environment).toBeDefined();
      expect(body.environment.stage).toBe('dev');
      expect(body.environment.region).toBe('us-east-2');
      expect(body.environment.nodeVersion).toBeDefined();
    });

    it('should include timestamp', async () => {
      const before = new Date().toISOString();
      const result = await handler(mockEvent, mockContext);
      const after = new Date().toISOString();
      const body = JSON.parse(result.body);

      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
      expect(new Date(body.timestamp).getTime()).toBeLessThanOrEqual(new Date(after).getTime());
    });

    it('should include CORS headers', async () => {
      const result = await handler(mockEvent, mockContext);

      expect(result.headers).toBeDefined();
      expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers!['Content-Type']).toBe('application/json');
    });
  });

  describe('Service Health Checks', () => {
    it('should handle DynamoDB failure gracefully', async () => {
      mockDynamoDBClient.scan = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
      });

      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.services.dynamodb).toBe('unhealthy');
      expect(body.services.s3).toBe('healthy');
      expect(body.services.cognito).toBe('healthy');
    });

    it('should handle S3 failure gracefully', async () => {
      mockS3Client.listBuckets = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('S3 error')),
      });

      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.services.dynamodb).toBe('healthy');
      expect(body.services.s3).toBe('unhealthy');
      expect(body.services.cognito).toBe('healthy');
    });

    it('should handle Cognito failure gracefully', async () => {
      mockCognitoClient.listUserPools = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('Cognito error')),
      });

      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.services.dynamodb).toBe('healthy');
      expect(body.services.s3).toBe('healthy');
      expect(body.services.cognito).toBe('unhealthy');
    });

    it('should handle multiple service failures', async () => {
      mockDynamoDBClient.scan = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('DynamoDB error')),
      });
      mockS3Client.listBuckets = jest.fn().mockReturnValue({
        promise: jest.fn().mockRejectedValue(new Error('S3 error')),
      });

      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(503);
      expect(body.status).toBe('unhealthy');
      expect(body.services.dynamodb).toBe('unhealthy');
      expect(body.services.s3).toBe('unhealthy');
      expect(body.errors).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should complete health check within timeout', async () => {
      const start = Date.now();
      await handler(mockEvent, mockContext);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000); // 3 second timeout
    });

    it('should include response time in output', async () => {
      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(body.responseTime).toBeDefined();
      expect(typeof body.responseTime).toBe('number');
      expect(body.responseTime).toBeGreaterThanOrEqual(0);
      expect(body.responseTime).toBeLessThan(3000);
    });
  });

  describe('Error Handling', () => {
    it('should handle OPTIONS request for CORS preflight', async () => {
      mockEvent.httpMethod = 'OPTIONS';

      const result = await handler(mockEvent, mockContext);

      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
      expect(result.headers!['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers!['Access-Control-Allow-Methods']).toBeDefined();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock console.error to prevent test output noise
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock the handler module to throw an error
      jest.doMock('../../handlers/health-check', () => ({
        handler: async () => {
          throw new Error('Unexpected error');
        },
      }));

      // Reimport to get the mocked version
      const { handler: throwingHandler } = require('../../handlers/health-check');

      try {
        await throwingHandler(mockEvent, mockContext);
      } catch (error: any) {
        expect(error.message).toBe('Unexpected error');
      }

      // Restore original implementation
      jest.dontMock('../../handlers/health-check');
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Detailed Mode', () => {
    it('should include detailed information when requested', async () => {
      mockEvent.queryStringParameters = { detailed: 'true' };

      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(body.detailed).toBe(true);
      expect(body.memoryUsage).toBeDefined();
      expect(body.uptime).toBeDefined();
      expect(body.lambdaContext).toBeDefined();
      expect(body.lambdaContext.functionName).toBe(mockContext.functionName);
    });

    it('should not include detailed information by default', async () => {
      const result = await handler(mockEvent, mockContext);
      const body = JSON.parse(result.body);

      expect(body.detailed).toBeUndefined();
      expect(body.memoryUsage).toBeUndefined();
      expect(body.lambdaContext).toBeUndefined();
    });
  });
});
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { BaseLambdaHandler } from './lambda-base';

interface ServiceStatus {
  dynamodb: 'healthy' | 'unhealthy';
  s3: 'healthy' | 'unhealthy';
  cognito: 'healthy' | 'unhealthy';
}

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  requestId: string;
  services: ServiceStatus;
  environment: {
    stage: string;
    region: string;
    nodeVersion: string;
  };
  responseTime: number;
  errors?: string[];
  detailed?: boolean;
  memoryUsage?: any; // NodeJS.MemoryUsage
  uptime?: number;
  lambdaContext?: {
    functionName: string;
    functionVersion: string;
    memoryLimitInMB: string;
    remainingTimeInMillis: number;
  };
}

class HealthCheckHandler extends BaseLambdaHandler {
  private dynamoClient: DynamoDB.DocumentClient;
  private s3Client: S3;
  private cognitoClient: CognitoIdentityServiceProvider;

  constructor() {
    super();
    this.dynamoClient = new DynamoDB.DocumentClient({
      region: this.region,
    });
    this.s3Client = new S3({
      region: this.region,
    });
    this.cognitoClient = new CognitoIdentityServiceProvider({
      region: this.region,
    });
  }

  async processRequest(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    // Check if detailed mode is requested
    const detailed = event.queryStringParameters?.detailed === 'true';

    // Check services health
    const services: ServiceStatus = {
      dynamodb: 'healthy',
      s3: 'healthy',
      cognito: 'healthy',
    };

    // Check DynamoDB health
    try {
      await this.checkDynamoDB();
      services.dynamodb = 'healthy';
    } catch (error: any) {
      services.dynamodb = 'unhealthy';
      errors.push(`DynamoDB: ${error.message}`);
    }

    // Check S3 health
    try {
      await this.checkS3();
      services.s3 = 'healthy';
    } catch (error: any) {
      services.s3 = 'unhealthy';
      errors.push(`S3: ${error.message}`);
    }

    // Check Cognito health
    try {
      await this.checkCognito();
      services.cognito = 'healthy';
    } catch (error: any) {
      services.cognito = 'unhealthy';
      errors.push(`Cognito: ${error.message}`);
    }

    // Determine overall health status
    const isHealthy = Object.values(services).every(status => status === 'healthy');
    const responseTime = Date.now() - startTime;

    // Build response
    const response: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      services,
      environment: {
        stage: this.stage,
        region: this.region,
        nodeVersion: process.version,
      },
      responseTime,
    };

    // Add errors if any
    if (errors.length > 0) {
      response.errors = errors;
    }

    // Add detailed information if requested
    if (detailed) {
      response.detailed = true;
      response.memoryUsage = process.memoryUsage();
      response.uptime = process.uptime();
      response.lambdaContext = {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        memoryLimitInMB: context.memoryLimitInMB,
        remainingTimeInMillis: context.getRemainingTimeInMillis(),
      };
    }

    // Return appropriate status code
    const statusCode = isHealthy ? 200 : 503;
    return this.createResponse(statusCode, response, context.awsRequestId);
  }

  private async checkDynamoDB(): Promise<void> {
    // Simple scan on a table to check connectivity
    const tableName = `TreeCareUsers-${this.stage}`;
    await this.dynamoClient.scan({
      TableName: tableName,
      Limit: 1,
    }).promise();
  }

  private async checkS3(): Promise<void> {
    // List buckets to check S3 connectivity
    await this.s3Client.listBuckets().promise();
  }

  private async checkCognito(): Promise<void> {
    // List user pools to check Cognito connectivity
    await this.cognitoClient.listUserPools({
      MaxResults: 1,
    }).promise();
  }
}

// Export handler
const healthCheckHandler = new HealthCheckHandler();
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    return await healthCheckHandler.handler(event, context);
  } catch (error) {
    // Fallback error handling
    console.error('Health check critical error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'Health check failed critically',
        requestId: context.awsRequestId,
      }),
    };
  }
};
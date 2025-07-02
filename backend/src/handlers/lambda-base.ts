import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export interface LambdaResponse extends Omit<APIGatewayProxyResult, 'headers'> {
  headers: {
    [key: string]: string;
  };
}

export interface ErrorResponse {
  error: string;
  message?: string;
  requestId: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  data?: T;
  message?: string;
  requestId: string;
}

/**
 * Base Lambda handler with common functionality
 */
export abstract class BaseLambdaHandler {
  protected stage: string;
  protected region: string;

  constructor() {
    this.stage = process.env.STAGE || 'dev';
    this.region = process.env.AWS_REGION || 'us-east-2';
  }

  /**
   * Main handler method to be implemented by subclasses
   */
  abstract processRequest(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult>;

  /**
   * Lambda handler entry point
   */
  async handler(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<LambdaResponse> {
    console.log('Request:', {
      requestId: context.awsRequestId,
      method: event.httpMethod,
      path: event.path,
      headers: event.headers,
    });

    try {
      // Handle preflight OPTIONS requests
      if (event.httpMethod === 'OPTIONS') {
        return this.createResponse(204, '', context.awsRequestId);
      }

      // Process the actual request
      const result = await this.processRequest(event, context);
      return this.addCorsHeaders(result);
    } catch (error) {
      console.error('Handler error:', error);
      return this.createErrorResponse(error, context.awsRequestId);
    }
  }

  /**
   * Create a standardized response
   */
  protected createResponse<T>(
    statusCode: number,
    body: T | string,
    _requestId: string
  ): LambdaResponse {
    const response: LambdaResponse = {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    };

    if (statusCode === 204) {
      response.headers['Access-Control-Max-Age'] = '86400';
    }

    return response;
  }

  /**
   * Create an error response
   */
  protected createErrorResponse(
    error: any,
    requestId: string
  ): LambdaResponse {
    const statusCode = error.statusCode || 500;
    const errorResponse: ErrorResponse = {
      error: error.name || 'InternalServerError',
      message: error.message || 'An unexpected error occurred',
      requestId,
    };

    if (process.env.STAGE !== 'prod' && error.stack) {
      errorResponse.details = error.stack;
    }

    return this.createResponse(statusCode, errorResponse, requestId);
  }

  /**
   * Create a success response
   */
  protected createSuccessResponse<T>(
    data: T,
    requestId: string,
    message?: string
  ): LambdaResponse {
    const response: SuccessResponse<T> = {
      data,
      requestId,
    };

    if (message) {
      response.message = message;
    }

    return this.createResponse(200, response, requestId);
  }

  /**
   * Parse and validate JSON body
   */
  protected parseBody<T = any>(event: APIGatewayProxyEvent): T {
    if (!event.body) {
      throw new ValidationError('Request body is required');
    }

    try {
      return JSON.parse(event.body);
    } catch (error) {
      throw new ValidationError('Invalid JSON in request body');
    }
  }

  /**
   * Validate required headers
   */
  protected validateHeaders(
    event: APIGatewayProxyEvent,
    required: string[]
  ): void {
    const missing = required.filter(
      (header) => !event.headers[header] && !event.headers[header.toLowerCase()]
    );

    if (missing.length > 0) {
      throw new ValidationError(`Missing required headers: ${missing.join(', ')}`);
    }
  }

  /**
   * Add CORS headers to response
   */
  private addCorsHeaders(response: APIGatewayProxyResult): LambdaResponse {
    return {
      ...response,
      headers: {
        ...response.headers,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    };
  }
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  statusCode = 400;
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Example implementation for testing
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const lambdaHandler = new (class extends BaseLambdaHandler {
    async processRequest(
      event: APIGatewayProxyEvent,
      context: Context
    ): Promise<APIGatewayProxyResult> {
      return this.createSuccessResponse(
        { message: 'Lambda handler is working' },
        context.awsRequestId
      );
    }
  })();

  return lambdaHandler.handler(event, context);
};
/**
 * AWS SDK Mock Setup for Testing
 * Provides standardized mocks for AWS services used in the backend
 */

// Mock AWS SDK v3 clients
export const mockDynamoDBClient = {
  send: jest.fn(),
};

export const mockS3Client = {
  send: jest.fn(),
};

export const mockSageMakerRuntimeClient = {
  send: jest.fn(),
};

export const mockSNSClient = {
  send: jest.fn(),
};

// Mock AWS SDK v2 (if needed for legacy code)
export const mockAWSv2 = {
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      put: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      scan: jest.fn().mockReturnThis(),
      promise: jest.fn(),
    })),
  },
  S3: jest.fn(() => ({
    getSignedUrlPromise: jest.fn(),
    upload: jest.fn().mockReturnThis(),
    promise: jest.fn(),
  })),
};

// Helper function to reset all mocks
export const resetAllAWSMocks = (): void => {
  jest.clearAllMocks();
  mockDynamoDBClient.send.mockReset();
  mockS3Client.send.mockReset();
  mockSageMakerRuntimeClient.send.mockReset();
  mockSNSClient.send.mockReset();
};

// Mock implementation helpers
export const mockDynamoDBResponse = (data: any) => {
  mockDynamoDBClient.send.mockResolvedValueOnce(data);
};

export const mockS3Response = (data: any) => {
  mockS3Client.send.mockResolvedValueOnce(data);
};

export const mockSageMakerResponse = (data: any) => {
  mockSageMakerRuntimeClient.send.mockResolvedValueOnce(data);
};
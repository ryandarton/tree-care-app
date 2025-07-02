/**
 * Test for AWS SDK mocks configuration
 * Validates that AWS SDK mocking is properly set up
 */
import {
  mockDynamoDBClient,
  mockS3Client,
  mockSageMakerRuntimeClient,
  mockSNSClient,
  resetAllAWSMocks,
  mockDynamoDBResponse,
  mockS3Response,
  mockSageMakerResponse,
} from './setup/aws-mocks';

describe('AWS SDK Mocks', () => {
  beforeEach(() => {
    resetAllAWSMocks();
  });

  test('should have DynamoDB client mock', () => {
    expect(mockDynamoDBClient).toBeDefined();
    expect(mockDynamoDBClient.send).toBeDefined();
    expect(jest.isMockFunction(mockDynamoDBClient.send)).toBe(true);
  });

  test('should have S3 client mock', () => {
    expect(mockS3Client).toBeDefined();
    expect(mockS3Client.send).toBeDefined();
    expect(jest.isMockFunction(mockS3Client.send)).toBe(true);
  });

  test('should have SageMaker Runtime client mock', () => {
    expect(mockSageMakerRuntimeClient).toBeDefined();
    expect(mockSageMakerRuntimeClient.send).toBeDefined();
    expect(jest.isMockFunction(mockSageMakerRuntimeClient.send)).toBe(true);
  });

  test('should have SNS client mock', () => {
    expect(mockSNSClient).toBeDefined();
    expect(mockSNSClient.send).toBeDefined();
    expect(jest.isMockFunction(mockSNSClient.send)).toBe(true);
  });

  test('should support mock response helpers', async () => {
    const testData = { Item: { id: 'test-123' } };
    mockDynamoDBResponse(testData);
    
    const result = await mockDynamoDBClient.send({});
    expect(result).toEqual(testData);
  });

  test('should reset all mocks properly', () => {
    // Set up some mock calls
    mockDynamoDBClient.send.mockResolvedValueOnce({ test: 'data' });
    mockS3Client.send.mockResolvedValueOnce({ test: 'data' });
    
    expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(0); // Not called yet
    
    // Reset and verify
    resetAllAWSMocks();
    expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(0);
    expect(mockS3Client.send).toHaveBeenCalledTimes(0);
  });
});
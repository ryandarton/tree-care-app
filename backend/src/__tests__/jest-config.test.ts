/**
 * Meta-test for Jest configuration validation
 * This test ensures Jest is properly configured for the backend
 */
describe('Jest Configuration', () => {
  test('should have TypeScript support', () => {
    // This test will only pass if ts-jest is working
    const testValue: string = 'TypeScript is working';
    expect(testValue).toBe('TypeScript is working');
  });

  test('should have access to Node.js environment', () => {
    expect(process.env).toBeDefined();
    expect(global).toBeDefined();
  });

  test('should support async/await', async () => {
    const asyncFunction = async (): Promise<string> => {
      return Promise.resolve('async working');
    };
    
    const result = await asyncFunction();
    expect(result).toBe('async working');
  });

  test('should have test environment set to node', () => {
    // In browser environment, window would be defined
    // In node environment, process should be defined
    expect(typeof window).toBe('undefined');
    expect(typeof process).toBe('object');
  });
});
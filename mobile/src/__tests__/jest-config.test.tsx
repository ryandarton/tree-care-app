/**
 * Meta-test for React Native Jest configuration validation
 * This test ensures Jest is properly configured for React Native testing
 */
describe('React Native Jest Configuration', () => {
  test('should support TypeScript in tests', () => {
    const testValue: string = 'TypeScript is working';
    expect(testValue).toBe('TypeScript is working');
  });

  test('should support async/await in React Native tests', async () => {
    const asyncFunction = async (): Promise<string> => {
      return Promise.resolve('async working in RN');
    };
    
    const result = await asyncFunction();
    expect(result).toBe('async working in RN');
  });

  test('should have test environment configured', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('should support object destructuring', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const { a, ...rest } = obj;
    expect(a).toBe(1);
    expect(rest).toEqual({ b: 2, c: 3 });
  });
});
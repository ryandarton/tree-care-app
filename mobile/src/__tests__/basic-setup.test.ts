/**
 * Basic test to validate Jest setup
 */
describe('Basic Mobile Jest Setup', () => {
  test('should run basic JavaScript test', () => {
    expect(1 + 1).toBe(2);
  });

  test('should support ES6 features', () => {
    const arr = [1, 2, 3];
    const doubled = arr.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  test('should support TypeScript types', () => {
    interface TestInterface {
      name: string;
      value: number;
    }

    const testObj: TestInterface = {
      name: 'test',
      value: 42
    };

    expect(testObj.name).toBe('test');
    expect(testObj.value).toBe(42);
  });
});
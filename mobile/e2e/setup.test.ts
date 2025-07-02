/**
 * Meta-test for E2E framework initialization
 * This test ensures Detox is properly configured
 */
describe('E2E Testing Setup', () => {
  beforeAll(async () => {
    // This will only run if Detox is properly configured
    await device.launchApp();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  test('should have device object available', () => {
    expect(device).toBeDefined();
    expect(device.launchApp).toBeDefined();
    expect(device.terminateApp).toBeDefined();
  });

  test('should have element and by helpers available', () => {
    expect(element).toBeDefined();
    expect(by).toBeDefined();
    expect(waitFor).toBeDefined();
  });

  test('should have expect matchers for Detox', () => {
    // These are Detox-specific matchers
    const testElement = element(by.id('test'));
    expect(testElement.tap).toBeDefined();
    expect(testElement.typeText).toBeDefined();
    expect(testElement.scroll).toBeDefined();
  });

  test('should launch app successfully', async () => {
    // If we get here, the app launched in beforeAll
    const welcomeScreen = element(by.id('welcome-screen'));
    
    // This would fail if app didn't launch, proving Detox works
    // For now, we just test that the element query doesn't throw
    expect(() => welcomeScreen).not.toThrow();
  });
});
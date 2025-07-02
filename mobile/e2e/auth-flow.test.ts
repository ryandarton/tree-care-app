/**
 * E2E test for authentication flow
 * Tests the complete user authentication journey
 */
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('should show login screen on app launch', async () => {
    // Wait for login screen to appear
    await waitFor(element(by.id('login-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Verify login elements are present
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
    await expect(element(by.id('signup-link'))).toBeVisible();
  });

  test('should navigate to signup screen', async () => {
    await element(by.id('signup-link')).tap();
    
    await waitFor(element(by.id('signup-screen')))
      .toBeVisible()
      .withTimeout(3000);
    
    await expect(element(by.id('name-input'))).toBeVisible();
    await expect(element(by.id('email-input'))).toBeVisible();
    await expect(element(by.id('password-input'))).toBeVisible();
  });

  test('should show validation errors for invalid input', async () => {
    // Try to login with empty fields
    await element(by.id('login-button')).tap();
    
    await waitFor(element(by.text('Email is required')))
      .toBeVisible()
      .withTimeout(2000);
    
    await expect(element(by.text('Password is required'))).toBeVisible();
  });

  test('should login with valid credentials', async () => {
    // Enter test credentials
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('TestPassword123!');
    
    // Hide keyboard
    await element(by.id('login-screen')).tap();
    
    // Attempt login
    await element(by.id('login-button')).tap();
    
    // Should navigate to main app
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(5000);
    
    // Verify we're logged in
    await expect(element(by.id('tree-list'))).toBeVisible();
  });
});
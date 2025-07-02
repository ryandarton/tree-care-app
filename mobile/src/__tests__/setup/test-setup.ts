/**
 * Test setup for React Native testing
 * Configures mocks and global test utilities
 */

// Silence console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

global.beforeAll(() => {
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactNative') ||
       args[0].includes('Animated') ||
       args[0].includes('ViewPropTypes'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

global.afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Export to make TypeScript happy
export {};
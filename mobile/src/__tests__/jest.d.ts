import '@testing-library/jest-native/extend-expect';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStyle(style: Record<string, any>): R;
    }
  }
}
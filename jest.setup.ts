import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';

// Make TextEncoder and TextDecoder available globally
Object.assign(global, {
  TextDecoder,
  TextEncoder,
});

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

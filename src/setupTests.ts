import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@asamuzakjp/css-color', () => ({
    default: vi.fn(),
    parse: vi.fn(),
}));

vi.mock('@csstools/css-calc', () => ({
    default: vi.fn(),
}));

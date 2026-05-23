import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NetworkProvider, useNetwork } from '../NetworkContext';
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Mock Firebase APIs
vi.mock('firebase/firestore', () => ({
  enableNetwork: vi.fn(() => Promise.resolve()),
  disableNetwork: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../firebase', () => ({
  db: {},
}));

const TestComponent = () => {
  const { isOnline, isManualOffline, actualOnline, toggleManualOffline } = useNetwork();
  return (
    <div>
      <span data-testid="isOnline">{String(isOnline)}</span>
      <span data-testid="isManualOffline">{String(isManualOffline)}</span>
      <span data-testid="actualOnline">{String(actualOnline)}</span>
      <button data-testid="toggleBtn" onClick={toggleManualOffline}>Toggle</button>
    </div>
  );
};

describe('NetworkContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides default online values matching navigator.onLine', () => {
    render(
      <NetworkProvider>
        <TestComponent />
      </NetworkProvider>
    );

    expect(screen.getByTestId('isOnline').textContent).toBe('true');
    expect(screen.getByTestId('isManualOffline').textContent).toBe('false');
    expect(screen.getByTestId('actualOnline').textContent).toBe('true');
    expect(enableNetwork).toHaveBeenCalled();
  });

  it('toggles manual offline mode and triggers Firestore disableNetwork', async () => {
    render(
      <NetworkProvider>
        <TestComponent />
      </NetworkProvider>
    );

    const button = screen.getByTestId('toggleBtn');
    await act(async () => {
      button.click();
    });

    expect(screen.getByTestId('isOnline').textContent).toBe('false');
    expect(screen.getByTestId('isManualOffline').textContent).toBe('true');
    expect(disableNetwork).toHaveBeenCalled();
    expect(localStorage.getItem('force_offline')).toBe('true');
  });

  it('updates when browser goes offline and online', async () => {
    render(
      <NetworkProvider>
        <TestComponent />
      </NetworkProvider>
    );

    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByTestId('isOnline').textContent).toBe('false');
    expect(screen.getByTestId('actualOnline').textContent).toBe('false');
    expect(disableNetwork).toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByTestId('isOnline').textContent).toBe('true');
    expect(screen.getByTestId('actualOnline').textContent).toBe('true');
  });
});

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEvents, defaultEvents } from '../useEvents';
import * as firestoreHooks from 'react-firebase-hooks/firestore';

// Mock Firebase
vi.mock('../../../shared/firebase', () => ({
    db: {},
}));

// Mock Context
const mockShowToast = vi.fn();
vi.mock('../../../shared/context', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

// Mock Hooks
vi.mock('react-firebase-hooks/firestore');
vi.mock('firebase/firestore');

describe('useEvents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Default mock for useCollectionData
        (firestoreHooks.useCollectionData as any).mockReturnValue([null, true, undefined]);
    });

    it('should return default events when no synagogueId is provided', () => {
        const { result } = renderHook(() => useEvents(undefined));
        expect(result.current.events).toEqual(defaultEvents);
    });

    it('should load initial events from localStorage if available', () => {
        const synagogueId = 'test-synagogue';
        const storedEvents = [{ id: '1', name: 'Test Event', order: 0 }];
        localStorage.setItem(`syn_${synagogueId}_events`, JSON.stringify(storedEvents));

        const { result } = renderHook(() => useEvents(synagogueId));
        expect(result.current.events).toEqual(storedEvents);
    });

    it('should update events and localStorage when server data changes', () => {
        const synagogueId = 'test-synagogue';
        const serverEvents = [{ id: '2', name: 'Server Event', order: 0 }];

        // Mock initial loading state
        (firestoreHooks.useCollectionData as any).mockReturnValue([serverEvents, false, undefined]);

        const { result } = renderHook(() => useEvents(synagogueId));

        expect(result.current.events).toEqual(serverEvents);
        expect(localStorage.getItem(`syn_${synagogueId}_events`)).toEqual(JSON.stringify(serverEvents));
    });

    it('should show a toast when data is updated from server (after initial load)', () => {
        const synagogueId = 'test-synagogue';
        const initialEvents = [{ id: '1', name: 'Initial', order: 0 }];
        const updatedEvents = [{ id: '1', name: 'Updated', order: 0 }];

        // 1. Render with initial data
        let mockReturnValue = [initialEvents, false, undefined];
        (firestoreHooks.useCollectionData as any).mockImplementation(() => mockReturnValue);

        const { result, rerender } = renderHook(() => useEvents(synagogueId));
        expect(result.current.events).toEqual(initialEvents);

        // 2. Simulate server update
        mockReturnValue = [updatedEvents, false, undefined];
        rerender();

        expect(result.current.events).toEqual(updatedEvents);
        expect(mockShowToast).toHaveBeenCalledWith('המידע עודכן מהשרת', 'info', 2000);
    });

    it('should use cached events and not be loading when Firestore returns an error', () => {
        const synagogueId = 'test-synagogue';
        const cachedEvents = [{ id: '1', name: 'Cached Event', order: 0 }];
        localStorage.setItem(`syn_${synagogueId}_events`, JSON.stringify(cachedEvents));

        // Simulate Firestore error (e.g. offline)
        const firestoreError = new Error('Failed to get document because the client is offline.');
        (firestoreHooks.useCollectionData as any).mockReturnValue([undefined, false, firestoreError]);

        const { result } = renderHook(() => useEvents(synagogueId));

        expect(result.current.events).toEqual(cachedEvents);
        expect(result.current.loading).toBe(false);
    });

    it('should report loading=false when localStorage has data even if Firestore is still loading', () => {
        const synagogueId = 'test-synagogue';
        const cachedEvents = [{ id: '1', name: 'Cached Event', order: 0 }];
        localStorage.setItem(`syn_${synagogueId}_events`, JSON.stringify(cachedEvents));

        // Firestore is still loading
        (firestoreHooks.useCollectionData as any).mockReturnValue([undefined, true, undefined]);

        const { result } = renderHook(() => useEvents(synagogueId));

        expect(result.current.events).toEqual(cachedEvents);
        expect(result.current.loading).toBe(false);
    });
});

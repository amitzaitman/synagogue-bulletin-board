import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useEvents, defaultEvents } from '../useEvents';
import * as firestoreHooks from 'react-firebase-hooks/firestore';
import { ToastWrapper, mockShowToast } from './test-utils';

// Mock Firebase
vi.mock('../../../shared/firebase', () => ({
    db: {},
}));

// Mock Hooks
vi.mock('react-firebase-hooks/firestore');
vi.mock('firebase/firestore');

const createCollectionSnapshot = (docs: any[], fromCache = false) => ({
    docs: docs.map(doc => ({
        id: doc.id,
        data: () => doc,
    })),
    metadata: { fromCache },
});

describe('useEvents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        (firestoreHooks.useCollection as any).mockReturnValue([undefined, true, undefined]);
    });

    it('should return default events when no synagogueId is provided', () => {
        const { result } = renderHook(() => useEvents(undefined), { wrapper: ToastWrapper });
        expect(result.current.events).toEqual(defaultEvents);
    });

    it('should load initial events from localStorage if available', () => {
        const synagogueId = 'test-synagogue';
        const storedEvents = [{ id: '1', name: 'Test Event', order: 0 }];
        localStorage.setItem(`syn_${synagogueId}_events`, JSON.stringify(storedEvents));

        const { result } = renderHook(() => useEvents(synagogueId), { wrapper: ToastWrapper });
        expect(result.current.events).toEqual(storedEvents);
    });

    it('should update events and localStorage when server data changes', () => {
        const synagogueId = 'test-synagogue';
        const serverEvents = [{ id: '2', name: 'Server Event', order: 0 }];

        (firestoreHooks.useCollection as any).mockReturnValue([createCollectionSnapshot(serverEvents), false, undefined]);

        const { result } = renderHook(() => useEvents(synagogueId), { wrapper: ToastWrapper });

        expect(result.current.events).toEqual(serverEvents);
        expect(localStorage.getItem(`syn_${synagogueId}_events`)).toEqual(JSON.stringify(serverEvents));
    });

    it('should show a toast when data is updated from server (after initial load)', () => {
        const synagogueId = 'test-synagogue';
        const initialEvents = [{ id: '1', name: 'Initial', order: 0 }];
        const updatedEvents = [{ id: '1', name: 'Updated', order: 0 }];

        // 1. Render with initial data
        let mockReturnValue = [createCollectionSnapshot(initialEvents), false, undefined];
        (firestoreHooks.useCollection as any).mockImplementation(() => mockReturnValue);

        const { result, rerender } = renderHook(() => useEvents(synagogueId), { wrapper: ToastWrapper });
        expect(result.current.events).toEqual(initialEvents);

        // 2. Simulate server update
        mockReturnValue = [createCollectionSnapshot(updatedEvents), false, undefined];
        rerender();

        expect(result.current.events).toEqual(updatedEvents);
        expect(mockShowToast).toHaveBeenCalledWith('המידע עודכן מהשרת', 'info', 2000);
    });

    it('should not report a server sync when the snapshot only came from cache', () => {
        const synagogueId = 'test-synagogue';
        const cachedEvents = [{ id: '1', name: 'Cached Event', order: 0 }];
        const onSync = vi.fn();

        (firestoreHooks.useCollection as any).mockReturnValue([createCollectionSnapshot(cachedEvents, true), false, undefined]);

        const { result } = renderHook(() => useEvents(synagogueId, onSync), { wrapper: ToastWrapper });

        expect(result.current.events).toEqual(cachedEvents);
        expect(onSync).not.toHaveBeenCalled();
    });

    it('should use cached events and not be loading when Firestore returns an error', () => {
        const synagogueId = 'test-synagogue';
        const cachedEvents = [{ id: '1', name: 'Cached Event', order: 0 }];
        localStorage.setItem(`syn_${synagogueId}_events`, JSON.stringify(cachedEvents));

        // Simulate Firestore error (e.g. offline)
        const firestoreError = new Error('Failed to get document because the client is offline.');
        (firestoreHooks.useCollection as any).mockReturnValue([undefined, false, firestoreError]);

        const { result } = renderHook(() => useEvents(synagogueId), { wrapper: ToastWrapper });

        expect(result.current.events).toEqual(cachedEvents);
        expect(result.current.loading).toBe(false);
    });

    it('should report loading=false when localStorage has data even if Firestore is still loading', () => {
        const synagogueId = 'test-synagogue';
        const cachedEvents = [{ id: '1', name: 'Cached Event', order: 0 }];
        localStorage.setItem(`syn_${synagogueId}_events`, JSON.stringify(cachedEvents));

        // Firestore is still loading
        (firestoreHooks.useCollection as any).mockReturnValue([undefined, true, undefined]);

        const { result } = renderHook(() => useEvents(synagogueId), { wrapper: ToastWrapper });

        expect(result.current.events).toEqual(cachedEvents);
        expect(result.current.loading).toBe(false);
    });
});

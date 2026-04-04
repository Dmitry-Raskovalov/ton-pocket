import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mock for IntersectionObserver
class IntersectionObserverMock {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    disconnect = vi.fn();
    observe = vi.fn();
    takeRecords = vi.fn();
    unobserve = vi.fn();
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);
// Ensure it's on window too
if (typeof window !== 'undefined') {
    window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}

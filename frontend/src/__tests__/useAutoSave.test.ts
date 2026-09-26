import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '@/hooks/useAutoSave';

// The hook must debounce. Typing quickly should produce ONE save after the
// pause, not one save per keystroke.
describe('useAutoSave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not report a save before the user has typed anything', () => {
    const { result } = renderHook(() => useAutoSave({ subjective: '' }, 1500));
    expect(result.current).toBeNull();
  });

  it('does not save while the user is still typing', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, 1500),
      { initialProps: { data: { subjective: 'P' } } }
    );
    rerender({ data: { subjective: 'Pa' } });
    act(() => { vi.advanceTimersByTime(1000); });
    rerender({ data: { subjective: 'Pat' } });
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current).toBeNull();
  });

  it('records one save once typing pauses for the full delay', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, 1500),
      { initialProps: { data: { subjective: 'P' } } }
    );
    rerender({ data: { subjective: 'Patient reports a headache' } });
    act(() => { vi.advanceTimersByTime(1500); });
    expect(result.current).toBeInstanceOf(Date);
  });

  it('respects a custom delay', () => {
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, 500),
      { initialProps: { data: { subjective: 'a' } } }
    );
    rerender({ data: { subjective: 'ab' } });
    act(() => { vi.advanceTimersByTime(499); });
    expect(result.current).toBeNull();
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBeInstanceOf(Date);
  });

  it('clears its pending timer when the component unmounts', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { rerender, unmount } = renderHook(
      ({ data }) => useAutoSave(data, 1500),
      { initialProps: { data: { subjective: 'a' } } }
    );
    rerender({ data: { subjective: 'ab' } });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});

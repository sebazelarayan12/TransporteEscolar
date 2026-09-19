import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devuelve el valor inicial de inmediato', () => {
    const { result } = renderHook(() => useDebounce('hola', 500));

    expect(result.current).toBe('hola');
  });

  it('no actualiza el valor antes de que pase el retraso', () => {
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 500), {
      initialProps: { valor: 'a' },
    });

    rerender({ valor: 'ab' });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe('a');
  });

  it('actualiza el valor una vez que pasa el retraso', () => {
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 500), {
      initialProps: { valor: 'a' },
    });

    rerender({ valor: 'ab' });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('ab');
  });

  it('reinicia el temporizador si el valor vuelve a cambiar', () => {
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 500), {
      initialProps: { valor: 'a' },
    });

    rerender({ valor: 'ab' });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    rerender({ valor: 'abc' });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('abc');
  });
});

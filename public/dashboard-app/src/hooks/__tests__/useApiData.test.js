import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiData } from '../useForm';

// Mock console.error to avoid noise in tests
/* eslint-disable no-console */
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});
/* eslint-enable no-console */

describe('useApiData Hook', () => {
  describe('Successful API calls', () => {
    it('handles successful data fetching', async () => {
      const mockData = { id: 1, name: 'Test User' };
      const fetchFunction = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiData(fetchFunction));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(fetchFunction).toHaveBeenCalledOnce();
    });

    it('provides refetch functionality', async () => {
      const mockData1 = { id: 1, name: 'First' };
      const mockData2 = { id: 2, name: 'Second' };
      const fetchFunction = vi.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      // Refetch
      let refetchResult;
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(refetchResult).toEqual(mockData2);
      expect(result.current.data).toEqual(mockData2);
      expect(fetchFunction).toHaveBeenCalledTimes(2);
    });

    it('handles empty data response', async () => {
      const fetchFunction = vi.fn().mockResolvedValue(null);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('handles array data response', async () => {
      const mockData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const fetchFunction = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });
    });
  });

  describe('Failed API calls', () => {
    it('handles API errors with message', async () => {
      const error = new Error('API Error');
      const fetchFunction = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('API Error');
    });

    it('handles errors without message', async () => {
      const fetchFunction = vi.fn().mockRejectedValue({});

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('An error occurred');
    });

    it('returns null on refetch error', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetchFunction = vi.fn()
        .mockResolvedValueOnce(mockData)
        .mockRejectedValueOnce(new Error('Refetch failed'));

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      let refetchResult;
      await act(async () => {
        refetchResult = await result.current.refetch();
      });

      expect(refetchResult).toBeNull();
      expect(result.current.error).toBe('Refetch failed');
    });

    it('clears previous error on successful refetch', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetchFunction = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockData);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.error).toBe('First error');
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('Dependencies', () => {
    it('refetches when dependencies change', async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };
      const fetchFunction = vi.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      let dependency = 'initial';
      const { result, rerender } = renderHook(
        ({ dep }) => useApiData(fetchFunction, [dep]),
        { initialProps: { dep: dependency } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      // Change dependency
      dependency = 'changed';
      rerender({ dep: dependency });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData2);
      });

      expect(fetchFunction).toHaveBeenCalledTimes(2);
    });

    it('does not refetch when dependencies stay the same', async () => {
      const mockData = { id: 1 };
      const fetchFunction = vi.fn().mockResolvedValue(mockData);

      const dependency = 'constant';
      const { result, rerender } = renderHook(
        ({ dep }) => useApiData(fetchFunction, [dep]),
        { initialProps: { dep: dependency } }
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // Rerender with same dependency
      rerender({ dep: dependency });

      // Should not refetch
      expect(fetchFunction).toHaveBeenCalledOnce();
    });

    it('works without dependencies', async () => {
      const mockData = { id: 1 };
      const fetchFunction = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      expect(fetchFunction).toHaveBeenCalledOnce();
    });
  });

  describe('Loading states', () => {
    it('manages loading state during initial fetch', async () => {
      let resolvePromise;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      const fetchFunction = vi.fn().mockReturnValue(promise);

      const { result } = renderHook(() => useApiData(fetchFunction));

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();

      resolvePromise({ id: 1 });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('manages loading state during refetch', async () => {
      const mockData = { id: 1 };
      let resolveRefetch;
      const refetchPromise = new Promise((resolve) => {
        resolveRefetch = resolve;
      });

      const fetchFunction = vi.fn()
        .mockResolvedValueOnce(mockData)
        .mockReturnValueOnce(refetchPromise);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData);
      });

      // Start refetch
      act(() => {
        result.current.refetch();
      });

      expect(result.current.loading).toBe(true);

      resolveRefetch({ id: 2 });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error recovery', () => {
    it('can recover from error with successful refetch', async () => {
      const error = new Error('Network error');
      const successData = { id: 1, name: 'Success' };
      
      const fetchFunction = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(successData);

      const { result } = renderHook(() => useApiData(fetchFunction));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      await act(async () => {
        await result.current.refetch();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual(successData);
    });
  });
});

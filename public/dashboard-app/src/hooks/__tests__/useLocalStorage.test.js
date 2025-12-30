import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useForm';
import * as logger from '../../utils/logger';

vi.mock('../../utils/logger', () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logDebug: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('returns initial value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', 'defaultValue')
      );

      expect(result.current[0]).toBe('defaultValue');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
    });

    it('returns stored value from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('"storedValue"');
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', 'defaultValue')
      );

      expect(result.current[0]).toBe('storedValue');
    });

    it('handles invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      const logErrorSpy = logger.logError;
      logErrorSpy.mockClear();
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', 'defaultValue')
      );

      expect(result.current[0]).toBe('defaultValue');
      expect(logErrorSpy).toHaveBeenCalled();
    });

    it('handles different data types as initial values', () => {
      localStorageMock.getItem.mockReturnValue(null);

      // String
      const { result: stringResult } = renderHook(() => 
        useLocalStorage('string', 'test')
      );
      expect(stringResult.current[0]).toBe('test');

      // Number
      const { result: numberResult } = renderHook(() => 
        useLocalStorage('number', 42)
      );
      expect(numberResult.current[0]).toBe(42);

      // Boolean
      const { result: booleanResult } = renderHook(() => 
        useLocalStorage('boolean', true)
      );
      expect(booleanResult.current[0]).toBe(true);

      // Object
      const testObject = { name: 'test', value: 123 };
      const { result: objectResult } = renderHook(() => 
        useLocalStorage('object', testObject)
      );
      expect(objectResult.current[0]).toEqual(testObject);

      // Array
      const testArray = [1, 2, 3, 'test'];
      const { result: arrayResult } = renderHook(() => 
        useLocalStorage('array', testArray)
      );
      expect(arrayResult.current[0]).toEqual(testArray);
    });
  });

  describe('Setting Values', () => {
    it('sets string values in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', 'initial')
      );

      act(() => {
        result.current[1]('newValue');
      });

      expect(result.current[0]).toBe('newValue');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', '"newValue"');
    });

    it('sets object values in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', {})
      );

      const newObject = { name: 'test', id: 123 };

      act(() => {
        result.current[1](newObject);
      });

      expect(result.current[0]).toEqual(newObject);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(newObject));
    });

    it('sets array values in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', [])
      );

      const newArray = [1, 2, 'three', { four: 4 }];

      act(() => {
        result.current[1](newArray);
      });

      expect(result.current[0]).toEqual(newArray);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(newArray));
    });

    it('sets boolean values in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', false)
      );

      act(() => {
        result.current[1](true);
      });

      expect(result.current[0]).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', 'true');
    });

    it('sets null values in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('"initial"');
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', 'initial')
      );

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testKey', 'null');
    });

    it('handles function updates', () => {
      localStorageMock.getItem.mockReturnValue('10');
      
      const { result } = renderHook(() => 
        useLocalStorage('counter', 0)
      );

      act(() => {
        result.current[1](prevValue => prevValue + 5);
      });

      expect(result.current[0]).toBe(15);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('counter', '15');
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage.setItem errors', () => {
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      const logErrorSpy = logger.logError;
      logErrorSpy.mockClear();
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', 'initial')
      );

      act(() => {
        result.current[1]('newValue');
      });

      // Value should still update in state
      expect(result.current[0]).toBe('newValue');
      expect(logErrorSpy).toHaveBeenCalled();
    });

    it('handles localStorage.getItem errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const logErrorSpy = logger.logError;
      logErrorSpy.mockClear();
      
      const { result } = renderHook(() => 
        useLocalStorage('testKey', 'defaultValue')
      );

      expect(result.current[0]).toBe('defaultValue');
      expect(logErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Key Changes', () => {
    it('updates value when key changes', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('"value1"')  // First key
        .mockReturnValueOnce('"value2"'); // Second key

      let key = 'key1';
      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage(key, 'default'),
        { initialProps: { key } }
      );

      expect(result.current[0]).toBe('value1');

      // Change key
      key = 'key2';
      rerender({ key });

      expect(result.current[0]).toBe('value2');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('key1');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('key2');
    });
  });

  describe('Complex Data Types', () => {
    it('handles nested objects', () => {
      const complexObject = {
        user: {
          name: 'John Doe',
          settings: {
            theme: 'dark',
            notifications: {
              email: true,
              push: false
            }
          },
          tags: ['admin', 'developer']
        },
        metadata: {
          created: '2023-01-01',
          version: 1.2
        }
      };

      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('complex', {})
      );

      act(() => {
        result.current[1](complexObject);
      });

      expect(result.current[0]).toEqual(complexObject);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('complex', JSON.stringify(complexObject));
    });

    it('handles arrays with mixed types', () => {
      const mixedArray = [
        'string',
        42,
        true,
        null,
        { id: 1, name: 'object' },
        [1, 2, 3],
        undefined // Note: undefined will be converted to null by JSON
      ];

      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useLocalStorage('mixed', [])
      );

      act(() => {
        result.current[1](mixedArray);
      });

      // undefined becomes null in JSON serialization
      const expectedArray = [
        'string',
        42,
        true,
        null,
        { id: 1, name: 'object' },
        [1, 2, 3],
        null
      ];

      expect(result.current[0]).toEqual(expectedArray);
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      localStorageMock.getItem.mockReturnValue('"initial"');
      
      const renderSpy = vi.fn();
      
      const { rerender } = renderHook(() => {
        renderSpy();
        return useLocalStorage('testKey', 'default');
      });

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Rerender with same key and default value
      rerender();
      
      expect(renderSpy).toHaveBeenCalledTimes(2);
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1); // Should only call once
    });
  });

  describe('State Synchronization', () => {
    it('maintains state across multiple hook instances with same key', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result: result1 } = renderHook(() => 
        useLocalStorage('shared', 'initial')
      );
      
      const { result: result2 } = renderHook(() => 
        useLocalStorage('shared', 'initial')
      );

      // Both should have the same initial value
      expect(result1.current[0]).toBe('initial');
      expect(result2.current[0]).toBe('initial');

      // Update from first hook
      act(() => {
        result1.current[1]('updated');
      });

      expect(result1.current[0]).toBe('updated');
      // Note: In a real implementation, you might want to sync across instances
      // This test documents the current behavior
    });
  });
});
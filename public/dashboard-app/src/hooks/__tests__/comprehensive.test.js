import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useForm, useApiData, useLocalStorage, useToggle } from '../useForm';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Custom Hooks Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('useForm - Core Functionality', () => {
    it('handles basic form operations', async () => {
      const { result } = renderHook(() => 
        useForm({ username: '', email: '' })
      );

      // Initial state
      expect(result.current.values).toEqual({ username: '', email: '' });
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);

      // Handle input change
      act(() => {
        result.current.handleChange({
          target: { name: 'username', value: 'testuser' }
        });
      });

      expect(result.current.values.username).toBe('testuser');

      // Handle blur
      act(() => {
        result.current.handleBlur({
          target: { name: 'username' }
        });
      });

      expect(result.current.touched.username).toBe(true);

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values).toEqual({ username: '', email: '' });
      expect(result.current.touched).toEqual({});
    });

    it('handles validation with rules object', async () => {
      const validationRules = {
        username: {
          required: true,
          minLength: 3,
          message: 'Username is required'
        }
      };

      const { result } = renderHook(() => 
        useForm({ username: '' }, validationRules)
      );

      // Test required validation
      act(() => {
        result.current.handleChange({
          target: { name: 'username', value: '' }
        });
      });

      act(() => {
        result.current.handleBlur({
          target: { name: 'username' }
        });
      });

      await waitFor(() => {
        expect(result.current.errors.username).toBe('Username is required');
      });

      // Test min length validation
      act(() => {
        result.current.handleChange({
          target: { name: 'username', value: 'ab' }
        });
      });

      await waitFor(() => {
        expect(result.current.errors.username).toBeTruthy();
      });

      // Valid input
      act(() => {
        result.current.handleChange({
          target: { name: 'username', value: 'validuser' }
        });
      });

      await waitFor(() => {
        expect(result.current.errors.username).toBeUndefined();
      });
    });

    it('handles form submission', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(true);
      
      const { result } = renderHook(() => 
        useForm({ username: 'test' }, null, mockSubmit)
      );

      // Submit form
      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSubmit).toHaveBeenCalledWith({ username: 'test' });
    });
  });

  describe('useApiData - Core Functionality', () => {
    it('fetches data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      const fetchFn = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiData(fetchFn));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();

      // Wait for data
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('handles API errors', async () => {
      const error = new Error('API failed');
      const fetchFn = vi.fn().mockRejectedValue(error);

      const { result } = renderHook(() => useApiData(fetchFn));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('API failed');
    });

    it('provides refetch functionality', async () => {
      const mockData1 = { id: 1 };
      const mockData2 = { id: 2 };
      const fetchFn = vi.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      const { result } = renderHook(() => useApiData(fetchFn));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockData1);
      });

      // Refetch
      const refetchResult = await result.current.refetch();
      expect(refetchResult).toEqual(mockData2);
    });
  });

  describe('useLocalStorage - Core Functionality', () => {
    it('initializes with default value', () => {
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'default-value')
      );

      expect(result.current[0]).toBe('default-value');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
    });

    it('stores and retrieves values', () => {
      const { result } = renderHook(() => 
        useLocalStorage('test-key', 'initial')
      );

      act(() => {
        result.current[1]('new-value');
      });

      expect(result.current[0]).toBe('new-value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
    });

    it('handles stored JSON data', () => {
      localStorageMock.getItem.mockReturnValue('{"name":"John","age":30}');
      
      const { result } = renderHook(() => 
        useLocalStorage('user', {})
      );

      expect(result.current[0]).toEqual({ name: 'John', age: 30 });
    });

    it('handles function updates', () => {
      const { result } = renderHook(() => 
        useLocalStorage('counter', 0)
      );

      act(() => {
        result.current[1](prev => prev + 1);
      });

      expect(result.current[0]).toBe(1);
    });
  });

  describe('useToggle - Core Functionality', () => {
    it('toggles between true and false', () => {
      const { result } = renderHook(() => useToggle(false));

      expect(result.current[0]).toBe(false);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[1]();
      });

      expect(result.current[0]).toBe(false);
    });

    it('initializes with provided value', () => {
      const { result } = renderHook(() => useToggle(true));
      expect(result.current[0]).toBe(true);
    });

    it('toggles multiple times correctly', () => {
      const { result } = renderHook(() => useToggle(false));

      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current[1]();
        });
        expect(result.current[0]).toBe(i % 2 === 0);
      }
    });
  });

  describe('Hooks Integration', () => {
    it('can use multiple hooks together', async () => {
      const mockApi = vi.fn().mockResolvedValue({ settings: { theme: 'dark' } });
      
      const { result } = renderHook(() => {
        const form = useForm({ username: '' });
        const api = useApiData(mockApi);
        const [theme, toggleTheme] = useToggle(false);
        const [settings, setSettings] = useLocalStorage('settings', {});
        
        return { form, api, theme, toggleTheme, settings, setSettings };
      });

      // Wait for API data
      await waitFor(() => {
        expect(result.current.api.data).toEqual({ settings: { theme: 'dark' } });
      });

      // Update form
      act(() => {
        result.current.form.handleChange({
          target: { name: 'username', value: 'testuser' }
        });
      });

      // Toggle theme
      act(() => {
        result.current.toggleTheme();
      });

      // Update localStorage
      act(() => {
        result.current.setSettings({ theme: 'light' });
      });

      expect(result.current.form.values.username).toBe('testuser');
      expect(result.current.theme).toBe(true);
      expect(result.current.settings).toEqual({ theme: 'light' });
    });
  });
});
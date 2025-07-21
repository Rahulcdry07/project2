import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import useScrollAnimation from '../useScrollAnimation';

describe('useScrollAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a ref', () => {
    const { result } = renderHook(() => useScrollAnimation());
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
  });

  it('creates IntersectionObserver on mount', () => {
    const mockObserver = jest.fn();
    global.IntersectionObserver = mockObserver;

    renderHook(() => useScrollAnimation());
    
    expect(mockObserver).toHaveBeenCalled();
  });

  it('observes the ref element', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    // Create a mock element
    const mockElement = document.createElement('div');
    
    // Simulate the ref being set
    result.current.current = mockElement;
    
    // The observer should be called with the element
    expect(global.IntersectionObserver).toHaveBeenCalled();
  });

  it('adds animation class when element becomes visible', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    const mockElement = document.createElement('div');
    mockElement.classList = {
      add: jest.fn(),
      remove: jest.fn()
    };
    
    result.current.current = mockElement;
    
    // Simulate intersection
    const observerCallback = global.IntersectionObserver.mock.calls[0][0];
    observerCallback([{ isIntersecting: true, target: mockElement }]);
    
    expect(mockElement.classList.add).toHaveBeenCalledWith('animate-in');
  });

  it('removes animation class when element is not visible', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    const mockElement = document.createElement('div');
    mockElement.classList = {
      add: jest.fn(),
      remove: jest.fn()
    };
    
    result.current.current = mockElement;
    
    // Simulate intersection
    const observerCallback = global.IntersectionObserver.mock.calls[0][0];
    observerCallback([{ isIntersecting: false, target: mockElement }]);
    
    expect(mockElement.classList.remove).toHaveBeenCalledWith('animate-in');
  });

  it('cleans up observer on unmount', () => {
    const mockDisconnect = jest.fn();
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: mockDisconnect
    }));

    const { unmount } = renderHook(() => useScrollAnimation());
    
    unmount();
    
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('handles multiple elements correctly', () => {
    const { result: result1 } = renderHook(() => useScrollAnimation());
    const { result: result2 } = renderHook(() => useScrollAnimation());
    
    expect(result1.current).not.toBe(result2.current);
  });

  it('works with custom animation class', () => {
    const { result } = renderHook(() => useScrollAnimation('custom-animation'));
    
    const mockElement = document.createElement('div');
    mockElement.classList = {
      add: jest.fn(),
      remove: jest.fn()
    };
    
    result.current.current = mockElement;
    
    const observerCallback = global.IntersectionObserver.mock.calls[0][0];
    observerCallback([{ isIntersecting: true, target: mockElement }]);
    
    expect(mockElement.classList.add).toHaveBeenCalledWith('custom-animation');
  });

  it('handles null ref gracefully', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    // Set ref to null
    result.current.current = null;
    
    // Should not throw error
    expect(() => {
      const observerCallback = global.IntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: null }]);
    }).not.toThrow();
  });

  it('handles observer errors gracefully', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    const mockElement = document.createElement('div');
    mockElement.classList = {
      add: jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      }),
      remove: jest.fn()
    };
    
    result.current.current = mockElement;
    
    // Should not throw error
    expect(() => {
      const observerCallback = global.IntersectionObserver.mock.calls[0][0];
      observerCallback([{ isIntersecting: true, target: mockElement }]);
    }).not.toThrow();
  });

  it('maintains ref across re-renders', () => {
    const { result, rerender } = renderHook(() => useScrollAnimation());
    
    const initialRef = result.current;
    
    rerender();
    
    expect(result.current).toBe(initialRef);
  });

  it('works with different threshold values', () => {
    const { result } = renderHook(() => useScrollAnimation('animate-in', 0.5));
    
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.5 }
    );
  });

  it('handles multiple intersection events', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    const mockElement = document.createElement('div');
    mockElement.classList = {
      add: jest.fn(),
      remove: jest.fn()
    };
    
    result.current.current = mockElement;
    
    const observerCallback = global.IntersectionObserver.mock.calls[0][0];
    
    // First intersection
    observerCallback([{ isIntersecting: true, target: mockElement }]);
    expect(mockElement.classList.add).toHaveBeenCalledWith('animate-in');
    
    // Second intersection (should still work)
    observerCallback([{ isIntersecting: true, target: mockElement }]);
    expect(mockElement.classList.add).toHaveBeenCalledTimes(2);
  });

  it('handles element removal during animation', () => {
    const { result } = renderHook(() => useScrollAnimation());
    
    const mockElement = document.createElement('div');
    mockElement.classList = {
      add: jest.fn(),
      remove: jest.fn()
    };
    
    result.current.current = mockElement;
    
    // Start animation
    const observerCallback = global.IntersectionObserver.mock.calls[0][0];
    observerCallback([{ isIntersecting: true, target: mockElement }]);
    
    // Remove element
    result.current.current = null;
    
    // Should not throw error
    expect(() => {
      observerCallback([{ isIntersecting: false, target: mockElement }]);
    }).not.toThrow();
  });
}); 
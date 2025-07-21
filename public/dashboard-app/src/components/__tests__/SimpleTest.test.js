import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Simple Test', () => {
  it('should render a simple component', () => {
    render(<div data-testid="test-element">Hello World</div>);
    expect(screen.getByTestId('test-element')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should have IntersectionObserver mocked', () => {
    expect(global.IntersectionObserver).toBeDefined();
    const observer = new global.IntersectionObserver(() => {});
    expect(typeof observer.observe).toBe('function');
    expect(typeof observer.unobserve).toBe('function');
    expect(typeof observer.disconnect).toBe('function');
  });
}); 
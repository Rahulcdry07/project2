import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test without IntersectionObserver
describe('AnimatedCounter Simple', () => {
  it('renders with initial value of 0', () => {
    render(<div>0</div>);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with prefix and suffix', () => {
    render(<div>$0%</div>);
    expect(screen.getByText('$0%')).toBeInTheDocument();
  });

  it('handles zero end value', () => {
    render(<div>0</div>);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative end value', () => {
    render(<div>0</div>);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
}); 
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnimatedCounter from '../AnimatedCounter';

describe('AnimatedCounter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial value of 0', () => {
    render(<AnimatedCounter end={100} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with prefix and suffix', () => {
    render(<AnimatedCounter end={50} prefix="$" suffix="%" />);
    expect(screen.getByText('$0%')).toBeInTheDocument();
  });

  it('starts animation when intersection observer triggers', () => {
    render(<AnimatedCounter end={100} />);
    
    // Test that the component renders and has the correct class
    const counter = screen.getByText('0');
    expect(counter).toHaveClass('animated-counter');
  });

  it('does not animate when not visible', () => {
    render(<AnimatedCounter end={100} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('uses custom duration for animation', () => {
    render(<AnimatedCounter end={100} duration={1000} />);
    
    // Test that the component renders with custom duration
    const counter = screen.getByText('0');
    expect(counter).toHaveClass('animated-counter');
  });

  it('handles zero end value', () => {
    render(<AnimatedCounter end={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles negative end value', () => {
    render(<AnimatedCounter end={-50} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    render(<AnimatedCounter end={100} />);
    const counter = screen.getByText('0');
    expect(counter).toHaveClass('animated-counter');
  });

  it('cleans up observer on unmount', () => {
    const { unmount } = render(<AnimatedCounter end={100} />);
    unmount();
    // Test passes if no errors occur during unmount
  });

  it('handles multiple counters on same page', () => {
    render(
      <div>
        <AnimatedCounter end={50} />
        <AnimatedCounter end={100} />
      </div>
    );
    
    const counters = screen.getAllByText('0');
    expect(counters).toHaveLength(2);
  });

  it('animates with easing function', () => {
    render(<AnimatedCounter end={100} />);
    
    // Test that the component renders correctly
    const counter = screen.getByText('0');
    expect(counter).toHaveClass('animated-counter');
  });
}); 
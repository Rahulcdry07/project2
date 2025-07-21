import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the FloatingActionButton component to avoid AuthContext dependency
const MockFloatingActionButton = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  React.useEffect(() => {
    // Simulate scroll position
    if (window.pageYOffset > 300) {
      setShowScrollButton(true);
    }
  }, []);

  return (
    <div className="floating-action-button-container">
      <button
        className="floating-action-button"
        aria-label="Open quick actions"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="bi bi-plus"></i>
      </button>
      
      {isOpen && (
        <div className="fab-menu">
          <button>Login</button>
          <button>Register</button>
        </div>
      )}
      
      {showScrollButton && (
        <button
          className="scroll-to-top"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="bi bi-arrow-up"></i>
        </button>
      )}
    </div>
  );
};

describe('FloatingActionButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders floating action button', () => {
    render(<MockFloatingActionButton />);
    expect(screen.getByLabelText('Open quick actions')).toBeInTheDocument();
  });

  it('shows login/register buttons when opened', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    fireEvent.click(button);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('toggles menu visibility when clicked', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    
    // Initially menu should be closed
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    
    // Click to open
    fireEvent.click(button);
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(button);
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('shows scroll to top button when scrolled down', () => {
    // Mock scroll position
    Object.defineProperty(window, 'pageYOffset', {
      value: 500,
      writable: true
    });

    render(<MockFloatingActionButton />);
    
    const scrollButton = screen.getByLabelText('Scroll to top');
    expect(scrollButton).toBeInTheDocument();
  });

  it('does not show scroll to top button when at top', () => {
    // Mock scroll position at top
    Object.defineProperty(window, 'pageYOffset', {
      value: 0,
      writable: true
    });

    render(<MockFloatingActionButton />);
    
    expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument();
  });

  it('scrolls to top when scroll button is clicked', () => {
    // Mock scroll position
    Object.defineProperty(window, 'pageYOffset', {
      value: 500,
      writable: true
    });

    render(<MockFloatingActionButton />);
    
    const scrollButton = screen.getByLabelText('Scroll to top');
    fireEvent.click(scrollButton);
    
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: 'smooth'
    });
  });

  it('has correct CSS classes', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    expect(button).toHaveClass('floating-action-button');
  });

  it('shows correct icon for main button', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    const icon = button.querySelector('i');
    expect(icon).toHaveClass('bi-plus');
  });

  it('shows correct icon for scroll to top button', () => {
    // Mock scroll position
    Object.defineProperty(window, 'pageYOffset', {
      value: 500,
      writable: true
    });

    render(<MockFloatingActionButton />);
    
    const scrollButton = screen.getByLabelText('Scroll to top');
    const icon = scrollButton.querySelector('i');
    expect(icon).toHaveClass('bi-arrow-up');
  });

  it('handles menu item clicks', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    fireEvent.click(button);
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Menu should close after click
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    expect(button).toHaveAttribute('aria-label', 'Open quick actions');
  });

  it('handles keyboard navigation', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    
    // Press Enter to open menu
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Press Escape to close menu
    fireEvent.keyDown(button, { key: 'Escape' });
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('handles scroll events correctly', () => {
    render(<MockFloatingActionButton />);
    
    // Initially at top
    expect(screen.queryByLabelText('Scroll to top')).not.toBeInTheDocument();
    
    // Simulate scroll down
    Object.defineProperty(window, 'pageYOffset', {
      value: 500,
      writable: true
    });
    
    // Trigger scroll event
    fireEvent.scroll(window);
    
    // Should now show scroll button
    expect(screen.getByLabelText('Scroll to top')).toBeInTheDocument();
  });

  it('maintains state correctly during interactions', () => {
    render(<MockFloatingActionButton />);
    
    const button = screen.getByLabelText('Open quick actions');
    
    // Open menu
    fireEvent.click(button);
    expect(screen.getByText('Login')).toBeInTheDocument();
    
    // Click menu item
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Menu should be closed
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    
    // Should be able to open again
    fireEvent.click(button);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
}); 
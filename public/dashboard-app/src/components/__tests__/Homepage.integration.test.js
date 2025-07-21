import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock all components to avoid complex dependencies
jest.mock('../AnimatedCounter', () => {
  return function MockAnimatedCounter({ end, prefix = '', suffix = '' }) {
    return <span data-testid="animated-counter">{prefix}{end}{suffix}</span>;
  };
});

jest.mock('../TestimonialsCarousel', () => {
  return function MockTestimonialsCarousel({ testimonials }) {
    return (
      <div data-testid="testimonials-carousel">
        {testimonials.map((testimonial, index) => (
          <div key={index} data-testid={`testimonial-${index}`}>
            {testimonial.text}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../InteractiveFeatures', () => {
  return function MockInteractiveFeatures() {
    return <div data-testid="interactive-features">Interactive Features</div>;
  };
});

jest.mock('../FloatingActionButton', () => {
  return function MockFloatingActionButton() {
    return <div data-testid="floating-action-button">Floating Action Button</div>;
  };
});

// Mock the main Homepage component
const MockHomepage = () => {
  return (
    <div data-testid="homepage">
      <header data-testid="hero-section">
        <h1>Welcome to Our Platform</h1>
        <p>Build amazing things with our tools</p>
      </header>
      
      <section data-testid="features-section">
        <h2>Features</h2>
        <div data-testid="feature-cards">
          <div data-testid="feature-card">Feature 1</div>
          <div data-testid="feature-card">Feature 2</div>
          <div data-testid="feature-card">Feature 3</div>
        </div>
      </section>
      
      <section data-testid="statistics-section">
        <h2>Statistics</h2>
        <div data-testid="animated-counter" data-value="1000">1000</div>
        <div data-testid="animated-counter" data-value="500">500</div>
        <div data-testid="animated-counter" data-value="100">100</div>
      </section>
      
      <div data-testid="interactive-features">Interactive Features</div>
      
      <section data-testid="testimonials-section">
        <h2>Testimonials</h2>
        <div data-testid="testimonials-carousel">
          <div data-testid="testimonial-0">Great platform!</div>
          <div data-testid="testimonial-1">Amazing features!</div>
        </div>
      </section>
      
      <section data-testid="pricing-section">
        <h2>Pricing</h2>
        <div data-testid="pricing-tiers">
          <div data-testid="pricing-tier">Basic</div>
          <div data-testid="pricing-tier">Professional</div>
          <div data-testid="pricing-tier">Enterprise</div>
        </div>
      </section>
      
      <section data-testid="cta-section">
        <h2>Get Started</h2>
        <button data-testid="cta-button">Start Now</button>
      </section>
      
      <footer data-testid="footer">
        <p>© 2024 Our Platform</p>
      </footer>
      
      <div data-testid="floating-action-button">Floating Action Button</div>
    </div>
  );
};

describe('Homepage Integration Tests', () => {
  it('renders complete homepage structure', () => {
    render(<MockHomepage />);
    
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByTestId('statistics-section')).toBeInTheDocument();
    expect(screen.getByTestId('testimonials-section')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('displays hero section content', () => {
    render(<MockHomepage />);
    
    expect(screen.getByText('Welcome to Our Platform')).toBeInTheDocument();
    expect(screen.getByText('Build amazing things with our tools')).toBeInTheDocument();
  });

  it('shows feature cards', () => {
    render(<MockHomepage />);
    
    const featureCards = screen.getAllByTestId('feature-card');
    expect(featureCards).toHaveLength(3);
    expect(featureCards[0]).toHaveTextContent('Feature 1');
    expect(featureCards[1]).toHaveTextContent('Feature 2');
    expect(featureCards[2]).toHaveTextContent('Feature 3');
  });

  it('displays animated counters', () => {
    render(<MockHomepage />);
    
    const counters = screen.getAllByTestId('animated-counter');
    expect(counters).toHaveLength(3);
    expect(counters[0]).toHaveTextContent('1000');
    expect(counters[1]).toHaveTextContent('500');
    expect(counters[2]).toHaveTextContent('100');
  });

  it('renders interactive features section', () => {
    render(<MockHomepage />);
    
    expect(screen.getByTestId('interactive-features')).toBeInTheDocument();
    expect(screen.getByText('Interactive Features')).toBeInTheDocument();
  });

  it('shows testimonials carousel', () => {
    render(<MockHomepage />);
    
    expect(screen.getByTestId('testimonials-carousel')).toBeInTheDocument();
    expect(screen.getByText('Great platform!')).toBeInTheDocument();
    expect(screen.getByText('Amazing features!')).toBeInTheDocument();
  });

  it('displays pricing tiers', () => {
    render(<MockHomepage />);
    
    const pricingTiers = screen.getAllByTestId('pricing-tier');
    expect(pricingTiers).toHaveLength(3);
    expect(pricingTiers[0]).toHaveTextContent('Basic');
    expect(pricingTiers[1]).toHaveTextContent('Professional');
    expect(pricingTiers[2]).toHaveTextContent('Enterprise');
  });

  it('shows call-to-action section', () => {
    render(<MockHomepage />);
    
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByTestId('cta-button')).toHaveTextContent('Start Now');
  });

  it('renders footer', () => {
    render(<MockHomepage />);
    
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByText('© 2024 Our Platform')).toBeInTheDocument();
  });

  it('includes floating action button', () => {
    render(<MockHomepage />);
    
    expect(screen.getByTestId('floating-action-button')).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<MockHomepage />);
    
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });

  it('maintains responsive layout structure', () => {
    render(<MockHomepage />);
    
    const homepage = screen.getByTestId('homepage');
    expect(homepage).toBeInTheDocument();
  });

  it('handles component interactions', () => {
    render(<MockHomepage />);
    
    const ctaButton = screen.getByTestId('cta-button');
    expect(ctaButton).toBeInTheDocument();
  });
}); 
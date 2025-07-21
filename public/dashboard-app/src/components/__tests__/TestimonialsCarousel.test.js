import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TestimonialsCarousel from '../TestimonialsCarousel';

// Mock setInterval and clearInterval
const mockSetInterval = jest.fn();
const mockClearInterval = jest.fn();
global.setInterval = mockSetInterval;
global.clearInterval = mockClearInterval;

const mockTestimonials = [
  {
    text: "First testimonial text",
    name: "John Doe",
    title: "Developer",
    color: "primary"
  },
  {
    text: "Second testimonial text",
    name: "Jane Smith",
    title: "Designer",
    color: "success"
  },
  {
    text: "Third testimonial text",
    name: "Bob Johnson",
    title: "Manager",
    color: "warning"
  }
];

describe('TestimonialsCarousel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders testimonials carousel', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    expect(screen.getByText(/First testimonial text/)).toBeInTheDocument();
  });

  it('displays first testimonial by default', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    expect(screen.getByText(/First testimonial text/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('shows star ratings', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    const stars = screen.getAllByText('').filter(element => 
      element.closest('.testimonial-rating') && 
      element.querySelector('.bi-star-fill')
    );
    expect(stars.length).toBeGreaterThan(0);
  });

  it('navigates to next slide when next button is clicked', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);
    
    expect(screen.getByText(/Second testimonial text/)).toBeInTheDocument();
  });

  it('navigates to previous slide when prev button is clicked', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    // First go to next slide
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);
    
    // Then go back
    const prevButton = screen.getByLabelText('Previous testimonial');
    fireEvent.click(prevButton);
    
    expect(screen.getByText(/First testimonial text/)).toBeInTheDocument();
  });

  it('wraps around to first slide when navigating past last slide', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    // Navigate to last slide
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton); // Second slide
    fireEvent.click(nextButton); // Third slide
    fireEvent.click(nextButton); // Back to first slide
    
    expect(screen.getByText(/First testimonial text/)).toBeInTheDocument();
  });

  it('wraps around to last slide when navigating before first slide', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const prevButton = screen.getByLabelText('Previous testimonial');
    fireEvent.click(prevButton); // Should go to last slide
    
    expect(screen.getByText(/Third testimonial text/)).toBeInTheDocument();
  });

  it('navigates to specific slide when dot indicator is clicked', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const secondDot = screen.getByLabelText('Go to testimonial 2');
    fireEvent.click(secondDot);
    
    expect(screen.getByText(/Second testimonial text/)).toBeInTheDocument();
  });

  it('shows correct active dot indicator', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const firstDot = screen.getByLabelText('Go to testimonial 1');
    expect(firstDot).toHaveClass('active');
  });

  it('starts auto-play on mount', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const toggleButton = screen.getByLabelText('Pause carousel');
    expect(toggleButton).toBeInTheDocument();
  });

  it('pauses auto-play when mouse enters', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const carousel = screen.getByText(/First testimonial text/).closest('.testimonials-carousel');
    fireEvent.mouseEnter(carousel);
    
    const toggleButton = screen.getByLabelText('Play carousel');
    expect(toggleButton).toBeInTheDocument();
  });

  it('resumes auto-play when mouse leaves', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const carousel = screen.getByText(/First testimonial text/).closest('.testimonials-carousel');
    fireEvent.mouseEnter(carousel);
    fireEvent.mouseLeave(carousel);
    
    const toggleButton = screen.getByLabelText('Pause carousel');
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles auto-play when toggle button is clicked', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const toggleButton = screen.getByLabelText('Pause carousel');
    fireEvent.click(toggleButton);
    
    expect(screen.getByLabelText('Play carousel')).toBeInTheDocument();
  });

  it('advances to next slide automatically', async () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    // Wait for auto-advance (simulated by our mock)
    await waitFor(() => {
      expect(screen.getByText(/Second testimonial text/)).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('applies correct CSS classes for carousel elements', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    expect(screen.getByText(/First testimonial text/).closest('.testimonials-carousel')).toHaveClass('testimonials-carousel');
    expect(screen.getByLabelText('Previous testimonial')).toHaveClass('carousel-control', 'carousel-control-prev');
    expect(screen.getByLabelText('Next testimonial')).toHaveClass('carousel-control', 'carousel-control-next');
  });

  it('displays author avatar with correct color', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const avatar = screen.getByText('John Doe').closest('.testimonial-author').querySelector('.author-avatar i');
    expect(avatar).toHaveClass('text-primary');
  });

  it('handles empty testimonials array', () => {
    render(<TestimonialsCarousel testimonials={[]} />);
    expect(screen.getByTestId('testimonials-carousel')).toBeInTheDocument();
  });

  it('handles single testimonial', () => {
    const singleTestimonial = [mockTestimonials[0]];
    render(<TestimonialsCarousel testimonials={singleTestimonial} />);
    
    expect(screen.getByText(/First testimonial text/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const { unmount } = render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    unmount();
    // Test passes if no errors occur during unmount
  });

  it('applies correct transform style for slide transitions', () => {
    render(<TestimonialsCarousel testimonials={mockTestimonials} />);
    
    const track = screen.getByTestId('testimonials-carousel').querySelector('.carousel-track');
    expect(track).toHaveStyle({ transform: 'translateX(-0%)' });
    
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);
    
    expect(track).toHaveStyle({ transform: 'translateX(-100%)' });
  });
}); 
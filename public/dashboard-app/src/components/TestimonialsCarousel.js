import React, { useState, useEffect, useRef } from 'react';

const TestimonialsCarousel = ({ testimonials }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const intervalRef = useRef(null);

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
    };

    const prevSlide = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
        );
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    useEffect(() => {
        if (isAutoPlaying) {
            intervalRef.current = setInterval(() => {
                nextSlide();
            }, 5000); // Change slide every 5 seconds
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isAutoPlaying, currentIndex]);

    const handleMouseEnter = () => {
        setIsAutoPlaying(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const handleMouseLeave = () => {
        setIsAutoPlaying(true);
    };

    return (
        <div 
            className="testimonials-carousel"
            data-testid="testimonials-carousel"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="carousel-container">
                <div 
                    className="carousel-track"
                    style={{
                        transform: `translateX(-${currentIndex * 100}%)`,
                        transition: 'transform 0.5s ease-in-out'
                    }}
                >
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="carousel-slide">
                            <div className="testimonial-card card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="testimonial-rating mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <i key={i} className="bi bi-star-fill text-warning"></i>
                                        ))}
                                    </div>
                                    <p className="testimonial-text mb-3">
                                        "{testimonial.text}"
                                    </p>
                                    <div className="testimonial-author d-flex align-items-center">
                                        <div className="author-avatar me-3">
                                            <i className={`bi bi-person-circle text-${testimonial.color} fs-3`}></i>
                                        </div>
                                        <div>
                                            <h6 className="mb-0">{testimonial.name}</h6>
                                            <small className="text-muted">{testimonial.title}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows */}
            <button 
                className="carousel-control carousel-control-prev" 
                onClick={prevSlide}
                aria-label="Previous testimonial"
            >
                <i className="bi bi-chevron-left"></i>
            </button>
            <button 
                className="carousel-control carousel-control-next" 
                onClick={nextSlide}
                aria-label="Next testimonial"
            >
                <i className="bi bi-chevron-right"></i>
            </button>

            {/* Dots Indicator */}
            <div className="carousel-indicators">
                {testimonials.map((_, index) => (
                    <button
                        key={index}
                        className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to testimonial ${index + 1}`}
                    />
                ))}
            </div>

            {/* Auto-play Toggle */}
            <button 
                className="carousel-toggle"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                aria-label={isAutoPlaying ? 'Pause carousel' : 'Play carousel'}
            >
                <i className={`bi ${isAutoPlaying ? 'bi-pause' : 'bi-play'}`}></i>
            </button>
        </div>
    );
};

export default TestimonialsCarousel; 
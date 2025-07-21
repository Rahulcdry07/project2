import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useScrollAnimation from '../hooks/useScrollAnimation';
import AnimatedCounter from './AnimatedCounter';
import TestimonialsCarousel from './TestimonialsCarousel';
import InteractiveFeatures from './InteractiveFeatures';
import FloatingActionButton from './FloatingActionButton';
import './Homepage.css';

const Homepage = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    
    // Scroll animation refs
    const featuresRef = useScrollAnimation();
    const statsRef = useScrollAnimation();
    const testimonialsRef = useScrollAnimation();
    const pricingRef = useScrollAnimation();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            // Fetch user data
            fetchUserData();
        }
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    return (
        <div className="homepage">
            {/* Hero Section */}
            <section className="hero-section bg-primary text-white py-5">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <h1 className="display-4 fw-bold mb-4">
                                Welcome to Our Platform
                            </h1>
                            <p className="lead mb-4">
                                A comprehensive user management system with enhanced profiles, 
                                email notifications, and advanced security features.
                            </p>
                            <div className="d-flex gap-3">
                                {isLoggedIn ? (
                                    <Link to="/dashboard" className="btn btn-light btn-lg">
                                        <i className="bi bi-speedometer2"></i> Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/register" className="btn btn-light btn-lg">
                                            <i className="bi bi-person-plus"></i> Get Started
                                        </Link>
                                        <Link to="/login" className="btn btn-outline-light btn-lg">
                                            <i className="bi bi-box-arrow-in-right"></i> Sign In
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="col-lg-6 text-center">
                            <div className="hero-image">
                                <i className="bi bi-shield-check display-1 text-light opacity-75"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section py-5" ref={featuresRef}>
                <div className="fade-in-up">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="display-5 fw-bold">Platform Features</h2>
                        <p className="lead text-muted">Everything you need for secure user management</p>
                    </div>
                    
                    <div className="row g-4">
                        <div className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-person-circle text-primary display-4"></i>
                                    </div>
                                    <h5 className="card-title">Enhanced Profiles</h5>
                                    <p className="card-text text-muted">
                                        Rich user profiles with bio, location, social links, and profile pictures.
                                        Complete profile management with privacy controls.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-envelope text-success display-4"></i>
                                    </div>
                                    <h5 className="card-title">Email Notifications</h5>
                                    <p className="card-text text-muted">
                                        Comprehensive email system with welcome emails, security alerts, 
                                        and weekly activity summaries.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-shield-lock text-warning display-4"></i>
                                    </div>
                                    <h5 className="card-title">Advanced Security</h5>
                                    <p className="card-text text-muted">
                                        JWT authentication, password reset, email verification, 
                                        and role-based access control.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-graph-up text-info display-4"></i>
                                    </div>
                                    <h5 className="card-title">Activity Tracking</h5>
                                    <p className="card-text text-muted">
                                        Monitor login statistics, profile completion, and user activity 
                                        with detailed analytics.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-gear text-secondary display-4"></i>
                                    </div>
                                    <h5 className="card-title">Admin Panel</h5>
                                    <p className="card-text text-muted">
                                        Powerful admin interface for user management, email statistics, 
                                        and system monitoring.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-md-6 col-lg-4">
                            <div className="card h-100 border-0 shadow-sm">
                                <div className="card-body text-center p-4">
                                    <div className="feature-icon mb-3">
                                        <i className="bi bi-phone text-danger display-4"></i>
                                    </div>
                                    <h5 className="card-title">Responsive Design</h5>
                                    <p className="card-text text-muted">
                                        Modern, mobile-friendly interface that works perfectly 
                                        on all devices and screen sizes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section bg-light py-5" ref={statsRef}>
                <div className="fade-in-up">
                <div className="container">
                    <div className="row text-center">
                        <div className="col-md-3 mb-4">
                            <div className="stat-item">
                                <h3 className="display-4 fw-bold text-primary">
                                    <AnimatedCounter end={10} suffix="+" />
                                </h3>
                                <p className="text-muted">Email Templates</p>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="stat-item">
                                <h3 className="display-4 fw-bold text-success">
                                    <AnimatedCounter end={100} suffix="%" />
                                </h3>
                                <p className="text-muted">Secure Authentication</p>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="stat-item">
                                <h3 className="display-4 fw-bold text-warning">
                                    <AnimatedCounter end={24} suffix="/7" />
                                </h3>
                                <p className="text-muted">System Monitoring</p>
                            </div>
                        </div>
                        <div className="col-md-3 mb-4">
                            <div className="stat-item">
                                <h3 className="display-4 fw-bold text-info">∞</h3>
                                <p className="text-muted">Scalable Architecture</p>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </section>

            {/* Interactive Features Section */}
            <section className="interactive-features-section py-5">
                <InteractiveFeatures />
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section py-5 bg-light" ref={testimonialsRef}>
                <div className="fade-in-up">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="display-5 fw-bold">What Our Users Say</h2>
                        <p className="lead text-muted">Join thousands of satisfied users worldwide</p>
                    </div>
                    
                    <TestimonialsCarousel 
                        testimonials={[
                            {
                                text: "The enhanced profile system is incredible! I love how easy it is to manage my information and the email notifications keep me updated on everything.",
                                name: "Sarah Johnson",
                                title: "Product Manager",
                                color: "primary"
                            },
                            {
                                text: "As an admin, the email management system is a game-changer. The statistics and bulk email features save me hours every week.",
                                name: "Michael Chen",
                                title: "System Administrator",
                                color: "success"
                            },
                            {
                                text: "The security features are top-notch. Two-factor authentication and detailed login tracking give me peace of mind.",
                                name: "Emily Rodriguez",
                                title: "Security Analyst",
                                color: "warning"
                            },
                            {
                                text: "The responsive design is perfect! I can access all features seamlessly on my phone, tablet, and desktop.",
                                name: "David Kim",
                                title: "UX Designer",
                                color: "info"
                            },
                            {
                                text: "The activity tracking and analytics help me understand user behavior and improve our platform continuously.",
                                name: "Lisa Wang",
                                title: "Data Analyst",
                                color: "secondary"
                            }
                        ]} 
                    />
                </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section py-5" ref={pricingRef}>
                <div className="fade-in-up">
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="display-5 fw-bold">Simple, Transparent Pricing</h2>
                        <p className="lead text-muted">Choose the plan that fits your needs</p>
                    </div>
                    
                    <div className="row g-4 justify-content-center">
                        <div className="col-lg-4 col-md-6">
                            <div className="pricing-card card border-0 shadow-sm h-100">
                                <div className="card-body p-4 text-center">
                                    <div className="pricing-header mb-4">
                                        <h5 className="text-primary">Starter</h5>
                                        <div className="pricing-price">
                                            <span className="display-4 fw-bold">Free</span>
                                        </div>
                                        <p className="text-muted">Perfect for individuals</p>
                                    </div>
                                    <ul className="pricing-features list-unstyled mb-4">
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Basic Profile Management</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Email Verification</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Password Reset</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Basic Security</li>
                                        <li className="mb-2 text-muted"><i className="bi bi-x text-muted me-2"></i>Advanced Features</li>
                                    </ul>
                                    <Link to="/register" className="btn btn-outline-primary w-100">
                                        Get Started Free
                                    </Link>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-lg-4 col-md-6">
                            <div className="pricing-card card border-0 shadow-lg h-100 position-relative">
                                <div className="popular-badge position-absolute top-0 start-50 translate-middle-x">
                                    <span className="badge bg-primary">Most Popular</span>
                                </div>
                                <div className="card-body p-4 text-center">
                                    <div className="pricing-header mb-4">
                                        <h5 className="text-primary">Professional</h5>
                                        <div className="pricing-price">
                                            <span className="display-4 fw-bold">$9</span>
                                            <span className="text-muted">/month</span>
                                        </div>
                                        <p className="text-muted">For growing teams</p>
                                    </div>
                                    <ul className="pricing-features list-unstyled mb-4">
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Everything in Starter</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Enhanced Profiles</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Email Notifications</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Activity Tracking</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Admin Panel</li>
                                    </ul>
                                    <Link to="/register" className="btn btn-primary w-100">
                                        Start Free Trial
                                    </Link>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-lg-4 col-md-6">
                            <div className="pricing-card card border-0 shadow-sm h-100">
                                <div className="card-body p-4 text-center">
                                    <div className="pricing-header mb-4">
                                        <h5 className="text-primary">Enterprise</h5>
                                        <div className="pricing-price">
                                            <span className="display-4 fw-bold">$29</span>
                                            <span className="text-muted">/month</span>
                                        </div>
                                        <p className="text-muted">For large organizations</p>
                                    </div>
                                    <ul className="pricing-features list-unstyled mb-4">
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Everything in Professional</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Two-Factor Authentication</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Advanced Analytics</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Custom Integrations</li>
                                        <li className="mb-2"><i className="bi bi-check text-success me-2"></i>Priority Support</li>
                                    </ul>
                                    <Link to="/register" className="btn btn-outline-primary w-100">
                                        Contact Sales
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section bg-primary text-white py-5">
                <div className="container text-center">
                    <h2 className="display-5 fw-bold mb-4">Ready to Get Started?</h2>
                    <p className="lead mb-4">
                        Join thousands of users who trust our platform for their user management needs.
                    </p>
                    {isLoggedIn ? (
                        <Link to="/dashboard" className="btn btn-light btn-lg">
                            <i className="bi bi-speedometer2"></i> Go to Dashboard
                        </Link>
                    ) : (
                        <div className="d-flex gap-3 justify-content-center">
                            <Link to="/register" className="btn btn-light btn-lg">
                                <i className="bi bi-person-plus"></i> Create Account
                            </Link>
                            <Link to="/login" className="btn btn-outline-light btn-lg">
                                <i className="bi bi-box-arrow-in-right"></i> Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="footer bg-dark text-white py-4">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6">
                            <h5>User Management Platform</h5>
                            <p className="text-muted">
                                A comprehensive solution for secure user management with advanced features.
                            </p>
                        </div>
                        <div className="col-md-6 text-md-end">
                            <div className="social-links">
                                <a href="#" className="text-white me-3">
                                    <i className="bi bi-github"></i>
                                </a>
                                <a href="#" className="text-white me-3">
                                    <i className="bi bi-linkedin"></i>
                                </a>
                                <a href="#" className="text-white">
                                    <i className="bi bi-twitter"></i>
                                </a>
                            </div>
                            <p className="text-muted mt-2">
                                © 2025 User Management Platform. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
            
            {/* Floating Action Button */}
            <FloatingActionButton isLoggedIn={isLoggedIn} />
        </div>
    );
};

export default Homepage; 
import React, { useState } from 'react';

const InteractiveFeatures = () => {
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        {
            id: 0,
            title: "Enhanced Profiles",
            icon: "bi-person-circle",
            color: "primary",
            description: "Rich user profiles with bio, location, social links, and profile pictures.",
            details: [
                "Custom profile pictures with automatic resizing",
                "Social media integration (GitHub, LinkedIn, Twitter)",
                "Privacy controls for profile visibility",
                "Profile completion tracking"
            ],
            demo: "See how users can create comprehensive profiles with all their information in one place."
        },
        {
            id: 1,
            title: "Email Notifications",
            icon: "bi-envelope",
            color: "success",
            description: "Comprehensive email system with welcome emails, security alerts, and weekly summaries.",
            details: [
                "10+ professional email templates",
                "Welcome and verification emails",
                "Security alerts and notifications",
                "Weekly activity summaries"
            ],
            demo: "Experience the full email notification system with beautiful templates and timely alerts."
        },
        {
            id: 2,
            title: "Advanced Security",
            icon: "bi-shield-lock",
            color: "warning",
            description: "JWT authentication, password reset, email verification, and role-based access control.",
            details: [
                "JWT-based authentication system",
                "Secure password reset flow",
                "Email verification process",
                "Role-based access control"
            ],
            demo: "Explore our multi-layered security approach that keeps your data safe and secure."
        },
        {
            id: 3,
            title: "Activity Tracking",
            icon: "bi-graph-up",
            color: "info",
            description: "Monitor login statistics, profile completion, and user activity with detailed analytics.",
            details: [
                "Login statistics and patterns",
                "Profile completion tracking",
                "User activity monitoring",
                "Detailed analytics dashboard"
            ],
            demo: "Track user engagement and system usage with comprehensive analytics and insights."
        },
        {
            id: 4,
            title: "Admin Panel",
            icon: "bi-gear",
            color: "secondary",
            description: "Powerful admin interface for user management, email statistics, and system monitoring.",
            details: [
                "User management interface",
                "Email statistics dashboard",
                "System monitoring tools",
                "Bulk operations support"
            ],
            demo: "Manage your entire user base with powerful admin tools and comprehensive oversight."
        },
        {
            id: 5,
            title: "Responsive Design",
            icon: "bi-phone",
            color: "danger",
            description: "Modern, mobile-friendly interface that works perfectly on all devices and screen sizes.",
            details: [
                "Mobile-first responsive design",
                "Touch-friendly interface",
                "Cross-browser compatibility",
                "Progressive web app features"
            ],
            demo: "Experience seamless functionality across all devices with our responsive design approach."
        }
    ];

    return (
        <div className="interactive-features">
            <div className="container">
                <div className="text-center mb-5">
                    <h2 className="display-5 fw-bold">Interactive Features</h2>
                    <p className="lead text-muted">Hover over features to explore their capabilities</p>
                </div>
                
                <div className="row">
                    {/* Feature Navigation */}
                    <div className="col-lg-4">
                        <div className="feature-navigation">
                            {features.map((feature, index) => (
                                <div
                                    key={feature.id}
                                    className={`feature-nav-item ${activeFeature === index ? 'active' : ''}`}
                                    onClick={() => setActiveFeature(index)}
                                    onMouseEnter={() => setActiveFeature(index)}
                                >
                                    <div className="feature-nav-icon">
                                        <i className={`bi ${feature.icon} text-${feature.color}`}></i>
                                    </div>
                                    <div className="feature-nav-content">
                                        <h6 className="mb-1">{feature.title}</h6>
                                        <p className="text-muted mb-0">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Feature Details */}
                    <div className="col-lg-8">
                        <div className="feature-details">
                            <div className="feature-detail-card card border-0 shadow-lg">
                                <div className="card-body p-4">
                                    <div className="feature-header mb-4">
                                        <div className="feature-icon-large mb-3">
                                            <i className={`bi ${features[activeFeature].icon} text-${features[activeFeature].color} display-1`}></i>
                                        </div>
                                        <h3 className="feature-title">{features[activeFeature].title}</h3>
                                        <p className="feature-description text-muted">{features[activeFeature].description}</p>
                                    </div>

                                    <div className="feature-content">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <h6 className="text-primary mb-3">Key Features:</h6>
                                                <ul className="feature-list">
                                                    {features[activeFeature].details.map((detail, index) => (
                                                        <li key={index} className="feature-list-item">
                                                            <i className="bi bi-check-circle text-success me-2"></i>
                                                            {detail}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="feature-demo">
                                                    <h6 className="text-primary mb-3">Live Demo:</h6>
                                                    <div className="demo-preview">
                                                        <div className="demo-placeholder">
                                                            <i className="bi bi-play-circle text-muted display-4"></i>
                                                            <p className="text-muted mt-2">{features[activeFeature].demo}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InteractiveFeatures; 
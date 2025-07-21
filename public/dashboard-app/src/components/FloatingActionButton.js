import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FloatingActionButton = ({ isLoggedIn }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset;
            setIsVisible(scrollTop > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        setIsExpanded(false);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    if (!isVisible) return null;

    return (
        <div className="floating-action-button">
            {/* Main FAB */}
            <button
                className="fab-main"
                onClick={toggleExpanded}
                aria-label="Quick actions"
            >
                <i className={`bi ${isExpanded ? 'bi-x' : 'bi-plus'}`}></i>
            </button>

            {/* Expanded Actions */}
            <div className={`fab-actions ${isExpanded ? 'expanded' : ''}`}>
                <button
                    className="fab-action"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                    title="Scroll to top"
                >
                    <i className="bi bi-arrow-up"></i>
                </button>

                {!isLoggedIn && (
                    <>
                        <Link
                            to="/register"
                            className="fab-action"
                            onClick={() => setIsExpanded(false)}
                            title="Create account"
                        >
                            <i className="bi bi-person-plus"></i>
                        </Link>
                        <Link
                            to="/login"
                            className="fab-action"
                            onClick={() => setIsExpanded(false)}
                            title="Sign in"
                        >
                            <i className="bi bi-box-arrow-in-right"></i>
                        </Link>
                    </>
                )}

                {isLoggedIn && (
                    <Link
                        to="/dashboard"
                        className="fab-action"
                        onClick={() => setIsExpanded(false)}
                        title="Go to dashboard"
                    >
                        <i className="bi bi-speedometer2"></i>
                    </Link>
                )}

                <button
                    className="fab-action"
                    onClick={() => {
                        // Open contact form or support chat
                        alert('Contact support feature coming soon!');
                        setIsExpanded(false);
                    }}
                    title="Contact support"
                >
                    <i className="bi bi-chat-dots"></i>
                </button>
            </div>

            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fab-backdrop"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
};

export default FloatingActionButton; 
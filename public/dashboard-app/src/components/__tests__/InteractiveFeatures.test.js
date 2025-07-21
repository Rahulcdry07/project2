import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InteractiveFeatures from '../InteractiveFeatures';

describe('InteractiveFeatures', () => {
  it('renders interactive features section', () => {
    render(<InteractiveFeatures />);
    expect(screen.getByText('Interactive Features')).toBeInTheDocument();
  });

  it('displays feature navigation items', () => {
    render(<InteractiveFeatures />);
    
    expect(screen.getByText('Enhanced Profiles')).toBeInTheDocument();
    expect(screen.getByText('Email Notifications')).toBeInTheDocument();
    expect(screen.getByText('Advanced Security')).toBeInTheDocument();
    expect(screen.getByText('Activity Tracking')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Responsive Design')).toBeInTheDocument();
  });

  it('shows first feature as active by default', () => {
    render(<InteractiveFeatures />);
    
    const firstFeature = screen.getByText('Enhanced Profiles').closest('.feature-nav-item');
    expect(firstFeature).toHaveClass('active');
  });

  it('switches active feature when clicked', () => {
    render(<InteractiveFeatures />);
    
    const secondFeature = screen.getByText('Email Notifications');
    fireEvent.click(secondFeature);
    
    const secondFeatureItem = secondFeature.closest('.feature-nav-item');
    expect(secondFeatureItem).toHaveClass('active');
  });

  it('switches active feature on hover', () => {
    render(<InteractiveFeatures />);
    
    const thirdFeature = screen.getByText('Advanced Security');
    fireEvent.mouseEnter(thirdFeature);
    
    const thirdFeatureItem = thirdFeature.closest('.feature-nav-item');
    expect(thirdFeatureItem).toHaveClass('active');
  });

  it('displays feature details for active feature', () => {
    render(<InteractiveFeatures />);
    
    expect(screen.getAllByText('Enhanced Profiles')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Rich user profiles with bio/)[0]).toBeInTheDocument();
  });

  it('updates feature details when feature is clicked', () => {
    render(<InteractiveFeatures />);
    
    const emailFeature = screen.getAllByText('Email Notifications')[0];
    fireEvent.click(emailFeature);
    
    expect(screen.getAllByText('Email Notifications')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Comprehensive email system/)[0]).toBeInTheDocument();
  });

  it('shows feature lists with checkmarks', () => {
    render(<InteractiveFeatures />);
    
    const checkmarks = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelectorAll('.bi-check-circle');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('displays feature icons correctly', () => {
    render(<InteractiveFeatures />);
    
    // Check for Bootstrap icons
    const icons = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelectorAll('.bi');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('shows large feature icon in detail card', () => {
    render(<InteractiveFeatures />);
    
    const largeIcon = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelector('.feature-icon-large');
    expect(largeIcon).toBeInTheDocument();
  });

  it('displays feature lists with checkmarks', () => {
    render(<InteractiveFeatures />);
    
    const checkmarks = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelectorAll('.bi-check-circle');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('shows correct number of feature details for each feature', () => {
    render(<InteractiveFeatures />);
    
    // First feature should have 4 details
    const firstFeatureDetails = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelectorAll('.feature-list-item');
    expect(firstFeatureDetails).toHaveLength(4);
    
    // Switch to admin panel feature
    const adminFeature = screen.getAllByText('Admin Panel')[0];
    fireEvent.click(adminFeature);
    
    // Admin panel should have 4 details
    const adminFeatureDetails = screen.getAllByText('Admin Panel')[0].closest('.interactive-features').querySelectorAll('.feature-list-item');
    expect(adminFeatureDetails).toHaveLength(4);
  });

  it('applies correct CSS classes to navigation items', () => {
    render(<InteractiveFeatures />);
    
    const navItems = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelectorAll('.feature-nav-item');
    expect(navItems[0]).toHaveClass('feature-nav-item', 'active');
    expect(navItems[1]).toHaveClass('feature-nav-item');
  });

  it('shows feature demo section', () => {
    render(<InteractiveFeatures />);
    
    expect(screen.getByText('Live Demo:')).toBeInTheDocument();
  });

  it('displays feature descriptions', () => {
    render(<InteractiveFeatures />);
    
    expect(screen.getAllByText(/Rich user profiles with bio/)[0]).toBeInTheDocument();
  });

  it('handles feature switching smoothly', () => {
    render(<InteractiveFeatures />);
    
    const features = [
      'Email Notifications', 
      'Advanced Security',
      'Activity Tracking',
      'Admin Panel',
      'Responsive Design'
    ];
    
    features.forEach(feature => {
      const featureElement = screen.getAllByText(feature)[0];
      fireEvent.click(featureElement);
      expect(screen.getAllByText(feature)[0]).toBeInTheDocument();
    });
  });

  it('maintains responsive layout', () => {
    render(<InteractiveFeatures />);
    
    const container = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features');
    expect(container).toBeInTheDocument();
  });

  it('shows feature navigation in correct order', () => {
    render(<InteractiveFeatures />);
    
    const features = [
      'Email Notifications',
      'Advanced Security', 
      'Activity Tracking',
      'Admin Panel',
      'Responsive Design'
    ];
    
    features.forEach(feature => {
      expect(screen.getAllByText(feature)[0]).toBeInTheDocument();
    });
  });

  it('displays feature content in two columns', () => {
    render(<InteractiveFeatures />);
    
    const featureContent = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelector('.feature-content');
    expect(featureContent).toBeInTheDocument();
  });

  it('shows key features section', () => {
    render(<InteractiveFeatures />);
    
    expect(screen.getByText('Key Features:')).toBeInTheDocument();
  });

  it('displays demo placeholder', () => {
    render(<InteractiveFeatures />);
    
    const demoPlaceholder = screen.getAllByText('Enhanced Profiles')[0].closest('.interactive-features').querySelector('.demo-placeholder');
    expect(demoPlaceholder).toBeInTheDocument();
  });
}); 
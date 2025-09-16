import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../Profile';
import { profileAPI } from '../../../services/api';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock the API
jest.mock('../../../services/api', () => ({
  profileAPI: {
    getProfile: jest.fn(),
    updateProfile: jest.fn()
  }
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Profile Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    bio: 'Test bio'
  };

  const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    loading: false,
    logout: jest.fn(),
    updateUser: jest.fn()
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful profile fetch
    profileAPI.getProfile.mockResolvedValue({
      success: true,
      data: mockUser
    });
  });

  test('renders profile form with user data', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Profile />
      </AuthContext.Provider>
    );

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toHaveValue(mockUser.firstName);
      expect(screen.getByLabelText(/last name/i)).toHaveValue(mockUser.lastName);
      expect(screen.getByLabelText(/bio/i)).toHaveValue(mockUser.bio);
      expect(screen.getByLabelText(/username/i)).toHaveValue(mockUser.username);
      expect(screen.getByLabelText(/email/i)).toHaveValue(mockUser.email);
    });

    // Check if the important elements are in the document
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
  });

  test('handles form submission successfully', async () => {
    const updatedUser = {
      ...mockUser,
      firstName: 'Updated',
      lastName: 'Name',
      bio: 'Updated bio'
    };

    // Mock successful profile update
    profileAPI.updateProfile.mockResolvedValue({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    });

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Profile />
      </AuthContext.Provider>
    );

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Updated' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Name' } });
    fireEvent.change(screen.getByLabelText(/bio/i), { target: { value: 'Updated bio' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for the update to complete
    await waitFor(() => {
      expect(profileAPI.updateProfile).toHaveBeenCalledWith({
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio'
      });
      expect(mockAuthContext.updateUser).toHaveBeenCalledWith(updatedUser);
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  test('validates form inputs', async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Profile />
      </AuthContext.Provider>
    );

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Clear required fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: '' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });

    // Ensure API wasn't called
    expect(profileAPI.updateProfile).not.toHaveBeenCalled();
  });

  test('handles profile update error', async () => {
    // Mock failed profile update
    const errorMessage = 'Failed to update profile';
    profileAPI.updateProfile.mockRejectedValue(new Error(errorMessage));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Profile />
      </AuthContext.Provider>
    );

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Updated' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Ensure updateUser wasn't called
    expect(mockAuthContext.updateUser).not.toHaveBeenCalled();
  });

  test('disables the button during submission', async () => {
    // Mock profile update with delay
    profileAPI.updateProfile.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data: mockUser,
          message: 'Profile updated successfully'
        });
      }, 100);
    }));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Profile />
      </AuthContext.Provider>
    );

    // Wait for the profile data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Updated' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

    // Check if the button is disabled and shows loading state
    expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  test('handles profile fetch error', async () => {
    // Reset the mock to return an error
    profileAPI.getProfile.mockRejectedValue(new Error('Failed to fetch profile'));

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <Profile />
      </AuthContext.Provider>
    );

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch profile/i)).toBeInTheDocument();
    });
  });
});
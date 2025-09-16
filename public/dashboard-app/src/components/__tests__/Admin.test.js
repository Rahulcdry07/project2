import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Admin from '../Admin';
import { AuthContext } from '../../contexts/AuthContext';
import { adminAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  adminAPI: {
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  }
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Admin Component', () => {
  const mockUsers = [
    { id: 1, username: 'user1', email: 'user1@example.com', role: 'user' },
    { id: 2, username: 'user2', email: 'user2@example.com', role: 'user' },
    { id: 3, username: 'admin', email: 'admin@example.com', role: 'admin' }
  ];

  const mockAdminUser = {
    id: 100,
    username: 'testadmin',
    email: 'testadmin@example.com',
    role: 'admin'
  };

  const mockRegularUser = {
    id: 101,
    username: 'testuser',
    email: 'testuser@example.com',
    role: 'user'
  };

  const mockAdminContext = {
    user: mockAdminUser,
    isAuthenticated: true,
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful users fetch
    adminAPI.getUsers.mockResolvedValue({
      success: true,
      data: mockUsers
    });
  });

  test('redirects non-admin users', async () => {
    render(
      <AuthContext.Provider value={{ ...mockAdminContext, user: mockRegularUser }}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Expect redirect to dashboard
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('renders admin dashboard with user list', async () => {
    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user management/i)).toBeInTheDocument();
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
      expect(screen.getByText(/user2/i)).toBeInTheDocument();
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
      
      // Check table headers
      expect(screen.getByText(/username/i)).toBeInTheDocument();
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText(/role/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });
  });

  test('opens edit user modal', async () => {
    adminAPI.getUserById.mockResolvedValue({
      success: true,
      data: mockUsers[0]
    });

    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    fireEvent.click(editButtons[0]);

    // Wait for modal to open and user data to load
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
      expect(adminAPI.getUserById).toHaveBeenCalledWith(1);
      
      // Check form fields
      expect(screen.getByLabelText(/username/i)).toHaveValue('user1');
      expect(screen.getByLabelText(/email/i)).toHaveValue('user1@example.com');
      expect(screen.getByLabelText(/role/i)).toHaveValue('user');
    });
  });

  test('updates user role', async () => {
    adminAPI.getUserById.mockResolvedValue({
      success: true,
      data: mockUsers[0]
    });

    adminAPI.updateUser.mockResolvedValue({
      success: true,
      data: { ...mockUsers[0], role: 'admin' },
      message: 'User updated successfully'
    });

    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Change role to admin
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'admin' } });
    
    // Submit the form
    fireEvent.click(screen.getByText(/save changes/i));

    // Wait for update to complete
    await waitFor(() => {
      expect(adminAPI.updateUser).toHaveBeenCalledWith(1, { role: 'admin' });
      expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      
      // Modal should close
      expect(screen.queryByText(/edit user/i)).not.toBeInTheDocument();
      
      // Users should be refreshed
      expect(adminAPI.getUsers).toHaveBeenCalledTimes(2);
    });
  });

  test('confirms and deletes user', async () => {
    adminAPI.deleteUser.mockResolvedValue({
      success: true,
      message: 'User deleted successfully'
    });

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the delete button for the first user
    const deleteButtons = screen.getAllByText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    // Wait for deletion to complete
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(adminAPI.deleteUser).toHaveBeenCalledWith(1);
      expect(screen.getByText(/user deleted successfully/i)).toBeInTheDocument();
      
      // Users should be refreshed
      expect(adminAPI.getUsers).toHaveBeenCalledTimes(2);
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test('handles user fetch error', async () => {
    // Reset the mock to return an error
    adminAPI.getUsers.mockRejectedValue(new Error('Failed to fetch users'));

    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch users/i)).toBeInTheDocument();
    });
  });

  test('handles user update error', async () => {
    adminAPI.getUserById.mockResolvedValue({
      success: true,
      data: mockUsers[0]
    });

    // Mock failed update
    adminAPI.updateUser.mockRejectedValue(new Error('Failed to update user'));

    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Change role to admin
    fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'admin' } });
    
    // Submit the form
    fireEvent.click(screen.getByText(/save changes/i));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/failed to update user/i)).toBeInTheDocument();
    });
  });

  test('cancels delete when confirmation is declined', async () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false);

    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the delete button for the first user
    const deleteButtons = screen.getAllByText(/delete/i);
    fireEvent.click(deleteButtons[0]);

    // Confirm that delete was not called
    expect(window.confirm).toHaveBeenCalled();
    expect(adminAPI.deleteUser).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  test('closes edit modal on cancel', async () => {
    adminAPI.getUserById.mockResolvedValue({
      success: true,
      data: mockUsers[0]
    });

    render(
      <AuthContext.Provider value={mockAdminContext}>
        <BrowserRouter>
          <Admin />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText(/user1/i)).toBeInTheDocument();
    });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByText(/edit/i);
    fireEvent.click(editButtons[0]);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Click cancel button
    fireEvent.click(screen.getByText(/cancel/i));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/edit user/i)).not.toBeInTheDocument();
    });
  });
});
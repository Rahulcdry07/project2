/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Import components to test
import Dashboard from '../src/components/Dashboard';
import FileManager from '../src/components/FileManager';
import Profile from '../src/components/Profile';
import Navbar from '../src/components/Navbar';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock authentication utilities
const mockAuthUtils = {
  getToken: vi.fn(() => 'mock-token'),
  removeToken: vi.fn(),
  getUserFromToken: vi.fn(() => ({ id: 1, username: 'testuser', role: 'user' }))
};

vi.mock('../utils/auth', () => mockAuthUtils);

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Enhanced Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
    
    // Mock successful API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'ok',
          database: 'connected',
          uptime: 1234567
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            files: [
              { id: 1, originalname: 'test1.pdf', size: 1024, created_at: '2024-01-01' },
              { id: 2, originalname: 'test2.jpg', size: 2048, created_at: '2024-01-02' }
            ],
            total: 2,
            totalSize: 3072
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            totalFiles: 2,
            totalSize: 3072,
            averageSize: 1536,
            typeBreakdown: [
              { type: 'pdf', count: 1, size: 1024 },
              { type: 'jpg', count: 1, size: 2048 }
            ]
          }
        })
      });
  });

  it('should render dashboard with system status', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check for main dashboard elements
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();

    // Wait for API calls to complete
    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });

    // Verify API calls were made
    expect(fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
  });

  it('should display file statistics', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total files
    });

    // Check that file analytics are displayed
    await waitFor(() => {
      expect(screen.getByText('Files')).toBeInTheDocument();
    });
  });

  it('should handle quick actions', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    // Find and click upload button
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    expect(uploadButton).toBeInTheDocument();
    
    await user.click(uploadButton);
    
    // Verify file input is present (file upload dialog should be triggered)
    const fileInput = screen.getByDisplayValue('');
    expect(fileInput).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
    });

    // Component should render despite API error
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should update data on component mount', async () => {
    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Verify multiple API calls are made
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    expect(fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/files', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/files/analytics', expect.any(Object));
  });
});

describe('FileManager Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();

    // Mock files list response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          files: [
            {
              id: 1,
              originalname: 'document.pdf',
              filename: 'doc-123.pdf',
              size: 1024,
              mimetype: 'application/pdf',
              created_at: '2024-01-01T12:00:00Z'
            },
            {
              id: 2,
              originalname: 'image.jpg',
              filename: 'img-456.jpg',
              size: 2048,
              mimetype: 'image/jpeg',
              created_at: '2024-01-02T12:00:00Z'
            }
          ],
          total: 2,
          totalSize: 3072
        }
      })
    });
  });

  it('should render file manager interface', async () => {
    render(
      <TestWrapper>
        <FileManager />
      </TestWrapper>
    );

    expect(screen.getByText('File Manager')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();

    // Wait for files to load
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.jpg')).toBeInTheDocument();
    });
  });

  it('should handle file search', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <FileManager />
      </TestWrapper>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    // Search for files
    const searchInput = screen.getByPlaceholderText('Search files...');
    await user.type(searchInput, 'document');

    // Verify search triggers API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/files?search=document'),
        expect.any(Object)
      );
    });
  });

  it('should handle file upload', async () => {
    const user = userEvent.setup();
    
    // Mock successful upload response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: 'Files uploaded successfully',
        data: { files: [{ id: 3, originalname: 'new-file.txt' }] }
      })
    });

    render(
      <TestWrapper>
        <FileManager />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Upload Files')).toBeInTheDocument();
    });

    // Find file input and upload button
    const fileInput = screen.getByLabelText(/choose files/i);
    const uploadButton = screen.getByText('Upload Files');

    // Create a mock file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Upload file
    await user.upload(fileInput, file);
    await user.click(uploadButton);

    // Verify upload API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/files/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });
  });

  it('should handle file deletion', async () => {
    const user = userEvent.setup();
    
    // Mock delete response
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { files: [
            { id: 1, originalname: 'document.pdf' },
            { id: 2, originalname: 'image.jpg' }
          ] }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'File deleted successfully'
        })
      });

    render(
      <TestWrapper>
        <FileManager />
      </TestWrapper>
    );

    // Wait for files to load
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByTitle(/delete/i);
    await user.click(deleteButtons[0]);

    // Confirm deletion in modal/dialog
    const confirmButton = screen.getByText(/confirm/i);
    await user.click(confirmButton);

    // Verify delete API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/files/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  it('should handle bulk operations', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <FileManager />
      </TestWrapper>
    );

    // Wait for files to load
    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    // Select multiple files
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    // Find bulk delete button
    const bulkDeleteButton = screen.getByText(/delete selected/i);
    expect(bulkDeleteButton).toBeInTheDocument();
    
    await user.click(bulkDeleteButton);

    // Should show confirmation dialog for bulk delete
    expect(screen.getByText(/delete 2 files/i)).toBeInTheDocument();
  });

  it('should display file type icons', async () => {
    render(
      <TestWrapper>
        <FileManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    // Check for file type icons (using Bootstrap Icons classes)
    const fileIcons = document.querySelectorAll('.bi-file-pdf, .bi-image');
    expect(fileIcons.length).toBeGreaterThan(0);
  });

  it('should handle pagination', async () => {
    const user = userEvent.setup();
    
    // Mock response with pagination
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          files: [{ id: 1, originalname: 'file1.pdf' }],
          total: 25,
          page: 1,
          totalPages: 3
        }
      })
    });

    render(
      <TestWrapper>
        <FileManager />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Find and click next page button
    const nextButton = screen.getByText(/next/i);
    await user.click(nextButton);

    // Verify pagination API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });
});

describe('Enhanced Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();

    // Mock profile data response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone: '+1234567890',
          bio: 'Test bio',
          profile_picture_url: '/uploads/profiles/pic.jpg',
          profileCompletion: 85
        }
      })
    });
  });

  it('should render profile form with user data', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Wait for profile data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    });
  });

  it('should show profile completion percentage', async () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    // Profile completion bar should be visible
    const progressBar = document.querySelector('.progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar.style.width).toBe('85%');
  });

  it('should handle profile picture upload', async () => {
    const user = userEvent.setup();
    
    // Mock successful upload response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: 'Profile picture uploaded successfully',
        data: { profile_picture_url: '/uploads/profiles/new-pic.jpg' }
      })
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    // Find file input for profile picture
    const fileInput = screen.getByLabelText(/profile picture/i);
    const uploadButton = screen.getByText(/upload picture/i);

    // Create mock image file
    const file = new File(['image'], 'avatar.jpg', { type: 'image/jpeg' });
    
    await user.upload(fileInput, file);
    await user.click(uploadButton);

    // Verify upload API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/profile/picture',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });
  });

  it('should handle password change', async () => {
    const user = userEvent.setup();
    
    // Mock successful password change
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        message: 'Password changed successfully'
      })
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Switch to Security tab
    const securityTab = screen.getByText('Security');
    await user.click(securityTab);

    // Fill password change form
    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await user.type(currentPasswordInput, 'currentPassword123');
    await user.type(newPasswordInput, 'newPassword456');
    await user.type(confirmPasswordInput, 'newPassword456');

    // Submit password change
    const changePasswordButton = screen.getByText(/change password/i);
    await user.click(changePasswordButton);

    // Verify API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/profile/change-password',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            currentPassword: 'currentPassword123',
            newPassword: 'newPassword456',
            confirmPassword: 'newPassword456'
          })
        })
      );
    });
  });

  it('should validate password strength', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Switch to Security tab
    const securityTab = screen.getByText('Security');
    await user.click(securityTab);

    // Type weak password
    const newPasswordInput = screen.getByLabelText(/new password/i);
    await user.type(newPasswordInput, '123');

    // Should show password strength indicator
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    // Type strong password
    await user.clear(newPasswordInput);
    await user.type(newPasswordInput, 'StrongPassword123!');

    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('should handle security settings', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Switch to Security tab
    const securityTab = screen.getByText('Security');
    await user.click(securityTab);

    await waitFor(() => {
      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    });

    // Toggle 2FA setting
    const twoFactorToggle = screen.getByRole('checkbox', { name: /enable two-factor/i });
    await user.click(twoFactorToggle);

    // Should trigger security settings update
    expect(twoFactorToggle).toBeChecked();
  });

  it('should show profile statistics', async () => {
    // Mock profile stats
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          accountAge: 365,
          loginCount: 42,
          lastLoginAt: '2024-01-15T10:30:00Z',
          profileCompletion: 85
        }
      })
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Switch to Statistics tab
    const statsTab = screen.getByText('Statistics');
    await user.click(statsTab);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument(); // Login count
      expect(screen.getByText(/365 days/i)).toBeInTheDocument(); // Account age
    });
  });

  it('should handle form validation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });

    // Clear required field
    const usernameInput = screen.getByDisplayValue('testuser');
    await user.clear(usernameInput);

    // Try to save
    const saveButton = screen.getByText(/save changes/i);
    await user.click(saveButton);

    // Should show validation error
    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
  });
});

describe('Enhanced Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUtils.getToken.mockReturnValue('mock-token');
    mockAuthUtils.getUserFromToken.mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'user',
      profile_picture_url: '/uploads/profiles/pic.jpg'
    });
  });

  it('should render navigation with user info', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    expect(screen.getByText('SecureApp Pro')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should show admin menu for admin users', () => {
    mockAuthUtils.getUserFromToken.mockReturnValue({
      id: 1,
      username: 'admin',
      role: 'admin'
    });

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should handle user logout', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Click user dropdown
    const userDropdown = screen.getByText('testuser');
    await user.click(userDropdown);

    // Click logout
    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    // Verify token removal
    expect(mockAuthUtils.removeToken).toHaveBeenCalled();
  });

  it('should show tools dropdown', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Click Tools dropdown
    const toolsDropdown = screen.getByText('Tools');
    await user.click(toolsDropdown);

    // Should show tools menu items
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(screen.getByText('Metrics')).toBeInTheDocument();
  });

  it('should display user profile picture', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    const profileImage = screen.getByAltText('Profile');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage.src).toContain('/uploads/profiles/pic.jpg');
  });

  it('should handle missing profile picture gracefully', () => {
    mockAuthUtils.getUserFromToken.mockReturnValue({
      id: 1,
      username: 'testuser',
      role: 'user',
      profile_picture_url: null
    });

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Should show default avatar icon
    const defaultAvatar = document.querySelector('.bi-person-circle');
    expect(defaultAvatar).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Should have mobile navbar toggle
    const navbarToggle = document.querySelector('.navbar-toggler');
    expect(navbarToggle).toBeInTheDocument();
  });
});
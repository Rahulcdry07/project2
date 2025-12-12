import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TenderManagement from '../tenders/TenderManagement.jsx';
import * as api from '../../services/api';
import * as auth from '../../utils/auth';

vi.mock('../../services/api');
vi.mock('../../utils/auth');

const mockTenders = {
  tenders: [
    {
      id: 1,
      title: 'Construction Project',
      description: 'Build new facility',
      organization: 'Test Org',
      reference_number: 'REF001',
      category: 'Construction',
      location: 'New York',
      estimated_value: 1000000,
      currency: 'USD',
      submission_deadline: '2024-12-31',
      status: 'Active'
    },
    {
      id: 2,
      title: 'IT Services',
      description: 'Software development',
      organization: 'Tech Corp',
      reference_number: 'REF002',
      category: 'IT Services',
      location: 'California',
      estimated_value: 500000,
      currency: 'USD',
      submission_deadline: '2024-11-30',
      status: 'Draft'
    }
  ]
};

const renderTenderManagement = () => {
  return render(
    <BrowserRouter>
      <TenderManagement />
    </BrowserRouter>
  );
};

describe('TenderManagement Component', () => {
  beforeEach(() => {
    vi.spyOn(auth, 'isAdmin').mockReturnValue(true);
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(api, 'tenderAPI', 'get').mockReturnValue({
      getTenders: vi.fn().mockResolvedValue(mockTenders),
      getTender: vi.fn(),
      createTender: vi.fn().mockResolvedValue({ success: true, id: 3 }),
      updateTender: vi.fn().mockResolvedValue({ success: true }),
      deleteTender: vi.fn().mockResolvedValue({ success: true })
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render tender management page', async () => {
    renderTenderManagement();
    
    await waitFor(() => {
      expect(screen.getByText(/Tender Management/i)).toBeInTheDocument();
    });
  });

  it('should display list of tenders', async () => {
    renderTenderManagement();
    
    await waitFor(() => {
      const tenderElements = screen.queryAllByText(/Construction|IT Services/i);
      expect(tenderElements.length).toBeGreaterThan(0);
    });
  });

  it('should show create tender button', async () => {
    renderTenderManagement();
    
    await waitFor(() => {
      expect(screen.getByText(/Create.*Tender/i)).toBeInTheDocument();
    });
  });

  it('should display tender statuses', async () => {
    renderTenderManagement();
    
    await waitFor(() => {
      expect(screen.getByText(/Active/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Draft/i)).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    api.tenderAPI.getTenders = vi.fn(() => new Promise(() => {}));
    renderTenderManagement();
    const loadingElements = screen.queryAllByText(/Loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should handle API errors', async () => {
    api.tenderAPI.getTenders.mockRejectedValueOnce(new Error('Failed to load tenders'));
    
    renderTenderManagement();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load tenders')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TenderRecommendations from '../tenders/TenderRecommendations.jsx';
import * as api from '../../services/api';
import * as auth from '../../utils/auth';

vi.mock('../../services/api');
vi.mock('../../utils/auth');

const mockRecommendations = {
  tenders: [
    {
      id: 1,
      title: 'Recommended IT Project',
      description: 'Software development project',
      organization: 'Tech Corp',
      reference_number: 'REC001',
      category: 'IT Services',
      location: 'New York',
      estimated_value: 500000,
      currency: 'USD',
      submission_deadline: '2024-12-31',
      status: 'Active'
    },
    {
      id: 2,
      title: 'Infrastructure Development',
      description: 'Road construction',
      organization: 'Build Co',
      reference_number: 'REC002',
      category: 'Construction',
      location: 'California',
      estimated_value: 2000000,
      currency: 'USD',
      submission_deadline: '2025-01-31',
      status: 'Active'
    }
  ]
};

const renderTenderRecommendations = () => {
  return render(
    <BrowserRouter>
      <TenderRecommendations />
    </BrowserRouter>
  );
};

describe('TenderRecommendations Component', () => {
  beforeEach(() => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'getCurrentUser').mockReturnValue({ id: 1, email: 'user@test.com', username: 'testuser' });
    vi.spyOn(api, 'tenderAPI', 'get').mockReturnValue({
      getTenders: vi.fn().mockResolvedValue(mockRecommendations),
      getTender: vi.fn(),
      createTender: vi.fn(),
      updateTender: vi.fn(),
      deleteTender: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render recommendations page', async () => {
    renderTenderRecommendations();
    
    await waitFor(() => {
      const elements = screen.queryAllByText(/Recommended for You|Personalized/i);
      expect(elements.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should display recommended tenders', async () => {
    renderTenderRecommendations();
    
    await waitFor(() => {
      expect(screen.getByText('Recommended IT Project')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Infrastructure Development')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    api.tenderAPI.getTenders = vi.fn(() => new Promise(() => {}));
    renderTenderRecommendations();
    const loadingElements = screen.queryAllByText(/Loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should display categories and locations', async () => {
    renderTenderRecommendations();
    
    await waitFor(() => {
      const elements = screen.queryAllByText(/IT Services|Construction|New York|California/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should handle empty recommendations', async () => {
    api.tenderAPI.getTenders.mockResolvedValueOnce({ tenders: [] });
    
    renderTenderRecommendations();
    
    await waitFor(() => {
      expect(screen.getByText(/No recommendations available/i)).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    api.tenderAPI.getTenders.mockRejectedValueOnce(new Error('Failed to fetch recommendations'));
    
    renderTenderRecommendations();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch recommendations')).toBeInTheDocument();
    });
  });
});

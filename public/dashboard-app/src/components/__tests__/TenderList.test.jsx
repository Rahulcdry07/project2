import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TenderList from '../tenders/TenderList.jsx';
import * as api from '../../services/api';

vi.mock('../../services/api');

const mockTenders = {
  tenders: [
    {
      id: 1,
      title: 'Construction Project Alpha',
      description: 'Build a new facility',
      organization: 'Test Org',
      reference_number: 'REF001',
      category: 'Construction',
      location: 'New York',
      estimated_value: 1000000,
      currency: 'USD',
      submission_deadline: '2024-12-31',
      status: 'Active',
      is_featured: true
    },
    {
      id: 2,
      title: 'IT Services Contract',
      description: 'Software development',
      organization: 'Tech Corp',
      reference_number: 'REF002',
      category: 'IT Services',
      location: 'California',
      estimated_value: 500000,
      currency: 'USD',
      submission_deadline: '2024-11-30',
      status: 'Active',
      is_featured: false
    }
  ]
};

const renderTenderList = () => {
  return render(
    <BrowserRouter>
      <TenderList />
    </BrowserRouter>
  );
};

describe('TenderList Component', () => {
  beforeEach(() => {
    vi.spyOn(api, 'tenderAPI', 'get').mockReturnValue({
      getTenders: vi.fn().mockResolvedValue(mockTenders),
      getTender: vi.fn(),
      createTender: vi.fn(),
      updateTender: vi.fn(),
      deleteTender: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the tender list page title', async () => {
    renderTenderList();
    
    await waitFor(() => {
      expect(screen.getByText(/Government.*Private.*Tender/i)).toBeInTheDocument();
    });
  });

  it('should display tenders after loading', async () => {
    renderTenderList();
    
    await waitFor(() => {
      expect(screen.getByText('Construction Project Alpha')).toBeInTheDocument();
    });
    
    expect(screen.getByText('IT Services Contract')).toBeInTheDocument();
  });

  it('should show loading spinner initially', () => {
    api.tenderAPI.getTenders = vi.fn(() => new Promise(() => {}));
    renderTenderList();
    expect(screen.getAllByText(/Loading/i)[0]).toBeInTheDocument();
  });

  it('should filter tenders by search term', async () => {
    renderTenderList();
    
    await waitFor(() => {
      expect(screen.getByText('Construction Project Alpha')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by title/i);
    fireEvent.change(searchInput, { target: { value: 'Construction' } });
    
    expect(searchInput.value).toBe('Construction');
  });

  it('should display tender categories', async () => {
    renderTenderList();
    
    await waitFor(() => {
      const categoryElements = screen.queryAllByText(/Construction/i);
      expect(categoryElements.length).toBeGreaterThan(0);
    });
  });

  it('should display tender locations', async () => {
    renderTenderList();
    
    await waitFor(() => {
      const locationElements = screen.queryAllByText(/New York|California/i);
      expect(locationElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle API errors gracefully', async () => {
    api.tenderAPI.getTenders.mockRejectedValueOnce(new Error('Failed to fetch tenders'));
    
    renderTenderList();
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch tenders')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TenderDetail from '../tenders/TenderDetail.jsx';
import * as api from '../../services/api';
import * as auth from '../../utils/auth';

vi.mock('../../services/api');
vi.mock('../../utils/auth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn()
  };
});

const mockTender = {
  id: 1,
  title: 'Construction Project Alpha',
  description: 'Build a new facility with modern architecture and sustainable materials',
  organization: 'Test Organization',
  reference_number: 'REF001',
  category: 'Construction',
  location: 'New York',
  estimated_value: 1000000,
  currency: 'USD',
  submission_deadline: '2024-12-31',
  published_date: '2024-01-01',
  status: 'Active',
  created_by: 1,
  createdAt: '2024-01-01T00:00:00Z',
  requirements: 'Valid construction license required',
  contact_person: 'John Doe',
  contact_email: 'john@example.com',
  contact_phone: '1234567890'
};

const renderTenderDetail = () => {
  return render(
    <BrowserRouter>
      <TenderDetail />
    </BrowserRouter>
  );
};

describe('TenderDetail Component', () => {
  beforeEach(() => {
    vi.spyOn(auth, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(auth, 'isAdmin').mockReturnValue(false);
    vi.spyOn(api, 'tenderAPI', 'get').mockReturnValue({
      getTenders: vi.fn(),
      getTender: vi.fn().mockResolvedValue({ tender: mockTender }),
      createTender: vi.fn(),
      updateTender: vi.fn(),
      deleteTender: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render tender details after loading', async () => {
    renderTenderDetail();
    
    await waitFor(() => {
      expect(screen.getByText('Construction Project Alpha')).toBeInTheDocument();
    });
  });

  it('should display tender description', async () => {
    renderTenderDetail();
    
    await waitFor(() => {
      expect(screen.getByText(/Build a new facility/i)).toBeInTheDocument();
    });
  });

  it('should show loading spinner initially', () => {
    api.tenderAPI.getTender = vi.fn(() => new Promise(() => {}));
    renderTenderDetail();
    expect(screen.getAllByText(/Loading/i)[0]).toBeInTheDocument();
  });

  it('should display tender category and location', async () => {
    renderTenderDetail();
    
    await waitFor(() => {
      const categoryElements = screen.queryAllByText(/Construction/i);
      expect(categoryElements.length).toBeGreaterThan(0);
    });
    
    const locationElements = screen.queryAllByText(/New York/i);
    expect(locationElements.length).toBeGreaterThan(0);
  });

  it('should display contact information', async () => {
    renderTenderDetail();
    
    await waitFor(() => {
      expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
    });
  });

  it('should handle tender not found', async () => {
    api.tenderAPI.getTender.mockRejectedValueOnce(new Error('Tender not found'));
    
    renderTenderDetail();
    
    await waitFor(() => {
      expect(screen.getByText(/Tender not found|Failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('should display requirements section', async () => {
    renderTenderDetail();
    
    await waitFor(() => {
      expect(screen.getByText(/Valid construction license/i)).toBeInTheDocument();
    });
  });
});

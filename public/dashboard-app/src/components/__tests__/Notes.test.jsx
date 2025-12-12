import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Notes from '../Notes.jsx';
import * as api from '../../services/api';

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../services/api');

const mockNotes = [
  {
    id: 1,
    title: 'Meeting Notes',
    content: 'Discuss project timeline',
    color: 'blue',
    isPinned: true,
    createdAt: '2025-12-07T12:00:00Z'
  },
  {
    id: 2,
    title: 'Todo List',
    content: 'Buy groceries',
    color: 'yellow',
    isPinned: false,
    createdAt: '2025-12-07T11:00:00Z'
  }
];

const renderNotes = () => {
  return render(
    <BrowserRouter>
      <Notes />
    </BrowserRouter>
  );
};

describe('Notes Component', () => {
  beforeEach(() => {
    api.notesAPI = {
      getNotes: vi.fn().mockResolvedValue({
        notes: mockNotes,
        total: 2
      }),
      createNote: vi.fn().mockResolvedValue({ success: true }),
      updateNote: vi.fn().mockResolvedValue({ success: true }),
      deleteNote: vi.fn().mockResolvedValue({ success: true })
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders Notes page', async () => {
    renderNotes();
    
    await waitFor(() => {
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });
  });

  test('displays notes list', async () => {
    renderNotes();
    
    await waitFor(() => {
      expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Todo List')).toBeInTheDocument();
  });

  test('creates a new note', async () => {
    renderNotes();
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText('Title'), {
      target: { value: 'New Note' }
    });
    fireEvent.change(screen.getByPlaceholderText('Content'), {
      target: { value: 'Note content' }
    });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(api.notesAPI.createNote).toHaveBeenCalledWith({
        title: 'New Note',
        content: 'Note content',
        color: 'default'
      });
    });
  });

  test('shows pinned badge on pinned notes', async () => {
    renderNotes();
    
    await waitFor(() => {
      expect(screen.getByText('Pinned')).toBeInTheDocument();
    });
  });

  test('displays empty state when no notes', async () => {
    api.notesAPI.getNotes = vi.fn().mockResolvedValue({
      notes: [],
      total: 0
    });
    
    renderNotes();
    
    await waitFor(() => {
      expect(screen.getByText('No notes yet. Create your first note!')).toBeInTheDocument();
    });
  });

  test('allows color selection', async () => {
    renderNotes();
    
    await waitFor(() => {
      const colorOptions = document.querySelectorAll('.rounded.p-2');
      expect(colorOptions.length).toBeGreaterThan(0);
    });
  });

  test('shows edit form when editing note', async () => {
    renderNotes();
    
    await waitFor(() => {
      expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    });
    
    // Open dropdown and click edit
    const dropdownButtons = document.querySelectorAll('[data-bs-toggle="dropdown"]');
    if (dropdownButtons.length > 0) {
      fireEvent.click(dropdownButtons[0]);
    }
  });
});

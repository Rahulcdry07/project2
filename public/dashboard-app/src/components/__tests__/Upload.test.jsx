import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, test, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Upload from '../Upload.jsx';

const renderUpload = () => {
  return render(
    <BrowserRouter>
      <Upload />
    </BrowserRouter>
  );
};

describe('Upload Component', () => {
  test('renders Upload page', () => {
    renderUpload();
    
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop files here')).toBeInTheDocument();
  });

  test('displays upload guidelines', () => {
    renderUpload();
    
    expect(screen.getByText('Upload Guidelines')).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 100MB/)).toBeInTheDocument();
    expect(screen.getByText(/Multiple files supported/)).toBeInTheDocument();
  });

  test('handles file selection', () => {
    renderUpload();
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.getElementById('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  test('displays selected files', () => {
    renderUpload();
    
    const file1 = new File(['content1'], 'document.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'image.jpg', { type: 'image/jpeg' });
    const input = document.getElementById('file-input');
    
    fireEvent.change(input, { target: { files: [file1, file2] } });
    
    waitFor(() => {
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
    });
  });

  test('shows upload button when files are selected', () => {
    renderUpload();
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.getElementById('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    waitFor(() => {
      expect(screen.getByText('Upload All')).toBeInTheDocument();
    });
  });

  test('handles drag and drop', () => {
    renderUpload();
    
    const dropZone = screen.getByRole('button', { name: /upload files area/i });
    const file = new File(['content'], 'dropped.txt', { type: 'text/plain' });
    
    const dataTransfer = {
      files: [file],
      types: ['Files']
    };
    
    fireEvent.drop(dropZone, { dataTransfer });
    
    waitFor(() => {
      expect(screen.getByText('dropped.txt')).toBeInTheDocument();
    });
  });

  test('removes file from list', () => {
    renderUpload();
    
    const file = new File(['test'], 'removeme.txt', { type: 'text/plain' });
    const input = document.getElementById('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    waitFor(() => {
      const removeButton = screen.getByRole('button', { name: /x/i });
      fireEvent.click(removeButton);
      
      expect(screen.queryByText('removeme.txt')).not.toBeInTheDocument();
    });
  });

  test('uploads files and shows in recent uploads', async () => {
    renderUpload();
    
    const file = new File(['content'], 'upload.pdf', { type: 'application/pdf' });
    const input = document.getElementById('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Upload All')).toBeInTheDocument();
    });
    
    const uploadButton = screen.getByText('Upload All');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully uploaded/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('shows progress during upload', async () => {
    renderUpload();
    
    const file = new File(['content'], 'progress.txt', { type: 'text/plain' });
    const input = document.getElementById('file-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const uploadButton = screen.getByText('Upload All');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });

  test('displays file icons based on type', () => {
    renderUpload();
    
    const files = [
      new File([''], 'doc.pdf', { type: 'application/pdf' }),
      new File([''], 'pic.jpg', { type: 'image/jpeg' }),
      new File([''], 'sheet.xlsx', { type: 'application/vnd.ms-excel' })
    ];
    
    const input = document.getElementById('file-input');
    fireEvent.change(input, { target: { files } });
    
    waitFor(() => {
      const icons = document.querySelectorAll('.bi-file-pdf, .bi-file-image, .bi-file-excel');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  test('formats file size correctly', () => {
    renderUpload();
    
    const largeFile = new File(['x'.repeat(1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const input = document.getElementById('file-input');
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    waitFor(() => {
      expect(screen.getByText(/MB/)).toBeInTheDocument();
    });
  });
});

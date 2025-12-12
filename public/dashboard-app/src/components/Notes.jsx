import React, { useState, useEffect } from 'react';
import { notesAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './common/Toast';
import { ConfirmModal } from './common/Modal';
import { useModal } from '../hooks/useModal';

const Notes = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const deleteModal = useModal();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', color: 'default' });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await notesAPI.getNotes();
      setNotes(data.notes || []);
    } catch (error) {
      showError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingNote) {
        await notesAPI.updateNote(editingNote.id, formData);
        showSuccess('Note updated');
      } else {
        await notesAPI.createNote(formData);
        showSuccess('Note created');
      }
      setFormData({ title: '', content: '', color: 'default' });
      setEditingNote(null);
      loadNotes();
    } catch (error) {
      showError('Failed to save note');
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content || '', color: note.color });
  };

  const handleDelete = (note) => {
    setNoteToDelete(note);
    deleteModal.open();
  };

  const confirmDelete = async () => {
    try {
      await notesAPI.deleteNote(noteToDelete.id);
      setNotes(prev => prev.filter(n => n.id !== noteToDelete.id));
      showSuccess('Note deleted');
      deleteModal.close();
    } catch (error) {
      showError('Failed to delete note');
    }
  };

  const handlePin = async (note) => {
    try {
      await notesAPI.updateNote(note.id, { isPinned: !note.isPinned });
      loadNotes();
    } catch (error) {
      showError('Failed to pin note');
    }
  };

  const colors = [
    { name: 'default', bg: 'bg-white' },
    { name: 'blue', bg: 'bg-info bg-opacity-10' },
    { name: 'green', bg: 'bg-success bg-opacity-10' },
    { name: 'yellow', bg: 'bg-warning bg-opacity-10' },
    { name: 'red', bg: 'bg-danger bg-opacity-10' }
  ];

  if (loading) {
    return (
      <div className="container mt-4">
        <h1>Notes</h1>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-right" />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Notes</h1>
        </div>

        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{editingNote ? 'Edit Note' : 'New Note'}</h5>
                <form onSubmit={handleSave}>
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Color</label>
                    <div className="d-flex gap-2">
                      {colors.map(c => (
                        <div
                          key={c.name}
                          className={`${c.bg} border rounded p-2 cursor-pointer ${formData.color === c.name ? 'border-primary border-3' : ''}`}
                          style={{ width: '40px', height: '40px', cursor: 'pointer' }}
                          onClick={() => setFormData(prev => ({ ...prev, color: c.name }))}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      {editingNote ? 'Update' : 'Create'}
                    </button>
                    {editingNote && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingNote(null);
                          setFormData({ title: '', content: '', color: 'default' });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-md-8">
            {notes.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-journal-text" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                <p className="text-muted mt-3">No notes yet. Create your first note!</p>
              </div>
            ) : (
              <div className="row">
                {notes.map((note) => (
                  <div key={note.id} className="col-md-6 mb-3">
                    <div className={`card h-100 ${colors.find(c => c.name === note.color)?.bg || ''}`}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title mb-0">{note.title}</h6>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-link" data-bs-toggle="dropdown">
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu">
                              <li><button className="dropdown-item" onClick={() => handlePin(note)}>
                                <i className={`bi ${note.isPinned ? 'bi-pin-fill' : 'bi-pin'} me-2`}></i>
                                {note.isPinned ? 'Unpin' : 'Pin'}
                              </button></li>
                              <li><button className="dropdown-item" onClick={() => handleEdit(note)}>
                                <i className="bi bi-pencil me-2"></i>Edit
                              </button></li>
                              <li><button className="dropdown-item text-danger" onClick={() => handleDelete(note)}>
                                <i className="bi bi-trash me-2"></i>Delete
                              </button></li>
                            </ul>
                          </div>
                        </div>
                        <p className="card-text text-muted small">{note.content}</p>
                        {note.isPinned && (
                          <span className="badge bg-secondary"><i className="bi bi-pin-fill"></i> Pinned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default Notes;

import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { SkeletonTable } from '../common/SkeletonLoader';
import ErrorDisplay from '../common/ErrorDisplay';
import EmptyState from '../common/EmptyState';
import { ConfirmModal } from '../common/Modal';
import { useModal } from '../../hooks/useModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteModal = useModal();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users');
      // console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      // Update the local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      setError('Failed to update user role');
      // console.error('Error updating user role:', err);
    }
  };

  const handleDeleteUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
    deleteModal.open();
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setIsDeleting(true);
      await adminAPI.deleteUser(selectedUser.id);
      setUsers(users.filter(user => user.id !== selectedUser.id));
      deleteModal.close();
      setSelectedUser(null);
    } catch (err) {
      setError('Failed to delete user');
      // console.error('Error deleting user:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <h1>Admin Dashboard</h1>
        <p className="text-muted">Manage users and their roles</p>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <h1>Admin Dashboard</h1>
        <ErrorDisplay 
          error={error} 
          onRetry={loadUsers}
          retryText="Reload Users"
        />
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-1">Admin Dashboard</h1>
          <p className="text-muted mb-0">Manage users and their roles</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={loadUsers} aria-label="Refresh user list">
          <i className="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
          Refresh
        </button>
      </div>
      
      {users.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="bi-people"
              title="No Users Found"
              message="There are currently no users in the system. New users will appear here once they register."
              className="py-5"
            />
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">User List ({users.length})</h5>
              <span className="badge bg-primary">{users.length} total</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Email Verified</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="align-middle">
                        <code className="text-muted">#{user.id}</code>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                               style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <strong>{user.username}</strong>
                        </div>
                      </td>
                      <td className="align-middle">
                        <small className="text-muted">{user.email}</small>
                      </td>
                      <td className="align-middle">
                        <select 
                          className="form-select form-select-sm"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          style={{ minWidth: '100px' }}
                          aria-label={`Change role for ${user.username}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="align-middle">
                        <span className={`badge ${user.emailVerified ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {user.emailVerified ? (
                            <>
                              <i className="bi bi-check-circle-fill me-1"></i>
                              Verified
                            </>
                          ) : (
                            <>
                              <i className="bi bi-clock-fill me-1"></i>
                              Pending
                            </>
                          )}
                        </span>
                      </td>
                      <td className="align-middle">
                        <small className="text-muted">
                          {new Date(user.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </small>
                      </td>
                      <td className="align-middle">
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteUser(user.id)}
                          aria-label={`Delete user ${user.username}`}
                        >
                          <i className="bi bi-trash" aria-hidden="true"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${selectedUser?.username}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default UserManagement;
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { Card, Alert, Spinner, ConfirmDialog } from '../common/FormComponents';
import { isAdmin } from '../../utils/auth';
import { adminAPI } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { useApiData } from '../../hooks/useForm';

/**
 * User table component for the admin panel
 */
const UserTable = ({ users, onEdit, onDelete, isLoading }) => {
    if (isLoading) {
        return <Spinner centered text="Loading users..." data-testid="loading-spinner" />;
    }

    if (!users || users.length === 0) {
        return (
            <div className="alert alert-info" data-testid="no-users-message">
                No users found in the system.
            </div>
        );
    }

    return (
        <div className="table-responsive" data-testid="user-table-container">
            <table className="table table-hover" data-testid="user-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Verified</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} data-testid={`user-row-${user.id}`} data-username={user.username}>
                            <td>{user.id}</td>
                            <td data-testid={`username-${user.id}`}>{user.username}</td>
                            <td>{user.email}</td>
                            <td>
                                <span className={`badge bg-${user.role === 'admin' ? 'danger' : 'primary'}`}>
                                    {user.role}
                                </span>
                            </td>
                            <td>
                                {user.emailVerified ? (
                                    <span className="badge bg-success">Yes</span>
                                ) : (
                                    <span className="badge bg-warning text-dark">No</span>
                                )}
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => onEdit(user)}
                                        data-testid={`edit-user-${user.id}`}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-outline-danger"
                                        onClick={() => onDelete(user)}
                                        disabled={user.role === 'admin' && isAdmin()}
                                        data-testid={`delete-user-${user.id}`}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

UserTable.propTypes = {
    users: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number.isRequired,
            username: PropTypes.string.isRequired,
            email: PropTypes.string.isRequired,
            role: PropTypes.string.isRequired,
            emailVerified: PropTypes.bool.isRequired,
            createdAt: PropTypes.string.isRequired
        })
    ),
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    isLoading: PropTypes.bool
};

/**
 * User edit modal for the admin panel
 */
const UserEditModal = ({ user, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        role: 'user'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                role: user.role
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await onSave(user.id, formData);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to update user');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className={`modal ${isOpen ? 'd-block show' : ''}`} tabIndex="-1" style={{ display: isOpen ? 'block' : 'none', backgroundColor: 'rgba(0,0,0,0.5)' }} data-testid="edit-modal">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Edit User: {user.username}</h5>
                        <button type="button" className="btn-close" onClick={onClose} disabled={isLoading} data-testid="close-modal"></button>
                    </div>
                    <div className="modal-body">
                        {error && <Alert message={error} />}
                        <form onSubmit={handleSubmit} data-testid="edit-user-form">
                            <div className="mb-3">
                                <label htmlFor="role" className="form-label">Role</label>
                                <select 
                                    id="role" 
                                    name="role" 
                                    className="form-select" 
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    data-testid="role-select"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={onClose} 
                            disabled={isLoading}
                            data-testid="cancel-button"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={handleSubmit} 
                            disabled={isLoading}
                            data-testid="save-button"
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

UserEditModal.propTypes = {
    user: PropTypes.object,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired
};

/**
 * Admin panel component for user management
 */
const UserManagement = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [error, setError] = useState(null);

    // Fetch users using custom hook
    const { data: users, loading, error: fetchError, refetch } = useApiData(
        adminAPI.getAllUsers
    );

    useEffect(() => {
        if (fetchError) {
            setError(fetchError);
        }
    }, [fetchError]);

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteUser = (user) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleSaveUser = async (userId, userData) => {
        try {
            await adminAPI.updateUserRole(userId, userData.role);
            refetch(); // Reload the user list
            return true;
        } catch (err) {
            setError(err.message || 'Failed to update user');
            throw err;
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await adminAPI.deleteUser(selectedUser.id);
            refetch(); // Reload the user list
            return true;
        } catch (err) {
            setError(err.message || 'Failed to delete user');
            throw err;
        }
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
    };

    if (!isAdmin()) {
        return (
            <div className="alert alert-danger" data-testid="access-denied">
                <h4 className="alert-heading">Access Denied</h4>
                <p>You do not have permission to access the admin panel.</p>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4" data-testid="admin-container">
            <Card title="User Management" data-testid="user-management-card">
                <h1 data-testid="admin-title">Admin Dashboard</h1>
                
                {error && <Alert message={error} onClose={() => setError(null)} data-testid="error-alert" />}
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="mb-0">Users</h3>
                    <button 
                        className="btn btn-primary" 
                        onClick={refetch}
                        disabled={loading}
                        data-testid="refresh-button"
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Refresh
                    </button>
                </div>

                <UserTable 
                    users={users} 
                    onEdit={handleEditUser} 
                    onDelete={handleDeleteUser}
                    isLoading={loading}
                />

                <UserEditModal 
                    user={selectedUser}
                    isOpen={isEditModalOpen}
                    onClose={closeEditModal}
                    onSave={handleSaveUser}
                />

                <ConfirmDialog
                    isOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                    onConfirm={handleConfirmDelete}
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the user ${selectedUser?.username}? This action cannot be undone.`}
                    confirmText="Delete User"
                    confirmButtonType="danger"
                />
            </Card>
        </div>
    );
};

export default UserManagement;
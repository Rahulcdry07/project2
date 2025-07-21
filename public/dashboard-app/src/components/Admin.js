import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TokenManager from '../utils/tokenManager';

const Admin = () => {
    const [users, setUsers] = useState([]);
    
    const navigate = useNavigate();

    const fetchUsers = useCallback(async () => {
        try {
            const response = await TokenManager.makeAuthenticatedRequest('/api/admin/users');
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            } else {
                alert(`Error fetching users: ${data.error}`);
            }
        } catch (error) {
            console.error('Network error fetching users:', error);
            alert('Network error fetching users.');
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            
            fetchUsers();
        } else {
            
            navigate('/login');
        }
    }, [navigate, fetchUsers]);

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await TokenManager.makeAuthenticatedRequest(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });
            const result = await response.json();
            if (response.ok) {
                fetchUsers(); // Refresh the user list
            } else {
                alert(`Error updating role: ${result.error}`);
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Network error updating role.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await TokenManager.makeAuthenticatedRequest(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                });
                const result = await response.json();
                if (response.ok) {
                    fetchUsers(); // Refresh the user list
                } else {
                    alert(`Error deleting user: ${result.error}`);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Network error deleting user.');
            }
        }
    };

    return (
        <div className="container mt-4">
            <header className="mb-4">
                <h1>Admin Dashboard</h1>
            </header>
            <h2 className="mb-3">Users</h2>
            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        className="form-select"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Admin;

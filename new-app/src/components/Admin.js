import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // Add isLoggedIn state
    const navigate = useNavigate();

    const fetchUsers = async () => {
        console.log('fetchUsers called');
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, navigating to login.');
            navigate('/login');
            return;
        }
        console.log('Token found, attempting to fetch users.');
        try {
            const response = await fetch('/api/admin/users', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
                console.log('Users fetched successfully:', data);
            } else if (data.error === 'Token expired.' || data.error === 'Invalid token.' || data.error === 'No token provided.') {
                console.log('Token invalid or expired, navigating to login.');
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                alert(`Error fetching users: ${data.error}`);
                console.error('Error fetching users from API:', data.error);
            }
        } catch (error) {
            console.error('Network error fetching users:', error);
            alert('Network error fetching users.');
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchUsers();
        } else {
            setIsLoggedIn(false);
            navigate('/login');
        }
    }, [isLoggedIn, navigate]);

    const handleRoleChange = async (userId, newRole) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
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
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`/api/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token }
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

import React from 'react';
import UserManagement from './admin/UserManagement';

/**
 * Admin component that serves as a container for admin functionality
 * This component is kept for backward compatibility and now just imports
 * the UserManagement component from the admin directory
 */
const Admin = () => {
    return <UserManagement />;
};

export default Admin;
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ErrorBoundary } from './components/common/FormComponents';
import Navbar from './components/Navbar';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import VerifyEmail from './components/VerifyEmail';

// Main components
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import FileManager from './components/FileManager';

// Admin components
import UserManagement from './components/admin/UserManagement';

// Auth utilities
import { isAuthenticated, isAdmin } from './utils/auth';

/**
 * Protected route component that requires authentication
 */
const ProtectedRoute = ({ element, requireAdmin = false }) => {
  // Check if user is authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // If admin is required, check if user is admin
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" />;
  }
  
  return element;
};

ProtectedRoute.propTypes = {
  element: PropTypes.element.isRequired,
  requireAdmin: PropTypes.bool
};

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Navbar />
        <main className="container-fluid py-3">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute element={<Dashboard />} />} 
            />
            <Route 
              path="/profile" 
              element={<ProtectedRoute element={<Profile />} />} 
            />
            <Route 
              path="/files" 
              element={<ProtectedRoute element={<FileManager />} />} 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin" 
              element={<ProtectedRoute element={<UserManagement />} requireAdmin={true} />} 
            />
            
            {/* Default route */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
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
import Settings from './components/Settings.jsx';
import ActivityLog from './components/ActivityLog.jsx';
import Notifications from './components/Notifications.jsx';
import Notes from './components/Notes.jsx';
import Upload from './components/Upload.jsx';

// Tender components
import TenderList from './components/tenders/TenderList';
import TenderDetail from './components/tenders/TenderDetail';
import TenderManagement from './components/tenders/TenderManagement';
import TenderRecommendations from './components/tenders/TenderRecommendations';

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
            
            {/* Tender routes (public) */}
            <Route path="/tenders" element={<TenderList />} />
            <Route path="/tenders/:id" element={<TenderDetail />} />
            
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
              path="/upload" 
              element={<ProtectedRoute element={<Upload />} />} 
            />
            <Route 
              path="/settings" 
              element={<ProtectedRoute element={<Settings />} />} 
            />
            <Route 
              path="/activity" 
              element={<ProtectedRoute element={<ActivityLog />} />} 
            />
            <Route 
              path="/notifications" 
              element={<ProtectedRoute element={<Notifications />} />} 
            />
            <Route 
              path="/notes" 
              element={<ProtectedRoute element={<Notes />} />} 
            />
            <Route 
              path="/recommendations" 
              element={<ProtectedRoute element={<TenderRecommendations />} />} 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin/users" 
              element={<ProtectedRoute element={<UserManagement />} requireAdmin={true} />} 
            />
            <Route 
              path="/admin/tenders" 
              element={<ProtectedRoute element={<TenderManagement />} requireAdmin={true} />} 
            />
            
            {/* Default route */}
            <Route path="/" element={<Navigate to="/tenders" />} />
            <Route path="*" element={<Navigate to="/tenders" />} />
          </Routes>
        </main>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
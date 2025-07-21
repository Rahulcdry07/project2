import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import TokenManager from '../utils/tokenManager';
import ProfileForm from './ProfileForm';
import ProfileStatsCard from './ProfileStatsCard';
import PasswordForm from './PasswordForm';
import './Profile.css';

const Profile = () => {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const [fields, setFields] = useState(null); // null until initialized
  const [profileMessage, setProfileMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [passwordFields, setPasswordFields] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  // Diagnostic logs
  console.log('[Profile] Rendered');
  console.log('[Profile] user:', user);
  console.log('[Profile] fields:', fields);
  console.log('[Profile] authLoading:', authLoading);

  // Only initialize fields and profilePicUrl from user on first load or if user id changes
  useEffect(() => {
    console.log('[Profile] useEffect triggered. user:', user, 'fields:', fields, 'authLoading:', authLoading);
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (user && !fields) {
      console.log('[Profile] Initializing fields and profilePicUrl from user');
      setFields({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        githubUrl: user.github_url || '',
        linkedinUrl: user.linkedin_url || '',
        twitterUrl: user.twitter_url || '',
        profilePrivacy: user.profile_privacy || 'public',
      });
    }
    // If user changes (e.g., after login as a different user), update fields and profilePicUrl
    if (user && fields && user.username !== fields.username) {
      console.log('[Profile] User changed, updating fields and profilePicUrl');
      setFields({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        githubUrl: user.github_url || '',
        linkedinUrl: user.linkedin_url || '',
        twitterUrl: user.twitter_url || '',
        profilePrivacy: user.profile_privacy || 'public',
      });
    }
  }, [user, isLoggedIn, authLoading, navigate, fields]);

  // Profile field change handler
  const handleFieldChange = (field, value) => {
    setFields(prev => ({ ...prev, [field]: value }));
  };

  // Profile update submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    setIsUploading(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: fields.username,
          email: fields.email,
          bio: fields.bio,
          location: fields.location,
          website: fields.website,
          github_url: fields.githubUrl,
          linkedin_url: fields.linkedinUrl,
          twitter_url: fields.twitterUrl,
          profile_privacy: fields.profilePrivacy,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setProfileMessage(result.message || 'Profile updated successfully!');
        setFields(prev => ({
          ...prev,
          username: result.username !== undefined ? result.username : prev.username,
          email: result.email !== undefined ? result.email : prev.email,
          bio: result.bio !== undefined ? result.bio : prev.bio,
          location: result.location !== undefined ? result.location : prev.location,
          website: result.website !== undefined ? result.website : prev.website,
          githubUrl: result.github_url !== undefined ? result.github_url : prev.githubUrl,
          linkedinUrl: result.linkedin_url !== undefined ? result.linkedin_url : prev.linkedinUrl,
          twitterUrl: result.twitter_url !== undefined ? result.twitter_url : prev.twitterUrl,
          profilePrivacy: result.profile_privacy !== undefined ? result.profile_privacy : prev.profilePrivacy,
        }));
        setShowToast(true);
      } else {
        setProfileMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setProfileMessage('Network error updating profile.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  // Copy profile link
  const handleCopyLink = () => {
    if (!user) return;
    const profileUrl = window.location.origin + '/profile/' + encodeURIComponent(user.username);
    navigator.clipboard.writeText(profileUrl);
    setProfileMessage('Profile link copied!');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Password field change
  const handlePasswordFieldChange = (field, value) => {
    setPasswordFields(prev => ({ ...prev, [field]: value }));
  };

  // Change password submit
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setIsPasswordLoading(true);
    try {
      const response = await TokenManager.makeAuthenticatedRequest('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordFields.oldPassword,
          newPassword: passwordFields.newPassword,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setPasswordMessage(result.message);
        setPasswordFields({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
        setShowToast(true);
      } else {
        setPasswordMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      setPasswordMessage('Network error changing password.');
    } finally {
      setIsPasswordLoading(false);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  // Show skeleton only on very first load
  if ((authLoading || !user || !fields)) {
    console.log('[Profile] Showing skeleton');
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="glassy-card p-5 rounded-4 shadow" style={{ width: '32rem', minHeight: 400 }}>
          <div className="placeholder-glow w-100 mb-3" style={{ height: 24 }}></div>
          <div className="placeholder-glow w-100 mb-3" style={{ height: 24 }}></div>
          <div className="placeholder-glow w-100 mb-3" style={{ height: 120 }}></div>
          <div className="placeholder-glow w-100 mb-3" style={{ height: 48 }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container d-flex flex-column align-items-center py-5">
      <div className="w-100" style={{ maxWidth: 540 }}>
        {/* ProfilePicture removed */}
        <ProfileForm
          username={fields.username}
          email={fields.email}
          bio={fields.bio}
          location={fields.location}
          website={fields.website}
          githubUrl={fields.githubUrl}
          linkedinUrl={fields.linkedinUrl}
          twitterUrl={fields.twitterUrl}
          profilePrivacy={fields.profilePrivacy}
          onChange={handleFieldChange}
          onSubmit={handleProfileSubmit}
          isLoading={isUploading}
          message={profileMessage}
          profileCompletion={user.profile_completion || 0}
        />
        <ProfileStatsCard
          loginCount={user.login_count || 0}
          lastLogin={user.last_login || ''}
          isVerified={user.is_verified || false}
          profileUrl={window.location.origin + '/profile/' + encodeURIComponent(user.username)}
          onCopyLink={handleCopyLink}
        />
        <PasswordForm
          oldPassword={passwordFields.oldPassword}
          newPassword={passwordFields.newPassword}
          confirmNewPassword={passwordFields.confirmNewPassword}
          onChange={handlePasswordFieldChange}
          onSubmit={handleChangePassword}
          isLoading={isPasswordLoading}
          message={passwordMessage}
        />
      </div>
      {/* Toast notification */}
      {showToast && (
        <div className="toast align-items-center text-bg-primary border-0 show position-fixed bottom-0 end-0 m-4" role="alert" aria-live="assertive" aria-atomic="true" style={{ zIndex: 2000, minWidth: 220 }}>
          <div className="d-flex">
            <div className="toast-body">
              {profileMessage || passwordMessage}
            </div>
            <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => setShowToast(false)}></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

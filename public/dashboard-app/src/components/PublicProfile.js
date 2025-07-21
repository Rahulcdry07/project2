import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PublicProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { username } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`/api/profile/${username}`);
                const data = await response.json();
                
                if (response.ok) {
                    setProfile(data);
                } else {
                    setError(data.error || 'Profile not found');
                }
            } catch (error) {
                setError('Network error fetching profile.');
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfile();
        }
    }, [username]);

    if (loading) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container d-flex justify-content-center align-items-center min-vh-100">
                <div className="card p-4 shadow-sm text-center" style={{ width: '24rem' }}>
                    <h2 className="text-danger mb-3">Profile Not Found</h2>
                    <p className="text-muted mb-4">{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container d-flex justify-content-center align-items-center min-vh-100">
            <div className="card p-4 shadow-sm" style={{ width: '32rem' }}>
                <div className="text-center mb-4">
                    <img 
                        src={profile.profile_picture || 'https://via.placeholder.com/150x150?text=Profile'} 
                        alt={`${profile.username}'s profile`} 
                        className="rounded-circle mb-3"
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150x150?text=Profile';
                        }}
                    />
                    <h2 className="card-title">{profile.username}</h2>
                    {profile.location && (
                        <p className="text-muted">
                            <i className="bi bi-geo-alt"></i> {profile.location}
                        </p>
                    )}
                </div>

                {profile.bio && (
                    <div className="mb-4">
                        <h5>About</h5>
                        <p className="text-muted">{profile.bio}</p>
                    </div>
                )}

                {/* Social Links */}
                {(profile.website || profile.github_url || profile.linkedin_url || profile.twitter_url) && (
                    <div className="mb-4">
                        <h5>Links</h5>
                        <div className="d-flex flex-wrap gap-2">
                            {profile.website && (
                                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                    <i className="bi bi-globe"></i> Website
                                </a>
                            )}
                            {profile.github_url && (
                                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark btn-sm">
                                    <i className="bi bi-github"></i> GitHub
                                </a>
                            )}
                            {profile.linkedin_url && (
                                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                                    <i className="bi bi-linkedin"></i> LinkedIn
                                </a>
                            )}
                            {profile.twitter_url && (
                                <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm">
                                    <i className="bi bi-twitter"></i> Twitter
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Profile Statistics */}
                <div className="card bg-light">
                    <div className="card-body">
                        <h6 className="card-title">Profile Statistics</h6>
                        <div className="row text-center">
                            <div className="col-6">
                                <div className="text-muted">Login Count</div>
                                <div className="h5 mb-0">{profile.login_count}</div>
                            </div>
                            <div className="col-6">
                                <div className="text-muted">Last Login</div>
                                <div className="h6 mb-0">
                                    {profile.last_login ? new Date(profile.last_login).toLocaleDateString() : 'Never'}
                                </div>
                            </div>
                        </div>
                        <div className="text-center mt-3">
                            <div className="text-muted">Profile Completion</div>
                            <div className="progress mt-2">
                                <div className="progress-bar" role="progressbar" style={{ width: `${profile.profile_completion}%` }}></div>
                            </div>
                            <small className="text-muted">{profile.profile_completion}% complete</small>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile; 
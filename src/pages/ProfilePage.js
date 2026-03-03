import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/ProfilePage.css';
import API_BASE_URL from '../config/apiConfig.js';
import ProfileSkeleton from '../components/ui/ProfileSkeleton';

function ProfilePage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const getRolePrefix = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || (!user.role && !user.userRole)) return '';
        const role = user.role || (user.userRole === 1 ? 'SUPER_ADMIN' : 'USER');
        if (role === 'SUPER_ADMIN') return '/super-admin';
        if (role === 'ADMIN') return '/admin';
        return '/user';
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) {
                    navigate('/'); // Redirect to login
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                } else {
                    toast.error("Failed to load profile data");
                }
            } catch (error) {
                console.error("Error loading profile:", error);
                toast.error("Error loading profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!profile) {
        return <div className="profile-page-container">Profile not found.</div>;
    }

    const isSuperAdmin = profile.role === 'SUPER_ADMIN';
    // const isAdmin = profile.role === 'ADMIN'; // Keep for future use if needed
    const company = profile.companyId || {}; // If populate worked, this is an object

    return (
        <div className="profile-page-container">
            <div className="profile-page-header">
                <h1 className="profile-page-title">My Profile</h1>
            </div>

            <div className="profile-page-content">
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-avatar-large">
                            {profile.userProfile ? (
                                <img
                                    src={profile.userProfile}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                            ) : (
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            )}
                        </div>
                        <h2 className="profile-name">{profile.userName}</h2>
                        <p className="profile-email">{profile.userEmail}</p>
                    </div>

                    <div className="profile-info-section">
                        <h3 className="profile-section-title">Personal Information</h3>

                        <div className="profile-info-grid">
                            <div className="profile-info-item">
                                <label className="profile-info-label">Full Name</label>
                                <div className="profile-info-value">{profile.userName}</div>
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">Email Address</label>
                                <div className="profile-info-value">{profile.userEmail}</div>
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">Phone Number</label>
                                <div className="profile-info-value">{profile.userMobileNumber || 'N/A'}</div>
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">User Role</label>
                                <div className="profile-info-value">{profile.role}</div>
                            </div>

                            {/* Company Name shown in Personal Info if not Super Admin */}
                            {!isSuperAdmin && (
                                <div className="profile-info-item">
                                    <label className="profile-info-label">Company Name</label>
                                    <div className="profile-info-value">{company.companyName || 'N/A'}</div>
                                </div>
                            )}

                            {profile.userBirthdayDate && (
                                <div className="profile-info-item">
                                    <label className="profile-info-label">Birthday</label>
                                    <div className="profile-info-value">{profile.userBirthdayDate}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address Detail - Only show for Non-Super Admin if Company info is present */}
                    {!isSuperAdmin && company.companyName && (
                        <div className="profile-info-section" style={{ paddingTop: 0 }}>
                            <h3 className="profile-section-title">Company Address Detail</h3>

                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <label className="profile-info-label">Country</label>
                                    <div className="profile-info-value">{company.companyCountry || 'N/A'}</div>
                                </div>

                                <div className="profile-info-item">
                                    <label className="profile-info-label">State</label>
                                    <div className="profile-info-value">{company.companyState || 'N/A'}</div>
                                </div>

                                <div className="profile-info-item" style={{ gridColumn: 'span 2' }}>
                                    <label className="profile-info-label">Full Address</label>
                                    <div className="profile-info-value">{company.companyAddress || 'N/A'}</div>
                                </div>

                                <div className="profile-info-item">
                                    <label className="profile-info-label">City</label>
                                    <div className="profile-info-value">{company.companyCity || 'N/A'}</div>
                                </div>

                                <div className="profile-info-item">
                                    <label className="profile-info-label">Pin Code</label>
                                    <div className="profile-info-value">{company.companyPinCode || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="profile-actions">
                        <button className="btn-edit-profile" onClick={() => navigate(`${getRolePrefix()}/profile/edit`)}>Edit Profile</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;

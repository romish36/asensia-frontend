import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfilePage.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/apiConfig.js';

function EditProfilePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        userMobileNumber: '',
        userBirthdayDate: '',
        userPassword: '', // Optional
        userProfile: '',
        // Company details (ReadOnly)
        companyName: '',
        companyCountry: '',
        companyState: '',
        companyCity: '',
        companyAddress: '',
        companyPinCode: '',
        role: ''
    });

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
                    const company = data.companyId || {};

                    setFormData({
                        userName: data.userName || '',
                        userEmail: data.userEmail || '',
                        userMobileNumber: data.userMobileNumber || '',
                        userBirthdayDate: data.userBirthdayDate || '',
                        userPassword: '',
                        userProfile: data.userProfile || '',
                        role: data.role || '',
                        // Read-only company info
                        companyName: company.companyName || '',
                        companyCountry: company.companyCountry || '',
                        companyState: company.companyState || '',
                        companyCity: company.companyCity || '',
                        companyAddress: company.companyAddress || '',
                        companyPinCode: company.companyPinCode || ''
                    });
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

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleChange = async (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            if (files && files[0]) {
                try {
                    const base64 = await convertToBase64(files[0]);
                    setFormData(prev => ({ ...prev, [name]: base64 }));
                } catch (error) {
                    toast.error("Error processing file");
                }
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = sessionStorage.getItem('token');
            const payload = {
                userName: formData.userName,
                userMobileNumber: formData.userMobileNumber,
                userBirthdayDate: formData.userBirthdayDate,
                userProfile: formData.userProfile
            };
            if (formData.userPassword) {
                payload.userPassword = formData.userPassword;
            }

            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const updatedUser = await response.json();
                // Update session storage
                const currentUser = JSON.parse(sessionStorage.getItem('user'));
                sessionStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));

                toast.success('Profile updated successfully');
                navigate(`${getRolePrefix()}/profile`);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Server error');
        }
    };

    const handleCancel = () => {
        navigate(`${getRolePrefix()}/profile`);
    };

    // Helper check
    const isSuperAdmin = formData.role === 'SUPER_ADMIN';

    if (loading) return <div className="loading-spinner">Loading...</div>;

    return (
        <div className="profile-page-container">
            <div className="profile-page-header">
                <h1 className="profile-page-title">Edit Profile</h1>
            </div>

            <div className="profile-page-content">
                <form onSubmit={handleSubmit} className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-avatar-large">
                            {formData.userProfile ? (
                                <img
                                    src={formData.userProfile}
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
                        {/* File Upload for Profile Picture */}
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <input
                                type="file"
                                name="userProfile"
                                accept="image/*"
                                onChange={handleChange}
                                style={{ maxWidth: '200px' }}
                            />
                        </div>
                    </div>

                    <div className="profile-info-section">
                        <h3 className="profile-section-title">Edit Personal Information</h3>

                        <div className="profile-info-grid">
                            <div className="profile-info-item">
                                <label className="profile-info-label">Full Name</label>
                                <input
                                    type="text"
                                    name="userName"
                                    className="profile-info-input"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">Email Address (Read Only)</label>
                                <input
                                    type="email"
                                    name="userEmail"
                                    className="profile-info-input"
                                    value={formData.userEmail}
                                    readOnly
                                    disabled
                                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">Phone Number</label>
                                <input
                                    type="text"
                                    name="userMobileNumber"
                                    className="profile-info-input"
                                    value={formData.userMobileNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">Birthday</label>
                                <input
                                    type="date"
                                    name="userBirthdayDate"
                                    className="profile-info-input"
                                    value={formData.userBirthdayDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">New Password (Optional)</label>
                                <input
                                    type="password"
                                    name="userPassword"
                                    className="profile-info-input"
                                    value={formData.userPassword}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current"
                                />
                            </div>

                            <div className="profile-info-item">
                                <label className="profile-info-label">User Role</label>
                                <input
                                    type="text"
                                    value={formData.role}
                                    className="profile-info-input"
                                    disabled
                                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                />
                            </div>

                            {!isSuperAdmin && (
                                <div className="profile-info-item">
                                    <label className="profile-info-label">Company Name</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        className="profile-info-input"
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {!isSuperAdmin && formData.companyName && (
                        <div className="profile-info-section" style={{ paddingTop: 0 }}>
                            <h3 className="profile-section-title">Address Detail (Read Only)</h3>

                            <div className="profile-info-grid">
                                <div className="profile-info-item">
                                    <label className="profile-info-label">Country</label>
                                    <input
                                        type="text"
                                        value={formData.companyCountry}
                                        className="profile-info-input"
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>

                                <div className="profile-info-item">
                                    <label className="profile-info-label">State</label>
                                    <input
                                        type="text"
                                        value={formData.companyState}
                                        className="profile-info-input"
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>

                                <div className="profile-info-item" style={{ gridColumn: 'span 2' }}>
                                    <label className="profile-info-label">Full Address</label>
                                    <textarea
                                        value={formData.companyAddress}
                                        className="profile-info-input"
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>

                                <div className="profile-info-item">
                                    <label className="profile-info-label">City</label>
                                    <input
                                        type="text"
                                        value={formData.companyCity}
                                        className="profile-info-input"
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>

                                <div className="profile-info-item">
                                    <label className="profile-info-label">Pin Code</label>
                                    <input
                                        type="text"
                                        value={formData.companyPinCode}
                                        className="profile-info-input"
                                        disabled
                                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="profile-actions">
                        <button type="submit" className="auth-submit-btn">Save Changes</button>
                        <button type="button" className="auth-cancel-btn" onClick={handleCancel}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfilePage;

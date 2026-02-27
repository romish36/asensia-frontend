import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileDropdown.css';

function ProfileDropdown({ userName = 'User', userImage, onLogout }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    };

    const getRolePrefix = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.role) return '';
        if (user.role === 'SUPER_ADMIN') return '/super-admin';
        if (user.role === 'ADMIN') return '/admin';
        return '/user';
    };

    const handleMyProfile = () => {
        setIsOpen(false);
        navigate(`${getRolePrefix()}/profile`);
    };

    const handleChangePassword = () => {
        setIsOpen(false);
        navigate(`${getRolePrefix()}/change-password`);
    };

    const handleLogout = () => {
        setIsOpen(false);
        if (onLogout) {
            onLogout();
        }
    };

    return (
        <div className="profile-dropdown-container" ref={dropdownRef}>
            <div
                className="profile-pill"
                role="button"
                tabIndex={0}
                onClick={handleProfileClick}
                onKeyDown={(e) => e.key === 'Enter' && handleProfileClick()}
            >
                <div className="profile-pill__avatarWrap">
                    <div className="profile-pill__avatar">
                        {userImage ? (
                            <img
                                src={userImage}
                                alt="User"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                            />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        )}
                    </div>
                    <span className="profile-pill__status" />
                </div>
            </div>

            {isOpen && (
                <div className="profile-dropdown-menu">
                    {/* User Info Header */}
                    <div className="profile-dropdown-header">
                        <div className="profile-dropdown-avatar">
                            {userImage ? (
                                <img
                                    src={userImage}
                                    alt="User"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            )}
                            <span className="profile-dropdown-status" />
                        </div>
                        <span className="profile-dropdown-username">{userName}</span>
                    </div>

                    {/* Menu Items */}
                    <div className="profile-dropdown-items">
                        <button className="profile-dropdown-item" onClick={handleMyProfile}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>My Profile</span>
                        </button>

                        <button className="profile-dropdown-item" onClick={handleChangePassword}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>Change Password</span>
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button className="profile-dropdown-logout" onClick={handleLogout}>
                        Logout
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProfileDropdown;

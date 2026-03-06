import React, { useState, useEffect } from 'react';
import '../styles/CompanyProfile.css';
import fetchApi from '../utils/api.js';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import PageSkeleton from '../components/ui/PageSkeleton';


const CompanyProfile = ({ company, onBack, onPermissions, onChat, onEditUser, onDeleteUser }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'plan'
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const currentUserRole = currentUser?.role;
    const currentUserId = currentUser?._id || currentUser?.id;

    useEffect(() => {
        if (company) {
            fetchCompanyUsers();
        }
    }, [company]);

    const fetchCompanyUsers = async () => {
        try {
            setLoading(true);
            const companyId = company._id || company.id;
            const data = await fetchApi(`/users?companyId=${companyId}`);

            if (data.users && Array.isArray(data.users)) {
                setUsers(data.users);
            } else if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching company users:", error);
            toast.error("Failed to fetch users");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this user?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/users/${id}`, { method: 'DELETE' });
                    Swal.fire('Deleted!', 'User has been deleted.', 'success');
                    fetchCompanyUsers(); // Refresh the list
                } catch (error) {
                    console.error(error);
                }
            }
        });
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!company) return <div className="company-profile-container">No Company Selected</div>;

    return (
        <div className="company-profile-container">
            <div className="company-profile-header">
                <div className="header-left">
                    <h2 className="company-profile-title">{company.companyName}</h2>
                    <span className="company-profile-subtitle">{company.companyEmail}</span>
                </div>
                {onBack && (
                    <button className="company-profile-back-btn" onClick={onBack}>
                        ← Back to List
                    </button>
                )}
            </div>

            <div className="company-profile-tabs-wrapper">
                <div className="company-profile-tabs">
                    <button
                        className={`profile-tab ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        Users List
                    </button>
                    <button
                        className={`profile-tab ${activeTab === 'plan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('plan')}
                    >
                        Plan Details
                    </button>
                </div>

                <div className="company-profile-tab-content">
                    {activeTab === 'users' ? (
                        <div className="profile-panel users-panel">
                            <div className="panel-header">
                                <div className="panel-title">Users of this Company</div>
                                <span className="user-count">{users.length} Users</span>
                            </div>
                            <div className="panel-body">
                                {loading ? (
                                    <PageSkeleton />
                                ) : users.length > 0 ? (
                                    <div className="table-wrapper">
                                        <table className="panel-table">
                                            <thead>
                                                <tr>
                                                    <th>NAME</th>
                                                    <th>MOBILE</th>
                                                    <th>EMAIL</th>
                                                    <th>ROLE</th>
                                                    <th>PERMISSION</th>
                                                    <th>STATUS</th>
                                                    <th>ACTION</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map(user => (
                                                    <tr key={user._id}>
                                                        <td>
                                                            <div className="user-cell">
                                                                {user.userProfile ? (
                                                                    <img src={user.userProfile} alt="" className="user-avatar" />
                                                                ) : (
                                                                    <div className="user-avatar-placeholder">
                                                                        {user.userName?.charAt(0)}
                                                                    </div>
                                                                )}
                                                                <span>{user.userName}</span>
                                                            </div>
                                                        </td>
                                                        <td>{user.userMobileNumber}</td>
                                                        <td>{user.userEmail}</td>
                                                        <td>
                                                            <span className={`role-badge ${user.role?.toLowerCase().replace(' ', '_')}`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span
                                                                onClick={() => {
                                                                    if (!currentUserRole || currentUserRole === 'USER') {
                                                                        toast.error('You do not have access to permissions');
                                                                        return;
                                                                    }
                                                                    onPermissions && onPermissions(user);
                                                                }}
                                                                style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                                            >
                                                                Permissions
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`status-indicator ${user.userStatus === 1 ? 'active' : 'inactive'}`}>
                                                                {user.userStatus === 1 ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="profile-action-icons">
                                                                {onChat && (currentUserRole === 'SUPER_ADMIN' ? user.role === 'ADMIN' : (user._id || user.id) !== currentUserId) ? (
                                                                    <button
                                                                        type="button"
                                                                        className="profile-icon-btn"
                                                                        title="Chat"
                                                                        onClick={() => onChat(user)}
                                                                    >
                                                                        <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                                                        </svg>
                                                                    </button>
                                                                ) : (
                                                                    <div className="profile-icon-placeholder" />
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    className="profile-icon-btn"
                                                                    title="Edit"
                                                                    onClick={() => onEditUser && onEditUser(user)}
                                                                >
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="profile-icon-btn"
                                                                    title="Delete"
                                                                    onClick={() => handleDeleteUser(user._id)}
                                                                >
                                                                    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="panel-empty">No users found for this company.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="profile-panel plan-panel">
                            <div className="panel-header">
                                <div className="panel-title">Subscription & Plan Details</div>
                            </div>
                            <div className="panel-body">
                                <div className="plan-summary-grid">
                                    <div className="plan-summary-card">
                                        <div className="plan-icon">💎</div>
                                        <div className="plan-info">
                                            <div className="plan-name">{company.planName || 'No Active Plan'}</div>
                                            <div className="plan-duration">{company.planDurationDays || 0} Days Plan</div>
                                        </div>
                                    </div>

                                    <div className="details-list-card">
                                        <div className="detail-item">
                                            <span className="detail-label">Plan Price</span>
                                            <span className="detail-value">₹{company.planPrice || 0}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Discount</span>
                                            <span className="detail-value" style={{ color: '#1e3a8a' }}>{company.planDiscount || 0}%</span>
                                        </div>
                                        {company.couponCode && (
                                            <div className="detail-item">
                                                <span className="detail-label">Coupon code <span style={{ fontSize: '10px', verticalAlign: 'middle', color: '#16a34a' }}>(Applied)</span></span>
                                                <span className="detail-value" style={{ color: '#1e3a8a', fontWeight: 'bold' }}>{company.couponCode}</span>
                                            </div>
                                        )}
                                        {company.couponDiscountAmount > 0 && (
                                            <div className="detail-item">
                                                <span className="detail-label">Coupon Discount</span>
                                                <span className="detail-value" style={{ color: '#16a34a' }}>- ₹{company.couponDiscountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="detail-item" style={{ borderTop: '1px solid #e5e7eb', marginTop: '4px', paddingTop: '8px' }}>
                                            <span className="detail-label" style={{ fontWeight: '700' }}>Paid Amount</span>
                                            <span className="detail-value" style={{ color: '#059669', fontSize: '18px', fontWeight: '700' }}>
                                                ₹{company.finalPrice || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="details-list-card">
                                        <div className="detail-item">
                                            <span className="detail-label">Start Date</span>
                                            <span className="detail-value">{formatDate(company.planStartDate)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Expiry Date</span>
                                            <span className="detail-value">{formatDate(company.planExpiryDate)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Status</span>
                                            <span className="detail-value">
                                                {(() => {
                                                    if (!company.planExpiryDate) return <span className="status-expired">Inactive</span>;
                                                    const now = new Date();
                                                    const expiry = new Date(company.planExpiryDate);
                                                    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

                                                    if (diffDays <= 0) return <span className="status-expired">Expired</span>;
                                                    if (diffDays <= 10) return <span className="status-warning">Expiring Soon ({diffDays}d)</span>;
                                                    return <span className="status-active">Active ({diffDays} days left)</span>;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="company-info-section">
                                    <h4 className="section-title">Company Information</h4>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">Contact Person</span>
                                            <span className="info-value">{company.companyPersonName}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">GST Number</span>
                                            <span className="info-value">{company.companyGstNumber || '—'}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">PAN Number</span>
                                            <span className="info-value">{company.companyPanCardNumber || '—'}</span>
                                        </div>
                                        <div className="info-item full-width">
                                            <span className="info-label">Address</span>
                                            <span className="info-value">{company.companyAddress}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompanyProfile;

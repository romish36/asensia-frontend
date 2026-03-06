import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/UserForm.css';
import API_BASE_URL from '../config/apiConfig.js';
import AirDatePicker from '../components/ui/AirDatePicker';


const UserForm = ({ isOpen, onClose, user, isPage }) => {
    const [formData, setFormData] = useState({
        userName: '',
        userMobileNumber: '',
        userEmail: '',
        userPassword: '',
        userBirthdayDate: '',
        userStatus: 1, // Default Active
        userProfile: '', // Base64 String
        companyId: '',
        role: 'USER' // Default role
    });

    const [companies, setCompanies] = useState([]); // List for Dropdown

    useEffect(() => {
        // Fetch Companies for Dropdown
        const fetchCompanies = async () => {
            try {
                const storedUser = JSON.parse(sessionStorage.getItem('user'));
                const token = sessionStorage.getItem('token');

                // If Super Admin, fetch all. If Admin, fetch own.
                // We try fetching all first. If 403, we fall back to own.
                // Actually, api/company is protected. 
                // Let's rely on role or just try-catch.

                let companyList = [];

                if (storedUser.role === 'SUPER_ADMIN') {
                    const response = await fetch(`${API_BASE_URL}/company`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        companyList = await response.json();
                    }
                } else if (storedUser.companyId) {
                    const response = await fetch(`${API_BASE_URL}/company`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const myCompany = await response.json();
                        companyList = [myCompany];
                    }
                }

                setCompanies(companyList);

                // Auto-select if only 1 option (Regular Admin)
                if (companyList.length === 1 && !formData.companyId) {
                    setFormData(prev => ({ ...prev, companyId: companyList[0]._id }));
                }

            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        };
        fetchCompanies();
    }, []); // Run once

    useEffect(() => {
        if (user) {
            setFormData({
                userName: user.userName || '',
                userMobileNumber: user.userMobileNumber || '',
                userEmail: user.userEmail || '',
                userPassword: '',
                userBirthdayDate: user.userBirthdayDate || '',
                userStatus: user.userStatus !== undefined ? user.userStatus : 1,
                userProfile: user.userProfile || '',
                companyId: user.companyId || '',
                role: user.role || 'USER'
            });
        } else {
            // Reset logic...
            // Check if we need to preserve companyId if it was auto-set by the other effect?
            // We'll reset it to empty or first option if exists.
            setFormData(prev => ({
                userName: '',
                userMobileNumber: '',
                userEmail: '',
                userPassword: '',
                userBirthdayDate: '',
                userStatus: 1,
                userProfile: '',
                companyId: companies.length === 1 ? companies[0]._id : '',
                role: 'USER'
            }));
        }
    }, [user, isOpen, companies.length]);

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
                const file = files[0];
                const maxSize = 2500 * 1024; // 2500 KB in bytes

                if (file.size > maxSize) {
                    toast.error("image is too large");
                    e.target.value = ''; // Reset input
                    return;
                }

                try {
                    const base64 = await convertToBase64(file);
                    setFormData(prev => ({ ...prev, [name]: base64 }));
                } catch (error) {
                    toast.error("Error processing file");
                }
            }
        } else {
            // Handle Status Number conversion
            if (name === 'userStatus') {
                setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.userName || !formData.userEmail) {
            toast.error("Name and Email are required");
            return;
        }

        // Require password for new users
        if (!user && !formData.userPassword) {
            toast.error("Password is required for new users");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const url = user ? `${API_BASE_URL}/users/${user._id}` : `${API_BASE_URL}/users`;

            const method = user ? 'PUT' : 'POST';

            // Clean up payload (remove empty password on edit)
            const payload = { ...formData };
            if (!payload.userPassword) delete payload.userPassword;

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(user ? "User Updated Successfully" : "User Added Successfully");
                onClose();
            } else {
                toast.error(data.message || 'Failed to save user');
            }
        } catch (error) {
            console.error("Error saving user:", error);
            toast.error("Server error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{user ? 'Update User' : 'Add User'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="user-form-body">
                    <form onSubmit={handleSubmit}>
                        <div className="user-grid">
                            {/* Row 0: Company Info & Role (SUPER_ADMIN only) */}
                            {JSON.parse(sessionStorage.getItem('user'))?.role === 'SUPER_ADMIN' && (
                                <>
                                    <div className="user-field">
                                        <label>Company Name</label>
                                        <select
                                            name="companyId"
                                            value={formData.companyId}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Company</option>
                                            {companies.map(comp => (
                                                <option key={comp._id} value={comp._id}>
                                                    {comp.companyName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="user-field">
                                        <label>Role</label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Row 1 */}
                            <div className="user-field">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="userName"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    placeholder="Enter Name"
                                    required
                                />
                            </div>
                            <div className="user-field">
                                <label>Mobile Number</label>
                                <input
                                    type="text"
                                    name="userMobileNumber"
                                    value={formData.userMobileNumber}
                                    onChange={handleChange}
                                    placeholder="Enter Mobile Number"
                                />
                            </div>

                            {/* Row 2 */}
                            <div className="user-field">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="userEmail"
                                    value={formData.userEmail}
                                    onChange={handleChange}
                                    placeholder="Enter Email"
                                    required
                                />
                            </div>
                            <div className="user-field">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="userPassword"
                                    value={formData.userPassword}
                                    onChange={handleChange}
                                    placeholder={user ? "Leave blank to keep current" : "Enter Password"}
                                />
                            </div>

                            {/* Row 3 */}
                            <div className="user-field">
                                <label>Birthday Date</label>
                                <AirDatePicker
                                    value={formData.userBirthdayDate}
                                    onChange={(val) => setFormData(prev => ({ ...prev, userBirthdayDate: val }))}
                                    placeholder="Select Birthday"
                                />
                            </div>
                            <div className="user-field">
                                <label>Status</label>
                                <select
                                    name="userStatus"
                                    value={formData.userStatus}
                                    onChange={handleChange}
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>

                            {/* Row 4 */}
                            <div className="user-field full-width">
                                <label>User Profile</label>
                                <div className="file-input-wrapper">
                                    <input
                                        type="file"
                                        name="userProfile"
                                        onChange={handleChange} // Calls base64 converter
                                        accept="image/*"
                                    />
                                </div>
                                {formData.userProfile && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img src={formData.userProfile} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="user-form-actions">
                            <button type="submit" className="btn-submit">Submit</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserForm;

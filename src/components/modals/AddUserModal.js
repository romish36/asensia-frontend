import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../../styles/AddUserModal.css';
import AirDatePicker from '../ui/AirDatePicker';

function AddUserModal({ isOpen, onClose }) {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        status: 'Inactive', // Default screenshot shows Inactive? Or Active. Screenshot shows Inactive selected.
        birthday: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('User Form Submitted:', formData);
        toast.success('User added successfully!');
        // Reset and close
        setFormData({
            name: '',
            mobile: '',
            email: '',
            password: '',
            status: 'Inactive',
            birthday: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-user-modal-overlay" onClick={onClose}>
            <div className="add-user-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="add-user-close-icon" onClick={onClose}>✕</button>

                <h2 className="add-user-title">Add User</h2>

                <form className="add-user-form" onSubmit={handleSubmit}>
                    {/* Row 1 */}
                    <div className="add-user-row">
                        <div className="add-user-field">
                            <label className="add-user-label">Name</label>
                            <input
                                className="add-user-input"
                                placeholder="Enter name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="add-user-field">
                            <label className="add-user-label">Mobile Number</label>
                            <input
                                className="add-user-input"
                                placeholder="Enter Mobile Number"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="add-user-row">
                        <div className="add-user-field">
                            <label className="add-user-label">Email</label>
                            <input
                                className="add-user-input"
                                placeholder="Enter email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="add-user-field">
                            <label className="add-user-label">Password</label>
                            <input
                                className="add-user-input"
                                type={showPassword ? "text" : "password"}
                                placeholder=".........."
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <span
                                className="add-user-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    /* Eye Open Icon */
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (
                                    /* Eye Off Icon (crossed out) */
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="add-user-row">
                        <div className="add-user-field">
                            <label className="add-user-label">Status</label>
                            <select
                                className="add-user-select"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="add-user-field">
                            <label className="add-user-label">Birthday Date</label>
                            <AirDatePicker
                                className="add-user-input"
                                value={formData.birthday}
                                onChange={(val) => setFormData(prev => ({ ...prev, birthday: val }))}
                                placeholder="Select Birthday"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="add-user-actions">
                        <button type="button" className="add-user-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-user-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddUserModal;

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/ColorForm.css';
import API_BASE_URL from '../config/apiConfig.js';


const ColorForm = ({ isOpen, onClose, color, isPage }) => {
    const [name, setName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (color) {
            setName(color.colorName || '');
            setCompanyId(color.companyId || '');
        } else {
            setName('');
            setCompanyId('');
        }
    }, [color]);

    useEffect(() => {
        if (isSuperAdmin && isOpen) {
            fetchCompanies();
        }
    }, [isSuperAdmin, isOpen]);

    const fetchCompanies = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/company`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCompanies(data);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Color Name is required");
            return;
        }

        if (isSuperAdmin && !color && !companyId) {
            toast.error("Company selection is required");
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const url = color ? `${API_BASE_URL}/color/${color._id || color.id}` : `${API_BASE_URL}/color`;

            const method = color ? 'PUT' : 'POST';

            const payload = {
                colorName: trimmedName,
                ...(isSuperAdmin && !color && { companyId })
            };

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
                toast.success(color ? "Color Updated Successfully" : "Color Added Successfully");
                onClose();
            } else {
                toast.error(data.message || "Failed to save color");
            }
        } catch (error) {
            console.error("Error saving color:", error);
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{color ? 'Update Color' : 'Add Color'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="color-form-body">
                    <form onSubmit={handleSubmit}>
                        <div className="color-grid">
                            {!color && isSuperAdmin && (
                                <div className="color-field">
                                    <label>SELECT COMPANY</label>
                                    <select
                                        value={companyId}
                                        onChange={(e) => setCompanyId(e.target.value)}
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
                            )}
                            <div className="color-field">
                                <label>NAME</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter color name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="color-form-actions">
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? "Saving..." : "Submit"}
                            </button>
                            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ColorForm;


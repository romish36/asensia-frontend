import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/SaleTypeForm.css';
import API_BASE_URL from '../config/apiConfig.js';


const SaleTypeForm = ({ isOpen, onClose, saleType, isPage }) => {
    const [formData, setFormData] = useState({
        name: '',
        tax1: '',
        tax2: '',
        companyId: ''
    });
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (saleType) {
            setFormData({
                name: saleType.saleTypeName || '',
                tax1: (saleType.saleTypeTax1 || '').replace('%', ''),
                tax2: (saleType.saleTypeTax2 || '').replace('%', ''),
                companyId: saleType.companyId || ''
            });
        } else {
            setFormData({ name: '', tax1: '', tax2: '', companyId: '' });
        }
    }, [saleType]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            toast.error("Name is required");
            return;
        }

        if (isSuperAdmin && !saleType && !formData.companyId) {
            toast.error("Company selection is required");
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const url = saleType ? `${API_BASE_URL}/sale-type/${saleType._id || saleType.id}` : `${API_BASE_URL}/sale-type`;

            const method = saleType ? 'PUT' : 'POST';

            const payload = {
                saleTypeName: trimmedName,
                saleTypeTax1: formData.tax1,
                saleTypeTax2: formData.tax2,
                ...(isSuperAdmin && !saleType && { companyId: formData.companyId })
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
                toast.success(saleType ? "Sale Type Updated Successfully" : "Sale Type Added Successfully");
                onClose();
            } else {
                toast.error(data.message || "Failed to save sale type");
            }
        } catch (error) {
            console.error("Error saving sale type:", error);
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
                    <h2 className="modal-title">{saleType ? 'Update Sale Type' : 'Add Sale Type'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="saletype-form-body">
                    <form onSubmit={handleSubmit}>
                        <div className="saletype-grid">
                            {!saleType && isSuperAdmin && (
                                <div className="saletype-field">
                                    <label>SELECT COMPANY</label>
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
                            )}
                            <div className="saletype-field">
                                <label>NAME</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            <div className="saletype-field">
                                <label>Tax 1 (%)</label>
                                <input
                                    type="text"
                                    name="tax1"
                                    value={formData.tax1}
                                    onChange={handleChange}
                                    placeholder="Enter tax percentage"
                                />
                                <span className="helper-text error">Enter numbers only. Do not use % symbol.</span>
                            </div>

                            <div className="saletype-field">
                                <label>Tax 2 (%)</label>
                                <input
                                    type="text"
                                    name="tax2"
                                    value={formData.tax2}
                                    onChange={handleChange}
                                    placeholder="Enter tax percentage"
                                />
                                <span className="helper-text secondary">Applicable Only For Local Customers</span>
                            </div>
                        </div>

                        <div className="saletype-form-actions">
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

export default SaleTypeForm;


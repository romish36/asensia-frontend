import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/CustomerTypeForm.css';
import fetchApi from '../utils/api.js';

const CustomerTypeForm = ({ isOpen, onClose, customerType, isPage }) => {
    const [name, setName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState([]);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            if (user.role === 'SUPER_ADMIN') {
                fetchCompanies();
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (customerType) {
            setName(customerType.customerTypeName || '');
            setCompanyId(customerType.companyId || '');
        } else {
            setName('');
            setCompanyId('');
        }
    }, [customerType]);

    const fetchCompanies = async () => {
        try {
            const data = await fetchApi('/company');
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Name is required");
            return;
        }

        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        if (isSuperAdmin && !companyId && !customerType) {
            toast.error("Please select a company");
            return;
        }

        try {
            const endpoint = customerType
                ? `/customer-type/${customerType._id || customerType.id}`
                : '/customer-type';
            const method = customerType ? 'PUT' : 'POST';

            const payload = { customerTypeName: trimmedName };
            if (isSuperAdmin && !customerType) {
                payload.companyId = companyId;
            }

            await fetchApi(endpoint, {
                method,
                body: JSON.stringify(payload)
            });

            toast.success(customerType ? "Customer Type Updated Successfully" : "Customer Type Added Successfully");
            onClose();
        } catch (error) {
            console.error("Submit error:", error);
            toast.error(error.message || "Operation failed");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{customerType ? 'Update Customer Type' : 'Add Customer Type'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="customertype-form-body">
                    <form onSubmit={handleSubmit}>
                        <div className="customertype-grid">
                            {userRole === 'SUPER_ADMIN' && !customerType && (
                                <div className="customertype-field">
                                    <label>COMPANY <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        value={companyId}
                                        onChange={(e) => setCompanyId(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => (
                                            <option key={c._id} value={c._id}>
                                                {c.companyName || c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="customertype-field">
                                <label>NAME</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter Customer Type Name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="customertype-form-actions">
                            <button type="submit" className="btn-submit">Submit</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerTypeForm;

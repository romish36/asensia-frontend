import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/InvoiceNameForm.css';
import fetchApi from '../utils/api.js';

const InvoiceNameForm = ({ isOpen, onClose, invoiceName, isPage }) => {
    const [name, setName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState([]);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserRole(user.role);
            if (user.role === 'SUPER_ADMIN' && isOpen) {
                fetchCompanies();
            }
        }
    }, [isOpen]);

    useEffect(() => {
        if (invoiceName) {
            setName(invoiceName.invoiceShortName || '');
            setCompanyId(invoiceName.companyId?._id || invoiceName.companyId || '');
        } else {
            setName('');
            setCompanyId('');
        }
    }, [invoiceName]);

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
        if (isSuperAdmin && !invoiceName && !companyId) {
            toast.error("Company selection is required");
            return;
        }

        try {
            const endpoint = invoiceName
                ? `/invoice-name/${invoiceName._id || invoiceName.id}`
                : '/invoice-name';
            const method = invoiceName ? 'PUT' : 'POST';

            const payload = {
                invoiceShortName: trimmedName,
                ...(isSuperAdmin && !invoiceName && { companyId })
            };

            await fetchApi(endpoint, {
                method,
                body: JSON.stringify(payload)
            });

            toast.success(invoiceName ? "Invoice Name Updated Successfully" : "Invoice Name Added Successfully");
            onClose();
        } catch (error) {
            console.error('Save Error:', error);
            toast.error(error.message || "Failed to save");
        }
    };

    const handleKeyDown = (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
            const form = e.target.form;
            if (!form) return;
            const index = Array.prototype.indexOf.call(form, e.target);

            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                if (e.key === 'Enter' && e.target.tagName === 'BUTTON') return;
                e.preventDefault();
                const next = form.elements[index + 1];
                if (next && next.tagName !== 'BUTTON') {
                    next.focus();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = form.elements[index - 1];
                if (prev) prev.focus();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{invoiceName ? 'Update Invoice Name' : 'Add Invoice Name'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="invoice-name-form-body">
                    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                        <div className="invoice-name-grid">
                            {!invoiceName && userRole === 'SUPER_ADMIN' && (
                                <div className="invoice-name-field">
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
                            <div className="invoice-name-field">
                                <label>NAME</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="invoice-name-form-actions">
                            <button type="submit" className="btn-submit">Submit</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InvoiceNameForm;

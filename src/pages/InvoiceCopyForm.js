import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import fetchApi from '../utils/api.js';

const InvoiceCopyForm = ({ isOpen, onClose, copy, isPage }) => {
    const [name, setName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (copy) {
            setName(copy.invoiceCopyName || '');
            setCompanyId(copy.companyId?._id || copy.companyId || '');
        } else {
            setName('');
            setCompanyId('');
        }
    }, [copy]);

    useEffect(() => {
        if (isSuperAdmin && isOpen) {
            fetchCompanies();
        }
    }, [isSuperAdmin, isOpen]);

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
            toast.error("Copy Name is required");
            return;
        }

        if (isSuperAdmin && !copy && !companyId) {
            toast.error("Company selection is required");
            return;
        }

        setLoading(true);
        try {
            const url = copy ? `/invoice-copy/${copy._id}` : '/invoice-copy';
            const method = copy ? 'PUT' : 'POST';

            const payload = {
                invoiceCopyName: trimmedName,
                ...(isSuperAdmin && !copy && { companyId })
            };

            await fetchApi(url, {
                method: method,
                body: JSON.stringify(payload)
            });

            toast.success(copy ? "Updated Successfully" : "Added Successfully");
            onClose();
        } catch (error) {
            console.error("Error saving invoice copy:", error);
            toast.error(error.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{copy ? 'Update Invoice Copy' : 'Add Invoice Copy'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            {!copy && isSuperAdmin && (
                                <div className="form-field">
                                    <label>SELECT COMPANY</label>
                                    <select
                                        value={companyId}
                                        onChange={(e) => setCompanyId(e.target.value)}
                                        required
                                        className="form-control"
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
                            <div className="form-field">
                                <label>INVOICE COPY NAME</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter copy name"
                                    required
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
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

export default InvoiceCopyForm;

import React, { useState, useEffect } from 'react';
import '../../styles/AddGradeModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';
import fetchApi from '../../utils/api.js';

function AddGradeModal({ isOpen, onClose, isPage }) {
    const [gradeName, setGradeName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companies, setCompanies] = useState([]);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) {
            setUserRole(user.role);
            if (user.role === 'SUPER_ADMIN') {
                fetchCompanies();
            }
        }
    }, [isOpen]);

    const fetchCompanies = async () => {
        try {
            const data = await fetchApi('/company');
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
            // toast.error("Failed to load companies");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = gradeName.trim();

        if (!trimmedName) {
            toast.error("Grade name cannot be empty");
            return;
        }

        if (userRole === 'SUPER_ADMIN' && !companyId) {
            toast.error("Please select a company");
            return;
        }

        try {
            const payload = { gradeName: trimmedName };
            if (userRole === 'SUPER_ADMIN') {
                payload.companyId = companyId;
            }

            await fetchApi('/grade', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success('Grade added successfully!');
            setGradeName('');
            setCompanyId('');
            onClose();
        } catch (error) {
            console.error('Error adding grade:', error);
            toast.error(error.message || 'Failed to add grade');
        }
    };

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-grade-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <>
                    <button className="add-grade-close-icon" onClick={onClose}>✕</button>
                    <h2 className="add-grade-title">Add Grade</h2>
                </>
            )}
            {isPage && <div className="page-card__title">Add Grade</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-grade-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    {userRole === 'SUPER_ADMIN' && (
                        <div className="add-grade-field">
                            <label className="add-grade-label">Company <span style={{ color: 'red' }}>*</span></label>
                            <select
                                className="add-grade-input"
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
                                required
                            >
                                <option value="">Select Company</option>
                                {companies.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.companyName || c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="add-grade-field">
                        <label className="add-grade-label">Grade Name <span style={{ color: 'red' }}>*</span></label>
                        <input
                            className="add-grade-input"
                            placeholder="Enter grade name"
                            value={gradeName}
                            onChange={(e) => setGradeName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="add-grade-actions">
                        <button type="button" className="add-grade-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-grade-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="add-grade-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default AddGradeModal;

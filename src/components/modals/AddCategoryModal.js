import React, { useState, useEffect } from 'react';
import '../../styles/AddCategoryModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';


function AddCategoryModal({ isOpen, onClose, isPage }) {
    const [categoryName, setCategoryName] = useState('');
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
    }, []);

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
        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            toast.error("Category name cannot be empty");
            return;
        }

        if (userRole === 'SUPER_ADMIN' && !companyId) {
            toast.error("Please select a company");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const payload = { categoryName: trimmedName };
            if (userRole === 'SUPER_ADMIN') {
                payload.companyId = companyId;
            }

            const response = await fetch(`${API_BASE_URL}/category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Category added successfully!');
                setCategoryName('');
                setCompanyId('');
                onClose();
            } else {
                toast.error(data.message || 'Failed to add category');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Server error');
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

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-category-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <>
                    <button className="add-category-close-icon" onClick={onClose}>✕</button>
                    <h2 className="add-category-title">Add Category</h2>
                </>
            )}
            {isPage && <div className="page-card__title">Add Category</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-category-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}} onKeyDown={handleKeyDown}>
                    {userRole === 'SUPER_ADMIN' && (
                        <div className="add-category-field">
                            <label className="add-category-label">Company <span style={{ color: 'red' }}>*</span></label>
                            <select
                                className="add-category-input"
                                value={companyId}
                                onChange={(e) => setCompanyId(e.target.value)}
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

                    <div className="add-category-field">
                        <label className="add-category-label">Category Name <span style={{ color: 'red' }}>*</span></label>
                        <input
                            className="add-category-input"
                            placeholder="Enter Category"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                        />
                    </div>

                    <div className="add-category-actions">
                        <button type="button" className="add-category-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-category-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="add-category-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default AddCategoryModal;

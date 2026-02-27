import React, { useState, useEffect } from 'react';
import '../../styles/EditCategoryModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';


const EditCategoryModal = ({ isOpen, onClose, category, isPage }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (category) {
            setName(category.categoryName || category.name || '');
        }
    }, [category]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Category name cannot be empty");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            // Support both _id (backend) and legacy id if any
            const id = category._id || category.id;

            const response = await fetch(`${API_BASE_URL}/category/${category._id || category.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ categoryName: trimmedName })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Category Updated Successfully!");
                onClose();
            } else {
                toast.error(data.message || 'Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
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
    if (isPage && !category) return null; // Prevent crash on refresh

    const formContent = (
        <div className={isPage ? "page-card" : "edit-category-modal"} onClick={e => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="edit-category-header">
                    <h3 className="edit-category-title">Update Category</h3>
                    <button className="edit-category-close" onClick={onClose}>&times;</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Update Category</div>}

            <div className={isPage ? "page-card__body" : "edit-category-body"}>
                <form onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}} onKeyDown={handleKeyDown}>
                    {/* Add ID display if needed, user asked for ID and Name. ID is usually auto-generated/immutable so just display it? */}
                    {(category.categoryId || category.id) && (
                        <div className="edit-category-form-group">
                            <label className="edit-category-label">Category ID</label>
                            <input
                                type="text"
                                className="edit-category-input"
                                value={category.categoryId || category.id}
                                disabled
                                style={{ backgroundColor: '#f0f0f0' }}
                            />
                        </div>
                    )}

                    <div className="edit-category-form-group">
                        <label className="edit-category-label">Category Name</label>
                        <input
                            type="text"
                            className="edit-category-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="edit-category-actions">
                        <button type="button" className="btn-category-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-category-update">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="edit-category-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default EditCategoryModal;

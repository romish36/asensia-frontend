import React, { useState, useEffect } from 'react';
import '../../styles/AddGradeModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';


function EditGradeModal({ isOpen, onClose, grade, isPage }) {
    const [gradeName, setGradeName] = useState('');

    useEffect(() => {
        if (grade) {
            setGradeName(grade.gradeName || '');
        }
    }, [grade]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = gradeName.trim();
        if (!trimmedName) {
            toast.error("Grade name cannot be empty");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/grade/${grade._id || grade.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ gradeName: trimmedName })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Grade updated successfully!");
                onClose();
            } else {
                toast.error(data.message || "Failed to update grade");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Server error");
        }
    };

    if (!isOpen && !isPage) return null;
    if (isPage && !grade) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-grade-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <>
                    <button className="add-grade-close-icon" onClick={onClose}>✕</button>
                    <h2 className="add-grade-title">Update Grade</h2>
                </>
            )}
            {isPage && <div className="page-card__title">Update Grade</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-grade-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    <div className="add-grade-field">
                        <label className="add-grade-label">Grade Name</label>
                        <input
                            className="add-grade-input"
                            placeholder="Enter grade name"
                            value={gradeName}
                            onChange={(e) => setGradeName(e.target.value)}
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

export default EditGradeModal;

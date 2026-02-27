import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/ExpensesPurposeForm.css';

const ExpensesPurposeForm = ({ isOpen, onClose, expensesPurpose, isPage, existingPurposes, onAdd, onUpdate }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (expensesPurpose) {
            setName(expensesPurpose.name || '');
        } else {
            setName('');
        }
    }, [expensesPurpose]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Expenses Purpose Name is required");
            return;
        }

        if (existingPurposes) {
            const isDuplicate = existingPurposes.some(item =>
                (!expensesPurpose || item.id !== expensesPurpose.id) &&
                item.name.toLowerCase() === trimmedName.toLowerCase()
            );
            if (isDuplicate) {
                toast.error("This expenses purpose is already exist");
                return;
            }
        }

        if (expensesPurpose) {
            if (onUpdate) onUpdate({ ...expensesPurpose, name: trimmedName });
            toast.success("Expenses Purpose Updated Successfully");
        } else {
            if (onAdd) onAdd(trimmedName);
            toast.success("Expenses Purpose Added Successfully");
        }
        onClose();
    };

    if (!isOpen) return null;
    if (isPage && !expensesPurpose && !onAdd) return null; // Prevent crash on refresh for edit mode

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{expensesPurpose ? 'Update Expenses Purpose' : 'Add Expenses Purpose'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="expenses-purpose-form-body">
                    <form onSubmit={handleSubmit}>
                        <div className="expenses-purpose-grid">
                            <div className="expenses-purpose-field">
                                <label>NAME</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter expenses purpose name"
                                />
                            </div>
                        </div>

                        <div className="expenses-purpose-form-actions">
                            <button type="submit" className="btn-submit">Submit</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExpensesPurposeForm;

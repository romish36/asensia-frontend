import React, { useState } from 'react';
import '../../styles/AddExpensesPurposeModal.css';

function AddExpensesPurposeModal({ isOpen, onClose }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Expenses Purpose Added:', name);
        alert('Expenses Purpose added successfully!');
        setName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-expenses-purpose-modal-overlay" onClick={onClose}>
            <div className="add-expenses-purpose-modal" onClick={(e) => e.stopPropagation()}>
                <button className="add-expenses-purpose-close" onClick={onClose}>✕</button>

                <h2 className="add-expenses-purpose-title">Add Expenses Purpose</h2>

                <form className="add-expenses-purpose-form" onSubmit={handleSubmit}>
                    <div className="add-expenses-purpose-field">
                        <label className="add-expenses-purpose-label">NAME</label>
                        <input
                            className="add-expenses-purpose-input"
                            type="text"
                            placeholder="Enter name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="add-expenses-purpose-actions">
                        <button type="button" className="add-expenses-purpose-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-expenses-purpose-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddExpensesPurposeModal;

import React, { useState } from 'react';
import '../../styles/AddCustomerTypeModal.css';

function AddCustomerTypeModal({ isOpen, onClose }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Customer Type Submitted:', name);
        alert('Customer Type added successfully!');
        setName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-customertype-modal-overlay" onClick={onClose}>
            <div className="add-customertype-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="add-customertype-close-icon" onClick={onClose}>✕</button>

                <h2 className="add-customertype-title">Add Customer Type</h2>

                <form onSubmit={handleSubmit}>
                    <div className="add-customertype-field">
                        <label className="add-customertype-label">NAME</label>
                        <input
                            className="add-customertype-input"
                            placeholder="Enter name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="add-customertype-actions">
                        <button type="button" className="add-customertype-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-customertype-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddCustomerTypeModal;

import React, { useState } from 'react';
import '../../styles/AddInvoiceNameModal.css';

function AddInvoiceNameModal({ isOpen, onClose }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Invoice Name Form Submitted:', name);
        alert('Invoice Name added successfully!');
        setName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-invoicename-modal-overlay" onClick={onClose}>
            <div className="add-invoicename-modal" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="add-invoicename-close-icon" onClick={onClose}>✕</button>

                <h2 className="add-invoicename-title">Add Invoice Name</h2>

                <form onSubmit={handleSubmit}>
                    <div className="add-invoicename-field">
                        <label className="add-invoicename-label">NAME</label>
                        <input
                            className="add-invoicename-input"
                            placeholder="Enter name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="add-invoicename-actions">
                        <button type="button" className="add-invoicename-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-invoicename-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddInvoiceNameModal;

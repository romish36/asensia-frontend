import React, { useState } from 'react';
import '../../styles/AddColorModal.css';

function AddColorModal({ isOpen, onClose }) {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Color Added:', name);
        alert('Color added successfully!');
        setName('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-color-modal-overlay" onClick={onClose}>
            <div className="add-color-modal" onClick={(e) => e.stopPropagation()}>
                <button className="add-color-close" onClick={onClose}>✕</button>

                <h2 className="add-color-title">Add Color</h2>

                <form className="add-color-form" onSubmit={handleSubmit}>
                    <div className="add-color-field">
                        <label className="add-color-label">NAME</label>
                        <input
                            className="add-color-input"
                            type="text"
                            placeholder="Enter name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="add-color-actions">
                        <button type="button" className="add-color-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-color-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddColorModal;

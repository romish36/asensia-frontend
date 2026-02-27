import React, { useState } from 'react';
import '../../styles/AddSaleTypeModal.css';

function AddSaleTypeModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        tax1: '',
        tax2: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Sale Type Data:', formData);
        alert('Sale Type Added Successfully (Mock)!');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="add-saletype-modal-overlay" onClick={onClose}>
            <div className="add-saletype-modal" onClick={(e) => e.stopPropagation()}>
                <button className="add-saletype-close" onClick={onClose}>✕</button>

                <h2 className="add-saletype-title">Add Sale Type</h2>

                <form className="add-saletype-form" onSubmit={handleSubmit}>
                    <div className="add-saletype-row">
                        <div className="add-saletype-field">
                            <label className="add-saletype-label">Name</label>
                            <input
                                className="add-saletype-input"
                                type="text"
                                placeholder="Enter Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-saletype-field">
                            <label className="add-saletype-label">Tax (%)</label>
                            <input
                                className="add-saletype-input"
                                type="text"
                                placeholder="0"
                                name="tax1"
                                value={formData.tax1}
                                onChange={handleChange}
                            />
                            <span className="add-saletype-helper-text">
                                Enter numbers only. Do not use % symbol.
                            </span>
                        </div>

                        <div className="add-saletype-field">
                            <label className="add-saletype-label">Tax (%)</label>
                            <input
                                className="add-saletype-input"
                                type="text"
                                placeholder="0"
                                name="tax2"
                                value={formData.tax2}
                                onChange={handleChange}
                            />
                            <span className="add-saletype-helper-text">
                                Applicable Only For Local Customers
                            </span>
                        </div>
                    </div>

                    <div className="add-saletype-actions">
                        <button type="button" className="add-saletype-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-saletype-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddSaleTypeModal;

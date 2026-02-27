import React, { useState } from 'react';
import '../../styles/modal.css';

function AddStockModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        product: '',
        invoiceNo: '',
        date: new Date().toISOString().split('T')[0],
        inQty: '',
        inPrice: '',
        total: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'inQty' || name === 'inPrice') {
                const qty = parseFloat(name === 'inQty' ? value : prev.inQty) || 0;
                const price = parseFloat(name === 'inPrice' ? value : prev.inPrice) || 0;
                newData.total = (qty * price).toLocaleString();
            }
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Add Stock Submitted:', formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Add Stock</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Product Name</label>
                            <input
                                type="text"
                                name="product"
                                value={formData.product}
                                onChange={handleChange}
                                placeholder="Enter product name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Invoice No</label>
                            <input
                                type="text"
                                name="invoiceNo"
                                value={formData.invoiceNo}
                                onChange={handleChange}
                                placeholder="Enter invoice number"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>In Quantity Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>In Quantity</label>
                                <input
                                    type="number"
                                    name="inQty"
                                    value={formData.inQty}
                                    onChange={handleChange}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>In Price</label>
                                <input
                                    type="number"
                                    name="inPrice"
                                    value={formData.inPrice}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Total Amount</label>
                            <input
                                type="text"
                                name="total"
                                value={formData.total}
                                readOnly
                                placeholder="0.00"
                                className="readonly-input"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-save">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddStockModal;

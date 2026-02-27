import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/apiConfig';
import '../../styles/InvoiceTypeModal.css';

const InvoiceTypeModal = ({ isOpen, onClose, onSubmit }) => {
    const [invoiceType, setInvoiceType] = useState('');
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchInvoiceTypes();
        }
    }, [isOpen]);

    const fetchInvoiceTypes = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/invoice-type`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTypes(response.data);

            if (response.data && response.data.length > 0) {
                setInvoiceType(response.data[0].invoiceTypeName);
            }
        } catch (error) {
            console.error("Error fetching invoice types:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(invoiceType);
        onClose();
    };

    return (
        <div className="invoice-type-modal-overlay">
            <div className="invoice-type-modal-content">
                <button className="invoice-type-close" onClick={onClose}>&times;</button>
                <h2 className="invoice-type-title">Invoice Type</h2>

                <div className="invoice-type-form-group">
                    <label className="invoice-type-label">Invoice Type</label>
                    <select
                        className="invoice-type-select"
                        value={invoiceType}
                        onChange={(e) => setInvoiceType(e.target.value)}
                        disabled={loading}
                    >
                        {loading && <option>Loading...</option>}
                        {!loading && types.length === 0 && <option value="">No types found in DB</option>}
                        {types.map(t => (
                            <option key={t._id} value={t.invoiceTypeName}>
                                {t.invoiceTypeName}
                            </option>
                        ))}
                    </select>
                    <div className="invoice-type-hint">Select the type of invoice.</div>
                </div>

                <div className="invoice-type-actions">
                    <button className="invoice-type-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="invoice-type-btn-submit" onClick={handleSubmit} disabled={loading || types.length === 0}>Submit</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceTypeModal;

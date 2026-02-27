import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/apiConfig';
import '../../styles/InvoiceCopyModal.css';

const InvoiceCopyModal = ({ isOpen, onClose, onSubmit }) => {
    const [copyType, setCopyType] = useState('');
    const [copies, setCopies] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchInvoiceCopies();
        }
    }, [isOpen]);

    const fetchInvoiceCopies = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/invoice-copy`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCopies(response.data);
            if (response.data.length > 0) {
                setCopyType(response.data[0].invoiceCopyName);
            }
        } catch (error) {
            console.error("Error fetching invoice copies:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(copyType);
        onClose();
    };

    return (
        <div className="invoice-copy-modal-overlay">
            <div className="invoice-copy-modal-content">
                <button className="invoice-copy-close" onClick={onClose}>&times;</button>
                <h2 className="invoice-copy-title">Invoice Copy</h2>

                <div className="invoice-copy-form-group">
                    <label className="invoice-copy-label">Invoice Copy Type</label>
                    <select
                        className="invoice-copy-select"
                        value={copyType}
                        onChange={(e) => setCopyType(e.target.value)}
                        disabled={loading}
                    >
                        {loading && <option>Loading...</option>}
                        {!loading && copies.length === 0 && <option value="">No copies found</option>}
                        {copies.map(copy => (
                            <option key={copy._id} value={copy.invoiceCopyName}>
                                {copy.invoiceCopyName}
                            </option>
                        ))}
                    </select>
                    <div className="invoice-copy-hint">Select the copy type for this invoice.</div>
                </div>

                <div className="invoice-copy-actions">
                    <button className="invoice-copy-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="invoice-copy-btn-submit" onClick={handleSubmit} disabled={loading || copies.length === 0}>Submit</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceCopyModal;

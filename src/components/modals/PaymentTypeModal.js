import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/apiConfig';
import '../../styles/PaymentTypeModal.css';

const PaymentTypeModal = ({ isOpen, onClose, onSubmit }) => {
    const [paymentType, setPaymentType] = useState('');
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPaymentTypes();
        }
    }, [isOpen]);

    const fetchPaymentTypes = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/invoice-payment-type`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log("Fetched Payment Types:", response.data);
            setTypes(response.data);

            if (response.data && response.data.length > 0) {
                setPaymentType(response.data[0].invoicePaymentTypeName);
            } else {
                setPaymentType('');
            }
        } catch (error) {
            console.error("Error fetching payment types:", error);
            setPaymentType('');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        onSubmit(paymentType);
        onClose();
    };

    return (
        <div className="payment-type-modal-overlay">
            <div className="payment-type-modal-content">
                <button className="payment-type-close" onClick={onClose}>&times;</button>
                <h2 className="payment-type-title">Payment Type</h2>

                <div className="payment-type-form-group">
                    <label className="payment-type-label">Invoice Payment Type</label>
                    <select
                        className="payment-type-select"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        disabled={loading}
                    >
                        {loading && <option>Loading...</option>}
                        {!loading && types.length === 0 && <option value="">No types found in DB</option>}
                        {types.map(t => (
                            <option key={t._id} value={t.invoicePaymentTypeName}>
                                {t.invoicePaymentTypeName}
                            </option>
                        ))}
                    </select>
                    <div className="payment-type-hint">Select the payment type from database options.</div>
                </div>

                <div className="payment-type-actions">
                    <button className="payment-type-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="payment-type-btn-submit" onClick={handleSubmit} disabled={loading}>Submit</button>
                </div>
            </div>
        </div>
    );
};

export default PaymentTypeModal;

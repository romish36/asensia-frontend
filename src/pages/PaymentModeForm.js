import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/PaymentModeForm.css';
import API_BASE_URL from '../config/apiConfig.js';


const PaymentModeForm = ({ isOpen, onClose, paymentMode, isPage }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (paymentMode) {
            setName(paymentMode.paymentModeName || '');
        } else {
            setName('');
        }
    }, [paymentMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error("Name is required");
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const url = paymentMode ? `${API_BASE_URL}/payment-mode/${paymentMode._id || paymentMode.id}` : `${API_BASE_URL}/payment-mode`;

            const method = paymentMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paymentModeName: trimmedName })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(paymentMode ? "Payment Mode Updated Successfully" : "Payment Mode Added Successfully");
                onClose();
            } else {
                toast.error(data.message || "Failed to save payment mode");
            }
        } catch (error) {
            console.error("Error saving payment mode:", error);
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{paymentMode ? 'Update Payment Mode' : 'Add Payment Mode'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="payment-mode-form-body">
                    <form onSubmit={handleSubmit}>
                        <div className="payment-mode-grid">
                            <div className="payment-mode-field">
                                <label>NAME</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="payment-mode-form-actions">
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? "Saving..." : "Submit"}
                            </button>
                            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentModeForm;


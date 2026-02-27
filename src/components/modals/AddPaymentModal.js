import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';
import fetchApi from '../../utils/api.js';
import '../../styles/AddPaymentModal.css';

const AddPaymentModal = ({ isOpen, onClose, entityName, entityType, entityId, paymentToEdit }) => {
    // autofill current date and time
    const getCurrentDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
    };

    const [formData, setFormData] = useState({
        paymentMode: '',
        paymentDate: '',
        paymentTime: '',
        amount: '',
        remark: '',
        document: null
    });

    const [paymentModes, setPaymentModes] = useState([]);
    const [fileName, setFileName] = useState('No file chosen');

    useEffect(() => {
        const fetchPaymentModes = async () => {
            try {
                const data = await fetchApi('/payment-mode');
                setPaymentModes(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, paymentMode: data[0].paymentModeName }));
                }
            } catch (error) {
                console.error("Error fetching payment modes:", error);
            }
        };
        fetchPaymentModes();
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (paymentToEdit) {
                // Formatting date for input type="date"
                // Assuming paymentToEdit.date is "DD/MM/YYYY" or ISO.
                // If it is from existing display logic, it might be formatted.
                // It is safer to use raw date from backend if possible, or parse it.
                // However, the payment object passed from profile is likely from 'ledger' which has 'date' string.
                // The 'payments' array in profiles has { amount, date, mode, collector, ... }.
                // I need to ensure the profile passes the FULL payment object.

                // Let's assume paymentToEdit has the raw fields or we try to match.
                // To be safe, let's use what we have.
                // Note: The profile page currently maps ledger entries. I will need to update profile page to pass full object too.

                // Construct date for input (YYYY-MM-DD)
                // If the date is already in DD/MM/YYYY (from locale), we need to convert.
                // Ledger date comes from `new Date().toLocaleDateString()`.
                // This is risky for parsing back.
                // Ideally, we should use the `paymentToEdit.date` if it matches YYYY-MM-DD or convert.

                // Prefer paymentDate (business date) over date
                let dateStr = paymentToEdit.paymentDate || paymentToEdit.date || getCurrentDate();
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }

                setFormData({
                    paymentMode: paymentToEdit.mode || paymentToEdit.paymentModeName || '',
                    paymentDate: dateStr,
                    paymentTime: paymentToEdit.time || getCurrentTime(),
                    amount: paymentToEdit.amount || paymentToEdit.paymentAmount || '',
                    remark: paymentToEdit.narration || paymentToEdit.remark || '',
                    document: null
                });
            } else {
                setFormData(prev => ({
                    ...prev,
                    paymentMode: paymentModes.length > 0 ? paymentModes[0].paymentModeName : '',
                    paymentDate: getCurrentDate(),
                    paymentTime: getCurrentTime(),
                    amount: '',
                    remark: '',
                    document: null
                }));
            }
            setFileName('No file chosen');
        }
    }, [isOpen, paymentModes, paymentToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, document: file }));
            setFileName(file.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount) {
            toast.error("Please enter payment amount");
            return;
        }

        try {
            let endpoint = '';
            let payload = {};

            if (entityType === 'Customer') {
                endpoint = '/invoice-payment';
                payload = {
                    customerId: entityId,
                    customerName: entityName,
                    paymentAmount: formData.amount,
                    paymentDate: formData.paymentDate,
                    paymentTime: formData.paymentTime,
                    paymentModeName: formData.paymentMode,
                    remark: formData.remark,
                };
            } else if (entityType === 'Seller') {
                endpoint = '/purchase-order-payment';
                payload = {
                    buyerId: entityId,
                    buyerTradeName: entityName,
                    paymentAmount: formData.amount,
                    paymentDate: formData.paymentDate,
                    paymentTime: formData.paymentTime,
                    paymentModeName: formData.paymentMode,
                    remark: formData.remark,
                };
            } else if (entityType === 'Transporter') {
                endpoint = '/transporter-payment';
                payload = {
                    transporterId: entityId,
                    transporterName: entityName,
                    paymentAmount: formData.amount,
                    paymentDate: formData.paymentDate,
                    paymentTime: formData.paymentTime,
                    paymentModeName: formData.paymentMode,
                    remark: formData.remark,
                };
            }

            if (paymentToEdit) {
                // UPDATE
                if (entityType === 'Customer') endpoint += `/${paymentToEdit.id || paymentToEdit._id}`;
                else if (entityType === 'Seller') endpoint += `/${paymentToEdit.id || paymentToEdit._id}`;
                else if (entityType === 'Transporter') endpoint += `/${paymentToEdit.id || paymentToEdit._id}`;

                await fetchApi(endpoint, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                toast.success(`${entityType} payment updated successfully!`);
            } else {
                // CREATE
                await fetchApi(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                toast.success(`${entityType} payment recorded successfully!`);
            }

            onClose();
        } catch (error) {
            console.error("Payment Submission Error:", error);
            toast.error(error.message || "Failed to record payment");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="payment-modal-overlay">
            <div className="payment-modal-content">
                <button className="payment-modal-close" onClick={onClose}>&times;</button>
                <h2 className="payment-modal-title">{paymentToEdit ? 'Edit Payment' : 'Add Payment'}</h2>

                <form onSubmit={handleSubmit}>
                    {/* Row 1: Mode, Date, Time */}
                    <div className="payment-row-1">
                        <div className="payment-form-group">
                            <label className="payment-label">Payment Mode</label>
                            <select
                                name="paymentMode"
                                className="payment-select"
                                value={formData.paymentMode}
                                onChange={handleChange}
                            >
                                <option value="">Select Mode</option>
                                {paymentModes.map(mode => (
                                    <option key={mode._id} value={mode.paymentModeName}>
                                        {mode.paymentModeName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="payment-form-group">
                            <label className="payment-label">Payment Date</label>
                            <input
                                type="date"
                                name="paymentDate"
                                className="payment-input"
                                value={formData.paymentDate}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="payment-form-group">
                            <label className="payment-label">Payment Time</label>
                            <input
                                type="time"
                                name="paymentTime"
                                className="payment-input"
                                value={formData.paymentTime}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 2: Amount, Document */}
                    <div className="payment-row-2">
                        <div className="payment-form-group">
                            <label className="payment-label">Payment Amount</label>
                            <input
                                type="number"
                                name="amount"
                                placeholder="Payment Amount"
                                className="payment-input"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="payment-form-group">
                            <label className="payment-label">Payment Document</label>
                            <div className="payment-file-input-wrapper" onClick={() => document.getElementById('payment-file').click()}>
                                <span className="payment-file-label">Choose File</span>
                                <span className="payment-file-text">{fileName}</span>
                                <input
                                    id="payment-file"
                                    type="file"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Remark */}
                    <div className="payment-form-group full-width">
                        <label className="payment-label">Remark</label>
                        <textarea
                            name="remark"
                            placeholder="Enter Remark"
                            className="payment-textarea"
                            value={formData.remark}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="payment-modal-actions">
                        <button type="button" className="payment-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="payment-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPaymentModal;

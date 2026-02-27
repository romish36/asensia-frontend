import React, { useState, useEffect } from 'react';
import '../../styles/AddExpensesModal.css'; // Reuse styles
import { toast } from 'react-toastify';
import AirDatePicker from '../ui/AirDatePicker';
import fetchApi from '../../utils/api';

function EditExpensesModal({ isOpen, onClose, expense, isPage }) {
    const [formData, setFormData] = useState({
        purpose: 'Office Rent',
        name: '',
        amount: '',
        date: '',
        paymentMode: 'Cash',
        document: null,
        details: ''
    });

    useEffect(() => {
        if (expense) {
            setFormData({
                purpose: expense.purpose || 'Office Rent',
                name: expense.name || '',
                amount: expense.amount || '',
                date: expense.date || '',
                paymentMode: expense.paymentMode || 'Cash',
                document: null,
                details: expense.details || ''
            });
        }
    }, [expense]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await fetchApi(`/expense/${expense._id}`, {
                method: 'PUT',
                body: formData
            });
            toast.success('Expense updated successfully!');
            onClose();
        } catch (error) {
            console.error('Update Error:', error);
            toast.error(error.message || 'Failed to update expense');
        }
    };

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-expenses-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <>
                    <button className="add-expenses-close-icon" onClick={onClose}>✕</button>
                    <h2 className="add-expenses-title">Update Expenses</h2>
                </>
            )}
            {isPage && <div className="page-card__title">Update Expenses</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-expenses-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    {/* Row 1 */}
                    <div className="add-expenses-row">
                        <div className="add-expenses-field">
                            <label className="add-expenses-label">Purpose</label>
                            <select
                                className="add-expenses-select"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                            >
                                <option value="Office Rent">Office Rent</option>
                                <option value="Stationery">Stationery</option>
                                <option value="Utility">Utility</option>
                                <option value="Travel">Travel</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="add-expenses-field">
                            <label className="add-expenses-label">Name</label>
                            <input
                                className="add-expenses-input"
                                placeholder="Enter Expenses Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="add-expenses-field">
                            <label className="add-expenses-label">Amount</label>
                            <input
                                className="add-expenses-input"
                                placeholder="Enter Amount"
                                name="amount"
                                type="number"
                                value={formData.amount}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="add-expenses-row">
                        <div className="add-expenses-field">
                            <label className="add-expenses-label">Date</label>
                            <AirDatePicker
                                className="add-expenses-input"
                                value={formData.date}
                                onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                                placeholder="Select Date"
                            />
                        </div>
                        <div className="add-expenses-field">
                            <label className="add-expenses-label">Payment Mode</label>
                            <select
                                className="add-expenses-select"
                                name="paymentMode"
                                value={formData.paymentMode}
                                onChange={handleChange}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Online">Online</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>
                        <div className="add-expenses-field">
                            <label className="add-expenses-label">Document</label>
                            <input
                                className="add-expenses-file-input"
                                type="file"
                                name="document"
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 3: Details */}
                    <div className="add-expenses-field">
                        <label className="add-expenses-label">Details</label>
                        <textarea
                            className="add-expenses-textarea"
                            name="details"
                            value={formData.details}
                            onChange={handleChange}
                            rows="4"
                        ></textarea>
                    </div>

                    {/* Buttons */}
                    <div className="add-expenses-actions">
                        <button type="button" className="add-expenses-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-expenses-btn-submit">Update</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="add-expenses-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default EditExpensesModal;

import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/apiConfig';
import fetchApi from '../utils/api';
import { toast } from 'react-toastify';

import '../styles/UserForm.css';

function PlanForm({ plan, onCancel, onSuccess }) {
    const [formData, setFormData] = useState({
        planName: '',
        planDurationDays: '',
        planPrice: '',
        planDiscount: '',
        planDescription: ''
    });

    useEffect(() => {
        if (plan) {
            setFormData({
                planName: plan.planName || '',
                planDurationDays: plan.planDurationDays || '',
                planPrice: plan.planPrice || '',
                planDiscount: plan.planDiscount || '',
                planDescription: plan.planDescription || ''
            });
        }
    }, [plan]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = plan ? `/plan/${plan._id}` : '/plan';
            const method = plan ? 'PUT' : 'POST';

            await fetchApi(url, {
                method,
                body: JSON.stringify(formData)
            });

            toast.success(`Plan ${plan ? 'updated' : 'created'} successfully!`);
            onSuccess();
        } catch (error) {
            console.error('Error saving plan:', error);
            toast.error(error.message || 'Failed to save plan');
        }
    };

    const requiredStar = <span style={{ color: '#ef4444' }}>*</span>;

    return (
        <div className="list-page-container">
            <div className="modal-header" style={{ marginBottom: '24px' }}>
                <h2 className="modal-title" style={{ fontSize: '24px', fontWeight: '700', color: '#0c3447' }}>
                    {plan ? 'Update Plan' : 'Add New Plan'}
                </h2>
            </div>

            <div className="user-form-body">
                <form id="plan-form" onSubmit={handleSubmit}>
                    <div className="user-grid">
                        <div className="user-field">
                            <label>Plan Name {requiredStar}</label>
                            <input
                                type="text"
                                name="planName"
                                value={formData.planName}
                                onChange={handleChange}
                                required
                                placeholder="Enter Plan Name"
                            />
                        </div>

                        <div className="user-field">
                            <label>Duration (Days) {requiredStar}</label>
                            <input
                                type="number"
                                name="planDurationDays"
                                value={formData.planDurationDays}
                                onChange={handleChange}
                                required
                                min="1"
                                placeholder="Enter Duration in Days"
                            />
                        </div>

                        <div className="user-field">
                            <label>Plan Price (₹)</label>
                            <input
                                type="number"
                                name="planPrice"
                                value={formData.planPrice}
                                onChange={handleChange}
                                placeholder="Enter Basic Price"
                                min="0"
                            />
                        </div>

                        <div className="user-field">
                            <label>Discount (%)</label>
                            <input
                                type="number"
                                name="planDiscount"
                                value={formData.planDiscount}
                                onChange={handleChange}
                                placeholder="Enter Discount %"
                                min="0"
                                max="100"
                            />
                        </div>

                        <div className="user-field">
                            <label>Final Price (₹)</label>
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#f3f4f6',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '700',
                                color: '#16a34a',
                                border: '1px solid #d1d5db'
                            }}>
                                ₹{(() => {
                                    const price = Number(formData.planPrice) || 0;
                                    const discount = Number(formData.planDiscount) || 0;
                                    return (price - (price * (discount / 100))).toFixed(2);
                                })()}
                            </div>
                        </div>

                        <div className="user-field full-width">
                            <label>Description</label>
                            <textarea
                                name="planDescription"
                                value={formData.planDescription}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Describe plan features..."
                                style={{
                                    padding: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    width: '100%',
                                    resize: 'vertical'
                                }}
                            ></textarea>
                        </div>
                    </div>

                    <div className="user-form-actions">
                        <button type="submit" className="btn-submit">
                            {plan ? 'Update Plan' : 'Save Plan'}
                        </button>
                        <button type="button" className="btn-cancel" onClick={onCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PlanForm;

import React, { useState, useEffect } from 'react';
import fetchApi from '../utils/api';
import { toast } from 'react-toastify';
import AirDatePicker from '../components/ui/AirDatePicker';

function CouponForm({ coupon, onCancel, onSuccess }) {
    const [plans, setPlans] = useState([]);
    const [formData, setFormData] = useState({
        couponCode: '',
        couponName: '',
        discountType: 'percentage',
        discountValue: '',
        validFrom: '',
        validTo: '',
        applicablePlans: [],
        description: ''
    });

    useEffect(() => {
        fetchPlans();
        if (coupon) {
            setFormData({
                couponCode: coupon.couponCode || '',
                couponName: coupon.couponName || '',
                discountType: coupon.discountType || 'percentage',
                discountValue: coupon.discountValue || '',
                validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
                validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().split('T')[0] : '',
                applicablePlans: coupon.applicablePlans || [],
                description: coupon.description || ''
            });
        }
    }, [coupon]);

    const fetchPlans = async () => {
        try {
            const data = await fetchApi('/plan');
            if (data.plans) {
                setPlans(data.plans);
            } else if (Array.isArray(data)) {
                setPlans(data);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlanToggle = (planId) => {
        setFormData(prev => {
            const current = [...prev.applicablePlans];
            const index = current.indexOf(planId);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(planId);
            }
            return { ...prev, applicablePlans: current };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = coupon ? `/coupon/${coupon._id}` : '/coupon';
            const method = coupon ? 'PUT' : 'POST';

            await fetchApi(url, {
                method,
                body: JSON.stringify(formData)
            });

            toast.success(`Coupon ${coupon ? 'updated' : 'created'} successfully!`);
            onSuccess();
        } catch (error) {
            console.error('Error saving coupon:', error);
            toast.error(error.message || 'Failed to save coupon');
        }
    };

    const requiredStar = <span style={{ color: '#ef4444' }}>*</span>;

    return (
        <div className="list-page-container">
            <div className="list-page-header" style={{ marginBottom: '24px' }}>
                <h1 className="list-page-title">
                    {coupon ? 'Edit Coupon' : 'Add New Coupon'}
                </h1>
            </div>

            <div className="user-form-body">
                <form id="coupon-form" onSubmit={handleSubmit}>
                    <div className="user-grid">
                        <div className="user-field">
                            <label>Coupon Code {requiredStar}</label>
                            <input
                                type="text"
                                name="couponCode"
                                value={formData.couponCode}
                                onChange={handleChange}
                                required
                                placeholder="e.g. NEWYEAR500"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </div>

                        <div className="user-field">
                            <label>Coupon Name {requiredStar}</label>
                            <input
                                type="text"
                                name="couponName"
                                value={formData.couponName}
                                onChange={handleChange}
                                required
                                placeholder="e.g. New Year Offer"
                            />
                        </div>

                        <div className="user-field">
                            <label>Discount Type {requiredStar}</label>
                            <select name="discountType" value={formData.discountType} onChange={handleChange} required>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Amount (₹)</option>
                            </select>
                        </div>

                        <div className="user-field">
                            <label>Discount Value {requiredStar}</label>
                            <input
                                type="number"
                                name="discountValue"
                                value={formData.discountValue}
                                onChange={handleChange}
                                required
                                min="0"
                                placeholder={formData.discountType === 'percentage' ? 'Enter %' : 'Enter Amount'}
                            />
                        </div>

                        <div className="user-field">
                            <label>Valid From {requiredStar}</label>
                            <AirDatePicker
                                name="validFrom"
                                value={formData.validFrom}
                                onChange={(val) => setFormData(prev => ({ ...prev, validFrom: val }))}
                                placeholder="Select Start Date"
                                required
                            />
                        </div>

                        <div className="user-field">
                            <label>Valid To {requiredStar}</label>
                            <AirDatePicker
                                name="validTo"
                                value={formData.validTo}
                                onChange={(val) => setFormData(prev => ({ ...prev, validTo: val }))}
                                placeholder="Select End Date"
                                required
                            />
                        </div>

                        <div className="user-field full-width">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="2"
                                placeholder="Optional description..."
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            ></textarea>
                        </div>

                        <div className="user-field full-width">
                            <label>Applicable Plans (Leave empty for all plans)</label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '10px',
                                marginTop: '10px',
                                padding: '15px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                {plans.map(plan => (
                                    <label key={plan._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.applicablePlans.includes(plan._id)}
                                            onChange={() => handlePlanToggle(plan._id)}
                                        />
                                        {plan.planName}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="user-form-actions">
                        <button type="submit" className="btn-submit">
                            SUBMIT
                        </button>
                        <button type="button" className="btn-cancel" onClick={onCancel}>
                            CANCEL
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CouponForm;

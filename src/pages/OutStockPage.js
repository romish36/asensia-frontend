import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/OutStock.css';
import AirDatePicker from '../components/ui/AirDatePicker';

function OutStockPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const editData = location.state?.edit;

    const [formData, setFormData] = useState({
        product: editData?.product || '',
        invoiceNo: editData?.invoiceNo || '',
        date: editData?.date ? editData.date.split('-').reverse().join('-') : new Date().toISOString().split('T')[0],
        outQty: editData?.outQty || '',
        outPrice: editData?.outPrice ? editData.outPrice.replace(/,/g, '') : '',
        total: editData?.total ? editData.total.replace(/,/g, '') : ''
    });

    useEffect(() => {
        if (editData?.date) {
            const parts = editData.date.split('-');
            if (parts.length === 3) {
                setFormData(prev => ({ ...prev, date: `${parts[2]}-${parts[1]}-${parts[0]}` }));
            }
        }
    }, [editData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'outQty' || name === 'outPrice') {
                const qty = parseFloat(name === 'outQty' ? value : prev.outQty) || 0;
                const price = parseFloat(name === 'outPrice' ? value : prev.outPrice) || 0;
                newData.total = (qty * price).toFixed(2);
            }
            return newData;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Out Stock Submitted:', formData);
        toast.success(editData ? 'Out stock updated successfully!' : 'Out stock added successfully!');

        // Reset form
        setFormData({
            product: '',
            invoiceNo: '',
            date: new Date().toISOString().split('T')[0],
            outQty: '',
            outPrice: '',
            total: ''
        });
    };

    const handleCancel = () => {
        navigate('/out-stock');
    };

    return (
        <div className="out-stock-container">
            <div className="stock-header-actions" style={{ marginBottom: '24px' }}>
                <h1 className="stock-title" style={{ margin: 0 }}>{editData ? 'Edit Out Stock' : 'Out Stock'}</h1>
            </div>

            <div className="stock-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="stock-form-grid">
                        <div className="stock-form-group">
                            <label className="stock-form-label">Product Name <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                name="product"
                                className="stock-form-input"
                                value={formData.product}
                                onChange={handleChange}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Invoice No <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                name="invoiceNo"
                                className="stock-form-input"
                                value={formData.invoiceNo}
                                onChange={handleChange}
                                placeholder="Enter invoice number"
                                required
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Out Quantity Date <span style={{ color: 'red' }}>*</span></label>
                            <AirDatePicker
                                className="stock-form-input"
                                value={formData.date}
                                onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                                placeholder="Select Date"
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Out Quantity <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="number"
                                name="outQty"
                                className="stock-form-input"
                                value={formData.outQty}
                                onChange={handleChange}
                                placeholder="0"
                                required
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Out Price <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="number"
                                name="outPrice"
                                className="stock-form-input"
                                value={formData.outPrice}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Total Amount</label>
                            <input
                                type="text"
                                name="total"
                                className="stock-form-input readonly-input"
                                value={formData.total}
                                readOnly
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="stock-form-actions">
                        <button type="button" className="stock-btn-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="stock-btn-submit">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OutStockPage;

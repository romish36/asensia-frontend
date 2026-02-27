import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/InStock.css';
import API_BASE_URL from '../config/apiConfig.js';
import AirDatePicker from '../components/ui/AirDatePicker';


function AddStockPage() {
    const navigate = useNavigate();
    const getRolePrefix = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.role) return '';
        if (user.role === 'SUPER_ADMIN') return '/super-admin';
        if (user.role === 'ADMIN') return '/admin';
        return '/user';
    };
    const location = useLocation();
    const editData = location.state?.edit;

    const [formData, setFormData] = useState({
        product: editData ? `${editData.productId}|${editData.product}` : '', // composite value for select
        productId: editData?.productId || '', // Store ID separately
        productName: editData?.product || '',
        invoiceNo: editData?.invoiceNo || '',
        date: editData?.date ? editData.date.split('-').reverse().join('-') : new Date().toISOString().split('T')[0],
        inQty: editData?.inQty || '',
        inPrice: editData?.inPrice ? String(editData.inPrice).replace(/,/g, '') : '',
        total: editData?.total ? String(editData.total).replace(/,/g, '') : ''
    });

    // Handle date conversion if coming from list (DD-MM-YYYY to YYYY-MM-DD)
    useEffect(() => {
        if (editData?.date) {
            const parts = editData.date.split('-');
            if (parts.length === 3) {
                // Assuming list date is DD-MM-YYYY
                setFormData(prev => ({ ...prev, date: `${parts[2]}-${parts[1]}-${parts[0]}` }));
            }
        }
    }, [editData]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'inQty' || name === 'inPrice') {
                const qty = parseFloat(name === 'inQty' ? value : prev.inQty) || 0;
                const price = parseFloat(name === 'inPrice' ? value : prev.inPrice) || 0;
                newData.total = (qty * price).toFixed(2);
            }
            return newData;
        });
    };

    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/product`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter out non-inventory products (Without Stock)
                const filteredProducts = data.filter(p => p.stockType !== 2);
                setProducts(filteredProducts);
            }
        } catch (error) {
            console.error("Error loading products", error);
            toast.error("Failed to load products");
        }
    };

    const handleProductChange = (e) => {
        const val = e.target.value;
        if (!val) {
            setFormData(prev => ({ ...prev, productId: '', productName: '', product: '' }));
            return;
        }

        // val format: "productId|productName"
        const [pId, pName] = val.split('|');
        setFormData(prev => ({ ...prev, productId: pId, productName: pName, product: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = sessionStorage.getItem('token');
            const url = editData ? `${API_BASE_URL}/instock/${editData._id || editData.id}` : `${API_BASE_URL}/instock`;

            const method = editData ? 'PUT' : 'POST';

            const payload = {
                productId: formData.productId,
                productName: formData.productName,
                invoiceNo: formData.invoiceNo,
                date: formData.date,
                inQuantity: formData.inQty,
                inPrice: formData.inPrice,
                totalAmount: formData.total
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();

            if (response.ok) {
                toast.success(editData ? 'Stock updated successfully!' : 'Stock added successfully!');
                navigate(`${getRolePrefix()}/in-stock`);
            } else {
                toast.error(resData.message || 'Failed to save stock');
            }
        } catch (error) {
            console.error("Stock save error:", error);
            toast.error("Server error");
        }
    };

    const handleCancel = () => {
        navigate(`${getRolePrefix()}/in-stock`);
    };

    return (
        <div className="in-stock-container">
            <div className="stock-header-actions" style={{ marginBottom: '24px' }}>
                <h1 className="stock-title" style={{ margin: 0 }}>{editData ? 'Edit Stock' : 'Add Stock'}</h1>
            </div>

            <div className="stock-form-card">
                <form onSubmit={handleSubmit}>
                    <div className="stock-form-grid">
                        <div className="stock-form-group">
                            <label className="stock-form-label">Product Name <span style={{ color: 'red' }}>*</span></label>
                            <select
                                name="product"
                                className="stock-form-input"
                                value={formData.product}
                                onChange={handleProductChange}
                                required
                                disabled={!!editData} // Disable product change on edit to simplify logic
                            >
                                <option value="">Select Product</option>
                                {products.map(p => (
                                    <option key={p._id} value={`${p.productId}|${p.productName}`}>
                                        {p.productName} ({p.sizeName} - {p.productType === 1 ? 'Bundle' : 'Single'})
                                    </option>
                                ))}
                            </select>
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
                            <label className="stock-form-label">In Quantity Date <span style={{ color: 'red' }}>*</span></label>
                            <AirDatePicker
                                className="stock-form-input"
                                value={formData.date}
                                onChange={(val) => setFormData(prev => ({ ...prev, date: val }))}
                                placeholder="Select Date"
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">In Quantity <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="number"
                                name="inQty"
                                className="stock-form-input"
                                value={formData.inQty}
                                onChange={handleChange}
                                placeholder="0"
                                required
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">In Price <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="number"
                                name="inPrice"
                                className="stock-form-input"
                                value={formData.inPrice}
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

export default AddStockPage;

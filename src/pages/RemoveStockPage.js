import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/InStock.css'; // Reusing InStock styles for consistency
import API_BASE_URL from '../config/apiConfig.js';
import AirDatePicker from '../components/ui/AirDatePicker';


function RemoveStockPage() {
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
        product: editData ? `${editData.productId}|${editData.product}` : '',
        productId: editData?.productId || '',
        productName: editData?.product || '',
        invoiceNo: editData?.invoiceNo || '',
        outQuantityDate: editData?.date ? editData.date.split('-').reverse().join('-') : new Date().toISOString().split('T')[0],
        outQuantity: editData?.outQty || '',
        outPrice: editData?.outPrice ? String(editData.outPrice).replace(/,/g, '') : '',
        totalAmount: editData?.total ? String(editData.total).replace(/,/g, '') : ''
    });

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
                setProducts(data);
                // If editing, try to set price from product if not set
                if (editData) {
                    const found = data.find(p => String(p.productId) === String(editData.productId));
                    // Logic for edit mode if needed
                }
            }
        } catch (error) {
            console.error("Error loading products", error);
            toast.error("Failed to load products");
        }
    };

    const handleProductChange = (e) => {
        const val = e.target.value;
        if (!val) {
            setFormData(prev => ({ ...prev, productId: '', productName: '', product: '', outPrice: '', totalAmount: '' }));
            return;
        }

        const [pId, pName] = val.split('|');
        const selectedProduct = products.find(p => String(p.productId) === String(pId));
        // Auto-fill price from product, using productSalePrice
        const price = selectedProduct ? (selectedProduct.productSalePrice || 0) : 0;

        // Recalculate total if quantity is already entered
        const qty = parseFloat(formData.outQuantity) || 0;
        const total = (qty * price).toFixed(2);

        setFormData(prev => ({
            ...prev,
            productId: pId,
            productName: pName,
            product: val,
            outPrice: String(price),
            totalAmount: total
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (name === 'outQuantity' || name === 'outPrice') {
                const qty = parseFloat(name === 'outQuantity' ? value : prev.outQuantity) || 0;
                const price = parseFloat(name === 'outPrice' ? value : prev.outPrice) || 0;
                newData.totalAmount = (qty * price).toFixed(2);
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = sessionStorage.getItem('token');
            const url = editData ? `${API_BASE_URL}/outstock/${editData._id || editData.id}` : `${API_BASE_URL}/outstock`;

            const method = editData ? 'PUT' : 'POST';

            const payload = {
                productId: formData.productId,
                productName: formData.productName,
                invoiceNo: formData.invoiceNo,
                outQuantityDate: formData.outQuantityDate,
                outQuantity: formData.outQuantity,
                outPrice: formData.outPrice,
                totalAmount: formData.totalAmount
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
                toast.success(editData ? 'Stock out updated!' : 'Stock removed successfully!');
                navigate(`${getRolePrefix()}/out-stock`);
            } else {
                toast.error(resData.message || 'Failed to save stock out');
            }
        } catch (error) {
            console.error("Stock save error:", error);
            toast.error("Server error");
        }
    };

    const handleCancel = () => {
        navigate(`${getRolePrefix()}/out-stock`);
    };

    return (
        <div className="in-stock-container">
            <div className="stock-header-actions" style={{ marginBottom: '24px' }}>
                <h1 className="stock-title" style={{ margin: 0 }}>{editData ? 'Edit Out Stock' : 'Remove Stock'}</h1>
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
                                disabled={!!editData}
                            >
                                <option value="">Select Product</option>
                                {products.map(p => (
                                    <option key={p._id} value={`${p.productId}|${p.productName}`}>
                                        {p.productName} ({p.sizeName}) - Stock: {p.productStock}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Invoice No</label>
                            <input
                                type="text"
                                name="invoiceNo"
                                className="stock-form-input"
                                value={formData.invoiceNo}
                                onChange={handleChange}
                                placeholder="Enter invoice number"
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Out Quantity Date <span style={{ color: 'red' }}>*</span></label>
                            <AirDatePicker
                                className="stock-form-input"
                                value={formData.outQuantityDate}
                                onChange={(val) => setFormData(prev => ({ ...prev, outQuantityDate: val }))}
                                placeholder="Select Date"
                            />
                        </div>

                        <div className="stock-form-group">
                            <label className="stock-form-label">Out Quantity <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="number"
                                name="outQuantity"
                                className="stock-form-input"
                                value={formData.outQuantity}
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
                                name="totalAmount"
                                className="stock-form-input readonly-input"
                                value={formData.totalAmount}
                                readOnly
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="stock-form-actions">
                        <button type="button" className="stock-btn-cancel" onClick={handleCancel}>Cancel</button>
                        <button type="submit" className="stock-btn-submit" style={{ background: '#dc2626' }}>Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RemoveStockPage;

import React, { useState, useEffect } from 'react';
import '../../styles/EditProductModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';


const EditProductModal = ({ isOpen, onClose, product, isPage }) => {
    const [formData, setFormData] = useState({
        companyId: '',
        categoryId: '',
        sizeId: '',
        sizeName: '',
        productName: '',
        productHsnCode: '',
        productModelNumber: '',
        productDesignName: '',
        productFinshGlaze: '',
        productSalePrice: '',
        productImage: '',
        stockType: '',
        productType: '',
        productBundle: ''
    });

    const [userRole, setUserRole] = useState('');
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);

    // Custom Category Dropdown State
    const [categoryInput, setCategoryInput] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const dropdownRef = React.useRef(null);


    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) {
            setUserRole(user.role);
            if (user.role === 'SUPER_ADMIN') {
                fetchCompanies();
            } else {
                fetchCategories();
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch categories specific to the company of the product being edited
    // Or if Super Admin changes the company dropdown (if that logic exists)
    useEffect(() => {
        if (formData.companyId) {
            fetchCategories(formData.companyId);
        }
    }, [formData.companyId]);

    const fetchCompanies = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/company`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setCompanies(await response.json());
            }
        } catch (error) {
            console.error('Error loading companies', error);
        }
    };

    const fetchCategories = async (companyId = null) => {
        try {
            const token = sessionStorage.getItem('token');
            let url = `${API_BASE_URL}/category`;
            if (companyId) {
                url += `?companyId=${companyId}`;
            }
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
                setFilteredCategories(data);
            }
        } catch (error) {
            console.error('Error loading categories', error);
        }
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            try {
                const base64 = await convertToBase64(files[0]);
                setFormData(prev => ({ ...prev, [name]: base64 }));
            } catch (error) {
                console.error("Error converting file:", error);
                toast.error("Error processing file");
            }
        }
    };

    useEffect(() => {
        if (product) {
            setFormData({
                companyId: product.companyId?._id || product.companyId || '',
                categoryId: product.categoryId?._id || product.categoryId || '',
                sizeId: product.sizeId || '',
                sizeName: product.sizeName || '',
                productName: product.productName || '',
                productHsnCode: product.productHsnCode || '',
                productModelNumber: product.productModelNumber || '',
                productDesignName: product.productDesignName || '',
                productFinshGlaze: product.productFinshGlaze || '',
                productSalePrice: product.productSalePrice || '',
                productImage: product.productImages || product.productImage || '',
                stockType: product.stockType || '',
                productType: product.productType || '',
                productBundle: product.productBundle || ''
            });

            // Set initial category input value
            // We might try to find it in the categories list later, but if product.categoryId is populated, use it.
            if (product.categoryId && typeof product.categoryId === 'object' && product.categoryId.categoryName) {
                setCategoryInput(product.categoryId.categoryName);
            } else if (categories.length > 0 && product.categoryId) {
                const cat = categories.find(c => c._id === product.categoryId);
                if (cat) setCategoryInput(cat.categoryName);
            }
        }
    }, [product]);

    // Sync input name when categories load if we have an ID but no name yet
    useEffect(() => {
        if (formData.categoryId && !categoryInput && categories.length > 0) {
            const cat = categories.find(c => c._id === formData.categoryId);
            if (cat) setCategoryInput(cat.categoryName);
        }
    }, [categories, formData.categoryId]);

    const [categoryActiveIndex, setCategoryActiveIndex] = useState(-1);

    const handleCategoryInputChange = (e) => {
        const value = e.target.value;
        setCategoryInput(value);
        setIsDropdownOpen(true);
        setCategoryActiveIndex(-1);

        if (!value.trim()) {
            setFilteredCategories(categories);
            setFormData(prev => ({ ...prev, categoryId: '' }));
            return;
        }

        const filtered = categories.filter(cat =>
            cat.categoryName.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCategories(filtered);
    };

    const handleSelectCategory = (category) => {
        setCategoryInput(category.categoryName);
        setFormData(prev => ({ ...prev, categoryId: category._id }));
        setIsDropdownOpen(false);
        setCategoryActiveIndex(-1);
    };

    const handleCreateCategory = async () => {
        if (!categoryInput.trim()) return;

        try {
            const token = sessionStorage.getItem('token');
            const payload = { categoryName: categoryInput.trim() };
            if (formData.companyId) {
                payload.companyId = formData.companyId;
            } else if (product?.companyId?._id) {
                payload.companyId = product.companyId._id;
            } else if (product?.companyId) {
                payload.companyId = product.companyId;
            }

            const response = await fetch(`${API_BASE_URL}/category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Category "${data.categoryName}" created!`);

                const updatedCategories = [...categories, data];
                setCategories(updatedCategories);
                setFilteredCategories(updatedCategories);

                handleSelectCategory(data);
            } else {
                toast.error(data.message || 'Failed to create category');
            }
        } catch (error) {
            console.error("Error creating category:", error);
            toast.error("Server error creating category");
        }
    };

    const handleCategoryKeyDown = (e) => {
        if (!isDropdownOpen && e.key === 'ArrowDown') {
            setIsDropdownOpen(true);
            return;
        }

        if (isDropdownOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setCategoryActiveIndex(prev => (prev < filteredCategories.length ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setCategoryActiveIndex(prev => (prev > -1 ? prev - 1 : -1));
            } else if (e.key === 'Enter') {
                if (categoryActiveIndex >= 0 && categoryActiveIndex < filteredCategories.length) {
                    e.preventDefault();
                    handleSelectCategory(filteredCategories[categoryActiveIndex]);
                } else if (categoryActiveIndex === filteredCategories.length && categoryInput) {
                    e.preventDefault();
                    handleCreateCategory();
                }
            } else if (e.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleKeyDown = (e) => {
        if (isDropdownOpen) return;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
            const form = e.target.form;
            if (!form) return;
            const index = Array.prototype.indexOf.call(form, e.target);

            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                if (e.key === 'Enter' && e.target.tagName === 'BUTTON') return;
                e.preventDefault();
                const next = form.elements[index + 1];
                if (next && next.tagName !== 'BUTTON') {
                    next.focus();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = form.elements[index - 1];
                if (prev) prev.focus();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = sessionStorage.getItem('token');
            const productId = product?._id || product?.id;
            if (!productId) {
                toast.error("Product ID missing");
                return;
            }
            const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Updated Product Data:", data);
                toast.success("Product Updated Successfully!");
                onClose();
            } else {
                toast.error(data.message || 'Failed to update product');
            }
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Server error while updating product");
        }
    };

    if (!isOpen && !isPage) return null;

    // If it's a page and product is missing (e.g. refresh), redirect back to list
    if (isPage && !product) {
        return (
            <div className="page-card">
                <div className="page-card__body">
                    <p>Product not found or page refreshed. Returning to list...</p>
                    <button className="btn-update" onClick={onClose}>Back to List</button>
                </div>
            </div>
        );
    }

    const formContent = (
        <div className={isPage ? "page-card" : "edit-product-modal"} onClick={e => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="edit-product-header">
                    <h3 className="edit-product-title">Update Product</h3>
                    <button className="edit-product-close" onClick={onClose}>&times;</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Update Product</div>}

            <div className={isPage ? "page-card__body" : "edit-product-body"}>
                <form onSubmit={handleSubmit} className="edit-form-grid" style={isPage ? { padding: '0', display: 'flex', flexDirection: 'column' } : {}} onKeyDown={handleKeyDown}>
                    {/* Super Admin Company Selection */}
                    {userRole === 'SUPER_ADMIN' && (
                        <div className="edit-form-group" style={{ marginBottom: '15px', gridColumn: '1 / -1' }}>
                            <label className="edit-label">Company (Move Product)</label>
                            <select
                                className="edit-select"
                                name="companyId"
                                value={formData.companyId}
                                onChange={handleChange}
                            >
                                <option value="">Select Company</option>
                                {companies.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.companyName || c.name || "Unnamed Company"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>

                        <div className="edit-form-group" ref={dropdownRef} style={{ position: 'relative' }}>
                            <label className="edit-label">Category</label>

                            <input
                                className="edit-input"
                                placeholder="Select or Type to Add"
                                value={categoryInput}
                                onChange={handleCategoryInputChange}
                                onClick={() => setIsDropdownOpen(true)}
                                onKeyDown={handleCategoryKeyDown}
                                style={{ width: '100%' }}
                            />

                            {isDropdownOpen && (
                                <ul className="edit-category-dropdown" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    zIndex: 1000,
                                    listStyle: 'none',
                                    padding: 0,
                                    margin: 0,
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    {filteredCategories.map((cat, idx) => (
                                        <li
                                            key={cat._id}
                                            onClick={() => handleSelectCategory(cat)}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #eee',
                                                color: '#333',
                                                backgroundColor: idx === categoryActiveIndex ? '#f0f0f0' : 'white'
                                            }}
                                            onMouseEnter={() => setCategoryActiveIndex(idx)}
                                        >
                                            {cat.categoryName}
                                        </li>
                                    ))}

                                    {categoryInput && !filteredCategories.some(c => c.categoryName.toLowerCase() === categoryInput.toLowerCase()) && (
                                        <li
                                            onClick={handleCreateCategory}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                color: '#007bff',
                                                fontWeight: 'bold',
                                                backgroundColor: categoryActiveIndex === filteredCategories.length ? '#d1e9ff' : '#e6f7ff'
                                            }}
                                            onMouseEnter={() => setCategoryActiveIndex(filteredCategories.length)}
                                        >
                                            Add "{categoryInput}"
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">Product Name <span style={{ color: 'red' }}>*</span></label>
                            <input
                                type="text"
                                className="edit-input"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">HSN Code</label>
                            <input
                                type="text"
                                className="edit-input"
                                name="productHsnCode"
                                value={formData.productHsnCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">Model Number</label>
                            <input
                                className="edit-input"
                                placeholder="Enter Model Number"
                                name="productModelNumber"
                                value={formData.productModelNumber}
                                onChange={handleChange}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">Finish/Glaze</label>
                            <input
                                type="text"
                                className="edit-input"
                                name="productFinshGlaze"
                                value={formData.productFinshGlaze}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">Sale Price</label>
                            <input
                                type="text"
                                className="edit-input"
                                name="productSalePrice"
                                value={formData.productSalePrice}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">Product Image</label>
                            <input
                                type="file"
                                className="edit-input"
                                name="productImage"
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ width: '100%' }}
                            />
                            {formData.productImage && (
                                <div style={{ marginTop: '10px' }}>
                                    <img src={formData.productImage} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                </div>
                            )}
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">Stock Type</label>
                            <select
                                className="edit-input" // Use existing edit-input class for consistency if select specific class not avail
                                name="stockType"
                                value={formData.stockType}
                                onChange={handleChange}
                            >
                                <option value="">Select Stock Status</option>
                                <option value="1">In Stock</option>
                                <option value="0">Out of Stock</option>
                                <option value="2">Without Stock</option>
                            </select>
                        </div>

                        <div className="edit-form-group">
                            <label className="edit-label">Product Type</label>
                            <select
                                className="edit-input"
                                name="productType"
                                value={formData.productType}
                                onChange={handleChange}
                            >
                                <option value="">Select Product Type</option>
                                <option value="0">Single Product</option>
                                <option value="1">Bundle Product</option>
                            </select>
                        </div>

                        {formData.productType === '1' && (
                            <div className="edit-form-group">
                                <label className="edit-label">Bundle Details</label>
                                <input
                                    type="text"
                                    className="edit-input"
                                    placeholder="Enter Bundle Details"
                                    name="productBundle"
                                    value={formData.productBundle}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    <div className="edit-actions" style={isPage ? { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' } : { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-update">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="edit-product-modal-overlay">
            {formContent}
        </div>
    );
}

export default EditProductModal;

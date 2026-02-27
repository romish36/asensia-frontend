import React, { useState, useEffect } from 'react';
import '../../styles/AddProductModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';


function AddProductModal({ isOpen, onClose, isPage }) {
    const [formData, setFormData] = useState({
        companyId: '', // For Super Admin
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

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch when company changes (for Super Admin)
    useEffect(() => {
        if (userRole === 'SUPER_ADMIN' && formData.companyId) {
            setCategoryInput('');
            setFormData(prev => ({ ...prev, categoryId: '' }));
            fetchCategories(formData.companyId);
        }
    }, [formData.companyId, userRole]);

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
                // If endpoint supports filtering by query param, otherwise it might just filter by token (user scope)
                // Assuming backend supports /api/category?companyId=xyz for Super Admins
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

    const [categoryActiveIndex, setCategoryActiveIndex] = useState(-1);

    const handleCategoryInputChange = (e) => {
        const value = e.target.value;
        setCategoryInput(value);
        setIsDropdownOpen(true);
        setCategoryActiveIndex(-1);

        if (!value.trim()) {
            setFilteredCategories(categories);
            setFormData(prev => ({ ...prev, categoryId: '' })); // Clear ID if input cleared
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

                // Add new category to local list and select it
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        const missingFields = [];
        if (!formData.productName) missingFields.push("Product Name");
        // Removed sizeId and sizeName from mandatory validation as per request to remove from frontend
        if (!formData.categoryId) missingFields.push("Category");
        if (userRole === 'SUPER_ADMIN' && !formData.companyId) missingFields.push("Company");

        if (missingFields.length > 0) {
            toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Product Form Submitted:', data);
                toast.success('Product added successfully!');

                // Reset and close
                setFormData({
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
                setCategoryInput('');
                setIsDropdownOpen(false);
                onClose();
            } else {
                toast.error(data.message || 'Failed to add product');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            toast.error('Server error while adding product');
        }
    };

    const handleKeyDown = (e) => {
        // Only trigger form navigation if dropdowns are closed
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

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-product-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : { overflowY: 'auto', maxHeight: '90vh' }}>
            {!isPage && (
                <div className="add-product-header">
                    <h2 className="add-product-title">Add Product</h2>
                    <button className="add-product-close-btn" onClick={onClose}>✕</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Add Product</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-product-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}} onKeyDown={handleKeyDown}>
                    {/* Super Admin Company Selection */}
                    {userRole === 'SUPER_ADMIN' && (
                        <div className="add-product-row-1" style={{ marginBottom: '15px' }}>
                            <div className="add-product-field">
                                <label className="add-product-label">Select Company <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    className="add-product-select"
                                    name="companyId"
                                    value={formData.companyId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Company --</option>
                                    {companies.map(c => (
                                        <option key={c._id} value={c._id}>
                                            {c.companyName || c.name || "Unnamed Company"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="add-product-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

                        <div className="add-product-field" ref={dropdownRef} style={{ position: 'relative' }}>
                            <label className="add-product-label">Category <span style={{ color: 'red' }}>*</span></label>

                            <input
                                className="add-product-input"
                                placeholder="Select or Type to Add"
                                value={categoryInput}
                                onChange={handleCategoryInputChange}
                                onClick={() => setIsDropdownOpen(true)}
                                onKeyDown={handleCategoryKeyDown}
                            />

                            {isDropdownOpen && (
                                <ul className="custom-dropdown-list" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    maxHeight: '200px',
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
                                                backgroundColor: idx === categoryActiveIndex ? '#f0f0f0' : 'white'
                                            }}
                                            onMouseEnter={() => setCategoryActiveIndex(idx)}
                                        >
                                            {cat.categoryName}
                                        </li>
                                    ))}

                                    {/* Show "Add" option if input has value and no exact match */}
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

                        <div className="add-product-field">
                            <label className="add-product-label">Product Name <span style={{ color: 'red' }}>*</span></label>
                            <input
                                className="add-product-input"
                                placeholder="Enter Product Name"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-product-field">
                            <label className="add-product-label">HSN Code</label>
                            <input
                                className="add-product-input"
                                placeholder="Enter HSN Code"
                                name="productHsnCode"
                                value={formData.productHsnCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-product-field">
                            <label className="add-product-label">Model Number</label>
                            <input
                                className="add-product-input"
                                placeholder="Enter Model Number"
                                name="productModelNumber"
                                value={formData.productModelNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-product-field">
                            <label className="add-product-label">Finish/Glaze</label>
                            <input
                                className="add-product-input"
                                placeholder="Enter Finish/Glaze"
                                name="productFinshGlaze"
                                value={formData.productFinshGlaze}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-product-field">
                            <label className="add-product-label">Sale Price</label>
                            <input
                                className="add-product-input"
                                placeholder="Enter Sale Price"
                                name="productSalePrice"
                                value={formData.productSalePrice}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-product-field">
                            <label className="add-product-label">Product Image</label>
                            <input
                                type="file"
                                className="add-product-input"
                                name="productImage"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            {formData.productImage && (
                                <div style={{ marginTop: '10px' }}>
                                    <img src={formData.productImage} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                </div>
                            )}
                        </div>

                        <div className="add-product-field">
                            <label className="add-product-label">Stock Type</label>
                            <select
                                className="add-product-select"
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

                        <div className="add-product-field">
                            <label className="add-product-label">Product Type</label>
                            <select
                                className="add-product-select"
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
                            <div className="add-product-field">
                                <label className="add-product-label">Bundle Details</label>
                                <input
                                    className="add-product-input"
                                    placeholder="Enter Bundle Details"
                                    name="productBundle"
                                    value={formData.productBundle}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    <div className="add-product-actions" style={{ marginTop: '20px' }}>
                        <button type="button" className="add-product-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="add-product-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
    if (isPage) return formContent;

    return (
        <div className="add-product-modal-overlay">
            {formContent}
        </div>
    );
}

export default AddProductModal;

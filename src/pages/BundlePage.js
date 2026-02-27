import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/BundlePage.css';
import API_BASE_URL from '../config/apiConfig.js';

const BundlePage = () => {
    const { id } = useParams(); // This is the bundle product ID (the parent)
    const navigate = useNavigate();
    const [bundleProduct, setBundleProduct] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [bundleItems, setBundleItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);

    const getRolePrefix = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.role) return '';
        if (user.role === 'SUPER_ADMIN') return '/super-admin';
        if (user.role === 'ADMIN') return '/admin';
        return '/user';
    };

    // fetching data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const user = JSON.parse(sessionStorage.getItem('user'));
                let productUrl = `${API_BASE_URL}/product`;

                if (user && user.companyId) {
                    productUrl += `?companyId=${user.companyId}`;
                }

                // 1. Fetch All Products
                const productRes = await fetch(productUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (productRes.ok) {
                    const productsData = await productRes.json();
                    setAllProducts(productsData);

                    // Find current bundle product
                    // Note: productsData contains _id and productId. The URL param 'id' is likely _id based on how react-router usually works with mapped IDs.
                    const found = productsData.find(p => p._id === id);
                    if (found) {
                        setBundleProduct(found);

                        // 2. Fetch Bundle Items specific to this product
                        // We need to pass the productId (Number) not _id (ObjectId) if our backend expects Number
                        // Based on controller logic: req.params.productBundleId is treated as Number
                        await fetchBundleItems(found.productId, token);
                    } else {
                        toast.error("Bundle product not found");
                    }
                } else {
                    toast.error("Failed to fetch products");
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Server error");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const fetchBundleItems = async (productBundleId, token) => {
        try {
            const res = await fetch(`${API_BASE_URL}/bundle/${productBundleId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBundleItems(data);
            }
        } catch (error) {
            console.error("Error fetching bundle items:", error);
        }
    };

    const handleCheckboxChange = (productId) => {
        setSelectedProducts(prev => {
            if (prev.includes(productId)) {
                return prev.filter(p => p !== productId);
            } else {
                return [...prev, productId];
            }
        });
    };

    const handleSaveBundle = async () => {
        if (selectedProducts.length === 0) {
            toast.warn("Please select at least one product to add.");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/bundle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productBundleId: bundleProduct.productId, // Sending Number ID
                    productIds: selectedProducts
                })
            });

            if (res.ok) {
                toast.success("Items added to bundle successfully");
                setSelectedProducts([]); // Clear selection
                // Refresh items
                await fetchBundleItems(bundleProduct.productId, token);
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to add items");
            }
        } catch (error) {
            console.error("Save Bundle Error:", error);
            toast.error("Error saving bundle");
        }
    };

    const handleDeleteItem = async (itemId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you really want to remove this item from the bundle?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            try {
                const token = sessionStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/bundle/${itemId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    Swal.fire(
                        'Removed!',
                        'The item has been removed from the bundle.',
                        'success'
                    );
                    // Refresh items
                    await fetchBundleItems(bundleProduct.productId, token);
                } else {
                    toast.error("Failed to delete item");
                }
            } catch (error) {
                console.error("Delete Error:", error);
                toast.error("Error deleting item");
            }
        }
    };

    if (loading) return <div className="bundle-page-loading">Loading...</div>;
    if (!bundleProduct) return <div className="bundle-page-error">Product not found <button onClick={() => navigate(`${getRolePrefix()}/product`)}>Back</button></div>;

    // Filter available products
    const bundleItemProductIds = bundleItems.map(item => item.productId);

    const availableProducts = allProducts.filter(p =>
        p.productId !== bundleProduct.productId && // Exclude self
        !bundleItemProductIds.includes(p.productId) && // Exclude already added
        p.productName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bundle-page-container">
            <div className="bundle-page-header">
                <button className="bundle-back-btn" onClick={() => navigate(`${getRolePrefix()}/product`)}>
                    &larr; Back to Products
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h1 className="bundle-page-title">Manage Bundle: <span style={{ color: '#2563eb' }}>{bundleProduct.productName}</span></h1>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Grade: {bundleProduct.productGrade} | Size: {bundleProduct.sizeName}</span>
                </div>
            </div>

            <div className="bundle-layout">
                {/* Available Products Section */}
                <div className="bundle-section">
                    <h2 className="bundle-section-title">Available Products</h2>
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="product-search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="products-list-container">
                        {availableProducts.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No products found</p>
                        ) : (
                            availableProducts.map(p => (
                                <div key={p._id} className="product-item">
                                    <input
                                        type="checkbox"
                                        className="product-checkbox"
                                        checked={selectedProducts.includes(p.productId)}
                                        onChange={() => handleCheckboxChange(p.productId)}
                                    />
                                    <div className="product-info">
                                        <span className="product-name">{p.productName}</span>
                                        <span className="product-meta">{p.productGrade} - {p.sizeName}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="save-bundle-container">
                        <button
                            className="save-bundle-btn"
                            disabled={selectedProducts.length === 0}
                            onClick={handleSaveBundle}
                        >
                            Add {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ''} to Bundle
                        </button>
                    </div>
                </div>

                {/* Bundle Items Section */}
                <div className="bundle-section">
                    <h2 className="bundle-section-title">Current Bundle Items ({bundleItems.length})</h2>
                    <div className="bundle-items-list">
                        {bundleItems.length === 0 ? (
                            <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No items in this bundle yet.</p>
                        ) : (
                            bundleItems.map(item => (
                                <div key={item._id} className="bundle-item-card">
                                    <div className="bundle-item-info">
                                        <span className="product-name">{item.productDetails?.productName || `Product ID: ${item.productId}`}</span>
                                        {item.productDetails && (
                                            <span className="product-meta">{item.productDetails.productGrade} - {item.productDetails.sizeName}</span>
                                        )}
                                    </div>
                                    <button
                                        className="delete-bundle-btn"
                                        onClick={() => handleDeleteItem(item._id)}
                                        title="Remove from bundle"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BundlePage;

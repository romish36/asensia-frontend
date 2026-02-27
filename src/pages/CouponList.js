import React, { useState, useEffect } from 'react';
import fetchApi from '../utils/api';
import CouponForm from './CouponForm';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';


const CouponList = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const data = await fetchApi('/coupon');
            setCoupons(data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            toast.error('Failed to load coupons');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await fetchApi(`/coupon/${id}`, { method: 'DELETE' });
                toast.success('Coupon deleted successfully');
                fetchCoupons();
            } catch (error) {
                toast.error(error.message || 'Failed to delete coupon');
            }
        }
    };

    const handleToggleStatus = async (coupon) => {
        try {
            await fetchApi(`/coupon/${coupon._id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !coupon.isActive })
            });
            toast.success(`Coupon ${coupon.isActive ? 'Deactivated' : 'Activated'}`);
            fetchCoupons();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.couponCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.couponName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (showForm) {
        return (
            <CouponForm
                coupon={editingCoupon}
                onCancel={() => { setShowForm(false); setEditingCoupon(null); }}
                onSuccess={() => { setShowForm(false); setEditingCoupon(null); fetchCoupons(); }}
            />
        );
    }

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="list-page-container">
            <div className="list-page-header">
                <h1 className="list-page-title">Discount Coupons</h1>
                <div className="list-page-action-buttons">
                    <button className="list-page-btn list-page-btn-add" onClick={() => setShowForm(true)}>
                        + CREATE COUPON
                    </button>
                </div>
            </div>

            <div className="list-page-toolbar">
                <SearchBar
                    placeholder="Search by code or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th>CODE</th>
                            <th>NAME</th>
                            <th>DISCOUNT</th>
                            <th>VALIDITY</th>
                            <th>STATUS</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCoupons.length > 0 ? (
                            filteredCoupons.map((coupon) => (
                                <tr key={coupon._id}>
                                    <td><strong style={{ color: '#1e3a8a' }}>{coupon.couponCode}</strong></td>
                                    <td>{coupon.couponName}</td>
                                    <td>
                                        {coupon.discountType === 'percentage'
                                            ? `${coupon.discountValue}%`
                                            : `₹${coupon.discountValue}`} Off
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '12px' }}>
                                            <div>From: {new Date(coupon.validFrom).toLocaleDateString('en-IN')}</div>
                                            <div>To: {new Date(coupon.validTo).toLocaleDateString('en-IN')}</div>
                                        </div>
                                    </td>
                                    <td>
                                        {(() => {
                                            const isExpired = new Date(coupon.validTo) < new Date().setHours(0, 0, 0, 0);
                                            const isActive = coupon.isActive && !isExpired;
                                            return (
                                                <span
                                                    onClick={() => handleToggleStatus(coupon)}
                                                    className={`status-indicator ${isActive ? 'active' : 'inactive'}`}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            <button
                                                className="list-page-icon-btn"
                                                title="Edit"
                                                onClick={() => { setEditingCoupon(coupon); setShowForm(true); }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                className="list-page-icon-btn"
                                                title="Delete"
                                                onClick={() => handleDelete(coupon._id)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="list-page-table-empty">No coupons found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CouponList;

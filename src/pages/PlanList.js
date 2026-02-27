import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';


function PlanList({ onAddPlan, onEditPlan }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const userRole = JSON.parse(sessionStorage.getItem('user'))?.role;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    const fetchPlans = async (search = '', page = 1, limit = 10) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            console.log('Fetching plans from:', `/plan?${queryParams.toString()}`);
            const data = await fetchApi(`/plan?${queryParams.toString()}`);
            console.log('Plans data received:', data);

            if (data && data.plans && Array.isArray(data.plans)) {
                setRows(data.plans);
                setTotalEntries(data.total || 0);
                setTotalPages(data.pages || 1);
            } else if (Array.isArray(data)) {
                setRows(data);
                setTotalEntries(data.length);
                setTotalPages(Math.ceil(data.length / limit));
            } else {
                setRows([]);
                setTotalEntries(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load plans');
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPlans(searchQuery, currentPage, itemsPerPage);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, currentPage, itemsPerPage]);

    const handleEdit = (plan) => {
        if (onEditPlan) {
            onEditPlan(plan);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this plan?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/plan/${id}`, { method: 'DELETE' });
                    Swal.fire('Deleted!', 'Plan has been deleted.', 'success');
                    fetchPlans(searchQuery, currentPage, itemsPerPage);
                } catch (error) {
                    console.error('Error deleting plan:', error);
                    toast.error(error.message || 'Failed to delete plan');
                }
            }
        });
    };

    const handleAdd = () => {
        if (onAddPlan) {
            onAddPlan();
        }
    };

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [currentPage, totalPages]);

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="list-page-container">
            <div className="list-page-header">
                <h1 className="list-page-title">Plans Management</h1>
                <div className="list-page-action-buttons">
                    {isSuperAdmin && (
                        <button className="list-page-btn list-page-btn-add" onClick={handleAdd}>
                            ADD PLAN
                        </button>
                    )}
                </div>
            </div>

            <div className="list-page-toolbar">
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search plans by name..."
                />
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th>PLAN ID</th>
                            <th>NAME</th>
                            <th>DURATION</th>
                            <th>PRICE (₹)</th>
                            <th>DISCOUNT (%)</th>
                            <th>FINAL PRICE (₹)</th>
                            <th>DESCRIPTION</th>
                            <th>STATUS</th>
                            {isSuperAdmin && <th>ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length > 0 ? (
                            rows.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.planId}</td>
                                    <td>{item.planName}</td>
                                    <td>{item.planDurationDays} Days</td>
                                    <td>₹{item.planPrice || 0}</td>
                                    <td>{item.planDiscount || 0}%</td>
                                    <td style={{ color: '#059669', fontWeight: '700' }}>₹{item.finalPrice || 0}</td>
                                    <td>{item.planDescription || '—'}</td>
                                    <td>
                                        <span style={{
                                            color: item.isActive ? '#059669' : '#ef4444',
                                            fontWeight: '600'
                                        }}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {isSuperAdmin && (
                                        <td>
                                            <div className="list-page-action-icons">
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Edit"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Delete"
                                                    onClick={() => handleDelete(item._id)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="list-page-table-empty" colSpan={isSuperAdmin ? 9 : 8}>No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="list-page-footer">
                <div className="list-page-entries">
                    <span>Show</span>
                    <select
                        className="list-page-entries-select"
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                    </select>
                    <span>entries</span>
                </div>

                <div className="list-page-info">
                    Showing {totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                </div>

                <div className="list-page-pagination">
                    <button
                        type="button"
                        className="list-page-page-btn"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            type="button"
                            className={`list-page-page-num ${p === currentPage ? 'list-page-page-num-active' : ''}`}
                            onClick={() => setCurrentPage(p)}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        type="button"
                        className="list-page-page-btn"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PlanList;

import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import CompanyDetailsModal from '../components/modals/CompanyDetailsModal';
import API_BASE_URL from '../config/apiConfig.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function CompanyList({ onAddCompany, onEditCompany, onViewProfile }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const userRole = JSON.parse(sessionStorage.getItem('user'))?.role;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    // Fetch Companies from API
    const fetchCompanies = async (search = '', page = 1, limit = 10) => {
        try {
            if (!search) setLoading(true);
            const token = sessionStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            const response = await fetch(`${API_BASE_URL}/company?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.companies && Array.isArray(data.companies)) {
                    setRows(data.companies);
                    setTotalEntries(data.total || 0);
                    setTotalPages(data.pages || 1);
                } else if (Array.isArray(data)) {
                    setRows(data);
                    setTotalEntries(data.length);
                    setTotalPages(Math.ceil(data.length / limit));
                }
            } else {
                const err = await response.json();
                toast.error(err.message || 'Failed to fetch companies');
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
            toast.error('Server error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCompanies(searchQuery, currentPage, itemsPerPage);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, currentPage, itemsPerPage]);

    const handleView = (company) => {
        setSelectedCompany(company);
        setIsViewModalOpen(true);
    };

    const handleEdit = (company) => {
        if (onEditCompany) {
            onEditCompany(company);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this company?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/company/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        Swal.fire(
                            'Deleted!',
                            'Company has been deleted.',
                            'success'
                        );
                        // Refresh Data
                        fetchCompanies(searchQuery, currentPage, itemsPerPage);
                    } else {
                        const err = await response.json();
                        toast.error(err.message || 'Failed to delete company');
                    }
                } catch (error) {
                    console.error('Error deleting company:', error);
                    toast.error('Server error');
                }
            }
        });
    };

    const handleAdd = () => {
        if (onAddCompany) {
            onAddCompany();
        }
    };

    // Pagination Display Logic
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
            {/* Header: Title and Action Buttons */}
            <div className="list-page-header">
                <h1 className="list-page-title">Company List</h1>
                <div className="list-page-action-buttons">
                    {isSuperAdmin && hasPermission('Company', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={handleAdd}>
                            ADD COMPANY
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search */}
            <div className="list-page-toolbar">
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search companies..."
                />

                <div className="list-page-filter-box">
                    {/* No filter for company */}
                </div>
            </div>

            {/* Table */}
            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th>NAME</th>
                            <th>PERSON NAME</th>
                            <th>EMAIL</th>
                            <th>MOBILE NUMBER</th>
                            <th>GST</th>
                            <th>PLAN</th>
                            <th>PLAN EXPIRY</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length > 0 ? (
                            rows.map((item) => (
                                <tr key={item._id || item.companyId}>
                                    <td>
                                        <span
                                            onClick={() => onViewProfile && onViewProfile(item)}
                                            style={{
                                                color: '#2563eb',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                                        >
                                            {item.companyName}
                                        </span>
                                    </td>
                                    <td>{item.companyPersonName}</td>
                                    <td>{item.companyEmail}</td>
                                    <td>{item.companyMobileNumber_1}</td>
                                    <td>{item.companyGstNumber}</td>
                                    <td>{item.planName || <span style={{ color: '#94a3b8', fontSize: '12px' }}>No Plan</span>}</td>
                                    <td>
                                        {item.planExpiryDate ? (() => {
                                            const now = new Date();
                                            const expiry = new Date(item.planExpiryDate);
                                            const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
                                            const isExpired = diffDays <= 0;
                                            const isWarn = !isExpired && diffDays <= 10;
                                            return (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    backgroundColor: isExpired ? '#fee2e2' : isWarn ? '#fef3c7' : '#dcfce7',
                                                    color: isExpired ? '#dc2626' : isWarn ? '#d97706' : '#16a34a'
                                                }}>
                                                    {isExpired ? `Expired` : `${diffDays}d left`}
                                                </span>
                                            );
                                        })() : <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>}
                                    </td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Company', 'view') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="View"
                                                    onClick={() => handleView(item)}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('Company', 'update') && (
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
                                            )}
                                            {isSuperAdmin && hasPermission('Company', 'delete') && (
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
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="list-page-table-empty" colSpan={8}>No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer: Pagination */}
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

            {/* View Company Details Modal */}
            <CompanyDetailsModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                company={selectedCompany}
            />
        </div>
    );
}

export default CompanyList;

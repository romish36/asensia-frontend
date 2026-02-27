import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';

function InvoiceCopyList({ onAdd, onEdit }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) setUserRole(user.role);
    }, []);

    const fetchInvoiceCopies = async (search = '', page = 1, limit = 10) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            const result = await fetchApi(`/invoice-copy?${queryParams.toString()}`);

            if (result.invoiceCopies && Array.isArray(result.invoiceCopies)) {
                setRows(result.invoiceCopies);
                setTotalEntries(result.total || 0);
                setTotalPages(result.pages || 1);
            } else if (Array.isArray(result)) {
                setRows(result);
                setTotalEntries(result.length);
                setTotalPages(Math.ceil(result.length / limit));
            }
        } catch (error) {
            console.error('Error fetching invoice copies:', error);
            if (error.status !== 403) {
                toast.error('Server error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInvoiceCopies(searchQuery, currentPage, itemsPerPage);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, currentPage, itemsPerPage]);

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this invoice copy?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/invoice-copy/${id}`, {
                        method: 'DELETE'
                    });
                    setRows(prevData => prevData.filter(item => item._id !== id));
                    Swal.fire('Deleted!', 'Invoice copy has been deleted.', 'success');
                } catch (error) {
                    console.error("Delete Error:", error);
                    toast.error(error.message || "Server error");
                }
            }
        });
    };

    const filteredData = rows;
    const currentItems = rows;

    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const showingTo = Math.min(totalEntries, currentPage * itemsPerPage);

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [currentPage, totalPages]);

    const [userRole, setUserRole] = useState('');

    return (
        <div className="list-page-container">
            <div className="list-page-header">
                <h1 className="list-page-title">Invoice Copy List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Invoice Copy', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={onAdd}>
                            ADD COPY
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
                    placeholder="Search copies..."
                />
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th>COPY NAME</th>
                            {userRole === 'SUPER_ADMIN' && <th>COMPANY</th>}
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={userRole === 'SUPER_ADMIN' ? 3 : 2}>Loading...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.invoiceCopyName}</td>
                                    {userRole === 'SUPER_ADMIN' && <td>{item.companyId?.companyName || ''}</td>}
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Invoice Copy', 'update') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Edit"
                                                    onClick={() => onEdit(item)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('Invoice Copy', 'delete') && (
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
                                <td className="list-page-table-empty" colSpan={userRole === 'SUPER_ADMIN' ? 3 : 2}>No records found</td>
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
                    Showing {showingFrom} to {showingTo} of {totalEntries} entries
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

export default InvoiceCopyList;

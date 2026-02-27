import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';


function InvoiceNameList({ onAdd, onEdit }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const fetchInvoiceNames = async (searchQuery = '', currentPage = 1, limit = 10) => {
        try {
            setLoading(true);
            const result = await fetchApi(`/invoice-name?search=${searchQuery}&page=${currentPage}&limit=${limit}`);

            if (result.invoiceNames && Array.isArray(result.invoiceNames)) {
                setRows(result.invoiceNames);
                setTotalEntries(result.total || 0);
                setTotalPages(result.pages || 1);
            } else if (Array.isArray(result)) {
                setRows(result);
                setTotalEntries(result.length);
                setTotalPages(Math.ceil(result.length / limit));
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            if (error.status !== 403) {
                toast.error('Error connecting to server');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInvoiceNames(search, page, pageSize);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, pageSize]);

    const filteredRows = useMemo(() => {
        return rows;
    }, [rows]);

    const total = totalEntries;
    const safePage = page;

    const pagedRows = rows;

    const showingFrom = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
    const showingTo = Math.min(totalEntries, (page - 1) * pageSize + rows.length);

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, page - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [page, totalPages]);

    const deleteRow = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this invoice name?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/invoice-name/${id}`, {
                        method: 'DELETE'
                    });

                    setRows((prev) => prev.filter((r) => r._id !== id));
                    Swal.fire('Deleted!', 'Invoice name has been deleted.', 'success');
                } catch (error) {
                    if (error.status !== 403) {
                        toast.error(error.message || 'Failed to delete');
                    }
                }
            }
        });
    };

    const handleEdit = (item) => {
        if (onEdit) onEdit(item);
    };

    const handleAdd = () => {
        if (onAdd) onAdd();
    };

    return (
        <div className="list-page-container">
            {/* Header: Title and Action Buttons */}
            <div className="list-page-header">
                <h1 className="list-page-title">Invoice Name List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('InvoiceName', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={handleAdd}>
                            ADD INVOICE NAME
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search */}
            <div className="list-page-toolbar">
                <SearchBar
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search names..."
                />

                <div className="list-page-filter-box">
                    {/* No filter for invoice name */}
                </div>
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            {isSuperAdmin && <th>COMPANY ID</th>}
                            <th>INVOICE NAME</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={isSuperAdmin ? 3 : 2} className="list-page-table-empty">Loading...</td></tr>
                        ) : pagedRows.length === 0 ? (
                            <tr>
                                <td className="list-page-table-empty" colSpan={isSuperAdmin ? 3 : 2}>
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            pagedRows.map((r) => (
                                <tr key={r._id}>
                                    {isSuperAdmin && <td>{r.companyId}</td>}
                                    <td>{r.invoiceShortName}</td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('InvoiceName', 'update') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Edit"
                                                    onClick={() => handleEdit(r)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('InvoiceName', 'delete') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Delete"
                                                    onClick={() => deleteRow(r._id)}
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
                        )}
                    </tbody>
                </table>
            </div>

            <div className="list-page-footer">
                <div className="list-page-entries">
                    <span>Show</span>
                    <select
                        className="list-page-entries-select"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                </div>

                <div className="list-page-info">
                    Showing {showingFrom} to {showingTo} of {total} entries
                </div>

                <div className="list-page-pagination">
                    <button
                        type="button"
                        className="list-page-page-btn"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            type="button"
                            className={`list-page-page-num ${p === page ? 'list-page-page-num-active' : ''}`}
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        type="button"
                        className="list-page-page-btn"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}


export default InvoiceNameList;

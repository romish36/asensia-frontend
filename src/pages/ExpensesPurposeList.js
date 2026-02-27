import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';

function ExpensesPurposeList({ data, onAdd, onEdit, onDelete }) {
    const { hasPermission } = usePermissionContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredData = useMemo(() => {
        return (data || []).filter(item =>
            (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    const handleEdit = (item) => {
        if (onEdit) onEdit(item);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this expenses purpose?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then((result) => {
            if (result.isConfirmed) {
                if (onDelete) {
                    onDelete(id);
                    Swal.fire('Deleted!', 'Expenses purpose has been deleted.', 'success');
                } else {
                    toast.error("Delete function not provided");
                }
            }
        });
    };

    const handleAdd = () => {
        if (onAdd) onAdd();
    };

    const totalEntries = filteredData.length;
    const totalPages = Math.ceil(totalEntries / itemsPerPage);
    const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

    return (
        <div className="list-page-container">
            <div className="list-page-header">
                <h1 className="list-page-title">Expenses Purpose List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('ExpensePurpose', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={handleAdd}>ADD EXPENSES PURPOSE</button>
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
                    placeholder="Search purposes..."
                />
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead><tr><th>EXPENSES PURPOSE</th><th>ACTIONS</th></tr></thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('ExpensePurpose', 'update') && (
                                                <button type="button" className="list-page-icon-btn" title="Edit" onClick={() => handleEdit(item)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('ExpensePurpose', 'delete') && (
                                                <button type="button" className="list-page-icon-btn" title="Delete" onClick={() => handleDelete(item.id)}>
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
                            <tr><td className="list-page-table-empty" colSpan={2}>No records found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="list-page-footer">
                <div className="list-page-entries">
                    <span>Show</span>
                    <select className="list-page-entries-select" value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                        <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
                    </select>
                    <span>entries</span>
                </div>
                <div className="list-page-info">
                    Showing {showingFrom} to {showingTo} of {totalEntries} entries
                </div>
                <div className="list-page-pagination">
                    <button type="button" className="list-page-page-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</button>
                    {pages.map((p) => (
                        <button key={p} type="button" className={`list-page-page-num ${p === currentPage ? 'list-page-page-num-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                    ))}
                    <button type="button" className="list-page-page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                </div>
            </div>
        </div>
    );
}

export default ExpensesPurposeList;

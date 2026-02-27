import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';


function SaleTypeList({ onAdd, onEdit }) {
    const { hasPermission } = usePermissionContext();
    const [data, setData] = useState([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchSaleTypes = async (search = '', page = 1, limit = 10) => {
        try {
            setLoading(true);
            const result = await fetchApi(`/sale-type?search=${search}&page=${page}&limit=${limit}`);

            if (result.saleTypes && Array.isArray(result.saleTypes)) {
                setData(result.saleTypes);
                setTotalEntries(result.total || 0);
                setTotalPages(result.pages || 1);
            } else if (Array.isArray(result)) {
                setData(result);
                setTotalEntries(result.length);
                setTotalPages(Math.ceil(result.length / limit));
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            if (error.status !== 403) {
                toast.error("Server error");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchSaleTypes(searchQuery, currentPage, itemsPerPage);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, currentPage, itemsPerPage]);

    const handleEdit = (item) => {
        if (onEdit) onEdit(item);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this sale type?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/sale-type/${id}`, { method: 'DELETE' });
                    setData(prevData => prevData.filter(item => item._id !== id));
                    Swal.fire('Deleted!', 'Sale type has been deleted.', 'success');
                } catch (error) {
                    toast.error(error.message || "Failed to delete sale type");
                }
            }
        });
    };

    const handleAdd = () => {
        if (onAdd) onAdd();
    };

    const filteredData = data;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data;

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [currentPage, totalPages]);

    // if (loading) return <div className="list-page-container">Loading sale types...</div>;


    return (
        <div className="list-page-container">
            <div className="list-page-header">
                <h1 className="list-page-title">Sale Type List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('SaleType', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={handleAdd}>ADD SALE TYPE</button>
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
                    placeholder="Search types..."
                />
                <div className="list-page-filter-box"></div>
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead><tr><th>NAME</th><th>SALE TYPE TAX 1 (%)</th><th>SALE TYPE TAX 2 (%)</th><th>ACTIONS</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td className="list-page-table-empty" colSpan={4}>Loading...</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.saleTypeName}</td>
                                    <td>{item.saleTypeTax1}%</td>
                                    <td>{item.saleTypeTax2}%</td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('SaleType', 'update') && (
                                                <button type="button" className="list-page-icon-btn" title="Edit" onClick={() => handleEdit(item)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('SaleType', 'delete') && (
                                                <button type="button" className="list-page-icon-btn" title="Delete" onClick={() => handleDelete(item._id)}>
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
                            <tr><td className="list-page-table-empty" colSpan={4}>No records found</td></tr>
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
                    Showing {totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
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

export default SaleTypeList;


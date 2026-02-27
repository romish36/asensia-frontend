import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function GradeList({ onAddGrade, onEditGrade }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) setUserRole(user.role);
    }, []);

    const fetchGrades = async (search = '', page = 1, limit = 10) => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const result = await fetchApi(`/grade?search=${search}&page=${page}&limit=${limit}`);

            if (result.grades && Array.isArray(result.grades)) {
                setRows(result.grades);
                setTotalEntries(result.total || 0);
                setTotalPages(result.pages || 1);
            } else if (Array.isArray(result)) {
                setRows(result);
                setTotalEntries(result.length);
                setTotalPages(Math.ceil(result.length / limit));
            }
        } catch (error) {
            console.error('Error fetching grades:', error);
            toast.error('Server error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchGrades(searchQuery, currentPage, itemsPerPage);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, currentPage, itemsPerPage]);

    const handleEdit = (grade) => {
        if (onEditGrade) onEditGrade(grade);
    };

    const handleAdd = () => {
        if (onAddGrade) onAddGrade();
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this grade?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = sessionStorage.getItem('token');
                    const response = await fetch(`${API_BASE_URL}/grade/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        setRows(prevData => prevData.filter(item => item._id !== id));
                        Swal.fire('Deleted!', 'Grade has been deleted.', 'success');
                    } else {
                        const errData = await response.json();
                        toast.error(errData.message || 'Failed to delete grade');
                    }
                } catch (error) {
                    console.error("Delete Error:", error);
                    toast.error("Server error");
                }
            }
        });
    };

    // Filter Data Logic
    const filteredData = rows;

    // Pagination Logic
    const total = totalEntries;
    const safePage = currentPage;

    const currentItems = rows;

    const showingFrom = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const showingTo = Math.min(totalEntries, (currentPage - 1) * itemsPerPage + rows.length);

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [safePage, totalPages]);

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="list-page-container">
            <div className="list-page-header">
                <h1 className="list-page-title">Grade List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Grade', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={handleAdd}>
                            ADD GRADE
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
                    placeholder="Search grades..."
                />
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th>GRADE NAME</th>
                            {userRole === 'SUPER_ADMIN' && <th>COMPANY</th>}
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.gradeName}</td>
                                    {userRole === 'SUPER_ADMIN' && <td>{item.companyId?.companyName || ''}</td>}
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Grade', 'update') && (
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
                                            {hasPermission('Grade', 'delete') && (
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
                    Showing {showingFrom} to {showingTo} of {total} entries
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

export default GradeList;

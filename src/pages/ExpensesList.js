import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import '../styles/ExpensesList.css';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import AirDatePicker from '../components/ui/AirDatePicker';
import SearchBar from '../components/ui/SearchBar';

function ExpensesList({ onAddExpenses, onEditExpenses }) {
    const { hasPermission } = usePermissionContext();
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        purpose: '',
        paymentMode: ''
    });

    const [activeFilters, setActiveFilters] = useState({
        startDate: '',
        endDate: '',
        purpose: '',
        paymentMode: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    // const [isModalOpen, setIsModalOpen] = useState(false); // Handled by parent

    const [data, setData] = useState([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async (search = '', page = 1, limit = 10, filterParams = {}) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            queryParams.append('page', page);
            queryParams.append('limit', limit);
            if (filterParams.startDate) queryParams.append('startDate', filterParams.startDate);
            if (filterParams.endDate) queryParams.append('endDate', filterParams.endDate);
            if (filterParams.purpose) queryParams.append('purpose', filterParams.purpose);
            if (filterParams.paymentMode) queryParams.append('paymentMode', filterParams.paymentMode);

            const result = await fetchApi(`/expense?${queryParams.toString()}`);

            if (result.expenses && Array.isArray(result.expenses)) {
                setData(result.expenses);
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
            fetchExpenses(searchQuery, currentPage, itemsPerPage, activeFilters);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, currentPage, itemsPerPage, activeFilters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    const handleSubmit = () => {
        setActiveFilters({ ...filters });
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFilters({ startDate: '', endDate: '', purpose: '', paymentMode: '' });
        setActiveFilters({ startDate: '', endDate: '', purpose: '', paymentMode: '' });
        setSearchQuery('');
        setCurrentPage(1);
    };

    const handleView = (id) => {
        alert(`View Expense ID: ${id}`);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this expense?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/expense/${id}`, { method: 'DELETE' });
                    Swal.fire('Deleted!', 'Expense has been deleted.', 'success');
                    fetchExpenses(searchQuery, currentPage, itemsPerPage, activeFilters);
                } catch (error) {
                    console.error("Delete Error:", error);
                    toast.error(error.message || "Delete failed");
                }
            }
        });
    };

    const currentItems = data;

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        <div className="expenses-list-container">
            {/* Statistics Cards */}
            <div className="expenses-stats-cards">
                <div className="expenses-card">
                    <div className="expenses-card-header">
                        <span className="expenses-amount">₹ 0.00 /-</span>
                        <span className="expenses-currency-icon">Rs</span>
                    </div>
                    <div className="expenses-label">Today Expenses</div>
                </div>
                <div className="expenses-card">
                    <div className="expenses-card-header">
                        <span className="expenses-amount">₹ 0.00 /-</span>
                        <span className="expenses-currency-icon">Rs</span>
                    </div>
                    <div className="expenses-label">This Month Expenses</div>
                </div>
                <div className="expenses-card">
                    <div className="expenses-card-header">
                        <span className="expenses-amount">₹ 0.00 /-</span>
                        <span className="expenses-currency-icon">Rs</span>
                    </div>
                    <div className="expenses-label">Last Month Expenses</div>
                </div>
                <div className="expenses-card">
                    <div className="expenses-card-header">
                        <span className="expenses-amount">₹ 0.00 /-</span>
                        <span className="expenses-currency-icon">Rs</span>
                    </div>
                    <div className="expenses-label">Total Expenses</div>
                </div>
            </div>

            <h1 className="expenses-title">Expenses List</h1>

            {/* Filters */}
            <div className="expenses-filter-section">
                <div className="expenses-filter-group">
                    <label className="expenses-filter-label">Start Date</label>
                    <AirDatePicker
                        className="expenses-filter-date"
                        value={filters.startDate}
                        onChange={(val) => setFilters(prev => ({ ...prev, startDate: val }))}
                        placeholder="Start Date"
                    />
                </div>
                <div className="expenses-filter-group">
                    <label className="expenses-filter-label">End Date</label>
                    <AirDatePicker
                        className="expenses-filter-date"
                        value={filters.endDate}
                        onChange={(val) => setFilters(prev => ({ ...prev, endDate: val }))}
                        placeholder="End Date"
                    />
                </div>
                <div className="expenses-filter-group">
                    <label className="expenses-filter-label">Expenses Purpose</label>
                    <select
                        className="expenses-filter-select"
                        name="purpose"
                        value={filters.purpose}
                        onChange={handleFilterChange}
                    >
                        <option value="">---Select Purpose---</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Utility">Utility</option>
                        <option value="Travel">Travel</option>
                    </select>
                </div>
                <div className="expenses-filter-group">
                    <label className="expenses-filter-label">Payment Mode</label>
                    <select
                        className="expenses-filter-select"
                        name="paymentMode"
                        value={filters.paymentMode}
                        onChange={handleFilterChange}
                    >
                        <option value="">---Select Payment Mode---</option>
                        <option value="Cash">Cash</option>
                        <option value="Online">Online</option>
                        <option value="Cheque">Cheque</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="expenses-btn-submit" onClick={handleSubmit}>Submit</button>
                    <button className="expenses-btn-reset" onClick={handleReset}>Reset</button>
                </div>

                <div style={{ marginLeft: 'auto' }}>
                    {hasPermission('Expense', 'add') && (
                        <button
                            className="expenses-btn-submit"
                            style={{ backgroundColor: '#0c3447', border: 'none' }}
                            onClick={onAddExpenses}
                        >
                            Add Expenses
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="expenses-controls">
                <div>
                    Show
                    <select
                        style={{ margin: '0 5px', padding: '2px' }}
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                    </select>
                    entries
                </div>
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search expenses..."
                />
            </div>

            {/* Table */}
            <div className="expenses-table-wrapper">
                <table className="expenses-table">
                    <thead>
                        <tr>
                            <th>Expenses Name</th>
                            <th>Purpose</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Payment Mode</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.name}</td>
                                    <td>{item.purpose}</td>
                                    <td>{(parseFloat(item.amount) || 0).toFixed(2)}</td>
                                    <td>{item.date}</td>
                                    <td>{item.paymentMode}</td>
                                    <td>
                                        <div className="expenses-action-icons">
                                            {/* View Icon */}
                                            {hasPermission('Expense', 'view') && (
                                                <button
                                                    className="expenses-icon-btn expenses-icon-view"
                                                    title="View"
                                                    onClick={() => handleView(item._id)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                </button>
                                            )}
                                            {/* Edit Icon */}
                                            {hasPermission('Expense', 'update') && (
                                                <button
                                                    className="expenses-icon-btn expenses-icon-edit"
                                                    title="Edit"
                                                    onClick={() => onEditExpenses && onEditExpenses(item)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {/* Delete Icon */}
                                            {hasPermission('Expense', 'delete') && (
                                                <button
                                                    className="expenses-icon-btn expenses-icon-delete"
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
                                <td colSpan="6" className="no-data">No data available in table</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (Hidden or Disabled if no data, but kept structure) */}
            <div className="expenses-pagination">
                <div>
                    Showing {totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries
                </div>
                <div className="expenses-page-controls">
                    <button
                        className="expenses-page-btn"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <button
                        className="expenses-page-btn"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </button>
                </div>
            </div>
            {/* Add Expenses Modal removed */}
        </div >
    );
}

export default ExpensesList;

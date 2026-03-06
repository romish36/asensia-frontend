import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import AirDatePicker from '../components/ui/AirDatePicker';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function parseDDMMYYYY(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function dateToComparable(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function InStock() {
    const { hasPermission } = usePermissionContext();
    const navigate = useNavigate();
    const getRolePrefix = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.role) return '';
        if (user.role === 'SUPER_ADMIN') return '/super-admin';
        if (user.role === 'ADMIN') return '/admin';
        return '/user';
    };

    const [filters, setFilters] = useState({
        product: '',
        startDate: '',
        endDate: ''
    });

    const [activeFilters, setActiveFilters] = useState({
        product: '',
        startDate: '',
        endDate: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(() => {
        const savedPage = sessionStorage.getItem('lastPage_InStock');
        return savedPage ? parseInt(savedPage) : 1;
    });
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const totalCols = 7 + ((hasPermission('InStock', 'update') || hasPermission('InStock', 'delete')) ? 1 : 0);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productList, setProductList] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const result = await fetchApi('/product');
            setProductList(result);
        } catch (error) {
            console.error("Fetch Products Error:", error);
        }
    };

    const fetchInStocks = async (search = '', page = 1, limit = 10, filterParams = {}) => {
        try {
            if (!search) setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            queryParams.append('page', page);
            queryParams.append('limit', limit);
            if (filterParams.product) queryParams.append('product', filterParams.product);
            if (filterParams.startDate) queryParams.append('startDate', filterParams.startDate);
            if (filterParams.endDate) queryParams.append('endDate', filterParams.endDate);

            const result = await fetchApi(`/instock?${queryParams.toString()}`);

            let records = [];
            if (result.inStocks && Array.isArray(result.inStocks)) {
                records = result.inStocks;
                setTotalEntries(result.total || 0);
                setTotalPages(result.pages || 1);
            } else if (Array.isArray(result)) {
                records = result;
                setTotalEntries(result.length);
                setTotalPages(Math.ceil(result.length / limit));
            }

            const mappedData = records.map(item => ({
                id: item._id,
                inStockId: item.inStockId,
                productId: item.productId,
                product: item.productName,
                invoiceNo: item.invoiceNo || '-',
                date: item.inQuantityDate ? item.inQuantityDate.split('T')[0] : (item.date ? item.date.split('T')[0] : '-'),
                inQty: item.inQuantity,
                inPrice: item.inPrice,
                total: item.totalAmount
            }));
            setData(mappedData);
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
        sessionStorage.setItem('lastPage_InStock', currentPage);
    }, [currentPage]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInStocks(searchQuery, currentPage, itemsPerPage, activeFilters);
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
        let finalEndDate = filters.endDate;
        if (filters.startDate && !filters.endDate) {
            finalEndDate = new Date().toISOString().split('T')[0];
            setFilters(prev => ({ ...prev, endDate: finalEndDate }));
        }

        setActiveFilters({ ...filters, endDate: finalEndDate });
        setCurrentPage(1);
    };

    const handleReset = () => {
        setFilters({ product: '', startDate: '', endDate: '' });
        setActiveFilters({ product: '', startDate: '', endDate: '' });
        setSearchQuery('');
        setCurrentPage(1);
    };


    const [exportType, setExportType] = useState(''); // 'print' or 'excel'
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportColumns, setExportColumns] = useState({
        product: true,
        invoiceNo: true,
        date: true,
        inQty: true,
        inPrice: true,
        total: true,
        company: true
    });

    const columnLabels = {
        product: 'Product',
        invoiceNo: 'Invoice No',
        date: 'In Quantity Date',
        inQty: 'In Quantity',
        inPrice: 'In Price (Incl. GST)',
        total: 'Total Amount (Incl. GST)',
        company: 'Company'
    };

    const toggleExportColumn = (columnKey) => {
        setExportColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'inQty' || sortConfig.key === 'inPrice' || sortConfig.key === 'total') {
                    aValue = parseFloat(String(aValue).replace(/[^\d.-]/g, '')) || 0;
                    bValue = parseFloat(String(bValue).replace(/[^\d.-]/g, '')) || 0;
                } else {
                    aValue = aValue ? aValue.toString().toLowerCase() : '';
                    bValue = bValue ? bValue.toString().toLowerCase() : '';
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handlePrint = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (activeFilters.product) queryParams.append('product', activeFilters.product);
            if (activeFilters.startDate) queryParams.append('startDate', activeFilters.startDate);
            if (activeFilters.endDate) queryParams.append('endDate', activeFilters.endDate);

            const allData = await fetchApi(`/instock?${queryParams.toString()}`);
            const stocksToPrint = Array.isArray(allData) ? allData : (allData.inStocks || []);

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>In Stock List</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
            printWindow.document.write('h1 { text-align: center; color: #0b3a54; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
            printWindow.document.write('th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }');
            printWindow.document.write('th { background-color: #dff5ea; color: #0b3a54; font-weight: 600; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h1>In Stock List</h1>');
            printWindow.document.write('<table><thead><tr>');

            printWindow.document.write('<th>No.</th>');
            if (exportColumns.product) printWindow.document.write('<th>Product</th>');
            if (exportColumns.invoiceNo) printWindow.document.write('<th>Invoice No</th>');
            if (exportColumns.date) printWindow.document.write('<th>In Quantity Date</th>');
            if (exportColumns.inQty) printWindow.document.write('<th>In Quantity</th>');
            if (exportColumns.inPrice) printWindow.document.write('<th>In Price (Incl. GST)</th>');
            if (exportColumns.total) printWindow.document.write('<th>Total Amount (Incl. GST)</th>');
            if (exportColumns.company) printWindow.document.write('<th>Company</th>');

            printWindow.document.write('</tr></thead><tbody>');

            stocksToPrint.forEach((item, index) => {
                const date = item.inQuantityDate ? item.inQuantityDate.split('T')[0] : (item.date ? item.date.split('T')[0] : '-');
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${index + 1}</td>`);
                if (exportColumns.product) printWindow.document.write(`<td>${item.productName || ''}</td>`);
                if (exportColumns.invoiceNo) printWindow.document.write(`<td>${item.invoiceNo || ''}</td>`);
                if (exportColumns.date) printWindow.document.write(`<td>${date}</td>`);
                if (exportColumns.inQty) printWindow.document.write(`<td>${item.inQuantity || ''}</td>`);
                if (exportColumns.inPrice) printWindow.document.write(`<td>${(parseFloat(item.inPrice) * 1.18 || 0).toFixed(2)}</td>`);
                if (exportColumns.total) printWindow.document.write(`<td>${(parseFloat(item.totalAmount) * 1.18 || 0).toFixed(2)}</td>`);
                if (exportColumns.company) printWindow.document.write(`<td>${item.companyId?.companyName || item.companyId?.name || '-'}</td>`);
                printWindow.document.write('</tr>');
            });

            printWindow.document.write('</tbody></table></body></html>');
            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            console.error("Print Error:", error);
            toast.error("Failed to fetch data for printing");
        } finally {
            setLoading(false);
        }
    };

    const handleExcelDownload = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (activeFilters.product) queryParams.append('product', activeFilters.product);
            if (activeFilters.startDate) queryParams.append('startDate', activeFilters.startDate);
            if (activeFilters.endDate) queryParams.append('endDate', activeFilters.endDate);

            const allData = await fetchApi(`/instock?${queryParams.toString()}`);
            const stocksToExport = Array.isArray(allData) ? allData : (allData.inStocks || []);

            const worksheetData = stocksToExport.map((item, index) => {
                const date = item.inQuantityDate ? item.inQuantityDate.split('T')[0] : (item.date ? item.date.split('T')[0] : '-');
                const row = { 'No.': index + 1 };
                if (exportColumns.product) row['Product'] = item.productName;
                if (exportColumns.invoiceNo) row['Invoice No'] = item.invoiceNo;
                if (exportColumns.date) row['In Quantity Date'] = date;
                if (exportColumns.inQty) row['In Quantity'] = item.inQuantity;
                if (exportColumns.inPrice) row['In Price (Incl. GST)'] = (parseFloat(item.inPrice) * 1.18 || 0).toFixed(2);
                if (exportColumns.total) row['Total Amount (Incl. GST)'] = (parseFloat(item.totalAmount) * 1.18 || 0).toFixed(2);
                if (exportColumns.company) row['Company'] = item.companyId?.companyName || item.companyId?.name || '-';
                return row;
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(worksheetData);
            XLSX.utils.book_append_sheet(wb, ws, 'In Stock');
            XLSX.writeFile(wb, 'InStock_Report.xlsx');
        } catch (error) {
            console.error("Excel Download Error:", error);
            toast.error("Failed to fetch data for Excel export");
        } finally {
            setLoading(false);
        }
    };

    // Action Handlers
    const handleEdit = (item) => {
        // Navigate to add page with edit state (if implemented) or just mock it
        navigate(`${getRolePrefix()}/in-stock/add`, { state: { edit: item } });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/instock/${id}`, { method: 'DELETE' });
                    setData(prev => prev.filter(item => item.id !== id));
                    Swal.fire('Deleted!', 'Record has been deleted.', 'success');
                } catch (error) {
                    console.error("Delete error:", error);
                    Swal.fire('Error!', 'Server connection failed.', 'error');
                }
            }
        });
    };

    // Generate page numbers for pagination
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
                <h1 className="list-page-title">In Stock</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('InStock', 'report') && (
                        <>
                            <button className="list-page-btn list-page-btn-excel" onClick={() => {
                                setExportType('excel');
                                setIsExportModalOpen(true);
                            }}>
                                EXCEL
                            </button>
                            <button className="list-page-btn list-page-btn-print" onClick={() => {
                                setExportType('print');
                                setIsExportModalOpen(true);
                            }}>
                                PRINT
                            </button>
                        </>
                    )}
                    {hasPermission('InStock', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={() => navigate(`${getRolePrefix()}/in-stock/add`)}>
                            + STOCK
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search, Filter, Action Buttons */}
            <div className="list-page-toolbar">
                {/* Search Box */}
                <SearchBar
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                    placeholder="Search stock..."
                />

                {/* Filter Box */}
                <div className="list-page-filter-box">
                    <div className="list-page-filter-group">
                        <label className="list-page-filter-label">Start Date</label>
                        <AirDatePicker
                            className="list-page-filter-date"
                            value={filters.startDate}
                            onChange={(val) => setFilters(prev => ({ ...prev, startDate: val }))}
                            placeholder="Start Date"
                        />
                    </div>

                    <div className="list-page-filter-group">
                        <label className="list-page-filter-label">End Date</label>
                        <AirDatePicker
                            className="list-page-filter-date"
                            value={filters.endDate}
                            onChange={(val) => setFilters(prev => ({ ...prev, endDate: val }))}
                            placeholder="End Date"
                        />
                    </div>

                    <div className="list-page-filter-group">
                        <label className="list-page-filter-label">Product</label>
                        <select
                            className="list-page-filter-select"
                            name="product"
                            value={filters.product}
                            onChange={handleFilterChange}
                        >
                            <option value="">---Select Product---</option>
                            {productList
                                .sort((a, b) => (a.productName || '').localeCompare(b.productName || ''))
                                .map(p => (
                                    <option key={p._id} value={p.productName}>
                                        {p.productName} ({p.sizeName})
                                    </option>
                                ))}
                        </select>
                    </div>

                    <button className="list-page-btn list-page-btn-submit" onClick={handleSubmit}>
                        Submit
                    </button>
                    <button className="list-page-btn list-page-btn-reset" onClick={handleReset}>
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>NO.</th>
                            <th onClick={() => requestSort('product')} style={{ cursor: 'pointer' }}>
                                PRODUCT {sortConfig.key === 'product' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('invoiceNo')} style={{ cursor: 'pointer' }}>
                                INVOICE NO {sortConfig.key === 'invoiceNo' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('date')} style={{ cursor: 'pointer' }}>
                                IN QUANTITY DATE {sortConfig.key === 'date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('inQty')} style={{ cursor: 'pointer' }}>
                                IN QUANTITY {sortConfig.key === 'inQty' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('inPrice')} style={{ cursor: 'pointer' }}>
                                IN PRICE {sortConfig.key === 'inPrice' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('total')} style={{ cursor: 'pointer' }}>
                                TOTAL AMOUNT {sortConfig.key === 'total' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            {(hasPermission('InStock', 'update') || hasPermission('InStock', 'delete')) && <th>ACTION</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length > 0 ? (
                            sortedData.map((item, index) => (
                                <tr key={item.id}>
                                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td>{item.product}</td>
                                    <td>{item.invoiceNo}</td>
                                    <td>{item.date}</td>
                                    <td>{item.inQty}</td>
                                    <td>{(parseFloat(item.inPrice) * 1.18 || 0).toFixed(2)}</td>
                                    <td>{(parseFloat(item.total) * 1.18 || 0).toFixed(2)}</td>
                                    {(hasPermission('InStock', 'update') || hasPermission('InStock', 'delete')) && (
                                        <td>
                                            <div className="list-page-action-icons">
                                                {hasPermission('InStock', 'update') && (
                                                    <button
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
                                                {hasPermission('InStock', 'delete') && (
                                                    <button
                                                        className="list-page-icon-btn"
                                                        title="Delete"
                                                        onClick={() => handleDelete(item.id)}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={totalCols} className="list-page-table-empty">No records found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer: Entries and Pagination */}
            <div className="list-page-footer">
                <div className="list-page-entries">
                    <span>Show</span>
                    <select
                        className="list-page-entries-select"
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
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
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>

                    {pages.map((p) => (
                        <button
                            key={p}
                            type="button"
                            className={`list-page-page-num ${currentPage === p ? 'list-page-page-num-active' : ''}`}
                            onClick={() => paginate(p)}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        type="button"
                        className="list-page-page-btn"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </button>
                </div>
            </div>

            {isExportModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: 'bold' }}>
                                Select Columns to {exportType === 'excel' ? 'Export' : 'Print'}
                            </h2>
                            <button
                                onClick={() => {
                                    const allKeys = Object.keys(columnLabels);
                                    const allChecked = allKeys.every(k => exportColumns[k]);
                                    const newExportColumns = { ...exportColumns };
                                    allKeys.forEach(k => newExportColumns[k] = !allChecked);
                                    setExportColumns(newExportColumns);
                                }}
                                style={{
                                    padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1',
                                    backgroundColor: '#f8fafc', cursor: 'pointer'
                                }}
                            >
                                {Object.keys(columnLabels).every(k => exportColumns[k]) ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                            {Object.entries(columnLabels).map(([key, label]) => (
                                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333', cursor: 'pointer', padding: '4px' }}>
                                    <input
                                        type="checkbox"
                                        checked={exportColumns[key]}
                                        onChange={() => toggleExportColumn(key)}
                                        style={{ accentColor: '#06b6d4', width: '16px', height: '16px' }}
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', pt: '10px', borderTop: '1px solid #e2e8f0', marginTop: '10px', paddingTop: '15px' }}>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                style={{
                                    padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e1',
                                    backgroundColor: 'white', color: '#475569', cursor: 'pointer', fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (exportType === 'excel') {
                                        handleExcelDownload();
                                    } else {
                                        handlePrint();
                                    }
                                    setIsExportModalOpen(false);
                                }}
                                style={{
                                    padding: '8px 16px', borderRadius: '4px', border: 'none',
                                    backgroundColor: '#06b6d4', color: 'white', cursor: 'pointer', fontWeight: '600'
                                }}
                            >
                                {exportType === 'excel' ? 'Export Excel' : 'Print'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InStock;

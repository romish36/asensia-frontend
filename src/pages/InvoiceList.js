import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import CustomerDetailsModal from '../components/modals/CustomerDetailsModal';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import AirDatePicker from '../components/ui/AirDatePicker';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function formatDateDDMMYYYY(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
}

function dateToComparable(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function InvoiceList({ onPreview, onAddInvoice, onEditInvoice, onNavigateToProfile }) {
    const { hasPermission } = usePermissionContext();

    const [rows, setRows] = useState([]);
    const token = sessionStorage.getItem('token');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [appliedFilter, setAppliedFilter] = useState('');

    const [draftStartDate, setDraftStartDate] = useState('');
    const [draftEndDate, setDraftEndDate] = useState('');
    const [appliedStartDate, setAppliedStartDate] = useState('');

    const [appliedEndDate, setAppliedEndDate] = useState('');

    const [exportType, setExportType] = useState('');
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportColumns, setExportColumns] = useState({
        customerName: true,
        companyName: true,
        customerState: true,
        invoiceNo: true,
        invoiceDate: true,
        totalAmount: true
    });

    const columnLabels = {
        customerName: 'Customer Name',
        companyName: 'Company Name',
        customerState: 'Place of Supply',
        invoiceNo: 'Invoice No',
        invoiceDate: 'Invoice Date',
        totalAmount: 'Total Amount'
    };

    const toggleExportColumn = (columnKey) => {
        setExportColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(() => {
        const savedPage = sessionStorage.getItem('lastPage_InvoiceList');
        return savedPage ? parseInt(savedPage) : 1;
    });
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [customers, setCustomers] = useState([]);

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const totalCols = 5 + (isSuperAdmin ? 1 : 0) + (hasPermission('Invoice', 'view') ? 1 : 0) + ((hasPermission('Invoice', 'update') || hasPermission('Invoice', 'delete')) ? 1 : 0);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const data = await fetchApi('/customer');
            setCustomers(data);
        } catch (error) {
            console.error("Fetch Customers Error:", error);
        }
    };

    const fetchInvoices = async (searchQuery = '', currentPage = 1, limit = 10, filters = {}) => {
        if (!searchQuery) setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            queryParams.append('page', currentPage);
            queryParams.append('limit', limit);
            if (filters.customer) queryParams.append('customer', filters.customer);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const result = await fetchApi(`/sales-invoice?${queryParams.toString()}`);

            if (result.invoices && Array.isArray(result.invoices)) {
                setRows(result.invoices);
                setTotalEntries(result.total || 0);
                setTotalPages(result.pages || 1);
            } else if (Array.isArray(result)) {
                setRows(result);
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
        sessionStorage.setItem('lastPage_InvoiceList', page);
    }, [page]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchInvoices(search, page, pageSize, {
                customer: appliedFilter,
                startDate: appliedStartDate,
                endDate: appliedEndDate
            });
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, pageSize, appliedFilter, appliedStartDate, appliedEndDate]);

    const filteredRows = useMemo(() => {
        return rows;
    }, [rows]);

    const sortedRows = useMemo(() => {
        let sortableItems = [...filteredRows];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'totalAmount') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                } else if (sortConfig.key === 'invoiceDate') {
                    aValue = new Date(aValue).getTime();
                    bValue = new Date(bValue).getTime();
                } else {
                    aValue = aValue ? aValue.toString().toLowerCase() : '';
                    bValue = bValue ? bValue.toString().toLowerCase() : '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredRows, sortConfig]);

    const total = totalEntries;
    const safePage = page;

    const pagedRows = sortedRows;

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleCustomerClick = async (invoice) => {
        try {
            if (!invoice.customerId) {
                toast.error("Customer ID not found in invoice");
                return;
            }
            const customerData = await fetchApi(`/customer/by-customer-id/${invoice.customerId}`);
            if (customerData) {
                if (onNavigateToProfile) {
                    onNavigateToProfile(customerData);
                }
            } else {
                toast.error("Failed to fetch customer details");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            if (error.status !== 403) {
                toast.error("Server error");
            }
        }
    };

    const showingFrom = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
    const showingTo = Math.min(totalEntries, (page - 1) * pageSize + rows.length);

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [safePage, totalPages]);

    const onSubmitFilters = () => {
        let finalEndDate = draftEndDate;
        if (draftStartDate && !draftEndDate) {
            finalEndDate = new Date().toISOString().split('T')[0];
            setDraftEndDate(finalEndDate);
        }

        if (!draftStartDate && draftEndDate) {
            toast.error('Please enter Start Date');
            return;
        }

        setAppliedFilter(filterCustomer);
        setAppliedStartDate(draftStartDate);
        setAppliedEndDate(finalEndDate);
        setPage(1);
    };

    const onResetFilters = () => {
        setFilterCustomer('');
        setAppliedFilter('');
        setDraftStartDate('');
        setDraftEndDate('');
        setAppliedStartDate('');
        setAppliedEndDate('');
        setSearch('');
        setPage(1);
    };

    const toggleActive = async (id) => {
        try {
            const item = rows.find(r => r._id === id);
            await fetchApi(`/sales-invoice/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ active: !item.active })
            });

            setRows(prev => prev.map(r => r._id === id ? { ...r, active: !r.active } : r));
            toast.success(`Invoice ${!item.active ? 'Activated' : 'Deactivated'}`);
        } catch (error) {
            if (error.status !== 403) {
                toast.error("Failed to update status");
            }
        }
    };

    const deleteRow = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this invoice?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/sales-invoice/${id}`, { method: 'DELETE' });
                    setRows(prev => prev.filter(r => r._id !== id));
                    Swal.fire('Deleted!', 'Invoice has been deleted.', 'success');
                } catch (error) {
                    if (error.status !== 403) {
                        toast.error("Server error");
                    }
                }
            }
        });
    };

    const handleExcelDownload = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (appliedFilter) queryParams.append('customer', appliedFilter);
            if (appliedStartDate) queryParams.append('startDate', appliedStartDate);
            if (appliedEndDate) queryParams.append('endDate', appliedEndDate);

            const result = await fetchApi(`/sales-invoice?${queryParams.toString()}`);
            let invoicesToExport = [];
            if (result.invoices && Array.isArray(result.invoices)) {
                invoicesToExport = result.invoices;
            } else if (Array.isArray(result)) {
                invoicesToExport = result;
            }

            const worksheetData = invoicesToExport.map((r, index) => {
                const row = { 'No.': index + 1 };
                if (exportColumns.customerName) row['Customer Name'] = r.customerName;
                if (isSuperAdmin && exportColumns.companyName) row['Company Name'] = r.invoiceTypeName || r.invoiceCompanyName || '';
                if (exportColumns.customerState) row['Place of Supply'] = r.customerState || '';
                if (exportColumns.invoiceNo) row['Invoice No'] = r.invoiceNo;
                if (exportColumns.invoiceDate) row['Invoice Date'] = formatDateDDMMYYYY(r.invoiceDate);
                if (exportColumns.totalAmount) row['Total Amount'] = (parseFloat(r.totalAmount) * 1.18 || 0).toFixed(2);
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
            XLSX.writeFile(workbook, 'InvoiceList.xlsx');
        } catch (error) {
            console.error("Excel Download Error:", error);
            toast.error("Failed to download Excel");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (appliedFilter) queryParams.append('customer', appliedFilter);
            if (appliedStartDate) queryParams.append('startDate', appliedStartDate);
            if (appliedEndDate) queryParams.append('endDate', appliedEndDate);

            const result = await fetchApi(`/sales-invoice?${queryParams.toString()}`);
            let invoicesToPrint = [];
            if (result.invoices && Array.isArray(result.invoices)) {
                invoicesToPrint = result.invoices;
            } else if (Array.isArray(result)) {
                invoicesToPrint = result;
            }

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Invoice List</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
            printWindow.document.write('h1 { text-align: center; color: #0b3a54; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }');
            printWindow.document.write('th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }');
            printWindow.document.write('th { background-color: #dff5ea; color: #0b3a54; font-weight: 600; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h1>Invoice List</h1>');
            printWindow.document.write('<table><thead><tr>');
            printWindow.document.write('<th>No.</th>');
            if (exportColumns.customerName) printWindow.document.write('<th>Customer Name</th>');
            if (isSuperAdmin && exportColumns.companyName) printWindow.document.write('<th>Company Name</th>');
            if (exportColumns.customerState) printWindow.document.write('<th>Place of Supply</th>');
            if (exportColumns.invoiceNo) printWindow.document.write('<th>Invoice No</th>');
            if (exportColumns.invoiceDate) printWindow.document.write('<th>Invoice Date</th>');
            if (exportColumns.totalAmount) printWindow.document.write('<th>Total Amount</th>');
            printWindow.document.write('</tr></thead><tbody>');

            invoicesToPrint.forEach((r, index) => {
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${index + 1}</td>`);
                if (exportColumns.customerName) printWindow.document.write(`<td>${r.customerName || ''}</td>`);
                if (isSuperAdmin && exportColumns.companyName) {
                    printWindow.document.write(`<td>${r.invoiceTypeName || r.invoiceCompanyName || ''}</td>`);
                }
                if (exportColumns.customerState) printWindow.document.write(`<td>${r.customerState || ''}</td>`);
                if (exportColumns.invoiceNo) printWindow.document.write(`<td>${r.invoiceNo || ''}</td>`);
                if (exportColumns.invoiceDate) printWindow.document.write(`<td>${formatDateDDMMYYYY(r.invoiceDate)}</td>`);
                if (exportColumns.totalAmount) printWindow.document.write(`<td>${(parseFloat(r.totalAmount) * 1.18 || 0).toFixed(2)}</td>`);
                printWindow.document.write('</tr>');
            });
            printWindow.document.write('</tbody></table></body></html>');
            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            console.error("Print Error:", error);
            toast.error("Failed to print");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="list-page-container">
            {/* Header: Title and Action Buttons */}
            <div className="list-page-header">
                <h1 className="list-page-title">Invoice List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Invoice', 'report') && (
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
                    {hasPermission('Invoice', 'add') && (
                        <button
                            className="list-page-btn list-page-btn-add"
                            onClick={() => onAddInvoice && onAddInvoice()}
                        >
                            ADD INVOICE
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search and Filter */}
            <div className="list-page-toolbar">
                <SearchBar
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search invoices..."
                />

                <div className="list-page-filter-box">
                    <div className="list-page-filter-group">
                        <label className="list-page-filter-label">Start Date</label>
                        <AirDatePicker
                            className="list-page-filter-date"
                            value={draftStartDate}
                            onChange={(val) => setDraftStartDate(val)}
                            placeholder="Start Date"
                        />
                    </div>

                    <div className="list-page-filter-group">
                        <label className="list-page-filter-label">End Date</label>
                        <AirDatePicker
                            className="list-page-filter-date"
                            value={draftEndDate}
                            onChange={(val) => setDraftEndDate(val)}
                            placeholder="End Date"
                        />
                    </div>

                    <div className="list-page-filter-group">
                        <label className="list-page-filter-label">Customer</label>
                        <select
                            className="list-page-filter-select"
                            value={filterCustomer}
                            onChange={(e) => setFilterCustomer(e.target.value)}
                        >
                            <option value="">---Select Customer---</option>
                            {customers
                                .filter(c => c.customerTradeName || c.customerName)
                                .sort((a, b) => (a.customerTradeName || a.customerName).localeCompare(b.customerTradeName || b.customerName))
                                .map((c) => (
                                    <option key={c._id} value={c.customerTradeName || c.customerName}>
                                        {c.customerTradeName}{c.customerName ? ` (${c.customerName})` : ''}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <button className="list-page-btn list-page-btn-submit" onClick={onSubmitFilters}>
                        Submit
                    </button>
                    <button className="list-page-btn list-page-btn-reset" onClick={onResetFilters}>
                        Reset
                    </button>
                </div>
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('customerName')} style={{ cursor: 'pointer' }}>
                                CUSTOMER NAME {sortConfig.key === 'customerName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            {isSuperAdmin && (
                                <th onClick={() => requestSort('invoiceCompanyName')} style={{ cursor: 'pointer' }}>
                                    COMPANY NAME {sortConfig.key === 'invoiceCompanyName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                            )}
                            <th onClick={() => requestSort('customerState')} style={{ cursor: 'pointer' }}>
                                PLACE OF SUPPLY {sortConfig.key === 'customerState' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('invoiceNo')} style={{ cursor: 'pointer' }}>
                                INVOICE NO {sortConfig.key === 'invoiceNo' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('invoiceDate')} style={{ cursor: 'pointer' }}>
                                INVOICE DATE {sortConfig.key === 'invoiceDate' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('totalAmount')} style={{ cursor: 'pointer' }}>
                                TOTAL AMOUNT {sortConfig.key === 'totalAmount' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            {hasPermission('Invoice', 'view') && <th>PRINT</th>}
                            {(hasPermission('Invoice', 'update') || hasPermission('Invoice', 'delete')) && <th>ACTIONS</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {pagedRows.length === 0 ? (
                            <tr>
                                <td className="list-page-table-empty" colSpan={totalCols}>
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            pagedRows.map((r) => (
                                <tr key={r._id}>
                                    <td>
                                        <span
                                            style={{ color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}
                                            onClick={() => handleCustomerClick(r)}
                                        >
                                            {r.customerName}
                                        </span>
                                    </td>
                                    {isSuperAdmin && <td>{r.invoiceTypeName || r.invoiceCompanyName}</td>}
                                    <td>{r.customerState}</td>
                                    <td>{r.invoiceNo}</td>
                                    <td>{formatDateDDMMYYYY(r.invoiceDate)}</td>
                                    <td>{(parseFloat(r.totalAmount) * 1.18 || 0).toFixed(2)}</td>
                                    {hasPermission('Invoice', 'view') && (
                                        <td>
                                            <button
                                                type="button"
                                                className="list-page-icon-btn"
                                                title="Preview"
                                                onClick={() => onPreview && onPreview(r)}
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#2563eb"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                </svg>
                                            </button>
                                        </td>
                                    )}
                                    {(hasPermission('Invoice', 'update') || hasPermission('Invoice', 'delete')) && (
                                        <td>
                                            <div className="list-page-action-icons">
                                                {hasPermission('Invoice', 'update') && (
                                                    <button
                                                        type="button"
                                                        className="list-page-icon-btn"
                                                        title="Edit"
                                                        onClick={() => onEditInvoice && onEditInvoice(r)}
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#7c3aed"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                                {hasPermission('Invoice', 'delete') && (
                                                    <button
                                                        type="button"
                                                        className="list-page-icon-btn"
                                                        title="Delete"
                                                        onClick={() => deleteRow(r._id)}
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="#ef4444"
                                                            strokeWidth="2"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                                {hasPermission('Invoice', 'update') && (
                                                    <button
                                                        type="button"
                                                        className={`list-page-toggle ${r.active ? 'list-page-toggle-on' : ''}`}
                                                        onClick={() => toggleActive(r._id)}
                                                        title={r.active ? 'Active' : 'Inactive'}
                                                    >
                                                        <span className="list-page-toggle-dot" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
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
                            {Object.entries(columnLabels).map(([key, label]) => {
                                if (key === 'companyName' && !isSuperAdmin) return null;
                                return (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#333', cursor: 'pointer', padding: '4px' }}>
                                        <input
                                            type="checkbox"
                                            checked={exportColumns[key]}
                                            onChange={() => toggleExportColumn(key)}
                                            style={{ accentColor: '#06b6d4', width: '16px', height: '16px' }}
                                        />
                                        {label}
                                    </label>
                                );
                            })}
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
            )
            }
        </div >
    );
}

export default InvoiceList;

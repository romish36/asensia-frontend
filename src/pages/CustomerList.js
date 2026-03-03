import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import CustomerDetailsModal from '../components/modals/CustomerDetailsModal';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function CustomerList({ onNavigateToProfile, onAddCustomer, onEditCustomer }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [customerTypes, setCustomerTypes] = useState([]);
    const [filterType, setFilterType] = useState('');
    const [appliedType, setAppliedType] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCustomerForView, setSelectedCustomerForView] = useState(null);

    useEffect(() => {
        if (hasPermission('CustomerType', 'view')) {
            fetchCustomerTypes();
        }
    }, [hasPermission]);

    const fetchCustomerTypes = async () => {
        try {
            const types = await fetchApi('/customer-type');
            setCustomerTypes(types);
        } catch (error) {
            console.error("Fetch Types Error:", error);
        }
    };

    const fetchCustomers = async (searchQuery = '', currentPage = 1, limit = 10, typeId = '') => {
        try {
            if (!searchQuery) setLoading(true);
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (typeId) queryParams.append('customerType', typeId);
            queryParams.append('page', currentPage);
            queryParams.append('limit', limit);

            const data = await fetchApi(`/customer?${queryParams.toString()}`);
            if (data.customers && Array.isArray(data.customers)) {
                setRows(data.customers);
                setTotalEntries(data.total || 0);
                setTotalPages(data.pages || 1);
            } else if (Array.isArray(data)) {
                setRows(data);
                setTotalEntries(data.length);
                setTotalPages(Math.ceil(data.length / limit));
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
            fetchCustomers(search, page, pageSize, appliedType);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, pageSize, appliedType]);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const sortedRows = useMemo(() => {
        let sortableItems = [...rows];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                aValue = aValue ? aValue.toString().toLowerCase() : '';
                bValue = bValue ? bValue.toString().toLowerCase() : '';
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [rows, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const showingFrom = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
    const showingTo = Math.min(totalEntries, page * pageSize);

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, page - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [page, totalPages]);

    const onSubmitFilters = () => {
        setAppliedType(filterType);
        setPage(1);
    };

    const onResetFilters = () => {
        setFilterType('');
        setAppliedType('');
        setSearch('');
        setPage(1);
    };

    const [exportType, setExportType] = useState(''); // 'print' or 'excel'
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportColumns, setExportColumns] = useState({
        customerName: true,
        customerTradeName: true,
        customerReferenceName: true,
        customerMobileNumber: true,
        customerEmail: true,
        customerCountry: true,
        customerState: true,
        customerCity: true,
        customerPinCode: true,
        customerAddress: true,
        customerGst: true,
        customerPanNo: true,
        customerTypeId: true,
        saleTypeId: true,
        active: true,
        date: true,
        time: true
    });

    const columnLabels = {
        customerName: 'Customer Name',
        customerTradeName: 'Trade Name',
        customerReferenceName: 'Reference Name',
        customerMobileNumber: 'Mobile Number',
        customerEmail: 'Email',
        customerCountry: 'Country',
        customerState: 'State',
        customerCity: 'City',
        customerPinCode: 'Pin Code',
        customerAddress: 'Address',
        customerGst: 'GST',
        customerPanNo: 'PAN',
        customerTypeId: 'Customer Type',
        saleTypeId: 'Sale Type',
        active: 'Status',
        date: 'Date',
        time: 'Time'
    };

    const toggleExportColumn = (columnKey) => {
        setExportColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const toggleActive = (id) => {
        setRows((prev) => prev.map((r) => (r._id === id ? { ...r, active: !r.active } : r)));
    };

    const handleView = (customer) => {
        setSelectedCustomerForView(customer);
        setViewModalOpen(true);
    };

    const deleteRow = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this customer?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/customer/${id}`, { method: 'DELETE' });
                    if (true) {
                        setRows((prev) => prev.filter((r) => r._id !== id));
                        Swal.fire('Deleted!', 'Customer has been deleted.', 'success');
                    } else {
                        toast.error("Failed to delete customer");
                    }
                } catch (error) {
                    toast.error("Server error");
                }
            }
        });
    };


    const handleExcelDownload = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (appliedType) queryParams.append('customerType', appliedType);

            const allData = await fetchApi(`/customer?${queryParams.toString()}`);
            const customersToExport = Array.isArray(allData) ? allData : (allData.customers || []);

            const worksheetData = customersToExport.map((r, idx) => {
                const row = { 'No.': idx + 1 };
                if (exportColumns.customerName) row['Customer Name'] = r.customerName;
                if (exportColumns.customerTradeName) row['Trade Name'] = r.customerTradeName;
                if (exportColumns.customerReferenceName) row['Reference Name'] = r.customerReferenceName || '-';
                if (exportColumns.customerMobileNumber) row['Mobile Number'] = r.customerMobileNumber;
                if (exportColumns.customerEmail) row['Email'] = r.customerEmail;
                if (exportColumns.customerCountry) row['Country'] = r.customerCountry || '-';
                if (exportColumns.customerState) row['State'] = r.customerState || '-';
                if (exportColumns.customerCity) row['City'] = r.customerCity || '-';
                if (exportColumns.customerPinCode) row['Pin Code'] = r.customerPinCode || '-';
                if (exportColumns.customerAddress) row['Address'] = r.customerAddress || '-';
                if (exportColumns.customerGst) row['GST'] = r.customerGst;
                if (exportColumns.customerPanNo) row['PAN'] = r.customerPanNo || '-';
                if (exportColumns.customerTypeId) row['Customer Type'] = r.customerTypeId?.customerTypeName || '';
                if (exportColumns.saleTypeId) row['Sale Type'] = r.saleTypeId?.saleTypeName || '';
                if (exportColumns.active) row['Status'] = r.active ? 'Active' : 'Inactive';
                if (exportColumns.date) row['Date'] = r.date || '';
                if (exportColumns.time) row['Time'] = r.time || '';
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
            XLSX.writeFile(workbook, 'CustomerList.xlsx');
        } catch (error) {
            console.error("Excel download error:", error);
            toast.error("Failed to fetch data for Excel export");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (appliedType) queryParams.append('customerType', appliedType);

            const allData = await fetchApi(`/customer?${queryParams.toString()}`);
            const customersToPrint = Array.isArray(allData) ? allData : (allData.customers || []);

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Customer List</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('@page { size: A4 portrait; margin: 10mm; }');
            printWindow.document.write('body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }');
            printWindow.document.write('h1 { text-align: center; color: #0b3a54; font-size: 16px; margin-bottom: 10px; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: auto; }');
            printWindow.document.write('th, td { border: 1px solid #ccc; padding: 4px 2px; text-align: left; font-size: 7.5px; word-break: break-word; }');
            printWindow.document.write('th { background-color: #f0fdf4; color: #0b3a54; font-weight: 700; text-transform: uppercase; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h1>Customer List</h1>');
            printWindow.document.write('<table><thead><tr>');

            printWindow.document.write('<th>No.</th>');
            if (exportColumns.customerName) printWindow.document.write('<th>Customer Name</th>');
            if (exportColumns.customerTradeName) printWindow.document.write('<th>Trade Name</th>');
            if (exportColumns.customerReferenceName) printWindow.document.write('<th>Reference Name</th>');
            if (exportColumns.customerMobileNumber) printWindow.document.write('<th>Mobile Number</th>');
            if (exportColumns.customerEmail) printWindow.document.write('<th>Email</th>');
            if (exportColumns.customerCountry) printWindow.document.write('<th>Country</th>');
            if (exportColumns.customerState) printWindow.document.write('<th>State</th>');
            if (exportColumns.customerCity) printWindow.document.write('<th>City</th>');
            if (exportColumns.customerPinCode) printWindow.document.write('<th>Pin Code</th>');
            if (exportColumns.customerAddress) printWindow.document.write('<th>Address</th>');
            if (exportColumns.customerGst) printWindow.document.write('<th>GST</th>');
            if (exportColumns.customerPanNo) printWindow.document.write('<th>PAN</th>');
            if (exportColumns.customerTypeId) printWindow.document.write('<th>Customer Type</th>');
            if (exportColumns.saleTypeId) printWindow.document.write('<th>Sale Type</th>');
            if (exportColumns.active) printWindow.document.write('<th>Status</th>');
            if (exportColumns.date) printWindow.document.write('<th>Date</th>');
            if (exportColumns.time) printWindow.document.write('<th>Time</th>');

            printWindow.document.write('</tr></thead><tbody>');

            customersToPrint.forEach((r, index) => {
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${index + 1}</td>`);
                if (exportColumns.customerName) printWindow.document.write(`<td>${r.customerName || ''}</td>`);
                if (exportColumns.customerTradeName) printWindow.document.write(`<td>${r.customerTradeName || ''}</td>`);
                if (exportColumns.customerReferenceName) printWindow.document.write(`<td>${r.customerReferenceName || '-'}</td>`);
                if (exportColumns.customerMobileNumber) printWindow.document.write(`<td>${r.customerMobileNumber || ''}</td>`);
                if (exportColumns.customerEmail) printWindow.document.write(`<td>${r.customerEmail || ''}</td>`);
                if (exportColumns.customerCountry) printWindow.document.write(`<td>${r.customerCountry || '-'}</td>`);
                if (exportColumns.customerState) printWindow.document.write(`<td>${r.customerState || '-'}</td>`);
                if (exportColumns.customerCity) printWindow.document.write(`<td>${r.customerCity || '-'}</td>`);
                if (exportColumns.customerPinCode) printWindow.document.write(`<td>${r.customerPinCode || '-'}</td>`);
                if (exportColumns.customerAddress) printWindow.document.write(`<td>${r.customerAddress || '-'}</td>`);
                if (exportColumns.customerGst) printWindow.document.write(`<td>${r.customerGst || ''}</td>`);
                if (exportColumns.customerPanNo) printWindow.document.write(`<td>${r.customerPanNo || '-'}</td>`);
                if (exportColumns.customerTypeId) printWindow.document.write(`<td>${r.customerTypeId?.customerTypeName || ''}</td>`);
                if (exportColumns.saleTypeId) printWindow.document.write(`<td>${r.saleTypeId?.saleTypeName || ''}</td>`);
                if (exportColumns.active) printWindow.document.write(`<td>${r.active ? 'Active' : 'Inactive'}</td>`);
                if (exportColumns.date) printWindow.document.write(`<td>${r.date || ''}</td>`);
                if (exportColumns.time) printWindow.document.write(`<td>${r.time || ''}</td>`);
                printWindow.document.write('</tr>');
            });

            printWindow.document.write('</tbody></table></body></html>');
            printWindow.document.close();
            printWindow.print();
        } catch (error) {
            console.error("Print error:", error);
            toast.error("Failed to fetch data for printing");
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
                <h1 className="list-page-title">Customer List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Customer', 'report') && (
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
                    {hasPermission('Customer', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={() => onAddCustomer && onAddCustomer()}>
                            ADD SINGLE CUSTOMER
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
                    placeholder="Search customers..."
                />

                <div className="list-page-filter-box">
                    <div className="list-page-filter-group">
                        <label className="list-page-filter-label">Filter:</label>
                        <select
                            className="list-page-filter-input"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="">---Select Type---</option>
                            {customerTypes.map((t) => (
                                <option key={t._id} value={t._id}>
                                    {t.customerTypeName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button className="list-page-btn list-page-btn-submit" onClick={onSubmitFilters}>
                        SUBMIT
                    </button>
                    <button className="list-page-btn list-page-btn-reset" onClick={onResetFilters}>
                        RESET
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
                            <th onClick={() => requestSort('customerTradeName')} style={{ cursor: 'pointer' }}>
                                TRADE NAME {sortConfig.key === 'customerTradeName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('customerMobileNumber')} style={{ cursor: 'pointer' }}>
                                MOBILE NUMBER {sortConfig.key === 'customerMobileNumber' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('customerEmail')} style={{ cursor: 'pointer' }}>
                                EMAIL {sortConfig.key === 'customerEmail' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('customerGst')} style={{ cursor: 'pointer' }}>
                                GST {sortConfig.key === 'customerGst' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('customerTypeId')} style={{ cursor: 'pointer' }}>
                                CUSTOMER TYPE {sortConfig.key === 'customerTypeId' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('saleTypeId')} style={{ cursor: 'pointer' }}>
                                SALE TYPE {sortConfig.key === 'saleTypeId' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.length === 0 ? (
                            <tr>
                                <td className="list-page-table-empty" colSpan={8}>
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            sortedRows.map((r) => (
                                <tr key={r._id} onDoubleClick={() => onNavigateToProfile && onNavigateToProfile(r)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <span className="profile-link" onClick={() => onNavigateToProfile && onNavigateToProfile(r)}>
                                            {r.customerName}
                                        </span>
                                    </td>
                                    <td>{r.customerTradeName}</td>
                                    <td>{r.customerMobileNumber}</td>
                                    <td>{r.customerEmail}</td>
                                    <td>{r.customerGst}</td>
                                    <td>{r.customerTypeId?.customerTypeName}</td>
                                    <td>{r.saleTypeId?.saleTypeName}</td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Customer', 'view') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="View"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleView(r);
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('Customer', 'update') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditCustomer && onEditCustomer(r);
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('Customer', 'delete') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteRow(r._id);
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('Customer', 'update') && (
                                                <button
                                                    type="button"
                                                    className={`list-page-toggle ${r.active ? 'list-page-toggle-on' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleActive(r._id);
                                                    }}
                                                    title={r.active ? 'Active' : 'Inactive'}
                                                >
                                                    <span className="list-page-toggle-dot" />
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
                    Showing {showingFrom} to {showingTo} of {totalEntries} entries
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

            <CustomerDetailsModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                customer={selectedCustomerForView}
            />
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
        </div >
    );
}

export default CustomerList;

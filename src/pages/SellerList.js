import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import SellerDetailsModal from '../components/modals/SellerDetailsModal';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



const SAMPLE_DATA = [
    {
        id: 1,
        tradeName: 'MAA ENTERPRISE',
        name: 'MAA ENTERPRISE',
        gst: '24ACDFM3629E1ZI',
        email: 'info@maaenterprise.com',
        mobileNumber: '+91 99887 76655',
        panNo: 'ACDFM3629E',
        city: 'Morbi',
        state: 'Gujarat',
        country: 'India',
        pinCode: '363641',
        stateCode: '24',
        address: 'B-HARIVAL TRADE CENTER, WANKANER-MORBI HIGHWAY, WANKANER, MORBI',
        active: true,
        sellerType: 'Corporate',
        prefix: 'GT',
        bankName: 'HDFC BANK',
        accountName: 'MAA ENTERPRISE',
        accountNo: '50200012345678',
        ifscCode: 'HDFC0001234',
        cinNumber: 'U12345GJ2020PTC123456',
        bankAddress: 'MORBI BRANCH, GUJARAT'
    },
    {
        id: 2,
        tradeName: 'BRIJ IMPEX',
        name: 'BRIJ IMPEX',
        gst: '24AABCB1234E1Z5',
        email: 'sales@brijimpex.com',
        mobileNumber: '+91 91234 56789',
        panNo: 'AABCB1234E',
        city: 'Rajkot',
        state: 'Gujarat',
        country: 'India',
        pinCode: '360001',
        stateCode: '24',
        address: 'Plot No. 45, GIDC Phase III, Rajkot, Gujarat',
        active: true,
        sellerType: 'Partnership',
        prefix: 'BJ',
        bankName: 'ICICI BANK',
        accountName: 'BRIJ IMPEX',
        accountNo: '001122334455',
        ifscCode: 'ICIC0001234',
        cinNumber: '',
        bankAddress: 'RAJKOT MAIN BRANCH'
    },
];

function SellerList({ onNavigateToProfile, onAddSeller, onEditSeller }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const token = sessionStorage.getItem('token');
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
    const [selectedSellerForView, setSelectedSellerForView] = useState(null);

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

    const fetchSellers = async (searchQuery = '', currentPage = 1, limit = 10, typeId = '') => {
        try {
            if (!searchQuery) setLoading(true);
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (typeId) queryParams.append('sellerType', typeId);
            queryParams.append('page', currentPage);
            queryParams.append('limit', limit);

            const data = await fetchApi(`/seller?${queryParams.toString()}`);
            if (data.sellers && Array.isArray(data.sellers)) {
                setRows(data.sellers);
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
            fetchSellers(search, page, pageSize, appliedType);
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
        sellerTradeName: true,
        sellerName: true,
        sellerPrefix: true,
        sellerMobileNumber: true,
        sellerEmail: true,
        sellerGstNumber: true,
        sellerPanCardNumber: true,
        sellerCinNumber: true,
        sellerCountry: true,
        sellerState: true,
        sellerCity: true,
        sellerPinCode: true,
        sellerAddress: true,
        sellerBankName: true,
        sellerAccountNo: true,
        sellerIfscCode: true,
        sellerTypeId: true,
        active: true,
        date: true,
        time: true
    });

    const columnLabels = {
        sellerTradeName: 'Trade Name',
        sellerName: 'Seller Name',
        sellerPrefix: 'Prefix',
        sellerMobileNumber: 'Mobile Number',
        sellerEmail: 'Email',
        sellerGstNumber: 'GST',
        sellerPanCardNumber: 'PAN',
        sellerCinNumber: 'CIN',
        sellerCountry: 'Country',
        sellerState: 'State',
        sellerCity: 'City',
        sellerPinCode: 'Pin Code',
        sellerAddress: 'Address',
        sellerBankName: 'Bank Name',
        sellerAccountNo: 'Account No',
        sellerIfscCode: 'IFSC',
        sellerTypeId: 'Seller Type',
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

    const toggleActive = async (id) => {
        try {
            const seller = rows.find(r => r._id === id);
            const response = await fetch(`${API_BASE_URL}/seller`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ active: !seller.active })
            });

            if (response.ok) {
                setRows((prev) => prev.map((r) => (r._id === id ? { ...r, active: !r.active } : r)));
                toast.success(`Seller ${!seller.active ? 'Activated' : 'Deactivated'}`);
            } else {
                toast.error("Failed to update status");
            }
        } catch (error) {
            toast.error("Server error");
        }
    };

    const handleView = (seller) => {
        setSelectedSellerForView(seller);
        setViewModalOpen(true);
    };

    const deleteRow = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this seller?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/seller/${id}`, { method: 'DELETE' });
                    if (true) {
                        setRows((prev) => prev.filter((r) => r._id !== id));
                        Swal.fire('Deleted!', 'Seller has been deleted.', 'success');
                    } else {
                        Swal.fire('Error!', 'Failed to delete seller.', 'error');
                    }
                } catch (error) {
                    Swal.fire('Error!', 'Server error.', 'error');
                }
            }
        });
    };

    const handleExcelDownload = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (appliedType) queryParams.append('sellerType', appliedType);

            const allData = await fetchApi(`/seller?${queryParams.toString()}`);
            const sellersToExport = Array.isArray(allData) ? allData : (allData.sellers || []);

            const worksheetData = sellersToExport.map((r, idx) => {
                const row = { 'No.': idx + 1 };
                if (exportColumns.sellerTradeName) row['Trade Name'] = r.sellerTradeName;
                if (exportColumns.sellerName) row['Seller Name'] = r.sellerName;
                if (exportColumns.sellerPrefix) row['Prefix'] = r.sellerPrefix || '-';
                if (exportColumns.sellerMobileNumber) row['Mobile Number'] = r.sellerMobileNumber;
                if (exportColumns.sellerEmail) row['Email'] = r.sellerEmail;
                if (exportColumns.sellerGstNumber) row['GST'] = r.sellerGstNumber;
                if (exportColumns.sellerPanCardNumber) row['PAN'] = r.sellerPanCardNumber || '-';
                if (exportColumns.sellerCinNumber) row['CIN'] = r.sellerCinNumber || '-';
                if (exportColumns.sellerCountry) row['Country'] = r.sellerCountry || '-';
                if (exportColumns.sellerState) row['State'] = r.sellerState || '-';
                if (exportColumns.sellerCity) row['City'] = r.sellerCity || '-';
                if (exportColumns.sellerPinCode) row['Pin Code'] = r.sellerPinCode || '-';
                if (exportColumns.sellerAddress) row['Address'] = r.sellerAddress || '-';
                if (exportColumns.sellerBankName) row['Bank Name'] = r.sellerBankName || '-';
                if (exportColumns.sellerAccountNo) row['Account No'] = r.sellerAccountNo || '-';
                if (exportColumns.sellerIfscCode) row['IFSC'] = r.sellerIfscCode || '-';
                if (exportColumns.sellerTypeId) row['Seller Type'] = r.sellerTypeId?.customerTypeName || '';
                if (exportColumns.active) row['Status'] = r.active ? 'Active' : 'Inactive';
                if (exportColumns.date) row['Date'] = r.date || '';
                if (exportColumns.time) row['Time'] = r.time || '';
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sellers');
            XLSX.writeFile(workbook, 'SellerList.xlsx');
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
            if (appliedType) queryParams.append('sellerType', appliedType);

            const allData = await fetchApi(`/seller?${queryParams.toString()}`);
            const sellersToPrint = Array.isArray(allData) ? allData : (allData.sellers || []);

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Seller List</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('@page { size: A4 portrait; margin: 10mm; }');
            printWindow.document.write('body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }');
            printWindow.document.write('h1 { text-align: center; color: #0b3a54; font-size: 16px; margin-bottom: 10px; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: auto; }');
            printWindow.document.write('th, td { border: 1px solid #ccc; padding: 4px 2px; text-align: left; font-size: 7.5px; word-break: break-word; }');
            printWindow.document.write('th { background-color: #f0fdf4; color: #0b3a54; font-weight: 700; text-transform: uppercase; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h1>Seller List</h1>');
            printWindow.document.write('<table><thead><tr>');

            printWindow.document.write('<th>No.</th>');
            if (exportColumns.sellerTradeName) printWindow.document.write('<th>Trade Name</th>');
            if (exportColumns.sellerName) printWindow.document.write('<th>Seller Name</th>');
            if (exportColumns.sellerPrefix) printWindow.document.write('<th>Prefix</th>');
            if (exportColumns.sellerMobileNumber) printWindow.document.write('<th>Mobile Number</th>');
            if (exportColumns.sellerEmail) printWindow.document.write('<th>Email</th>');
            if (exportColumns.sellerGstNumber) printWindow.document.write('<th>GST</th>');
            if (exportColumns.sellerPanCardNumber) printWindow.document.write('<th>PAN</th>');
            if (exportColumns.sellerCinNumber) printWindow.document.write('<th>CIN</th>');
            if (exportColumns.sellerCountry) printWindow.document.write('<th>Country</th>');
            if (exportColumns.sellerState) printWindow.document.write('<th>State</th>');
            if (exportColumns.sellerCity) printWindow.document.write('<th>City</th>');
            if (exportColumns.sellerPinCode) printWindow.document.write('<th>Pin Code</th>');
            if (exportColumns.sellerAddress) printWindow.document.write('<th>Address</th>');
            if (exportColumns.sellerBankName) printWindow.document.write('<th>Bank Name</th>');
            if (exportColumns.sellerAccountNo) printWindow.document.write('<th>Account No</th>');
            if (exportColumns.sellerIfscCode) printWindow.document.write('<th>IFSC</th>');
            if (exportColumns.sellerTypeId) printWindow.document.write('<th>Seller Type</th>');
            if (exportColumns.active) printWindow.document.write('<th>Status</th>');
            if (exportColumns.date) printWindow.document.write('<th>Date</th>');
            if (exportColumns.time) printWindow.document.write('<th>Time</th>');

            printWindow.document.write('</tr></thead><tbody>');

            sellersToPrint.forEach((r, index) => {
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${index + 1}</td>`);
                if (exportColumns.sellerTradeName) printWindow.document.write(`<td>${r.sellerTradeName || ''}</td>`);
                if (exportColumns.sellerName) printWindow.document.write(`<td>${r.sellerName || ''}</td>`);
                if (exportColumns.sellerPrefix) printWindow.document.write(`<td>${r.sellerPrefix || '-'}</td>`);
                if (exportColumns.sellerMobileNumber) printWindow.document.write(`<td>${r.sellerMobileNumber || ''}</td>`);
                if (exportColumns.sellerEmail) printWindow.document.write(`<td>${r.sellerEmail || ''}</td>`);
                if (exportColumns.sellerGstNumber) printWindow.document.write(`<td>${r.sellerGstNumber || ''}</td>`);
                if (exportColumns.sellerPanCardNumber) printWindow.document.write(`<td>${r.sellerPanCardNumber || '-'}</td>`);
                if (exportColumns.sellerCinNumber) printWindow.document.write(`<td>${r.sellerCinNumber || '-'}</td>`);
                if (exportColumns.sellerCountry) printWindow.document.write(`<td>${r.sellerCountry || '-'}</td>`);
                if (exportColumns.sellerState) printWindow.document.write(`<td>${r.sellerState || '-'}</td>`);
                if (exportColumns.sellerCity) printWindow.document.write(`<td>${r.sellerCity || '-'}</td>`);
                if (exportColumns.sellerPinCode) printWindow.document.write(`<td>${r.sellerPinCode || '-'}</td>`);
                if (exportColumns.sellerAddress) printWindow.document.write(`<td>${r.sellerAddress || '-'}</td>`);
                if (exportColumns.sellerBankName) printWindow.document.write(`<td>${r.sellerBankName || '-'}</td>`);
                if (exportColumns.sellerAccountNo) printWindow.document.write(`<td>${r.sellerAccountNo || '-'}</td>`);
                if (exportColumns.sellerIfscCode) printWindow.document.write(`<td>${r.sellerIfscCode || '-'}</td>`);
                if (exportColumns.sellerTypeId) printWindow.document.write(`<td>${r.sellerTypeId?.customerTypeName || ''}</td>`);
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
                <h1 className="list-page-title">Seller List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Seller', 'report') && (
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
                    {hasPermission('Seller', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={() => onAddSeller && onAddSeller()}>
                            ADD SINGLE SELLER
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
                    placeholder="Search sellers..."
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
                            <th onClick={() => requestSort('sellerTradeName')} style={{ cursor: 'pointer' }}>
                                TRADE NAME {sortConfig.key === 'sellerTradeName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('sellerName')} style={{ cursor: 'pointer' }}>
                                BUYER {sortConfig.key === 'sellerName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('sellerMobileNumber')} style={{ cursor: 'pointer' }}>
                                MOBILE NUMBER {sortConfig.key === 'sellerMobileNumber' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('sellerEmail')} style={{ cursor: 'pointer' }}>
                                EMAIL {sortConfig.key === 'sellerEmail' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('sellerGstNumber')} style={{ cursor: 'pointer' }}>
                                GST {sortConfig.key === 'sellerGstNumber' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('sellerTypeId')} style={{ cursor: 'pointer' }}>
                                BUYER TYPE {sortConfig.key === 'sellerTypeId' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.length === 0 ? (
                            <tr>
                                <td className="list-page-table-empty" colSpan={7}>
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            sortedRows.map((r) => (
                                <tr key={r._id} onDoubleClick={() => onNavigateToProfile && onNavigateToProfile(r)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <span className="profile-link" onClick={() => onNavigateToProfile && onNavigateToProfile(r)}>
                                            {r.sellerTradeName}
                                        </span>
                                    </td>
                                    <td>{r.sellerName}</td>
                                    <td>{r.sellerMobileNumber}</td>
                                    <td>{r.sellerEmail}</td>
                                    <td>{r.sellerGstNumber}</td>
                                    <td>{r.sellerTypeId?.customerTypeName}</td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Seller', 'view') && (
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
                                            {hasPermission('Seller', 'update') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Edit"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEditSeller && onEditSeller(r);
                                                    }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('Seller', 'delete') && (
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
                                            {hasPermission('Seller', 'update') && (
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

            <SellerDetailsModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                seller={selectedSellerForView}
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

export default SellerList;

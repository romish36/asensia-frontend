import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import TransporterDetailsModal from '../components/modals/TransporterDetailsModal';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function TransporterList({ onNavigateToProfile, onAddTransporter, onEditTransporter }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [appliedType, setAppliedType] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(() => {
        const savedPage = sessionStorage.getItem('lastPage_TransporterList');
        return savedPage ? parseInt(savedPage) : 1;
    });
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedTransporterForView, setSelectedTransporterForView] = useState(null);

    // Fetch Transporters


    const fetchTransporters = async (searchQuery = '', currentPage = 1, limit = 10, typeId = '') => {
        try {
            if (!searchQuery) setLoading(true);
            const queryParams = new URLSearchParams();
            if (searchQuery) queryParams.append('search', searchQuery);
            if (typeId) queryParams.append('transporterType', typeId);
            queryParams.append('page', currentPage);
            queryParams.append('limit', limit);

            const data = await fetchApi(`/transporter?${queryParams.toString()}`);
            if (data.transporters && Array.isArray(data.transporters)) {
                setRows(data.transporters);
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
        sessionStorage.setItem('lastPage_TransporterList', page);
    }, [page]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchTransporters(search, page, pageSize, appliedType);
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
        transporterName: true,
        transporterTradeName: true,
        transporterReferenceName: true,
        transporterMobileNumber: true,
        transporterEmail: true,
        transporterCountry: true,
        transporterState: true,
        transporterCity: true,
        transporterPinCode: true,
        transporterAddress: true,
        transporterGst: true,
        transporterPanNo: true,
        transporterType: true,
        active: true,
        date: true,
        time: true
    });

    const columnLabels = {
        transporterName: 'Name',
        transporterTradeName: 'Trade Name',
        transporterReferenceName: 'Reference Name',
        transporterMobileNumber: 'Mobile Number',
        transporterEmail: 'Email',
        transporterCountry: 'Country',
        transporterState: 'State',
        transporterCity: 'City',
        transporterPinCode: 'Pin Code',
        transporterAddress: 'Address',
        transporterGst: 'GST',
        transporterPanNo: 'PAN',
        transporterType: 'Transporter Type',
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
        // TBD: Backend doesn't explicitly store status yet, or assumes active/inactive logic.
        // If "active" status is needed, update model or assume all are active.
        // For now, toggle logic locally to prevent crash, or mock API call.
        setRows((prev) => prev.map((r) => (r._id === id ? { ...r, active: !r.active } : r)));
    };

    const handleView = (transporter) => {
        setSelectedTransporterForView(transporter);
        setViewModalOpen(true);
    };

    const deleteRow = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this transporter?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await fetchApi(`/transporter/${id}`, { method: 'DELETE' });
                    setRows((prev) => prev.filter((r) => r._id !== id));
                    Swal.fire('Deleted!', 'Transporter has been deleted.', 'success');
                } catch (error) {
                    console.error("Delete Error:", error);
                    toast.error(error.message || "Failed to delete transporter");
                }
            }
        });
    };

    const handleExcelDownload = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (appliedType) queryParams.append('transporterType', appliedType);

            const allData = await fetchApi(`/transporter?${queryParams.toString()}`);
            const transportersToExport = Array.isArray(allData) ? allData : (allData.transporters || []);

            const worksheetData = transportersToExport.map((r, idx) => {
                const row = { 'No.': idx + 1 };
                if (exportColumns.transporterName) row['Name'] = r.transporterName;
                if (exportColumns.transporterTradeName) row['Trade Name'] = r.transporterTradeName;
                if (exportColumns.transporterReferenceName) row['Reference Name'] = r.transporterReferenceName || '-';
                if (exportColumns.transporterMobileNumber) row['Mobile Number'] = r.transporterMobileNumber;
                if (exportColumns.transporterEmail) row['Email'] = r.transporterEmail;
                if (exportColumns.transporterCountry) row['Country'] = r.transporterCountry || '-';
                if (exportColumns.transporterState) row['State'] = r.transporterState || '-';
                if (exportColumns.transporterCity) row['City'] = r.transporterCity || '-';
                if (exportColumns.transporterPinCode) row['Pin Code'] = r.transporterPinCode || '-';
                if (exportColumns.transporterAddress) row['Address'] = r.transporterAddress || '-';
                if (exportColumns.transporterGst) row['GST'] = r.transporterGst;
                if (exportColumns.transporterPanNo) row['PAN'] = r.transporterPanNo || '-';
                if (exportColumns.transporterType) row['Transporter Type'] = r.transporterType || '';
                if (exportColumns.active) row['Status'] = r.active ? 'Active' : 'Inactive';
                if (exportColumns.date) row['Date'] = r.date || '';
                if (exportColumns.time) row['Time'] = r.time || '';
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transporters');
            XLSX.writeFile(workbook, 'TransporterList.xlsx');
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
            if (appliedType) queryParams.append('transporterType', appliedType);

            const allData = await fetchApi(`/transporter?${queryParams.toString()}`);
            const transportersToPrint = Array.isArray(allData) ? allData : (allData.transporters || []);

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Transporter List</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('@page { size: A4 portrait; margin: 10mm; }');
            printWindow.document.write('body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }');
            printWindow.document.write('h1 { text-align: center; color: #0b3a54; font-size: 16px; margin-bottom: 10px; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: auto; }');
            printWindow.document.write('th, td { border: 1px solid #ccc; padding: 4px 2px; text-align: left; font-size: 7.5px; word-break: break-word; }');
            printWindow.document.write('th { background-color: #f0fdf4; color: #0b3a54; font-weight: 700; text-transform: uppercase; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h1>Transporter List</h1>');
            printWindow.document.write('<table><thead><tr>');

            printWindow.document.write('<th>No.</th>');
            if (exportColumns.transporterName) printWindow.document.write('<th>Name</th>');
            if (exportColumns.transporterTradeName) printWindow.document.write('<th>Trade Name</th>');
            if (exportColumns.transporterReferenceName) printWindow.document.write('<th>Reference Name</th>');
            if (exportColumns.transporterMobileNumber) printWindow.document.write('<th>Mobile Number</th>');
            if (exportColumns.transporterEmail) printWindow.document.write('<th>Email</th>');
            if (exportColumns.transporterCountry) printWindow.document.write('<th>Country</th>');
            if (exportColumns.transporterState) printWindow.document.write('<th>State</th>');
            if (exportColumns.transporterCity) printWindow.document.write('<th>City</th>');
            if (exportColumns.transporterPinCode) printWindow.document.write('<th>Pin Code</th>');
            if (exportColumns.transporterAddress) printWindow.document.write('<th>Address</th>');
            if (exportColumns.transporterGst) printWindow.document.write('<th>GST</th>');
            if (exportColumns.transporterPanNo) printWindow.document.write('<th>PAN</th>');
            if (exportColumns.transporterType) printWindow.document.write('<th>Transporter Type</th>');
            if (exportColumns.active) printWindow.document.write('<th>Status</th>');
            if (exportColumns.date) printWindow.document.write('<th>Date</th>');
            if (exportColumns.time) printWindow.document.write('<th>Time</th>');

            printWindow.document.write('</tr></thead><tbody>');

            transportersToPrint.forEach((r, index) => {
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${index + 1}</td>`);
                if (exportColumns.transporterName) printWindow.document.write(`<td>${r.transporterName || ''}</td>`);
                if (exportColumns.transporterTradeName) printWindow.document.write(`<td>${r.transporterTradeName || ''}</td>`);
                if (exportColumns.transporterReferenceName) printWindow.document.write(`<td>${r.transporterReferenceName || '-'}</td>`);
                if (exportColumns.transporterMobileNumber) printWindow.document.write(`<td>${r.transporterMobileNumber || ''}</td>`);
                if (exportColumns.transporterEmail) printWindow.document.write(`<td>${r.transporterEmail || ''}</td>`);
                if (exportColumns.transporterCountry) printWindow.document.write(`<td>${r.transporterCountry || '-'}</td>`);
                if (exportColumns.transporterState) printWindow.document.write(`<td>${r.transporterState || '-'}</td>`);
                if (exportColumns.transporterCity) printWindow.document.write(`<td>${r.transporterCity || '-'}</td>`);
                if (exportColumns.transporterPinCode) printWindow.document.write(`<td>${r.transporterPinCode || '-'}</td>`);
                if (exportColumns.transporterAddress) printWindow.document.write(`<td>${r.transporterAddress || '-'}</td>`);
                if (exportColumns.transporterGst) printWindow.document.write(`<td>${r.transporterGst || ''}</td>`);
                if (exportColumns.transporterPanNo) printWindow.document.write(`<td>${r.transporterPanNo || '-'}</td>`);
                if (exportColumns.transporterType) printWindow.document.write(`<td>${r.transporterType || ''}</td>`);
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
            <div className="list-page-header">
                <h1 className="list-page-title">Transporter List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Transporter', 'report') && (
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
                    {hasPermission('Transporter', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={() => onAddTransporter && onAddTransporter()}>ADD SINGLE TRANSPORTER</button>
                    )}
                </div>
            </div>

            <div className="list-page-toolbar">
                <SearchBar
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search transporters..."
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
                            <option value="Corporate">Corporate</option>
                            <option value="Individual">Individual</option>
                            <option value="Regular">Regular</option>
                        </select>
                    </div>
                    <button className="list-page-btn list-page-btn-submit" onClick={onSubmitFilters}>SUBMIT</button>
                    <button className="list-page-btn list-page-btn-reset" onClick={onResetFilters}>RESET</button>
                </div>
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('transporterName')} style={{ cursor: 'pointer' }}>
                                NAME {sortConfig.key === 'transporterName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('transporterTradeName')} style={{ cursor: 'pointer' }}>
                                TRADE NAME {sortConfig.key === 'transporterTradeName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('transporterMobileNumber')} style={{ cursor: 'pointer' }}>
                                MOBILE NUMBER {sortConfig.key === 'transporterMobileNumber' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('transporterEmail')} style={{ cursor: 'pointer' }}>
                                EMAIL {sortConfig.key === 'transporterEmail' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('transporterGst')} style={{ cursor: 'pointer' }}>
                                GST {sortConfig.key === 'transporterGst' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('transporterType')} style={{ cursor: 'pointer' }}>
                                TRANSPORTER TYPE {sortConfig.key === 'transporterType' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.length === 0 ? (
                            <tr><td className="list-page-table-empty" colSpan={7}>No records found</td></tr>
                        ) : (
                            sortedRows.map((r) => (
                                <tr key={r._id} onDoubleClick={() => onNavigateToProfile && onNavigateToProfile(r)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <span className="profile-link" onClick={() => onNavigateToProfile && onNavigateToProfile(r)}>
                                            {r.transporterName}
                                        </span>
                                    </td>
                                    <td>{r.transporterTradeName}</td>
                                    <td>{r.transporterMobileNumber}</td>
                                    <td>{r.transporterEmail}</td>
                                    <td>{r.transporterGst}</td>
                                    <td>{r.transporterType}</td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Transporter', 'view') && (
                                                <button type="button" className="list-page-icon-btn" title="View" onClick={(e) => { e.stopPropagation(); handleView(r); }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </button>
                                            )}
                                            {hasPermission('Transporter', 'update') && (
                                                <button type="button" className="list-page-icon-btn" title="Edit" onClick={(e) => { e.stopPropagation(); onEditTransporter && onEditTransporter(r); }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                            )}
                                            {hasPermission('Transporter', 'delete') && (
                                                <button type="button" className="list-page-icon-btn" title="Delete" onClick={(e) => { e.stopPropagation(); deleteRow(r._id); }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
                    <select className="list-page-entries-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                </div>
                <div className="list-page-info">Showing {showingFrom} to {showingTo} of {totalEntries} entries</div>
                <div className="list-page-pagination">
                    <button type="button" className="list-page-page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                    {pages.map((p) => (
                        <button key={p} type="button" className={`list-page-page-num ${p === page ? 'list-page-page-num-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button type="button" className="list-page-btn list-page-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                </div>
            </div>

            <TransporterDetailsModal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                transporter={selectedTransporterForView}
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

export default TransporterList;

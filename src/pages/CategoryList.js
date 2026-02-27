import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/apiConfig.js';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';



function CategoryList({ onAddCategory, onEditCategory }) {
    const { hasPermission } = usePermissionContext();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [userRole, setUserRole] = useState('');

    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');

    useEffect(() => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) {
            setUserRole(user.role);
            if (user.role === 'SUPER_ADMIN') {
                fetchCompanies();
            }
        }
    }, []);

    const fetchCompanies = async () => {
        try {
            const data = await fetchApi('/company');
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchCategories = async (searchQuery = '', currentPage = 1, limit = 10) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCompany) params.append('companyId', selectedCompany);
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', currentPage);
            params.append('limit', limit);

            const data = await fetchApi(`/category?${params.toString()}`);
            if (data.categories && Array.isArray(data.categories)) {
                setRows(data.categories);
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
                toast.error('Server error');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCategories(search, page, pageSize);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, pageSize, selectedCompany]);

    const sortedRows = useMemo(() => {
        return [...rows];
    }, [rows]);

    const [exportType, setExportType] = useState(''); // 'print' or 'excel'
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportColumns, setExportColumns] = useState({
        categoryName: true,
        company: true,
        status: true
    });

    const columnLabels = {
        categoryName: 'Category Name',
        company: 'Company',
        status: 'Status'
    };

    const toggleExportColumn = (columnKey) => {
        setExportColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const showingFrom = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
    const showingTo = Math.min(totalEntries, page * pageSize);

    const deleteRow = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this category?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const token = sessionStorage.getItem('token');
                    // First Attempt
                    let response = await fetch(`${API_BASE_URL}/category/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    // Check for Product Existence Conflict
                    if (response.status === 409) {
                        const errData = await response.json();
                        if (errData.code === 'PRODUCT_EXISTS') {
                            const confirmCascade = await Swal.fire({
                                title: 'Products Available!',
                                text: "This category product is available in product page if still you delete then product page delete this category product",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33', // Red
                                cancelButtonColor: '#3085d6',
                                confirmButtonText: 'Yes, delete everything!'
                            });

                            if (confirmCascade.isConfirmed) {
                                // Second Attempt with Force
                                const token = sessionStorage.getItem('token');
                                response = await fetch(`${API_BASE_URL}/category/${id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                            } else {
                                return; // Cancelled
                            }
                        } else {
                            // If 409 but not PRODUCT_EXISTS, show error and stop
                            Swal.fire('Error', errData.message || 'Failed to delete category', 'error');
                            return;
                        }
                    }

                    if (response.ok) {
                        fetchCategories(search, page, pageSize);
                        Swal.fire('Deleted!', 'Category has been deleted.', 'success');
                    } else {
                        const errData = await response.json();
                        Swal.fire('Error', errData.message || 'Failed to delete category', 'error');
                    }
                } catch (error) {
                    console.error("Delete Category Error:", error);
                    Swal.fire('Error', 'Server connection failed', 'error');
                }
            }
        });
    };

    const handleExcelDownload = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCompany) params.append('companyId', selectedCompany);
            if (search) params.append('search', search);

            const data = await fetchApi(`/category?${params.toString()}`);
            const categoriesToExport = data.categories && Array.isArray(data.categories) ? data.categories : (Array.isArray(data) ? data : []);

            const worksheetData = categoriesToExport.map((r, idx) => {
                const row = { 'No.': idx + 1 };
                if (exportColumns.categoryName) row['Category Name'] = r.categoryName;
                if (exportColumns.company && (userRole === 'SUPER_ADMIN' || r.companyId)) {
                    row['Company'] = r.companyId?.companyName || r.companyId?.name || 'N/A';
                }
                if (exportColumns.status) row['Status'] = r.isActive ? 'Active' : 'Inactive';
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
            XLSX.writeFile(workbook, 'CategoryList.xlsx');
        } catch (error) {
            console.error("Excel Download Error:", error);
            toast.error("Failed to fetch data for Excel export");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCompany) params.append('companyId', selectedCompany);
            if (search) params.append('search', search);

            const data = await fetchApi(`/category?${params.toString()}`);
            const categoriesToPrint = data.categories && Array.isArray(data.categories) ? data.categories : (Array.isArray(data) ? data : []);

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Category List</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
            printWindow.document.write('h1 { text-align: center; color: #0b3a54; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; }');
            printWindow.document.write('th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }');
            printWindow.document.write('th { background-color: #dff5ea; color: #0b3a54; font-weight: 600; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h1>Category List</h1>');
            printWindow.document.write('<table><thead><tr>');

            printWindow.document.write('<th>No.</th>');
            if (exportColumns.categoryName) printWindow.document.write('<th>Category Name</th>');
            if (exportColumns.company && userRole === 'SUPER_ADMIN') printWindow.document.write('<th>Company</th>');
            if (exportColumns.status) printWindow.document.write('<th>Status</th>');

            printWindow.document.write('</tr></thead><tbody>');

            categoriesToPrint.forEach((r, idx) => {
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${idx + 1}</td>`);
                if (exportColumns.categoryName) printWindow.document.write(`<td>${r.categoryName || ''}</td>`);
                if (exportColumns.company && userRole === 'SUPER_ADMIN') printWindow.document.write(`<td>${r.companyId?.companyName || r.companyId?.name || ''}</td>`);
                if (exportColumns.status) printWindow.document.write(`<td>${r.isActive ? 'Active' : 'Inactive'}</td>`);
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

    if (loading) {
        return <PageSkeleton />;
    }

    return (
        <div className="list-page-container">
            <div className="list-page-header">
                <h1 className="list-page-title">Category List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Category', 'report') && (
                        <>
                            <button className="list-page-btn list-page-btn-excel" onClick={() => {
                                setExportType('excel');
                                setIsExportModalOpen(true);
                            }}>EXCEL</button>
                            <button className="list-page-btn list-page-btn-print" onClick={() => {
                                setExportType('print');
                                setIsExportModalOpen(true);
                            }}>PRINT</button>
                        </>
                    )}
                    {hasPermission('Category', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={onAddCategory}>ADD CATEGORY</button>
                    )}
                </div>
            </div>

            <div className="list-page-toolbar">
                <SearchBar
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search categories..."
                />

                {userRole === 'SUPER_ADMIN' && (
                    <div className="list-page-filter-box" style={{ marginLeft: '10px' }}>
                        <div className="list-page-filter-group" style={{ marginBottom: 0 }}>
                            <label className="list-page-filter-label">Company:</label>
                            <select
                                className="list-page-filter-input"
                                value={selectedCompany}
                                onChange={(e) => {
                                    setSelectedCompany(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All Companies</option>
                                {companies.map((company) => (
                                    <option key={company._id} value={company._id}>
                                        {company.companyName || company.name || "Unnamed Company"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            <th>NO.</th>
                            <th>CATEGORY NAME</th>
                            {userRole === 'SUPER_ADMIN' && <th>COMPANY</th>}
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.length === 0 ? (
                            <tr><td colSpan="4">No records found</td></tr>
                        ) : (
                            sortedRows.map((r, index) => (
                                <tr key={r._id}>
                                    <td>{(page - 1) * pageSize + index + 1}</td>
                                    <td>{r.categoryName}</td>
                                    {userRole === 'SUPER_ADMIN' && <td>{r.companyId?.companyName || r.companyId?.name || ''}</td>}
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Category', 'update') && (
                                                <button className="list-page-icon-btn" title="Edit" onClick={() => onEditCategory(r)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                            )}
                                            {hasPermission('Category', 'delete') && (
                                                <button className="list-page-icon-btn" title="Delete" onClick={() => deleteRow(r._id)}>
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
                    <select className="list-page-entries-select" value={pageSize} onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                    }}>
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
                    <button className="list-page-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                    <button className={`list-page-page-num list-page-page-num-active`}>{page}</button>
                    <button className="list-page-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
            </div>

            {isExportModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '450px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
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
                                if (key === 'company' && userRole !== 'SUPER_ADMIN') return null;
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
            )}
        </div>
    );
}

export default CategoryList;

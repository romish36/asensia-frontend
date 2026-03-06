import React, { useState, useMemo, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/apiConfig.js';


import { useNavigate } from 'react-router-dom';
import fetchApi from '../utils/api.js';
import { usePermissionContext } from '../contexts/PermissionContext.js';
import SearchBar from '../components/ui/SearchBar';
import PageSkeleton from '../components/ui/PageSkeleton';
import '../styles/ProductList.css';


function ProductList({ onAddProduct, onEditProduct }) {
    const isInitialMount = React.useRef(true);
    const { hasPermission, categories } = usePermissionContext();
    const navigate = useNavigate();
    const token = sessionStorage.getItem('token');
    const getRolePrefix = () => {
        const user = JSON.parse(sessionStorage.getItem('user'));
        if (!user || !user.role) return '';
        if (user.role === 'SUPER_ADMIN') return '/super-admin';
        if (user.role === 'ADMIN') return '/admin';
        return '/user';
    };

    const [rows, setRows] = useState([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(() => {
        const savedPage = sessionStorage.getItem('lastPage_ProductList');
        return savedPage ? parseInt(savedPage) : 1;
    });
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [userRole, setUserRole] = useState('');
    // Categories are now provided by PermissionContext
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        if (!isInitialMount.current) return;
        isInitialMount.current = false;

        const user = JSON.parse(sessionStorage.getItem('user'));
        if (user) {
            setUserRole(user.role);
            if (user.role === 'SUPER_ADMIN') {
                fetchCompanies();
            }
        }
    }, [isInitialMount]);

    const [activeCompany, setActiveCompany] = useState('');
    const [activeCategory, setActiveCategory] = useState('');

    const handleFilterSubmit = () => {
        setActiveCompany(selectedCompany);
        setActiveCategory(selectedCategory);
        setPage(1);
    };

    const handleFilterReset = () => {
        setSelectedCompany('');
        setSelectedCategory('');
        setActiveCompany('');
        setActiveCategory('');
        setPage(1);
        setSearch('');
    };

    const [exportType, setExportType] = useState(''); // 'print' or 'excel'
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportColumns, setExportColumns] = useState({
        company: true,
        productName: true,
        categoryName: true,
        hsnCode: true,
        grade: true,
        modelNumber: true,
        designName: true,
        finishGlaze: true,
        size: true,
        stock: true,
        salePrice: true,
        stockType: true,
        productType: true,
        bundle: true,
        date: true,
        time: true
    });

    const columnLabels = {
        company: 'Company',
        productName: 'Product Name',
        categoryName: 'Category Name',
        hsnCode: 'HSN Code',
        grade: 'Grade',
        modelNumber: 'Model Number',
        designName: 'Design Name',
        finishGlaze: 'Finish Glaze',
        size: 'Size',
        stock: 'Stock',
        salePrice: 'Sale Price',
        stockType: 'Stock Type',
        productType: 'Product Type',
        bundle: 'Bundle',
        date: 'Date',
        time: 'Time'
    };

    const toggleExportColumn = (columnKey) => {
        setExportColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const getStockLabel = (r) => {
        const type = Number(r.stockType);
        if (type === 1) return 'In Stock';
        if (type === 0) return 'Out of Stock';
        if (type === 2) return 'Without Stock';
        return '';
    };

    const getStockBadgeClass = (r) => {
        const type = Number(r.stockType);
        if (type === 1) return 'status-instock';
        if (type === 0 || type === 2) return 'status-outstock'; // Both use red styling
        return '';
    };

    const fetchCompanies = async () => {
        try {
            const data = await fetchApi('/company'); // Refactored
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };



    const fetchProducts = async (searchQuery = '', currentPage = 1, limit = 10) => {
        try {
            if (!searchQuery) setLoading(true);
            if (!token) {
                throw new Error('No authentication token found. Please login again.');
            }

            let url = `${API_BASE_URL}/product`;
            const params = new URLSearchParams();
            if (activeCompany) params.append('companyId', activeCompany);
            if (activeCategory) params.append('categoryId', activeCategory);
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', currentPage);
            params.append('limit', limit);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            const data = await response.json();
            setRows(data.products || []);
            setTotalEntries(data.total || 0);
            setTotalPages(data.pages || 1);
        } catch (error) {
            console.error("Fetch Error:", error);
            if (error.status !== 403) {
                toast.error(`Failed to load products: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        sessionStorage.setItem('lastPage_ProductList', page);
    }, [page]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchProducts(search, page, pageSize);
        }, 200);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, pageSize, activeCompany, activeCategory]);

    const filteredRows = useMemo(() => {
        return rows;
    }, [rows]);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    const sortedRows = useMemo(() => {
        let sortableItems = [...filteredRows];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle special cases
                if (sortConfig.key === 'productSalePrice') {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                } else if (sortConfig.key === 'companyName') {
                    const getCompName = (item) => {
                        if (item.companyId && typeof item.companyId === 'object') {
                            return item.companyId.companyName || item.companyId.name || '';
                        }
                        return '';
                    };
                    aValue = getCompName(a).toLowerCase();
                    bValue = getCompName(b).toLowerCase();
                } else if (sortConfig.key === 'categoryName') {
                    const getCatName = (item) => item.categoryId?.categoryName || '';
                    aValue = getCatName(a).toLowerCase();
                    bValue = getCatName(b).toLowerCase();
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

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const pagedRows = sortedRows;

    const showingFrom = totalEntries === 0 ? 0 : (page - 1) * pageSize + 1;
    const showingTo = Math.min(totalEntries, (page - 1) * pageSize + rows.length);

    const pages = useMemo(() => {
        const out = [];
        const maxButtons = 5;
        let start = Math.max(1, page - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);
        start = Math.max(1, end - maxButtons + 1);
        for (let i = start; i <= end; i += 1) out.push(i);
        return out;
    }, [page, totalPages]);

    const deleteRow = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this product?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // First Attempt
                    let response = await fetch(`${API_BASE_URL}/product/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    // Check for Stock Existence Conflict
                    if (response.status === 409) {
                        const errData = await response.json();
                        if (errData.code === 'STOCK_EXISTS') {
                            // Show Special Confirmation
                            const confirmStock = await Swal.fire({
                                title: 'Stock Available!',
                                text: "This product stock is available in instock page if still you delete then instock page delete this item stock",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33', // Red for danger
                                cancelButtonColor: '#3085d6',
                                confirmButtonText: 'Yes, delete everything!'
                            });

                            if (confirmStock.isConfirmed) {
                                // Second Attempt with Force
                                response = await fetch(`${API_BASE_URL}/product/${id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                            } else {
                                return; // Cancelled
                            }
                        }
                    }

                    if (response.ok) {
                        fetchProducts(search, page, pageSize);
                        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                    } else {
                        const errData = await response.json();
                        Swal.fire('Error!', errData.message || 'Failed to delete product', 'error');
                    }
                } catch (error) {
                    console.error("Delete error:", error);
                    Swal.fire('Error!', 'Server connection failed', 'error');
                }
            }
        });
    };

    const handleExcelDownload = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            if (activeCompany) queryParams.append('companyId', activeCompany);
            if (activeCategory) queryParams.append('categoryId', activeCategory);
            if (search) queryParams.append('search', search);

            const allData = await fetchApi(`/product?${queryParams.toString()}`);
            const productsToExport = Array.isArray(allData) ? allData : (allData.products || []);

            const worksheetData = productsToExport.map((r) => {
                const row = {};
                if (userRole === 'SUPER_ADMIN' && exportColumns.company) {
                    row['Company'] = r.companyId ? (r.companyId.companyName || r.companyId.name) : '';
                }
                if (exportColumns.productName) row['Product Name'] = r.productName;
                if (exportColumns.categoryName) row['Category Name'] = r.categoryId?.categoryName || '';
                if (exportColumns.hsnCode) row['HSN Code'] = r.productHsnCode;
                if (exportColumns.grade) row['Grade'] = r.productGrade || '';
                if (exportColumns.modelNumber) row['Model Number'] = r.productModelNumber;
                if (exportColumns.designName) row['Design Name'] = r.productDesignName || '';
                if (exportColumns.finishGlaze) row['Finish Glaze'] = r.productFinshGlaze || '';
                if (exportColumns.size) row['Size'] = r.sizeName || '';
                if (exportColumns.stock) row['Stock'] = r.productStock || 0;
                if (exportColumns.salePrice) row['Sale Price'] = (parseFloat(r.productSalePrice) * 1.18 || 0).toFixed(2);
                if (exportColumns.stockType) row['Stock Type'] = getStockLabel(r);
                if (exportColumns.productType) row['Product Type'] = Number(r.productType) === 1 ? 'Bundle Product' : 'Single Product';
                if (exportColumns.bundle) row['Bundle'] = Number(r.productType) === 1 ? (r.productBundle || '') : '-';
                if (exportColumns.date) row['Date'] = r.date || '';
                if (exportColumns.time) row['Time'] = r.time || '';
                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
            XLSX.writeFile(workbook, 'ProductList.xlsx');
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
            if (activeCompany) queryParams.append('companyId', activeCompany);
            if (activeCategory) queryParams.append('categoryId', activeCategory);
            if (search) queryParams.append('search', search);

            const allData = await fetchApi(`/product?${queryParams.toString()}`);
            const productsToPrint = Array.isArray(allData) ? allData : (allData.products || []);

            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<html><head><title>Product List</title>');
            printWindow.document.write('<style>');
            printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
            printWindow.document.write('h1 { text-align: center; color: #0b3a54; }');
            printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }');
            printWindow.document.write('th, td { border: 1px solid #ddd; padding: 5px; text-align: left; }');
            printWindow.document.write('th { background-color: #dff5ea; color: #0b3a54; font-weight: 600; }');
            printWindow.document.write('</style></head><body>');
            printWindow.document.write('<h1>Product List</h1>');
            printWindow.document.write('<table><thead><tr>');

            printWindow.document.write('<th>No.</th>');
            if (userRole === 'SUPER_ADMIN' && exportColumns.company) printWindow.document.write('<th>Company</th>');
            if (exportColumns.productName) printWindow.document.write('<th>Product Name</th>');
            if (exportColumns.categoryName) printWindow.document.write('<th>Category Name</th>');
            if (exportColumns.hsnCode) printWindow.document.write('<th>HSN Code</th>');
            if (exportColumns.grade) printWindow.document.write('<th>Grade</th>');
            if (exportColumns.modelNumber) printWindow.document.write('<th>Model Number</th>');
            if (exportColumns.designName) printWindow.document.write('<th>Design Name</th>');
            if (exportColumns.finishGlaze) printWindow.document.write('<th>Finish Glaze</th>');
            if (exportColumns.size) printWindow.document.write('<th>Size</th>');
            if (exportColumns.stock) printWindow.document.write('<th>Stock</th>');
            if (exportColumns.salePrice) printWindow.document.write('<th>Sale Price</th>');
            if (exportColumns.stockType) printWindow.document.write('<th>Stock Type</th>');
            if (exportColumns.productType) printWindow.document.write('<th>Product Type</th>');
            if (exportColumns.bundle) printWindow.document.write('<th>Bundle</th>');
            if (exportColumns.date) printWindow.document.write('<th>Date</th>');
            if (exportColumns.time) printWindow.document.write('<th>Time</th>');

            printWindow.document.write('</tr></thead><tbody>');

            productsToPrint.forEach((r, index) => {
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${index + 1}</td>`);
                if (userRole === 'SUPER_ADMIN' && exportColumns.company) {
                    printWindow.document.write(`<td>${r.companyId ? (r.companyId.companyName || r.companyId.name || '') : ''}</td>`);
                }
                if (exportColumns.productName) printWindow.document.write(`<td>${r.productName || ''}</td>`);
                if (exportColumns.categoryName) printWindow.document.write(`<td>${r.categoryId?.categoryName || ''}</td>`);
                if (exportColumns.hsnCode) printWindow.document.write(`<td>${r.productHsnCode || ''}</td>`);
                if (exportColumns.grade) printWindow.document.write(`<td>${r.productGrade || ''}</td>`);
                if (exportColumns.modelNumber) printWindow.document.write(`<td>${r.productModelNumber || ''}</td>`);
                if (exportColumns.designName) printWindow.document.write(`<td>${r.productDesignName || ''}</td>`);
                if (exportColumns.finishGlaze) printWindow.document.write(`<td>${r.productFinshGlaze || ''}</td>`);
                if (exportColumns.size) printWindow.document.write(`<td>${r.sizeName || ''}</td>`);
                if (exportColumns.stock) printWindow.document.write(`<td>${r.productStock || 0}</td>`);
                if (exportColumns.salePrice) printWindow.document.write(`<td>${(parseFloat(r.productSalePrice) * 1.18 || 0).toFixed(2)}</td>`);
                if (exportColumns.stockType) printWindow.document.write(`<td>${getStockLabel(r)}</td>`);
                if (exportColumns.productType) printWindow.document.write(`<td>${Number(r.productType) === 1 ? 'Bundle Product' : 'Single Product'}</td>`);
                if (exportColumns.bundle) printWindow.document.write(`<td>${Number(r.productType) === 1 ? (r.productBundle || 'Bundle') : '-'}</td>`);
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
                <h1 className="list-page-title">Product List</h1>
                <div className="list-page-action-buttons">
                    {hasPermission('Product', 'report') && (
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
                    {hasPermission('Product', 'add') && (
                        <button className="list-page-btn list-page-btn-add" onClick={() => onAddProduct && onAddProduct()}>
                            ADD PRODUCT
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
                    placeholder="Search products..."
                />

                <div className="product-filter-section">
                    {userRole === 'SUPER_ADMIN' && (
                        <div className="product-filter-group">
                            <label className="product-filter-label">Company:</label>
                            <select
                                className="product-filter-select"
                                value={selectedCompany}
                                onChange={(e) => {
                                    setSelectedCompany(e.target.value);
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
                    )}

                    <div className="product-filter-group">
                        <label className="product-filter-label">Filter:</label>
                        <select
                            className="product-filter-select"
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                            }}
                        >
                            <option value="">---Select Type---</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.categoryName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button className="product-btn-submit" onClick={handleFilterSubmit}>SUBMIT</button>
                    <button className="product-btn-reset" onClick={handleFilterReset}>RESET</button>
                </div>
            </div>

            <div className="list-page-table-wrapper">
                <table className="list-page-table">
                    <thead>
                        <tr>
                            {userRole === 'SUPER_ADMIN' && (
                                <th onClick={() => requestSort('companyName')} style={{ cursor: 'pointer' }}>
                                    COMPANY {sortConfig.key === 'companyName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                                </th>
                            )}
                            <th onClick={() => requestSort('productName')} style={{ cursor: 'pointer' }}>
                                PRODUCT NAME {sortConfig.key === 'productName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('categoryName')} style={{ cursor: 'pointer' }}>
                                CATEGORY NAME {sortConfig.key === 'categoryName' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>

                            <th onClick={() => requestSort('productHsnCode')} style={{ cursor: 'pointer' }}>
                                HSN CODE {sortConfig.key === 'productHsnCode' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('productModelNumber')} style={{ cursor: 'pointer' }}>
                                MODEL NUMBER {sortConfig.key === 'productModelNumber' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('productStock')} style={{ cursor: 'pointer' }}>
                                STOCK {sortConfig.key === 'productStock' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('productSalePrice')} style={{ cursor: 'pointer' }}>
                                SALE PRICE {sortConfig.key === 'productSalePrice' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('stockType')} style={{ cursor: 'pointer' }}>
                                STOCK TYPE {sortConfig.key === 'stockType' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('productType')} style={{ cursor: 'pointer' }}>
                                PRODUCT TYPE {sortConfig.key === 'productType' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th onClick={() => requestSort('productBundle')} style={{ cursor: 'pointer' }}>
                                BUNDLE {sortConfig.key === 'productBundle' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                            </th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRows.length === 0 ? (
                            <tr>
                                <td className="list-page-table-empty" colSpan={userRole === 'SUPER_ADMIN' ? 11 : 10}>
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            sortedRows.map((r) => (
                                <tr key={r._id || r.productId}>
                                    {userRole === 'SUPER_ADMIN' && (
                                        <td>
                                            {r.companyId && typeof r.companyId === 'object'
                                                ? (r.companyId.companyName || r.companyId.name || "Unnamed")
                                                : (r.companyId ? "Link Error" : "Unassigned")}
                                        </td>
                                    )}
                                    <td>{r.productName}</td>
                                    <td>{r.categoryId?.categoryName || ''}</td>

                                    <td>{r.productHsnCode}</td>
                                    <td>{r.productModelNumber}</td>
                                    <td style={{ color: (r.productStock || 0) < 0 ? '#ef4444' : 'inherit', fontWeight: (r.productStock || 0) < 0 ? 'bold' : 'normal' }}>
                                        {r.productStock || 0}
                                    </td>
                                    <td>{(parseFloat(r.productSalePrice) * 1.18 || 0).toFixed(2)}</td>
                                    <td>
                                        <span className={`status-badge ${getStockBadgeClass(r)}`}>
                                            {getStockLabel(r)}
                                        </span>
                                    </td>
                                    <td>{Number(r.productType) === 1 ? 'Bundle Product' : 'Single Product'}</td>
                                    <td>
                                        {Number(r.productType) === 1 ? (
                                            <button
                                                className="list-page-btn-bundle"
                                                onClick={() => navigate(`${getRolePrefix()}/product/bundle/${r._id}`)}
                                                title="View Bundle Details"
                                            >
                                                Bundle
                                            </button>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            {hasPermission('Product', 'update') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Edit"
                                                    onClick={() => onEditProduct && onEditProduct(r)}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                            )}
                                            {hasPermission('Product', 'delete') && (
                                                <button
                                                    type="button"
                                                    className="list-page-icon-btn"
                                                    title="Delete"
                                                    onClick={() => deleteRow(r._id || r.productId)}
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

            {isExportModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px',
                        maxHeight: '80vh', overflowY: 'auto',
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
        </div >
    );
}

export default ProductList;

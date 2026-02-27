import React, { useState, useMemo } from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';
import SearchBar from './ui/SearchBar';

const LowStockAlertTable = ({ products }) => {
    const { hasPermission } = usePermissionContext();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;

    const [sortConfig, setSortConfig] = useState({ key: 'stock', direction: 'ascending' });

    const sortedProducts = useMemo(() => {
        let sortableItems = [...products];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [products, sortConfig]);

    const filtered = useMemo(() => {
        return sortedProducts.filter(p =>
            (p.name?.toLowerCase().includes(search.toLowerCase()) ||
                p.sku?.toLowerCase().includes(search.toLowerCase())) &&
            p.stock <= 10
        );
    }, [sortedProducts, search]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const currentItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    if (!hasPermission('Product', 'view')) return null;

    const getSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
        }
        return '';
    };

    return (
        <div className="dashboard-table-container">
            <div className="dashboard-table-header">
                <h3 className="dashboard-table-title" style={{ color: '#dc2626' }}>Low Stock Alert (&lt;= 10)</h3>
                <SearchBar
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search..."
                    label={null}
                    className="dashboard-header-search"
                />
            </div>
            <div className="dashboard-table-wrapper">
                <table className="dashboard-mini-table">
                    <thead>
                        <tr>
                            <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
                                Product Name{getSortIcon('name')}
                            </th>
                            <th onClick={() => requestSort('category')} style={{ cursor: 'pointer' }}>
                                Category{getSortIcon('category')}
                            </th>
                            <th onClick={() => requestSort('stock')} style={{ cursor: 'pointer' }}>
                                Current Stock{getSortIcon('stock')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? (
                            currentItems.map(item => (
                                <tr key={item.id}>
                                    <td>{item.name}</td>
                                    <td>{item.category}</td>
                                    <td style={{ color: item.stock < 0 ? '#b91c1c' : '#dc2626', fontWeight: 'bold' }}>
                                        {item.stock}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="empty-cell">No low stock items found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="dashboard-table-footer">
                <span className="pagination-info">Page {page} of {totalPages || 1}</span>
                <div className="pagination-btns">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="pagination-btn"
                    >Prev</button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="pagination-btn"
                    >Next</button>
                </div>
            </div>
        </div>
    );
};

export default LowStockAlertTable;

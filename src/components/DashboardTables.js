import React, { useState, useMemo } from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';
import SearchBar from './ui/SearchBar';

const DashboardTables = ({ purchaseData, salesData }) => {
    const { hasPermission } = usePermissionContext();
    const [purchaseSearch, setPurchaseSearch] = useState('');
    const [salesSearch, setSalesSearch] = useState('');
    const [purchasePage, setPurchasePage] = useState(1);
    const [salesPage, setSalesPage] = useState(1);
    const itemsPerPage = 5;

    // Purchase Table Logic
    const filteredPurchase = useMemo(() => {
        return purchaseData.filter(item =>
            (item.partyName || '').toLowerCase().includes(purchaseSearch.toLowerCase())
        );
    }, [purchaseData, purchaseSearch]);

    const purchaseTotalPages = Math.ceil(filteredPurchase.length / itemsPerPage);
    const currentPurchaseItems = filteredPurchase.slice((purchasePage - 1) * itemsPerPage, purchasePage * itemsPerPage);

    // Sales Table Logic
    const filteredSales = useMemo(() => {
        return salesData.filter(item =>
            (item.partyName || '').toLowerCase().includes(salesSearch.toLowerCase())
        );
    }, [salesData, salesSearch]);

    const salesTotalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const currentSalesItems = filteredSales.slice((salesPage - 1) * itemsPerPage, salesPage * itemsPerPage);

    const showPurchase = hasPermission('Purchase Order', 'view');
    const showSales = hasPermission('Invoice', 'view');

    if (!showPurchase && !showSales) return null;

    return (
        <div className="dashboard-tables">
            {/* Purchase Payment Table */}
            {showPurchase && (
                <div className="dashboard-table-container">
                    <div className="dashboard-table-header">
                        <h3 className="dashboard-table-title">Purchase Payment List</h3>
                        <SearchBar
                            value={purchaseSearch}
                            onChange={(e) => { setPurchaseSearch(e.target.value); setPurchasePage(1); }}
                            placeholder="Search..."
                            label={null}
                            className="dashboard-header-search"
                        />
                    </div>
                    <div className="dashboard-table-wrapper">
                        <table className="dashboard-mini-table">
                            <thead>
                                <tr>
                                    <th>Trade Name</th>
                                    <th>Pending Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPurchaseItems.length > 0 ? (
                                    currentPurchaseItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.partyName}</td>
                                            <td className="amount-cell">{item.amount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="2" className="empty-cell">No data found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="dashboard-table-footer">
                        <span className="pagination-info">Page {purchasePage} of {purchaseTotalPages || 1}</span>
                        <div className="pagination-btns">
                            <button
                                onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                                disabled={purchasePage === 1}
                                className="pagination-btn"
                            >Prev</button>
                            <button
                                onClick={() => setPurchasePage(p => Math.min(purchaseTotalPages, p + 1))}
                                disabled={purchasePage >= purchaseTotalPages}
                                className="pagination-btn"
                            >Next</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sales Payment Table */}
            {showSales && (
                <div className="dashboard-table-container">
                    <div className="dashboard-table-header">
                        <h3 className="dashboard-table-title">Invoice Payment List</h3>
                        <SearchBar
                            value={salesSearch}
                            onChange={(e) => { setSalesSearch(e.target.value); setSalesPage(1); }}
                            placeholder="Search..."
                            label={null}
                            className="dashboard-header-search"
                        />
                    </div>
                    <div className="dashboard-table-wrapper">
                        <table className="dashboard-mini-table">
                            <thead>
                                <tr>
                                    <th>Trade Name</th>
                                    <th>Receive Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentSalesItems.length > 0 ? (
                                    currentSalesItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.partyName}</td>
                                            <td className="amount-cell">{item.amount}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="2" className="empty-cell">No data found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="dashboard-table-footer">
                        <span className="pagination-info">Page {salesPage} of {salesTotalPages || 1}</span>
                        <div className="pagination-btns">
                            <button
                                onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                                disabled={salesPage === 1}
                                className="pagination-btn"
                            >Prev</button>
                            <button
                                onClick={() => setSalesPage(p => Math.min(salesTotalPages, p + 1))}
                                disabled={salesPage >= salesTotalPages}
                                className="pagination-btn"
                            >Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardTables;

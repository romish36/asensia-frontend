import React, { useState, useEffect } from 'react';
import '../styles/CustomerProfile.css';
import AddPaymentModal from '../components/modals/AddPaymentModal';
import AccountStatement from './AccountStatement';
import fetchApi from '../utils/api.js';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash } from 'react-icons/fa';

const CustomerProfile = ({ customer, onBack, onPreviewInvoice, onEdit }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState(null);
    const [showStatement, setShowStatement] = useState(false);
    const [totals, setTotals] = useState({ totalDebit: 0, totalCredit: 0, balance: 0 });
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Invoice List State ---
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoicePage, setInvoicePage] = useState(1);
    const [invoiceEntries, setInvoiceEntries] = useState(10);

    // --- Payment List State ---
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentEntries, setPaymentEntries] = useState(10);

    useEffect(() => {
        if (customer) {
            fetchCustomerData();
        }
    }, [customer]);

    const fetchCustomerData = async () => {
        try {
            setLoading(true);
            const cId = customer.customerId || customer._id;

            // Fetch Totals
            const totalsData = await fetchApi(`/invoice-payment/totals/${cId}`);
            setTotals(totalsData);

            // Fetch Invoices (Assuming standard products list has some filtering, or we just fetch all and filter in JS if small)
            // For now, let's use the Ledger API to populate our lists if specialized invoice-by-customer isnt available.
            const ledger = await fetchApi(`/invoice-payment/ledger/${cId}`);

            const invList = ledger.filter(e => e.type === 'Invoice').map(e => ({
                id: e.id,
                invoiceNo: e.refNo,
                date: e.date,
                place: customer.customerCity || customer.city || '---',
                amount: e.debit.toFixed(2)
            }));
            setInvoices(invList);

            // Fetch Payments list separately
            const paymentsData = await fetchApi(`/invoice-payment?customerId=${cId}`);
            setPayments(paymentsData);

        } catch (error) {
            console.error("Error fetching customer profile data:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Helper Functions ---
    const filterData = (list, search, keys) => {
        if (!search) return list;
        return list.filter(item =>
            keys.some(key => item[key]?.toString().toLowerCase().includes(search.toLowerCase()))
        );
    };

    // Unified data mapping to support multiple naming conventions (backend and mocks)
    const displayData = {
        name: customer?.customerName || customer?.name || '---',
        tradeName: customer?.customerTradeName || customer?.tradeName || customer?.name || '---',
        referenceName: customer?.customerReferenceName || customer?.referenceName || '---',
        email: customer?.customerEmail || customer?.email || '---',
        mobileNumber: customer?.customerMobileNumber || customer?.mobileNumber || customer?.mobile || '---',
        gst: customer?.customerGst || customer?.gst || '---',
        panNo: customer?.customerPanNo || customer?.panNo || customer?.pan || '---',
        customerType: customer?.customerType || '---',
        saleType: customer?.customerSaleType || customer?.saleType || '---',
        country: customer?.customerCountry || customer?.country || 'India',
        state: customer?.customerState || customer?.state || '---',
        city: customer?.customerCity || customer?.city || '---',
        pinCode: customer?.customerPinCode || customer?.pinCode || '---',
        stateCode: customer?.customerStateCode || customer?.stateCode || '---',
        address: customer?.customerAddress || customer?.address || '---'
    };

    // Filter Invoices
    const filteredInvoices = filterData(invoices, invoiceSearch, ['id', 'date', 'place', 'amount']);
    const invoiceLastIdx = invoicePage * invoiceEntries;
    const invoiceFirstIdx = invoiceLastIdx - invoiceEntries;
    const currentInvoices = filteredInvoices.slice(invoiceFirstIdx, invoiceLastIdx);

    // Filter Payments
    const filteredPayments = filterData(payments, paymentSearch, ['paymentAmount', 'paymentModeName', 'paymentCollectorName']);
    const paymentLastIdx = paymentPage * paymentEntries;
    const paymentFirstIdx = paymentLastIdx - paymentEntries;
    const currentPayments = filteredPayments.slice(paymentFirstIdx, paymentLastIdx);

    const handleDeletePayment = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await fetchApi(`/invoice-payment/${id}`, { method: 'DELETE' });
                Swal.fire('Deleted!', 'Payment has been deleted.', 'success');
                fetchCustomerData();
            } catch (error) {
                console.error("Delete Error:", error);
                Swal.fire('Error!', 'Failed to delete payment.', 'error');
            }
        }
    };

    const handleEditPayment = (payment) => {
        setPaymentToEdit(payment);
        setIsPaymentModalOpen(true);
    };

    const handlePreviewInvoiceClick = async (inv) => {
        try {
            // inv.id is the database _id from ledger
            const fullInvoice = await fetchApi(`/sales-invoice/${inv.id}`);
            if (fullInvoice && onPreviewInvoice) {
                onPreviewInvoice(fullInvoice);
            }
        } catch (error) {
            console.error("Error fetching full invoice for preview:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch invoice details for preview.'
            });
        }
    };

    if (showStatement) {
        return <AccountStatement customer={displayData} customerId={customer.customerId || customer._id} onBack={() => setShowStatement(false)} />;
    }

    return (
        <div className="customer-profile-container">
            <div className="customer-profile-header">
                <h2 className="customer-profile-title">{displayData.name || 'Customer Profile'}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {onEdit && (
                        <button className="customer-profile-back-btn" onClick={onEdit} style={{ backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaEdit /> Edit
                        </button>
                    )}
                    {onBack && (
                        <button className="customer-profile-back-btn" onClick={onBack}>
                            ← Back
                        </button>
                    )}
                </div>
            </div>

            {/* Top Details Section */}
            <div className="customer-profile-details-grid">
                {/* Personal & Business Details */}
                <div className="customer-detail-card">
                    <div className="customer-detail-card-title">Personal & Business Details</div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Trade Name:</span>
                        <span className="customer-detail-value">{displayData.tradeName}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Customer Name:</span>
                        <span className="customer-detail-value">{displayData.name}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Reference Name:</span>
                        <span className="customer-detail-value">{displayData.referenceName}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Email:</span>
                        <span className="customer-detail-value">{displayData.email}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Mobile:</span>
                        <span className="customer-detail-value">{displayData.mobileNumber}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">GST:</span>
                        <span className="customer-detail-value">{displayData.gst}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">PAN No:</span>
                        <span className="customer-detail-value">{displayData.panNo}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Customer Type:</span>
                        <span className="customer-detail-value">{displayData.customerType}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Sale Type:</span>
                        <span className="customer-detail-value">{displayData.saleType}</span>
                    </div>
                </div>

                {/* Address Details */}
                <div className="customer-detail-card">
                    <div className="customer-detail-card-title">Address Details</div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Country:</span>
                        <span className="customer-detail-value">{displayData.country}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">State:</span>
                        <span className="customer-detail-value">{displayData.state}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">City:</span>
                        <span className="customer-detail-value">{displayData.city}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Pin Code:</span>
                        <span className="customer-detail-value">{displayData.pinCode}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">State Code:</span>
                        <span className="customer-detail-value">{displayData.stateCode}</span>
                    </div>
                    <div className="customer-detail-row">
                        <span className="customer-detail-label">Address:</span>
                        <span className="customer-detail-value" style={{ maxWidth: '60%' }}>{displayData.address}</span>
                    </div>
                </div>

                {/* Statistics & Actions */}
                <div className="customer-stats-column">
                    <div className="customer-stat-card">
                        <div className="customer-stat-icon-wrapper stat-blue">
                            💵
                        </div>
                        <div className="customer-stat-info">
                            <h3>{(totals.totalDebit || 0).toFixed(2)}/-</h3>
                            <p className="customer-stat-label">Total Amount</p>
                        </div>
                    </div>
                    <div className="customer-stat-card">
                        <div className="customer-stat-icon-wrapper stat-green">
                            📄
                        </div>
                        <div className="customer-stat-info">
                            <h3>{(totals.totalCredit || 0).toFixed(2)}/-</h3>
                            <p className="customer-stat-label">Received Amount</p>
                        </div>
                    </div>
                    <div className="customer-stat-card">
                        <div className="customer-stat-icon-wrapper stat-red">
                            📱
                        </div>
                        <div className="customer-stat-info">
                            <h3>{(totals.balance || 0).toFixed(2)}/-</h3>
                            <p className="customer-stat-label">Pending Amount</p>
                        </div>
                    </div>

                    <div className="customer-profile-actions">
                        <button className="customer-action-btn" onClick={() => setIsPaymentModalOpen(true)}>Add Payment</button>
                        <button className="customer-action-btn" onClick={() => setShowStatement(true)}>Account Statement</button>
                    </div>
                </div>
            </div>

            {/* Tables Area */}
            <div className="customer-profile-tables-grid">

                {/* Invoice List */}
                <div className="customer-list-section">
                    <div className="customer-list-header">Invoice List</div>
                    <div className="list-controls">
                        <div>
                            <span>Show</span>
                            <select value={invoiceEntries} onChange={(e) => setInvoiceEntries(Number(e.target.value))}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                            </select>
                            <span>entries</span>
                        </div>
                        <div className="list-search">
                            Search:
                            <input value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} />
                        </div>
                    </div>

                    <table className="customer-profile-table">
                        <thead>
                            <tr>
                                <th>INVOICE NO</th>
                                <th>INVOICE DATE</th>
                                <th>PLACE OF SUPPLY</th>
                                <th>TOTAL AMOUNT</th>
                                <th>PREVIEW</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentInvoices.length > 0 ? currentInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td>{inv.invoiceNo}</td>
                                    <td>{inv.date}</td>
                                    <td>{inv.place}</td>
                                    <td>{inv.amount}</td>
                                    <td>
                                        <button
                                            className="list-page-icon-btn"
                                            title="Preview"
                                            onClick={() => handlePreviewInvoiceClick(inv)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="no-data">No data available in table</td></tr>
                            )}
                        </tbody>
                    </table>

                    <div className="customer-profile-pagination">
                        <div>Showing {currentInvoices.length > 0 ? invoiceFirstIdx + 1 : 0} to {Math.min(invoiceLastIdx, filteredInvoices.length)} of {filteredInvoices.length} entries</div>
                        <div>
                            <button className="pagination-btn" onClick={() => setInvoicePage(p => Math.max(1, p - 1))} disabled={invoicePage === 1}>Previous</button>
                            <button className="pagination-btn active">1</button>
                            <button className="pagination-btn" onClick={() => setInvoicePage(p => p + 1)} disabled={invoicePage * invoiceEntries >= filteredInvoices.length}>Next</button>
                        </div>
                    </div>
                </div>

                {/* Payment List */}
                <div className="customer-list-section">
                    <div className="customer-list-header">Payment List</div>
                    <div className="list-controls">
                        <div>
                            <span>Show</span>
                            <select value={paymentEntries} onChange={(e) => setPaymentEntries(Number(e.target.value))}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                            </select>
                            <span>entries</span>
                        </div>
                        <div className="list-search">
                            Search:
                            <input value={paymentSearch} onChange={(e) => setPaymentSearch(e.target.value)} />
                        </div>
                    </div>

                    <table className="customer-profile-table">
                        <thead>
                            <tr>
                                <th>AMOUNT</th>
                                <th>DATE TIME</th>
                                <th>MODE</th>
                                <th>COLLECTOR</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPayments.length > 0 ? currentPayments.map((pay, idx) => (
                                <tr key={idx}>
                                    <td>{Number(pay.paymentAmount).toFixed(2)}</td>
                                    <td>{pay.paymentDate} {pay.paymentTime}</td>
                                    <td>{pay.paymentModeName}</td>
                                    <td>{pay.paymentCollectorName || 'Authorized'}</td>
                                    <td>
                                        <div className="list-page-action-icons">
                                            <button className="list-page-icon-btn" title="Edit" onClick={() => handleEditPayment(pay)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </button>
                                            <button className="list-page-icon-btn" title="Delete" onClick={() => handleDeletePayment(pay._id)}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="no-data">No data available in table</td></tr>
                            )}
                        </tbody>
                    </table>

                    <div className="customer-profile-pagination">
                        <div>Showing {currentPayments.length > 0 ? paymentFirstIdx + 1 : 0} to {Math.min(paymentLastIdx, filteredPayments.length)} of {filteredPayments.length} entries</div>
                        <div>
                            <button className="pagination-btn" onClick={() => setPaymentPage(p => Math.max(1, p - 1))} disabled={paymentPage === 1}>Previous</button>
                            <button className="pagination-btn active">1</button>
                            <button className="pagination-btn" onClick={() => setPaymentPage(p => p + 1)} disabled={paymentPage * paymentEntries >= filteredPayments.length}>Next</button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Add Payment Modal */}
            <AddPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentToEdit(null);
                    fetchCustomerData();
                }}
                entityName={displayData.name}
                entityType="Customer"
                entityId={customer?.customerId || customer?._id}
                paymentToEdit={paymentToEdit}
            />
        </div>
    );
};

export default CustomerProfile;

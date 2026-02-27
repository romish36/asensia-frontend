import React, { useState, useEffect } from 'react';
import '../styles/SellerProfile.css';
import AddPaymentModal from '../components/modals/AddPaymentModal';
import AccountStatement from './AccountStatement';
import fetchApi from '../utils/api.js';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash } from 'react-icons/fa';

const SellerProfile = ({ seller, onBack, onPreview, onEdit }) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState(null);
    const [showStatement, setShowStatement] = useState(false);
    const [totals, setTotals] = useState({ totalInvoiceAmount: 0, paidAmount: 0, pendingAmount: 0 });
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // fallbacks...
    // Unified data mapping to support multiple naming conventions (backend and mocks)
    const displayData = {
        name: seller?.sellerName || '---',
        tradeName: seller?.sellerTradeName || '---',
        email: seller?.sellerEmail || '---',
        mobileNumber: seller?.sellerMobileNumber || '---',
        gst: seller?.sellerGstNumber || '---',
        panNo: seller?.sellerPanCardNumber || '---',
        prefix: seller?.sellerPrefix || '---',
        sellerType: seller?.sellerTypeId?.customerTypeName || seller?.sellerType || '---',
        country: seller?.sellerCountry || 'India',
        state: seller?.sellerState || '---',
        city: seller?.sellerCity || '---',
        pinCode: seller?.sellerPinCode || '---',
        stateCode: seller?.sellerStateCode || '---',
        address: seller?.sellerAddress || '---',
        bankName: seller?.sellerBankName || '---',
        accountName: seller?.sellerBankAccountName || '---',
        accountNo: seller?.sellerAccountNo || '---',
        ifscCode: seller?.sellerIfscCode || '---',
        cinNumber: seller?.sellerCinNumber || '---',
        bankAddress: seller?.sellerBankAddress || '---'
    };


    // --- Invoice List State ---
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoicePage, setInvoicePage] = useState(1);
    const [invoiceEntries, setInvoiceEntries] = useState(10);

    // --- Payment List State ---
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentEntries, setPaymentEntries] = useState(10);

    useEffect(() => {
        if (seller) {
            fetchSellerData();
        }
    }, [seller]);

    const fetchSellerData = async () => {
        try {
            setLoading(true);
            const sId = seller.sellerId || seller._id;

            // Fetch Totals
            const totalsData = await fetchApi(`/purchase-order-payment/totals/${sId}`);
            setTotals(totalsData);

            // Fetch Ledger
            const ledger = await fetchApi(`/purchase-order-payment/ledger/${sId}`);

            const invList = ledger.filter(e => e.type === 'Invoice').map(e => ({
                id: e.id,
                seller: displayData.tradeName,
                company: 'ASENSIA INDUSTRY LLP',
                invoiceNo: e.refNo,
                date: e.date,
                amount: e.debit.toFixed(2)
            }));
            setInvoices(invList);

            // Fetch Payments separately
            const paymentsData = await fetchApi(`/purchase-order-payment?buyerId=${sId}`);
            setPayments(paymentsData);

        } catch (error) {
            console.error("Error fetching seller profile data:", error);
        } finally {
            setLoading(false);
        }
    };


    if (showStatement) {
        return (
            <AccountStatement
                customer={displayData}
                customerId={seller.sellerId || seller._id}
                isPurchase={true}
                onBack={() => setShowStatement(false)}
            />
        );
    }

    // --- Helper Functions ---
    const filterData = (list, search, keys) => {
        if (!search) return list;
        return list.filter(item =>
            keys.some(key => item[key] && item[key].toString().toLowerCase().includes(search.toLowerCase()))
        );
    };

    // Filter Invoices
    const filteredInvoices = filterData(invoices, invoiceSearch, ['seller', 'company', 'invoiceNo', 'date']);
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
                await fetchApi(`/purchase-order-payment/${id}`, { method: 'DELETE' });
                Swal.fire('Deleted!', 'Payment has been deleted.', 'success');
                fetchSellerData();
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

    const handlePreviewClick = async (inv) => {
        try {
            // inv.id is the database _id from ledger
            const fullInvoice = await fetchApi(`/purchase-order/${inv.id}`);
            if (fullInvoice && onPreview) {
                onPreview(fullInvoice);
            }
        } catch (error) {
            console.error("Error fetching full purchase invoice for preview:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch purchase invoice details for preview.'
            });
        }
    };

    return (
        <div className="seller-profile-container">
            <div className="seller-profile-header">
                <h2 className="seller-profile-title">{displayData.tradeName || displayData.name || 'Seller Profile'}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {onEdit && (
                        <button className="seller-profile-back-btn" onClick={onEdit} style={{ backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaEdit /> Edit
                        </button>
                    )}
                    {onBack && (
                        <button className="seller-profile-back-btn" onClick={onBack}>
                            ← Back
                        </button>
                    )}
                </div>
            </div>

            {/* Top Details Section - 3 Columns */}
            <div className="seller-profile-details-grid">
                {/* Personal & Business Details */}
                <div className="seller-detail-card">
                    <div className="seller-detail-card-title">Personal & Business Details</div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Trade Name:</span>
                        <span className="seller-detail-value">{displayData.tradeName}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Name:</span>
                        <span className="seller-detail-value">{displayData.name}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Prefix:</span>
                        <span className="seller-detail-value">{displayData.prefix}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Email:</span>
                        <span className="seller-detail-value">{displayData.email}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Mobile:</span>
                        <span className="seller-detail-value">{displayData.mobileNumber}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">GST:</span>
                        <span className="seller-detail-value">{displayData.gst}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">PAN No:</span>
                        <span className="seller-detail-value">{displayData.panNo}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Seller Type:</span>
                        <span className="seller-detail-value">{displayData.sellerType}</span>
                    </div>
                </div>

                {/* Address Details */}
                <div className="seller-detail-card">
                    <div className="seller-detail-card-title">Address Details</div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Country:</span>
                        <span className="seller-detail-value">{displayData.country}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">State:</span>
                        <span className="seller-detail-value">{displayData.state}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">City:</span>
                        <span className="seller-detail-value">{displayData.city}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Pin Code:</span>
                        <span className="seller-detail-value">{displayData.pinCode}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">State Code:</span>
                        <span className="seller-detail-value">{displayData.stateCode}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Address:</span>
                        <span className="seller-detail-value" style={{ maxWidth: '60%' }}>{displayData.address}</span>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="seller-detail-card">
                    <div className="seller-detail-card-title">Bank Details</div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Bank Name:</span>
                        <span className="seller-detail-value">{displayData.bankName}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Account Name:</span>
                        <span className="seller-detail-value">{displayData.accountName}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Account No:</span>
                        <span className="seller-detail-value">{displayData.accountNo}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">IFSC Code:</span>
                        <span className="seller-detail-value">{displayData.ifscCode}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">CIN Number:</span>
                        <span className="seller-detail-value">{displayData.cinNumber}</span>
                    </div>
                    <div className="seller-detail-row">
                        <span className="seller-detail-label">Bank Address:</span>
                        <span className="seller-detail-value">{displayData.bankAddress}</span>
                    </div>
                </div>
            </div>

            {/* Statistics Row */}
            <div className="seller-stats-row">
                <div className="seller-stat-card">
                    <div className="seller-stat-icon-wrapper stat-blue">
                        💵
                    </div>
                    <div className="seller-stat-info">
                        <h3>{(totals.totalInvoiceAmount || 0).toFixed(2)}/-</h3>
                        <p className="seller-stat-label">Total Invoice Amount</p>
                    </div>
                </div>
                <div className="seller-stat-card">
                    <div className="seller-stat-icon-wrapper stat-green">
                        📄
                    </div>
                    <div className="seller-stat-info">
                        <h3>{(totals.paidAmount || 0).toFixed(2)}/-</h3>
                        <p className="seller-stat-label">Paid Amount</p>
                    </div>
                </div>
                <div className="seller-stat-card">
                    <div className="seller-stat-icon-wrapper stat-red">
                        📱
                    </div>
                    <div className="seller-stat-info">
                        <h3>{(totals.pendingAmount || 0).toFixed(2)}/-</h3>
                        <p className="seller-stat-label">Pending Amount</p>
                    </div>
                </div>

                <div className="seller-profile-actions">
                    <button className="seller-action-btn" onClick={() => setIsPaymentModalOpen(true)}>Add Payment</button>
                    <button className="seller-action-btn" onClick={() => setShowStatement(true)}>Account Statement</button>
                </div>
            </div>

            {/* Tables Area */}
            <div className="seller-profile-tables-grid">

                {/* Purchase Invoice List */}
                <div className="seller-list-section">
                    <div className="seller-list-header">Purchase Invoice List</div>
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

                    <table className="seller-profile-table">
                        <thead>
                            <tr>
                                <th>SELLER</th>
                                <th>COMPANY</th>
                                <th>INVOICE NO</th>
                                <th>INVOICE DATE</th>
                                <th>PRINT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentInvoices.length > 0 ? currentInvoices.map((inv, idx) => (
                                <tr key={idx}>
                                    <td>{inv.seller}</td>
                                    <td>{inv.company}</td>
                                    <td>{inv.invoiceNo}</td>
                                    <td>{inv.date}</td>
                                    <td>
                                        <button
                                            className="list-page-icon-btn"
                                            title="Preview"
                                            onClick={() => handlePreviewClick(inv)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={5} className="no-data">No data available in table</td></tr>
                            )}
                        </tbody>
                    </table>

                    <div className="seller-profile-pagination">
                        <div>Showing {currentInvoices.length > 0 ? invoiceFirstIdx + 1 : 0} to {Math.min(invoiceLastIdx, filteredInvoices.length)} of {filteredInvoices.length} entries</div>
                        <div>
                            <button className="pagination-btn" onClick={() => setInvoicePage(p => Math.max(1, p - 1))} disabled={invoicePage === 1}>Previous</button>
                            <button className="pagination-btn active">1</button>
                            <button className="pagination-btn" onClick={() => setInvoicePage(p => p + 1)} disabled={invoicePage * invoiceEntries >= filteredInvoices.length}>Next</button>
                        </div>
                    </div>
                </div>

                {/* Payment List */}
                <div className="seller-list-section">
                    <div className="seller-list-header">Payment List</div>
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

                    <table className="seller-profile-table">
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

                    <div className="seller-profile-pagination">
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
                    fetchSellerData();
                }}
                entityName={displayData.tradeName}
                entityType="Seller"
                entityId={seller.sellerId || seller._id}
                paymentToEdit={paymentToEdit}
            />
        </div>
    );
};

export default SellerProfile;

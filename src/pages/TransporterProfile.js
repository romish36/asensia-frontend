import React, { useState, useEffect } from 'react';
import '../styles/TransporterProfile.css';
import AddPaymentModal from '../components/modals/AddPaymentModal';
import AccountStatement from './AccountStatement';
import fetchApi from '../utils/api.js';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash } from 'react-icons/fa';

const TransporterProfile = ({ transporter, onBack, onPreviewInvoice, onEdit }) => {
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
        if (transporter) {
            fetchTransporterData();
        }
    }, [transporter]);

    const fetchTransporterData = async () => {
        if (!transporter) return;
        try {
            setLoading(true);
            const tId = transporter.transporterId || transporter._id;
            if (!tId) return;

            // Fetch Totals (We'll need to implement this endpoint or mock it)
            // For now, let's try the endpoint. If it fails, we handle it.
            try {
                const totalsData = await fetchApi(`/transporter-payment/totals/${tId}`);
                setTotals(totalsData);
            } catch (err) {
                console.warn("Transporter totals API not implemented yet");
            }

            // Fetch Ledger
            try {
                const ledger = await fetchApi(`/transporter-payment/ledger/${tId}`);

                const invList = ledger.filter(e => e.type === 'Invoice').map(e => ({
                    id: e.refNo,
                    date: e.date,
                    place: transporter.transporterCity || '---',
                    amount: e.debit.toFixed(2)
                }));
                setInvoices(invList);
            } catch (err) {
                console.warn("Transporter ledger API not implemented yet");
            }

            // Fetch Payments list separately
            try {
                const paymentsData = await fetchApi(`/transporter-payment?transporterId=${tId}`);
                setPayments(paymentsData);
            } catch (err) {
                console.warn("Transporter payments list API not implemented yet");
            }

        } catch (error) {
            console.error("Error fetching transporter profile data:", error);
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

    // Unified data mapping
    const displayData = {
        name: transporter?.transporterName || '---',
        tradeName: transporter?.transporterTradeName || transporter?.transporterName || '---',
        referenceName: transporter?.transporterReferenceName || '---',
        email: transporter?.transporterEmail || '---',
        mobileNumber: transporter?.transporterMobileNumber || '---',
        gst: transporter?.transporterGst || '---',
        panNo: transporter?.transporterPanNo || '---',
        transporterType: transporter?.transporterType || '---',
        country: transporter?.transporterCountry || 'India',
        state: transporter?.transporterState || '---',
        city: transporter?.transporterCity || '---',
        pinCode: transporter?.transporterPinCode || '---',
        stateCode: transporter?.transporterStateCode || '---',
        address: transporter?.transporterAddress || '---'
    };

    // Filter Invoices
    const filteredInvoices = filterData(invoices, invoiceSearch, ['id', 'date', 'place', 'amount']);
    const invoiceLastIdx = invoicePage * invoiceEntries;
    const invoiceFirstIdx = invoiceLastIdx - invoiceEntries;
    const currentInvoices = filteredInvoices.slice(invoiceFirstIdx, invoiceLastIdx);

    // Filter Payments
    const filteredPayments = filterData(payments, paymentSearch, ['amount', 'mode', 'collector']);
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
                await fetchApi(`/transporter-payment/${id}`, { method: 'DELETE' });
                Swal.fire('Deleted!', 'Payment has been deleted.', 'success');
                fetchTransporterData();
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

    if (showStatement) {
        return (
            <AccountStatement
                customer={{ ...displayData, tradeName: displayData.tradeName }}
                customerId={transporter?.transporterId || transporter?._id}
                onBack={() => setShowStatement(false)}
                isTransporter={true} // We might need this in AccountStatement
            />
        );
    }

    return (
        <div className="transporter-profile-container">
            <div className="transporter-profile-header">
                <h2 className="transporter-profile-title">{displayData.name || 'Transporter Profile'}</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {onEdit && (
                        <button className="transporter-profile-back-btn" onClick={onEdit} style={{ backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <FaEdit /> Edit
                        </button>
                    )}
                    {onBack && (
                        <button className="transporter-profile-back-btn" onClick={onBack}>
                            ← Back
                        </button>
                    )}
                </div>
            </div>

            {/* Top Details Section */}
            <div className="transporter-profile-details-grid">
                <div className="transporter-detail-card">
                    <div className="transporter-detail-card-title">Personal & Business Details</div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Trade Name:</span>
                        <span className="transporter-detail-value">{displayData.tradeName}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Transporter Name:</span>
                        <span className="transporter-detail-value">{displayData.name}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Reference Name:</span>
                        <span className="transporter-detail-value">{displayData.referenceName}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Email:</span>
                        <span className="transporter-detail-value">{displayData.email}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Mobile:</span>
                        <span className="transporter-detail-value">{displayData.mobileNumber}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">GST:</span>
                        <span className="transporter-detail-value">{displayData.gst}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">PAN No:</span>
                        <span className="transporter-detail-value">{displayData.panNo}</span>
                    </div>
                </div>

                <div className="transporter-detail-card">
                    <div className="transporter-detail-card-title">Address Details</div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Country:</span>
                        <span className="transporter-detail-value">{displayData.country}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">State:</span>
                        <span className="transporter-detail-value">{displayData.state}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">City:</span>
                        <span className="transporter-detail-value">{displayData.city}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Pin Code:</span>
                        <span className="transporter-detail-value">{displayData.pinCode}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">State Code:</span>
                        <span className="transporter-detail-value">{displayData.stateCode}</span>
                    </div>
                    <div className="transporter-detail-row">
                        <span className="transporter-detail-label">Address:</span>
                        <span className="transporter-detail-value" style={{ maxWidth: '60%' }}>{displayData.address}</span>
                    </div>
                </div>

                <div className="transporter-stats-column">
                    <div className="transporter-stat-card">
                        <div className="transporter-stat-icon-wrapper stat-blue">
                            💵
                        </div>
                        <div className="transporter-stat-info">
                            <h3>{(totals.totalDebit || 0).toFixed(2)}/-</h3>
                            <p className="transporter-stat-label">Total Amount</p>
                        </div>
                    </div>
                    <div className="transporter-stat-card">
                        <div className="transporter-stat-icon-wrapper stat-green">
                            📄
                        </div>
                        <div className="transporter-stat-info">
                            <h3>{(totals.totalCredit || 0).toFixed(2)}/-</h3>
                            <p className="transporter-stat-label">Paid Amount</p>
                        </div>
                    </div>
                    <div className="transporter-stat-card">
                        <div className="transporter-stat-icon-wrapper stat-red">
                            📱
                        </div>
                        <div className="transporter-stat-info">
                            <h3>{(totals.balance || 0).toFixed(2)}/-</h3>
                            <p className="transporter-stat-label">Pending Amount</p>
                        </div>
                    </div>

                    <div className="transporter-profile-actions">
                        <button className="transporter-action-btn" onClick={() => setIsPaymentModalOpen(true)}>Add Payment</button>
                        <button className="transporter-action-btn" onClick={() => setShowStatement(true)}>Account Statement</button>
                    </div>
                </div>
            </div>

            <div className="transporter-profile-tables-grid">
                <div className="transporter-list-section">
                    <div className="transporter-list-header">LR / Invoice List</div>
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

                    <table className="transporter-profile-table">
                        <thead>
                            <tr>
                                <th>LR / INV NO</th>
                                <th>DATE</th>
                                <th>AREA</th>
                                <th>AMOUNT</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentInvoices.length > 0 ? currentInvoices.map(inv => (
                                <tr key={inv.id}>
                                    <td>{inv.id}</td>
                                    <td>{inv.date}</td>
                                    <td>{inv.place}</td>
                                    <td>{inv.amount}</td>
                                    <td>
                                        <button
                                            className="list-page-icon-btn"
                                            title="View"
                                            onClick={() => onPreviewInvoice && onPreviewInvoice(inv.id, 'transporter')}
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

                    <div className="transporter-profile-pagination">
                        <div>Showing {currentInvoices.length > 0 ? invoiceFirstIdx + 1 : 0} to {Math.min(invoiceLastIdx, filteredInvoices.length)} of {filteredInvoices.length} entries</div>
                        <div>
                            <button className="pagination-btn" onClick={() => setInvoicePage(p => Math.max(1, p - 1))} disabled={invoicePage === 1}>Previous</button>
                            <button className="pagination-btn active">1</button>
                            <button className="pagination-btn" onClick={() => setInvoicePage(p => p + 1)} disabled={invoicePage * invoiceEntries >= filteredInvoices.length}>Next</button>
                        </div>
                    </div>
                </div>

                <div className="transporter-list-section">
                    <div className="transporter-list-header">Payment List</div>
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

                    <table className="transporter-profile-table">
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

                    <div className="transporter-profile-pagination">
                        <div>Showing {currentPayments.length > 0 ? paymentFirstIdx + 1 : 0} to {Math.min(paymentLastIdx, filteredPayments.length)} of {filteredPayments.length} entries</div>
                        <div>
                            <button className="pagination-btn" onClick={() => setPaymentPage(p => Math.max(1, p - 1))} disabled={paymentPage === 1}>Previous</button>
                            <button className="pagination-btn active">1</button>
                            <button className="pagination-btn" onClick={() => setPaymentPage(p => p + 1)} disabled={paymentPage * paymentEntries >= filteredPayments.length}>Next</button>
                        </div>
                    </div>
                </div>
            </div>

            <AddPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentToEdit(null);
                    fetchTransporterData();
                }}
                entityName={displayData.name}
                entityType="Transporter"
                entityId={transporter?.transporterId || transporter?._id}
                paymentToEdit={paymentToEdit}
            />
        </div>
    );
};

export default TransporterProfile;

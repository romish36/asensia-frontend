import React, { useEffect, useState } from 'react';
import '../styles/AccountStatement.css';
import fetchApi from '../utils/api.js';

const AccountStatement = ({ customer, onBack, transactions: propTransactions, totals: propTotals, customerId, isPurchase, isTransporter }) => {
    const [ledger, setLedger] = useState([]);
    const [totals, setTotals] = useState({ debit: 0, credit: 0, balance: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (customerId) {
            fetchStatement();
        }
    }, [customerId]);

    const fetchStatement = async () => {
        try {
            setLoading(true);
            let baseRoute = '/invoice-payment';
            if (isPurchase) baseRoute = '/purchase-order-payment';
            if (isTransporter) baseRoute = '/transporter-payment';

            const data = await fetchApi(`${baseRoute}/ledger/${customerId}`);
            setLedger(data);

            const totalsData = await fetchApi(`${baseRoute}/totals/${customerId}`);
            setTotals({
                debit: (totalsData.totalDebit || totalsData.totalInvoiceAmount || 0).toFixed(2),
                credit: (totalsData.totalCredit || totalsData.paidAmount || 0).toFixed(2),
                balance: (totalsData.balance || totalsData.pendingAmount || 0).toFixed(2)
            });
        } catch (error) {
            console.error("Error fetching statement:", error);
        } finally {
            setLoading(false);
        }
    };

    const dataToRender = customerId ? ledger : (propTransactions || []);
    const totalsToRender = customerId ? totals : (propTotals || { credit: '0.00', debit: '0.00', balance: '0.00' });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="account-statement-container">
            {/* Action Buttons (Hidden when printing) */}
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={onBack}
                    style={{ padding: '8px 16px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                    Back
                </button>
                <button
                    onClick={handlePrint}
                    style={{ padding: '8px 16px', cursor: 'pointer', background: '#0f344d', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                    Print
                </button>
            </div>

            {/* Header Box */}
            <div className="as-header-box">
                <div className="as-header-row">
                    <div>M/S: {customer.tradeName || customer.customerName || 'CUSTOMER NAME'}</div>
                    <div>GST NUMBER: {customer.gst || 'GST NUMBER'}</div>
                </div>
                <div className="as-address-row">
                    ADDRESS: {customer.address || 'ADDRESS'}
                </div>
            </div>

            {/* Table */}
            <table className="as-table">
                <thead>
                    <tr>
                        <th className="as-col-sr">SR. NO</th>
                        <th className="as-col-date">DATE</th>
                        <th className="as-col-narration">NARRATION</th>
                        <th className="as-col-amount">CREDIT</th>
                        <th className="as-col-amount">DEBIT</th>
                        <th className="as-col-amount">BALANCE</th>
                    </tr>
                </thead>
                <tbody>
                    {dataToRender.map((tx, idx) => (
                        <tr key={idx}>
                            <td className="as-col-sr">{tx.srNo || idx + 1}</td>
                            <td>{tx.date}</td>
                            <td className="as-col-narration">
                                <div className="narration-content">{tx.narration}</div>
                            </td>
                            <td className="as-col-amount">{tx.credit}</td>
                            <td className="as-col-amount">{tx.debit}</td>
                            <td className="as-col-amount">{tx.balance}</td>
                        </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="as-total-row">
                        <td colSpan="3" style={{ textAlign: 'right', paddingRight: '10px' }}>TOTAL</td>
                        <td className="as-col-amount">{totalsToRender.credit}</td>
                        <td className="as-col-amount">{totalsToRender.debit}</td>
                        <td className="as-col-amount">{totalsToRender.balance}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default AccountStatement;

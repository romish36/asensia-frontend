import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';
import '../styles/PurchaseInvoicePreview.css';

const PurchaseInvoicePreview = ({ data: initialData, onBack, onEdit }) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFullData = async () => {
            if (initialData?._id) {
                setLoading(true);
                try {
                    const token = sessionStorage.getItem('token');
                    const res = await axios.get(`${API_BASE_URL}/purchase-order/${initialData._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data) {
                        setData(res.data);
                    }
                } catch (err) {
                    console.error("Error fetching full PO data:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchFullData();
    }, [initialData]);

    // Helper to convert number to words (Indian System)
    const numberToWords = (num) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if (n < 20) return a[n];
            let s = b[Math.floor(n / 10)];
            if (n % 10 > 0) s += ' ' + a[n % 10].trim();
            return s;
        };

        const convert = (n) => {
            if (n === 0) return '';
            let res = '';
            if (n >= 10000000) {
                res += convert(Math.floor(n / 10000000)) + 'Crore ';
                n %= 10000000;
            }
            if (n >= 100000) {
                res += inWords(Math.floor(n / 100000)) + ' Lakh ';
                n %= 100000;
            }
            if (n >= 1000) {
                res += inWords(Math.floor(n / 1000)) + ' Thousand ';
                n %= 1000;
            }
            if (n >= 100) {
                res += inWords(Math.floor(n / 100)) + ' Hundred ';
                n %= 100;
            }
            if (n > 0) {
                if (res !== '') res += 'and ';
                res += inWords(Math.floor(n));
            }
            return res;
        };

        if (num === 0) return 'Zero Only';
        const parts = num.toFixed(2).split('.');
        let result = convert(parseInt(parts[0]));
        if (parts.length > 1 && parseInt(parts[1]) > 0) {
            result += ' and ' + inWords(parseInt(parts[1])) + ' Paise';
        }
        return result.trim() + ' Only';
    };

    const subTotal = parseFloat(data?.totalAmount || 0);
    const freightAmount = parseFloat(data?.freight || 0);
    const insuranceAmount = parseFloat(data?.insurance || 0);
    const cgstAmount = (subTotal * 0.09);
    const sgstAmount = (subTotal * 0.09);
    const grandTotal = subTotal + cgstAmount + sgstAmount + freightAmount + insuranceAmount;

    // Build invoice object from dynamic data prop
    const invoice = {
        companyName: data?.companyName || 'No Name Found',
        address: data?.companyAddress || '',
        city: `${data?.companyCity || ''} ${data?.companyState || ''} ${data?.companyPinCode || ''}`,
        mobile: `Mo.: ${data?.companyMobileNumber || ''}`,
        email: `E-mail: ${data?.companyEmail || ''}`,
        invoiceType: 'TAX INVOICE',

        // Company (Seller) details
        pan: data?.companyPanCardNumber || '',
        gstin: data?.companyGstNumber || '',
        cin: '',

        // Invoice details
        invoiceNo: data?.invoiceNo || '',
        invoiceDate: data?.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB') : '',

        // Buyer details (Own Company)
        buyer: {
            name: data?.buyerTradeName || '',
            address: data?.buyerAddress || '',
            city: `${data?.buyerCity || ''} ${data?.buyerState || ''} ${data?.buyerPinCode || ''}`,
            pan: data?.buyerPanCardNumber || '',
            gstin: data?.buyerGstNumber || '',
            placeOfSupply: data?.buyerState || ''
        },

        // Consignee details (Assuming same as buyer for now)
        consignee: {
            name: data?.buyerTradeName || '',
            address: data?.buyerAddress || '',
            city: `${data?.buyerCity || ''} ${data?.buyerState || ''} ${data?.buyerPinCode || ''}`,
            pan: data?.buyerPanCardNumber || '',
            gstin: data?.buyerGstNumber || '',
            placeOfSupply: data?.buyerState || ''
        },

        // Transport details
        vehicleNo: data?.vehicleNo || '',
        lrNo: data?.lrNo || '',
        eWayBillNo: data?.eWayBillNo || '',

        // Items
        items: (data?.items || []).map((item, idx) => ({
            srNo: idx + 1,
            hsnCode: item.hsnCode || '',
            description: `${item.category || ''} ${item.product || ''}`,
            color: item.color || '',
            grade: item.grade || '',
            qty: item.quantity || 0,
            unit: item.unit || 'PCS',
            rate: item.rate || 0,
            amount: item.total || 0
        })),

        // Totals
        totals: {
            totalQty: (data?.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
            totalAmount: subTotal.toFixed(2),
            freight: freightAmount.toFixed(2),
            insurance: insuranceAmount.toFixed(2),
            subTotal: subTotal.toFixed(2),
            cgst: cgstAmount.toFixed(2),
            sgst: sgstAmount.toFixed(2),
            grandTotal: grandTotal.toFixed(2),
            amountInWords: numberToWords(grandTotal)
        },

        // Bank details
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifscCode: '',

        // Footer
        remarks: data?.remarks || '',
        termsAndConditions: data?.termsCondtion || ''
    };

    // Handle Print functionality
    const handlePrint = () => {
        window.print();
    };

    // Handle PDF Download using jsPDF
    const handleDownloadPDF = async () => {
        // Dynamic import of jspdf
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        // Get the invoice content
        const element = document.getElementById('invoice-content');

        // Create canvas from HTML
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`Invoice_${invoice.invoiceNo.replace(/\//g, '-')}.pdf`);
    };

    if (loading) return <div className="purchase-invoice-preview">Loading...</div>;

    return (
        <div className="purchase-invoice-preview">
            {/* Main container with invoice and sidebar */}
            <div className="preview-container">
                {/* Invoice content area */}
                <div className="invoice-wrapper" id="invoice-content">
                    <div className="invoice-box">
                        {/* Company Header */}
                        <div className="invoice-header">
                            <h1 className="company-name">{invoice.companyName}</h1>
                            <p className="company-address">{invoice.address}</p>
                            <p className="company-address">{invoice.city}</p>
                            <p className="company-contact">{invoice.mobile} {invoice.email}</p>
                            <h2 className="invoice-type">{invoice.invoiceType}</h2>
                        </div>

                        {/* Company Details Row */}
                        <div className="details-row">
                            <div className="details-left">
                                <div className="detail-item">PAN NO : {invoice.pan}</div>
                                <div className="detail-item">GSTIN NO : {invoice.gstin}</div>
                                <div className="detail-item">CIN/LLP NO : {invoice.cin}</div>
                            </div>
                            <div className="details-right">
                                <div className="detail-item">ORIGINAL FOR RECIPIENT [ ]</div>
                                <div className="detail-item">DUPALICATE FOR TRANSPORTER [ ]</div>
                                <div className="detail-item">TRIPALICATE FOR SUPPLIER [ ]</div>
                            </div>
                        </div>

                        {/* Buyer and Invoice Info */}
                        <div className="info-section">
                            <div className="info-left">
                                <div className="section-title">DETAILS OF RECEIVER (BUYER DETAIL)</div>
                                <div className="info-content">
                                    <strong>{invoice.buyer.name}</strong><br />
                                    {invoice.buyer.address}<br />
                                    {invoice.buyer.city}<br />
                                    <strong>PAN NO:</strong> {invoice.buyer.pan}<br />
                                    <strong>GSTIN NO:</strong> {invoice.buyer.gstin}<br />
                                    <strong>PLACE OF SUPPLY:</strong> {invoice.buyer.placeOfSupply}
                                </div>
                            </div>
                            <div className="info-right">
                                <div className="invoice-detail">
                                    <strong>INVOICE NO.:</strong> {invoice.invoiceNo}
                                </div>
                                <div className="invoice-detail">
                                    <strong>INVOICE DATE:</strong> {invoice.invoiceDate}
                                </div>
                            </div>
                        </div>

                        {/* Consignee and Transport Info */}
                        <div className="info-section">
                            <div className="info-left">
                                <div className="section-title">DETAILS OF CONSIGNEE (SHIPPED DETAIL)</div>
                                <div className="info-content">
                                    <strong>{invoice.consignee.name}</strong><br />
                                    {invoice.consignee.address}<br />
                                    {invoice.consignee.city}<br />
                                    <strong>PAN NO:</strong> {invoice.consignee.pan}<br />
                                    <strong>GSTIN NO:</strong> {invoice.consignee.gstin}<br />
                                    <strong>PLACE OF SUPPLY:</strong> {invoice.consignee.placeOfSupply}
                                </div>
                            </div>
                            <div className="info-right">
                                <div className="invoice-detail">
                                    <strong>VEHICLE NO.:</strong> {invoice.vehicleNo}
                                </div>
                                <div className="invoice-detail">
                                    <strong>L.R. NO:</strong> {invoice.lrNo}
                                </div>
                                <div className="invoice-detail">
                                    <strong>E-WAY BILL NO:</strong> {invoice.eWayBillNo}
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="invoice-table">
                            <thead>
                                <tr>
                                    <th>SR NO.</th>
                                    <th>HSN CODE</th>
                                    <th>DESCRIPTION OF GOODS</th>
                                    <th>COLOR</th>
                                    <th>GRADE</th>
                                    <th>QTY</th>
                                    <th>UNIT</th>
                                    <th>RATE</th>
                                    <th>AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.srNo}</td>
                                        <td>{item.hsnCode}</td>
                                        <td style={{ whiteSpace: 'pre-line' }}>{item.description}</td>
                                        <td>{item.color}</td>
                                        <td>{item.grade}</td>
                                        <td>{item.qty}</td>
                                        <td>{item.unit}</td>
                                        <td className="text-right">{item.rate}</td>
                                        <td className="text-right">{item.amount}</td>
                                    </tr>
                                ))}
                                <tr className="total-row-preview">
                                    <td colSpan="5" className="text-center"><strong>TOTAL</strong></td>
                                    <td><strong>{invoice.totals.totalQty}</strong></td>
                                    <td></td>
                                    <td></td>
                                    <td className="text-right"><strong>{invoice.totals.totalAmount}</strong></td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Footer Section */}
                        <div className="invoice-footer">
                            <div className="footer-left">
                                <div className="footer-row">
                                    <span className="footer-label">REMARKS:</span>
                                    <span className="footer-value">{invoice.remarks}</span>
                                </div>
                                <div className="footer-row">
                                    <span className="footer-label">RUPEES IN WORDS:</span>
                                    <span className="footer-value"><strong>{invoice.totals.amountInWords}</strong></span>
                                </div>
                                <div className="footer-row">
                                    <span className="footer-label">BANK NAME:</span>
                                    <span className="footer-value">{invoice.bankName}</span>
                                </div>
                                <div className="footer-row">
                                    <span className="footer-label">ACCOUNT NAME:</span>
                                    <span className="footer-value">{invoice.accountName}</span>
                                </div>
                                <div className="footer-row">
                                    <span className="footer-label">ACCOUNT NUMBER:</span>
                                    <span className="footer-value">{invoice.accountNumber}</span>
                                </div>
                                <div className="footer-row">
                                    <span className="footer-label">RTGS / IFSC CODE:</span>
                                    <span className="footer-value">{invoice.ifscCode}</span>
                                </div>
                                <div className="footer-terms">
                                    <strong>TERMS & CONDITIONS:</strong>
                                    <p>{invoice.termsAndConditions}</p>
                                </div>
                            </div>
                            <div className="footer-right">
                                <div className="amount-row">
                                    <span>FREIGHT (0%)</span>
                                    <span className="text-right">{invoice.totals.freight}</span>
                                </div>
                                <div className="amount-row">
                                    <span>INSURANCE (0%)</span>
                                    <span className="text-right">{invoice.totals.insurance}</span>
                                </div>
                                <div className="amount-row">
                                    <strong>SUB TOTAL</strong>
                                    <span className="text-right"><strong>{invoice.totals.subTotal}</strong></span>
                                </div>
                                <div className="amount-row">
                                    <strong>CGST (9%)</strong>
                                    <span className="text-right"><strong>{invoice.totals.cgst}</strong></span>
                                </div>
                                <div className="amount-row">
                                    <strong>SGST (9%)</strong>
                                    <span className="text-right"><strong>{invoice.totals.sgst}</strong></span>
                                </div>
                                <div className="amount-row grand-total">
                                    <strong>GRAND TOTAL</strong>
                                    <span className="text-right"><strong>{invoice.totals.grandTotal}</strong></span>
                                </div>
                                <div className="signature-section">
                                    <p>FOR, {invoice.companyName}</p>
                                    <p className="signature-line">[AUTHORISED SIGNATORY]</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons Sidebar */}
                <div className="action-sidebar">
                    <button className="action-btn" onClick={onBack}>Back</button>
                    <button className="action-btn" onClick={onEdit}>Update</button>
                    <button className="action-btn" onClick={handleDownloadPDF}>PDF</button>
                    <button className="action-btn" onClick={handlePrint}>Print</button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseInvoicePreview;

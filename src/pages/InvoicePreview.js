import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/apiConfig';
import '../styles/InvoicePreview.css';
import PaymentTypeModal from '../components/modals/PaymentTypeModal';
import InvoiceTypeModal from '../components/modals/InvoiceTypeModal';
import InvoiceCopyModal from '../components/modals/InvoiceCopyModal';

const SERVER_URL = API_BASE_URL.replace('/api', '');
const InvoicePreview = ({ data: initialData, onBack }) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFullData = async () => {
            if (initialData?._id && (!initialData.companyId || typeof initialData.companyId === 'string')) {
                setLoading(true);
                try {
                    const token = sessionStorage.getItem('token');
                    const res = await axios.get(`${API_BASE_URL}/sales-invoice/${initialData._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.data) {
                        setData(res.data);
                    }
                } catch (err) {
                    console.error("Error fetching full invoice data:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchFullData();
    }, [initialData]);

    // State for payment types from DB
    const [paymentTypes, setPaymentTypes] = useState([]);

    // State for Payment Type Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPaymentType, setSelectedPaymentType] = useState(data?.invoicePaymentTypeName || 'Debit');

    useEffect(() => {
        fetchPaymentTypes();
    }, []);

    const fetchPaymentTypes = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/invoice-payment-type`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPaymentTypes(res.data);
            if (!data?.invoicePaymentTypeName && res.data.length > 0) {
                setSelectedPaymentType(res.data[0].invoicePaymentTypeName);
            }
        } catch (err) {
            console.error("Error fetching payment types:", err);
        }
    };

    // State for Invoice Type Modal
    const [isInvoiceTypeModalOpen, setIsInvoiceTypeModalOpen] = useState(false);
    const [selectedInvoiceType, setSelectedInvoiceType] = useState('Tax invoice');

    // State for Invoice Copy Modal
    const [isInvoiceCopyModalOpen, setIsInvoiceCopyModalOpen] = useState(false);
    const [selectedCopyType, setSelectedCopyType] = useState('Original');

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

    const subTotal = (data?.items || []).reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0);
    const insuranceAmt = parseFloat(data?.insurance || 0);
    const extraAmt = parseFloat(data?.extrChargesAmount || 0);
    const igstAmt = subTotal * 0.18;
    const gTotal = subTotal + igstAmt + insuranceAmt + extraAmt;

    const invoiceData = useMemo(() => ({
        invoiceNo: data?.invoiceNo || 'AW-001',
        invoiceDate: data?.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB') : '30/01/2026',
        eWayBillNo: data?.eWayBillNo || '',
        transporter: data?.transporterTradeName || data?.transporterName || 'SELF',
        vehicleNo: data?.vehicleNo || '',
        lrNo: data?.lrNo || '',
        containerNo: data?.containerNo || '',
        sealNo: data?.sealNo || '',
        buyer: {
            name: data?.customerName || 'N/A',
            address: data?.customerAddress || 'N/A',
            cityState: data?.customerPinCode ? `${data.customerCity || ''} - ${data.customerPinCode}` : 'N/A',
            placeOfSupply: data?.customerPlaceOfSupply || 'N/A',
            stateCode: data?.customerStateCode || 'N/A',
            gstin: data?.customerGst || 'N/A',
            pan: data?.customerPanNo || 'N/A'
        },
        consignee: {
            name: data?.customerName || 'N/A',
            address: data?.customerDeliveryAddress || data?.customerAddress || 'N/A',
            cityState: data?.customerPinCode ? `${data.customerCity || ''} - ${data.customerPinCode}` : 'N/A',
            placeOfSupply: data?.customerPlaceOfSupply || 'N/A',
            stateCode: data?.customerStateCode || 'N/A',
            gstin: data?.customerGst || 'N/A',
            pan: data?.customerPanNo || 'N/A'
        },
        items: (data?.items || []).map((it, idx) => ({
            srNo: idx + 1,
            description: `${it.category || ''} ${it.product || ''}`,
            model: it.modelNumber || '',
            hsn: it.hsnCode || '',
            grade: it.grade || '',
            color: it.color || '',
            qty: parseFloat(it.quantity || 0).toFixed(2),
            rate: parseFloat(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            amount: parseFloat(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
        })),
        totals: {
            qty: (data?.items || []).reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0).toFixed(2),
            amount: subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            words: numberToWords(gTotal),
            insurance: insuranceAmt.toFixed(2),
            extra: extraAmt.toFixed(2),
            igst: igstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            grandTotal: gTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            gstPercent: '18%'
        },
        bank: {
            name: data?.invoiceCompanyBankName || 'N/A',
            accountName: data?.invoiceCompanyBankAccountName || 'N/A',
            accountNumber: data?.invoiceCompanyBankAccountNumber || 'N/A',
            ifsc: data?.invoiceCompanyBankIfscCode || 'N/A'
        }
    }), [data, subTotal, insuranceAmt, extraAmt, igstAmt, gTotal]);

    const handlePaymentSubmit = (type) => {
        setSelectedPaymentType(type);
        console.log("Selected Payment Type:", type);
    };

    const handleInvoiceTypeSubmit = (type) => {
        setSelectedInvoiceType(type);
        console.log("Selected Invoice Type:", type);
    };

    const handleInvoiceCopySubmit = (type) => {
        setSelectedCopyType(type);
        console.log("Selected Copy Type:", type);
    };

    // Handle PDF Download
    const handleDownloadPDF = async () => {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const element = document.querySelector('.invoice-box');

        // Use html2canvas to capture the invoice-box
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            padding: 0,
            backgroundColor: '#ffffff',
            useCORS: true // Important for images
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

        // Save PDF
        pdf.save(`Invoice_${invoiceData.invoiceNo}.pdf`);
    };

    // Handle PDF Download Without Letter
    const handleDownloadPDFWithoutLetter = async () => {
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;

        const element = document.querySelector('.invoice-box');
        const headerImageContainer = element.querySelector('.header-image-container');
        const signatureContainer = element.querySelector('.auth-sign-img');

        // Store original display style
        const originalDisplayHeader = headerImageContainer.style.display;
        const originalDisplaySignature = signatureContainer.style.display;

        // Hide header and signature for capture
        headerImageContainer.style.display = 'none';
        signatureContainer.style.display = 'none';

        try {
            // Use html2canvas to capture the invoice-box without header
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                padding: 0,
                backgroundColor: '#ffffff',
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

            // Save PDF
            pdf.save(`Invoice_NoLetter_${invoiceData.invoiceNo}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        } finally {
            // Restore visibility
            headerImageContainer.style.display = originalDisplayHeader;
            signatureContainer.style.display = originalDisplaySignature;
        }
    };

    // Handle Print With Letter
    const handlePrintWithLetter = () => {
        window.print();
    };

    // Handle Print Without Letter
    const handlePrintWithoutLetter = () => {
        const header = document.querySelector('.header-image-container');
        const sign = document.querySelector('.auth-sign-img');

        const originalHeader = header ? header.style.display : '';
        const originalSign = sign ? sign.style.display : '';

        if (header) header.style.display = 'none';
        if (sign) sign.style.display = 'none';

        window.print();

        if (header) header.style.display = originalHeader;
        if (sign) sign.style.display = originalSign;
    };

    if (loading) return <div className="inv-preview-container">Loading...</div>;

    return (
        <div className="inv-preview-container">
            <div className="inv-preview-main">
                <div className="inv-top-controls">
                    <button className="inv-control-btn" onClick={() => setIsPaymentModalOpen(true)}>Payment Type</button>
                    <button className="inv-control-btn" onClick={() => setIsInvoiceTypeModalOpen(true)}>Invoice Type</button>
                    <button className="inv-control-btn" onClick={() => setIsInvoiceCopyModalOpen(true)}>Invoice Copy</button>
                    {onBack && <button className="inv-control-btn" onClick={onBack} style={{ marginLeft: 'auto', background: '#d33' }}>Close Preview</button>}
                </div>

                <div className="invoice-box" id="invoice-content-to-pdf">
                    {/* Header Image Row */}
                    <div className="header-image-container">
                        <div className="header-image-placeholder">
                            {data?.companyId?.companyLetterHeadHeaderImage ? (
                                <img
                                    src={`${SERVER_URL}/${data.companyId.companyLetterHeadHeaderImage.startsWith('/') ? data.companyId.companyLetterHeadHeaderImage.substring(1) : data.companyId.companyLetterHeadHeaderImage}`}
                                    alt="Header"
                                    className="asencia_header"
                                />
                            ) : (
                                <div className="no-header-placeholder">
                                    <h1 style={{ margin: 0 }}>{data?.companyName || 'COMPANY NAME'}</h1>
                                    <p>{data?.companyAddress || 'ADDRESS'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Header */}
                    <div className="invoice-header-row">
                        <div className="invoice-header-left">{selectedPaymentType.toUpperCase()}</div>
                        <div className="invoice-header-center">{selectedInvoiceType.toUpperCase()}</div>
                        <div className="invoice-header-right">{selectedCopyType.toUpperCase()}</div>
                    </div>

                    {/* Addresses */}
                    <div className="invoice-addresses">
                        <div className="address-block">
                            <div className="address-title">DETAILS OF RECEIVER (BUYER DETAILS)</div>
                            <div className="address-content">
                                <p><strong>M/S. &nbsp;&nbsp;: {invoiceData.buyer.name}</strong></p>
                                <p style={{ paddingLeft: '35px' }}>{invoiceData.buyer.address}</p>
                                <p style={{ paddingLeft: '35px' }}><strong>{invoiceData.buyer.cityState}</strong></p>
                                <p><strong>PLACE OF SUPPLY:</strong> {invoiceData.buyer.placeOfSupply} <strong>STATE CODE:</strong> {invoiceData.buyer.stateCode}</p>
                                <p><strong>GSTIN NO.:</strong> {invoiceData.buyer.gstin} <strong>PAN NO.:</strong> {invoiceData.buyer.pan}</p>
                            </div>
                        </div>
                        <div className="address-block">
                            <div className="address-title">DETAILS OF CONSIGNEE (SHIPPED DETAILS)</div>
                            <div className="address-content">
                                <p><strong>M/S. &nbsp;&nbsp;: {invoiceData.consignee.name}</strong></p>
                                <p style={{ paddingLeft: '35px' }}>{invoiceData.consignee.address}</p>
                                <p style={{ paddingLeft: '35px' }}><strong>{invoiceData.consignee.cityState}</strong></p>
                                <p><strong>PLACE OF SUPPLY:</strong> {invoiceData.consignee.placeOfSupply} <strong>STATE CODE:</strong> {invoiceData.consignee.stateCode}</p>
                                <p><strong>GSTIN NO.:</strong> {invoiceData.consignee.gstin} <strong>PAN NO.:</strong> {invoiceData.consignee.pan}</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Meta */}
                    <div className="invoice-meta-row">
                        <div className="invoice-meta-left">
                            <div className="meta-line">
                                <span className="meta-label">INVOICE NO.</span>
                                <span>: {invoiceData.invoiceNo}</span>
                            </div>
                            <div className="meta-line">
                                <span className="meta-label">INVOICE DATE</span>
                                <span>: {invoiceData.invoiceDate}</span>
                            </div>
                            <div className="meta-line" style={{ marginTop: '10px' }}>
                                <span className="meta-label">E WAY BILL NO.</span>
                                <span>: {invoiceData.eWayBillNo}</span>
                            </div>
                        </div>
                        <div className="invoice-meta-right">
                            <div className="meta-line"><span className="meta-label">TRANSPORTER</span>: {invoiceData.transporter}</div>
                            <div className="meta-line"><span className="meta-label">VEHICLE NO.</span>: {invoiceData.vehicleNo}</div>
                            <div className="meta-line"><span className="meta-label">L.R. NO.</span>: {invoiceData.lrNo}</div>
                            <div className="meta-line"><span className="meta-label">CONTAINER NO.</span>: {invoiceData.containerNo}</div>
                            <div className="meta-line"><span className="meta-label">SEAL NO.</span>: {invoiceData.sealNo}</div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="invoice-body-grid">
                        <div className="grid-header">SR.<br />NO.</div>
                        <div className="grid-header">DESCRIPTION</div>
                        <div className="grid-header">MODEL NUMBER</div>
                        <div className="grid-header">HSN</div>
                        <div className="grid-header">GRADE</div>
                        <div className="grid-header">COLOR</div>
                        <div className="grid-header">QTY</div>
                        <div className="grid-header">RATE</div>
                        <div className="grid-header">AMOUNT</div>
                    </div>

                    {/* Items */}
                    <div className="invoice-content-container" style={{ display: 'flex' }}>
                        {/* Columns Container for continuous lines */}
                        <div style={{ width: '40px', borderRight: '1px solid #333', textAlign: 'center', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.srNo}</div>)}
                        </div>
                        <div style={{ flex: 1, borderRight: '1px solid #333', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => (
                                <div key={i}>
                                    {item.description}
                                </div>
                            ))}
                        </div>
                        <div style={{ width: '100px', borderRight: '1px solid #333', textAlign: 'center', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.model}</div>)}
                        </div>
                        <div style={{ width: '60px', borderRight: '1px solid #333', textAlign: 'center', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.hsn}</div>)}
                        </div>
                        <div style={{ width: '60px', borderRight: '1px solid #333', textAlign: 'center', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.grade}</div>)}
                        </div>
                        <div style={{ width: '60px', borderRight: '1px solid #333', textAlign: 'center', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.color}</div>)}
                        </div>
                        <div style={{ width: '50px', borderRight: '1px solid #333', textAlign: 'center', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.qty}</div>)}
                        </div>
                        <div style={{ width: '80px', borderRight: '1px solid #333', textAlign: 'right', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.rate}</div>)}
                        </div>
                        <div style={{ width: '100px', textAlign: 'right', padding: '5px' }}>
                            {invoiceData.items.map((item, i) => <div key={i}>{item.amount}</div>)}
                        </div>
                    </div>

                    {/* Total Line */}
                    {/* We need to match the columns precisely for the total line or use a flex row */}
                    <div style={{ display: 'flex', borderTop: '1px solid #333', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                        <div style={{ flex: 1, borderRight: '1px solid #333', padding: '5px' }}>INTER STATE {invoiceData.totals.gstPercent}</div>
                        <div style={{ flex: 1, textAlign: 'right', borderRight: '1px solid #333', padding: '5px' }}>TOTAL</div>
                        <div style={{ width: '50px', borderRight: '1px solid #333', textAlign: 'center', padding: '5px' }}>{invoiceData.totals.qty}</div>
                        <div style={{ width: '80px', borderRight: '1px solid #333', padding: '5px' }}></div> {/* Empty Rate column space */}
                        <div style={{ width: '100px', textAlign: 'right', padding: '5px' }}>{invoiceData.totals.amount}</div>
                    </div>


                    {/* Footer Lower Section */}
                    <div className="footer-row no-border">
                        <div className="footer-col-left">
                            <div className="remark-row"><strong>REMARK</strong></div>
                            <div className="amount-words-row">RUPPES IN WORDS :- {invoiceData.totals.words}</div>

                            <table className="bank-details-table">
                                <tbody>
                                    <tr>
                                        <td width="150" style={{ fontWeight: 'bold' }}>BANK NAME</td>
                                        <td>{invoiceData.bank.name}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold' }}>ACCOUNT_NAME</td>
                                        <td>{invoiceData.bank.accountName}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold' }}>ACCOUNT_NUMBER</td>
                                        <td>{invoiceData.bank.accountNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontWeight: 'bold' }}>RTGS/IFSC CODE</td>
                                        <td>{invoiceData.bank.ifsc}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ borderTop: '1px solid #333', padding: '5px', fontWeight: 'bold' }}>
                                TAX IS PAYABLE ON REVERSE CHARGE : NO
                            </div>
                        </div>
                        <div className="footer-col-right">
                            <table className="summary-table">
                                <tbody>
                                    <tr>
                                        <td>DISCOUNT</td>
                                        <td align="right"></td>
                                    </tr>
                                    <tr>
                                        <td>INSURANCE(0.3%)</td>
                                        <td align="right">{invoiceData.totals.insurance}</td>
                                    </tr>
                                    <tr>
                                        <td>EXTRA CHARGES</td>
                                        <td align="right">{invoiceData.totals.extra}</td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td align="right"><b>{Number(invoiceData.totals.amount.replace(/,/g, '')) + Number(invoiceData.totals.insurance)}</b></td>
                                    </tr>
                                    <tr>
                                        <td>IGST ({invoiceData.totals.gstPercent})</td>
                                        <td align="right">{invoiceData.totals.igst}</td>
                                    </tr>
                                    <tr>
                                        <td>GRAND TOTAL</td>
                                        <td align="right"><b>{invoiceData.totals.grandTotal}</b></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Terms and Signature */}
                    <div style={{ borderTop: '1px solid #333', display: 'flex' }}>
                        <div className="terms-col">
                            <strong>TERMS & CONDITION</strong>
                            <ol style={{ paddingLeft: '20px', marginTop: '5px' }}>
                                <li>GOODS ONCE SUPPLIED WILL NOT BE TAKEN BACK OR EXCHANGED.</li>
                                <li>WE ARE NOT RESPONSIBLE FOR ANY SHORTAGE OR DAMAGE IN TRANSIST.</li>
                                <li>INTEREST AT THE RATE OF 18% SHALL BE CHARGED ON ALL AMOUNTS UNPAID WITHIN 15 DAYS FROM THE SUPPLY DATE.</li>
                                <li>RS. 250 WILL BE CHARGED, WHEN CHEQUE WOULD BOUNCE.</li>
                                <li>SUBJECT TO MORBI JURISDICTION. E. & O.E</li>
                            </ol>
                        </div>
                        <div className="signature-col" style={{ borderLeft: '1px solid #333' }}>
                            <div style={{ fontWeight: 'bold' }}>FOR, ASENSIA INDUSTRY LLP</div>
                            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {data?.companyId?.companyDigitalSignature ? (
                                    <img
                                        src={`${SERVER_URL}/${data.companyId.companyDigitalSignature.startsWith('/') ? data.companyId.companyDigitalSignature.substring(1) : data.companyId.companyDigitalSignature}`}
                                        alt="Authorised Signatory"
                                        className="auth-sign-img"
                                    />
                                ) : (
                                    <div style={{ fontStyle: 'italic', color: '#ccc' }}>Sign here</div>
                                )}
                            </div>
                            <div style={{ fontSize: '10px' }}>(AUTHORISED SIGNATORY)</div>
                        </div>
                    </div>
                    {/* Footer Image Row */}
                    {data?.companyId?.companyLetterHeadFooterImage && (
                        <div className="footer-image-container" style={{ borderTop: '1px solid #333' }}>
                            <img
                                src={`${SERVER_URL}/${data.companyId.companyLetterHeadFooterImage.startsWith('/') ? data.companyId.companyLetterHeadFooterImage.substring(1) : data.companyId.companyLetterHeadFooterImage}`}
                                alt="Footer"
                                style={{ width: '100%', display: 'block' }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="inv-sidebar">
                <button className="sidebar-btn" onClick={handleDownloadPDF}>With Letter PDF</button>
                <button className="sidebar-btn" onClick={handleDownloadPDFWithoutLetter}>Without Letter PDF</button>
                <button className="sidebar-btn" onClick={handlePrintWithLetter}>With Letter Print</button>
                <button className="sidebar-btn" onClick={handlePrintWithoutLetter}>Without Letter Print</button>


                <input type="text" placeholder="Enter Mobile Number" className="sidebar-input" />
                <button className="sidebar-btn sidebar-btn-whatsapp">Send WhatsApp</button>
            </div>

            {/* Payment Type Modal */}
            <PaymentTypeModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSubmit={handlePaymentSubmit}
            />

            {/* Invoice Type Modal */}
            <InvoiceTypeModal
                isOpen={isInvoiceTypeModalOpen}
                onClose={() => setIsInvoiceTypeModalOpen(false)}
                onSubmit={handleInvoiceTypeSubmit}
            />

            {/* Invoice Copy Modal */}
            <InvoiceCopyModal
                isOpen={isInvoiceCopyModalOpen}
                onClose={() => setIsInvoiceCopyModalOpen(false)}
                onSubmit={handleInvoiceCopySubmit}
            />
        </div>
    );
};

export default InvoicePreview;

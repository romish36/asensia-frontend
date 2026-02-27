import React, { useEffect } from 'react';
import '../../styles/CustomerDetailsModal.css';

const CustomerDetailsModal = ({ isOpen, onClose, customer }) => {
    if (!isOpen || !customer) return null;

    return (
        <div className="cd-modal-overlay" onClick={onClose}>
            <div className="cd-modal-content" onClick={e => e.stopPropagation()}>
                <button className="cd-close-btn" onClick={onClose}>&times;</button>

                <div className="cd-header">
                    <h3 className="cd-title">Customer Details</h3>
                </div>

                <div className="cd-body">
                    <div className="cd-list-container">
                        <div className="cd-row">
                            <span className="cd-label">NAME:</span>
                            <span className="cd-value">{customer.customerName}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">TRADE NAME:</span>
                            <span className="cd-value">{customer.customerTradeName}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">REFERENCE NAME:</span>
                            <span className="cd-value">{customer.customerReferenceName || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">MOBILE NUMBER:</span>
                            <span className="cd-value">{customer.customerMobileNumber}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">EMAIL:</span>
                            <span className="cd-value">{customer.customerEmail}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">COUNTRY:</span>
                            <span className="cd-value">{customer.customerCountry}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">STATE:</span>
                            <span className="cd-value">{customer.customerState}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">CITY:</span>
                            <span className="cd-value">{customer.customerCity}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">PIN CODE:</span>
                            <span className="cd-value">{customer.customerPinCode}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">STATE CODE:</span>
                            <span className="cd-value">{customer.customerStateCode}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">ADDRESS:</span>
                            <span className="cd-value">{customer.customerAddress}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">GST NUMBER:</span>
                            <span className="cd-value">{customer.customerGst}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">PAN NUMBER:</span>
                            <span className="cd-value">{customer.customerPanNo}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">SALE TYPE:</span>
                            <span className="cd-value">{customer.saleTypeId?.saleTypeName || customer.customerSaleTypeName || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailsModal;

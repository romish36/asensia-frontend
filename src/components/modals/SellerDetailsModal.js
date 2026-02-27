import React from 'react';
import '../../styles/SellerDetailsModal.css';

const SellerDetailsModal = ({ isOpen, onClose, seller }) => {
    if (!isOpen || !seller) return null;

    // Helper to safely get value or empty string
    const getVal = (key) => seller[key] || '';

    return (
        <div className="sd-modal-overlay" onClick={onClose}>
            <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sd-modal-header">
                    <h2 className="sd-modal-title">Seller DETAILS</h2>
                    <button className="sd-modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="sd-modal-body">
                    <div className="sd-details-list">
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Trade Name:</span>
                            <span className="sd-detail-value">{getVal('sellerTradeName')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Name:</span>
                            <span className="sd-detail-value">{getVal('sellerName')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Prefix:</span>
                            <span className="sd-detail-value">{getVal('sellerPrefix')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Email:</span>
                            <span className="sd-detail-value">{getVal('sellerEmail')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Mobile Number:</span>
                            <span className="sd-detail-value">{getVal('sellerMobileNumber')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">GST Number:</span>
                            <span className="sd-detail-value">{getVal('sellerGstNumber')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Pan Card Number:</span>
                            <span className="sd-detail-value">{getVal('sellerPanCardNumber')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Country:</span>
                            <span className="sd-detail-value">{getVal('sellerCountry') || 'India'}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">State:</span>
                            <span className="sd-detail-value">{getVal('sellerState')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">City:</span>
                            <span className="sd-detail-value">{getVal('sellerCity')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">State Code:</span>
                            <span className="sd-detail-value">{getVal('sellerStateCode')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Pin Code:</span>
                            <span className="sd-detail-value">{getVal('sellerPinCode')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Bank Name:</span>
                            <span className="sd-detail-value">{getVal('sellerBankName')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Bank Account Name:</span>
                            <span className="sd-detail-value">{getVal('sellerBankAccountName')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Account No:</span>
                            <span className="sd-detail-value">{getVal('sellerAccountNo')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">IFSC Code:</span>
                            <span className="sd-detail-value">{getVal('sellerIfscCode')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">CIN Number:</span>
                            <span className="sd-detail-value">{getVal('sellerCinNumber')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Bank Address:</span>
                            <span className="sd-detail-value">{getVal('sellerBankAddress')}</span>
                        </div>
                        <div className="sd-detail-item">
                            <span className="sd-detail-label">Seller Address:</span>
                            <span className="sd-detail-value">{getVal('sellerAddress')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDetailsModal;

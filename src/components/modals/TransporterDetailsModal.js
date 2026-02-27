import React, { useEffect } from 'react';
import '../../styles/CustomerDetailsModal.css'; // Reusing the same CSS style

const TransporterDetailsModal = ({ isOpen, onClose, transporter }) => {
    if (!isOpen || !transporter) return null;

    return (
        <div className="cd-modal-overlay" onClick={onClose}>
            <div className="cd-modal-content" onClick={e => e.stopPropagation()}>
                <button className="cd-close-btn" onClick={onClose}>&times;</button>

                <div className="cd-header">
                    <h3 className="cd-title">Transporter Details</h3>
                </div>

                <div className="cd-body">
                    <div className="cd-list-container">
                        <div className="cd-row">
                            <span className="cd-label">NAME:</span>
                            <span className="cd-value">{transporter.transporterName}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">TRADE NAME:</span>
                            <span className="cd-value">{transporter.transporterTradeName}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">REFERENCE NAME:</span>
                            <span className="cd-value">{transporter.transporterReferenceName || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">MOBILE NUMBER:</span>
                            <span className="cd-value">{transporter.transporterMobileNumber}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">EMAIL:</span>
                            <span className="cd-value">{transporter.transporterEmail}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">COUNTRY:</span>
                            <span className="cd-value">{transporter.transporterCountry || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">STATE:</span>
                            <span className="cd-value">{transporter.transporterState || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">CITY:</span>
                            <span className="cd-value">{transporter.transporterCity || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">PIN CODE:</span>
                            <span className="cd-value">{transporter.transporterPinCode || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">STATE CODE:</span>
                            <span className="cd-value">{transporter.transporterStateCode || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">ADDRESS:</span>
                            <span className="cd-value">{transporter.transporterAddress || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">GST NUMBER:</span>
                            <span className="cd-value">{transporter.transporterGst}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">PAN NUMBER:</span>
                            <span className="cd-value">{transporter.transporterPanNo || ''}</span>
                        </div>
                        <div className="cd-row">
                            <span className="cd-label">TYPE:</span>
                            <span className="cd-value">{transporter.transporterType || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransporterDetailsModal;

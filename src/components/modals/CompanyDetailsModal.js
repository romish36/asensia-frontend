import React from 'react';
import '../../styles/CompanyDetailsModal.css';

const CompanyDetailsModal = ({ isOpen, onClose, company }) => {
    if (!isOpen || !company) return null;

    // Helper to safely get value or empty string
    const getVal = (key) => {
        // Map UI keys to backend keys if they differ
        const mapping = {
            'name': 'companyName',
            'personName': 'companyPersonName',
            'email': 'companyEmail',
            'mobileNumber': 'companyMobileNumber_1',
            'mobileNumber2': 'companyMobileNumber_2',
            'website': 'companyWebsiteUrl',
            'gst': 'companyGstNumber',
            'pan': 'companyPanCardNumber',
            'aadhar': 'companyAadharCardNumber',
            'country': 'companyCountry',
            'state': 'companyState',
            'city': 'companyCity',
            'stateCode': 'companyStateCode',
            'pinCode': 'companyPinCode',
            'address': 'companyAddress',
            'bankName': 'companyBankName',
            'bankAccountName': 'companyBankAccount_Name',
            'bankAccountNumber': 'companyBankAccount_Number',
            'swiftCode': 'companySwiftCode',
            'iban': 'companyIbanNo',
            'ifsc': 'companyBankIfscCode',
            'eWayBillUsername': 'companyEWayBillUsername',
            'eWayBillPassword': 'companyEWayBillPassword',
            'bankAddress': 'companyBankAddress'
        };
        const backendKey = mapping[key] || key;
        return company[backendKey] || '';
    };

    // Function to render address with manual line breaks if needed or just letting it wrap
    // The image showed <br/> in the text, so we might want to decode HTML or just display text.
    // I'll assume standard text for now.

    return (
        <div className="cd-modal-overlay" onClick={onClose}>
            <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="cd-modal-header">
                    <h2 className="cd-modal-title">Company Details</h2>
                    <button className="cd-modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="cd-modal-body">
                    <div className="cd-details-list">
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Name:</span>
                            <span className="cd-detail-value">{getVal('name')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Person Name:</span>
                            <span className="cd-detail-value">{getVal('personName')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Email:</span>
                            <span className="cd-detail-value">{getVal('email')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Mobile Number 1:</span>
                            <span className="cd-detail-value">{getVal('mobileNumber')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Mobile Number 2:</span>
                            <span className="cd-detail-value">{getVal('mobileNumber2')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Website Url:</span>
                            <span className="cd-detail-value">{getVal('website')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Gst Number:</span>
                            <span className="cd-detail-value">{getVal('gst')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Pan Card Number:</span>
                            <span className="cd-detail-value">{getVal('pan')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Aadhar Card_Number:</span>
                            <span className="cd-detail-value">{getVal('aadhar')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Country:</span>
                            <span className="cd-detail-value">{getVal('country') || 'India'}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">State:</span>
                            <span className="cd-detail-value">{getVal('state') || 'Gujarat'}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">City:</span>
                            <span className="cd-detail-value">{getVal('city') || 'Morbi'}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">State Code:</span>
                            <span className="cd-detail-value">{getVal('stateCode') || '24'}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Pin Code:</span>
                            <span className="cd-detail-value">{getVal('pinCode') || '363642'}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Address:</span>
                            <span className="cd-detail-value">{getVal('address')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Bank Name:</span>
                            <span className="cd-detail-value">{getVal('bankName')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Bank Account_Name:</span>
                            <span className="cd-detail-value">{getVal('bankAccountName')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Bank Account_Number:</span>
                            <span className="cd-detail-value">{getVal('bankAccountNumber')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Swift Code:</span>
                            <span className="cd-detail-value">{getVal('swiftCode')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">IBAN NO:</span>
                            <span className="cd-detail-value">{getVal('iban')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Bank IFSC Code:</span>
                            <span className="cd-detail-value">{getVal('ifsc')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">E Way Bill Username:</span>
                            <span className="cd-detail-value">{getVal('eWayBillUsername')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">E Way Bill Password:</span>
                            <span className="cd-detail-value">{getVal('eWayBillPassword')}</span>
                        </div>
                        <div className="cd-detail-item">
                            <span className="cd-detail-label">Bank Address:</span>
                            <span className="cd-detail-value">{getVal('bankAddress')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailsModal;

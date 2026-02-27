import React, { useState, useRef, useEffect } from 'react';
import '../../styles/AddCompanyModal.css';
import { toast } from 'react-toastify';

const CreatableSelect = ({ value, onChange, options, onAddOption, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const containerRef = useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        setSearchTerm(newVal);
        onChange(newVal);
        setIsOpen(true);
    };

    const handleOptionClick = (opt) => {
        onChange(opt);
        setSearchTerm(opt);
        setIsOpen(false);
    };

    const handleAddClick = () => {
        onAddOption(searchTerm);
        setIsOpen(false);
    };

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showAddOption = searchTerm && !filteredOptions.some(opt => opt.toLowerCase() === searchTerm.toLowerCase());

    return (
        <div className="custom-select-container" ref={containerRef} style={{ width: '100%' }}>
            <input
                className="add-company-input"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder || "Select or Type..."}
                style={{ width: '100%' }}
            />
            {isOpen && (filteredOptions.length > 0 || showAddOption) && (
                <div className="custom-select-dropdown">
                    {filteredOptions.map((opt) => (
                        <div
                            key={opt}
                            className="custom-select-option"
                            onClick={() => handleOptionClick(opt)}
                        >
                            {opt}
                        </div>
                    ))}
                    {showAddOption && (
                        <div className="custom-select-add-option" onClick={handleAddClick}>
                            Add "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


function AddCompanyModal({ isOpen, onClose }) {
    const initialState = {
        name: '',
        personName: '',
        email: '',
        mobile1Code: '91',
        mobile1: '',
        mobile2Code: '91',
        mobile2: '',
        website: '',
        gst: '',
        pan: '',
        aadhar: '',
        country: '',
        state: '',
        city: '',
        pinCode: '',
        stateCode: '',
        mapUrl: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        ifsc: '',
        swift: '',
        iban: '',
        ewayUsername: '',
        ewayPassword: '',
        bankAddress: '',
        companyAddress: '',
        background: 'Domestic',
        logo: null,
        headerImage: null,
        footerImage: null,
        signature: null
    };

    const [formData, setFormData] = useState(initialState);

    // Dynamic Lists
    const [countryList, setCountryList] = useState(['India', 'USA', 'UK']);
    const [stateList, setStateList] = useState(['Gujarat', 'Maharashtra', 'Delhi']);
    const [cityList, setCityList] = useState(['Ahmedabad', 'Mumbai', 'Delhi', 'Surat']);

    const handleAddCountry = (newCountry) => {
        if (!newCountry) return;
        setCountryList(prev => [...prev, newCountry]);
        console.log(`Country "${newCountry}" Added Successfully!`);
        toast.success(`Country "${newCountry}" Added Successfully!`);
    };

    const handleAddState = (newState) => {
        if (!newState) return;
        setStateList(prev => [...prev, newState]);
        console.log(`State "${newState}" Added Successfully!`);
        toast.success(`State "${newState}" Added Successfully!`);
    };

    const handleAddCity = (newCity) => {
        if (!newCity) return;
        setCityList(prev => [...prev, newCity]);
        console.log(`City "${newCity}" Added Successfully!`);
        toast.success(`City "${newCity}" Added Successfully!`);
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation for required fields
        const missingFields = [];
        if (!formData.name) missingFields.push("Company Name");
        if (!formData.mobile1) missingFields.push("Mobile Number 1");
        if (!formData.country) missingFields.push("Country");
        if (!formData.state) missingFields.push("State");
        if (!formData.city) missingFields.push("City");

        if (missingFields.length > 0) {
            toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
            return;
        }

        console.log('Company Form Submitted:', formData);
        toast.success('Company added successfully!');
        setFormData(initialState);
        onClose();
    };

    const handleReset = () => {
        setFormData(initialState);
    };

    if (!isOpen) return null;

    return (
        <div className="add-company-modal-overlay">
            <div className="add-company-modal">
                <button className="add-company-close-icon" onClick={onClose}>✕</button>

                <div className="add-company-content">
                    <h2 className="add-company-title">Add Company</h2>

                    <form onSubmit={handleSubmit}>
                        {/* 1. Company Personal Information */}
                        <div className="add-company-section-title">Company Personal Information</div>
                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Name</label>
                                <input className="add-company-input" placeholder="Enter Company Name" name="name" value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Person Name</label>
                                <input className="add-company-input" placeholder="Enter Company Person Name" name="personName" value={formData.personName} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Email</label>
                                <input className="add-company-input" placeholder="Enter Company Email" name="email" value={formData.email} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Mobile Number 1</label>
                                <div className="add-company-mobile-group">
                                    <select className="add-company-mobile-code" name="mobile1Code" value={formData.mobile1Code} onChange={handleChange}>
                                        <option value="91">91</option>
                                        <option value="1">1</option>
                                    </select>
                                    <input className="add-company-input" placeholder="Enter Mobile Number" name="mobile1" value={formData.mobile1} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Mobile Number 2</label>
                                <div className="add-company-mobile-group">
                                    <select className="add-company-mobile-code" name="mobile2Code" value={formData.mobile2Code} onChange={handleChange}>
                                        <option value="91">91</option>
                                        <option value="1">1</option>
                                    </select>
                                    <input className="add-company-input" placeholder="Enter Mobile Number" name="mobile2" value={formData.mobile2} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Website Url</label>
                                <input className="add-company-input" placeholder="Enter Website Url" name="website" value={formData.website} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Gst Number</label>
                                <input className="add-company-input" placeholder="Enter GST Number" name="gst" value={formData.gst} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Pan Card Number</label>
                                <input className="add-company-input" placeholder="Enter PAN Card" name="pan" value={formData.pan} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Aadhar Card Number</label>
                                <input className="add-company-input" placeholder="Enter Aadhar Card" name="aadhar" value={formData.aadhar} onChange={handleChange} />
                            </div>
                        </div>

                        {/* 2. Company Address Information */}
                        <div className="add-company-section-title">Company Address Information</div>
                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Country</label>
                                <CreatableSelect
                                    value={formData.country}
                                    options={countryList}
                                    onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                                    onAddOption={(newVal) => {
                                        handleAddCountry(newVal);
                                        setFormData(prev => ({ ...prev, country: newVal }));
                                    }}
                                    placeholder="Select or Type Country"
                                />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company State</label>
                                <CreatableSelect
                                    value={formData.state}
                                    options={stateList}
                                    onChange={(val) => setFormData(prev => ({ ...prev, state: val }))}
                                    onAddOption={(newVal) => {
                                        handleAddState(newVal);
                                        setFormData(prev => ({ ...prev, state: newVal }));
                                    }}
                                    placeholder="Select or Type State"
                                />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company City</label>
                                <CreatableSelect
                                    value={formData.city}
                                    options={cityList}
                                    onChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
                                    onAddOption={(newVal) => {
                                        handleAddCity(newVal);
                                        setFormData(prev => ({ ...prev, city: newVal }));
                                    }}
                                    placeholder="Select or Type City"
                                />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Pin Code</label>
                                <input className="add-company-input" placeholder="Enter Pin Code" name="pinCode" value={formData.pinCode} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company State Code</label>
                                <input className="add-company-input" placeholder="Enter State Code" name="stateCode" value={formData.stateCode} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Map Url</label>
                                <input className="add-company-input" placeholder="Enter Map Url" name="mapUrl" value={formData.mapUrl} onChange={handleChange} />
                            </div>
                        </div>

                        {/* 3. Company Bank Information */}
                        <div className="add-company-section-title">Company Bank Information</div>
                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Bank Name</label>
                                <input className="add-company-input" placeholder="Enter Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Bank Account Name</label>
                                <input className="add-company-input" placeholder="Enter Account Name" name="accountName" value={formData.accountName} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Bank Account Number</label>
                                <input className="add-company-input" placeholder="Enter Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Bank IFSC Code</label>
                                <input className="add-company-input" placeholder="Enter IFSC Code" name="ifsc" value={formData.ifsc} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Swift Code</label>
                                <input className="add-company-input" placeholder="Enter Swift Code" name="swift" value={formData.swift} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company IBAN NO</label>
                                <input className="add-company-input" placeholder="Enter IBAN NO" name="iban" value={formData.iban} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company E Way Bill Username</label>
                                <input className="add-company-input" placeholder="Enter Username" name="ewayUsername" value={formData.ewayUsername} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company E Way Bill Password</label>
                                <input className="add-company-input" placeholder="Enter Password" name="ewayPassword" value={formData.ewayPassword} onChange={handleChange} />
                            </div>
                        </div>

                        {/* 4. Company Bank & Office Address Information */}
                        <div className="add-company-section-title">Company Bank & Office Address Information</div>
                        <div className="add-company-grid-2">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Bank Address</label>
                                <textarea className="add-company-textarea" placeholder="Enter Bank Address" name="bankAddress" value={formData.bankAddress} onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Address</label>
                                <textarea className="add-company-textarea" placeholder="Enter Company Address" name="companyAddress" value={formData.companyAddress} onChange={handleChange} />
                            </div>
                        </div>

                        {/* 5. Company Background */}
                        <div className="add-company-section-title">Company Background</div>
                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Background</label>
                                <select className="add-company-select" name="background" value={formData.background} onChange={handleChange}>
                                    <option value="Domestic">Domestic</option>
                                    <option value="International">International</option>
                                </select>
                            </div>
                        </div>

                        {/* 6. Company Logo & Letter Pad */}
                        <div className="add-company-section-title">Company Logo & Letter Pad</div>
                        <div className="add-company-grid-4">
                            <div className="add-company-field">
                                <label className="add-company-label">Company Logo Image</label>
                                <input className="add-company-file-input" type="file" name="logo" onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Letter Head Header Image</label>
                                <input className="add-company-file-input" type="file" name="headerImage" onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Letter Head Footer Image</label>
                                <input className="add-company-file-input" type="file" name="footerImage" onChange={handleChange} />
                            </div>
                            <div className="add-company-field">
                                <label className="add-company-label">Company Digital Signature</label>
                                <input className="add-company-file-input" type="file" name="signature" onChange={handleChange} />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="add-company-actions">
                            <button type="button" className="add-company-btn-reset" onClick={onClose}>Cancel</button>
                            <button type="submit" className="add-company-btn-submit">Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddCompanyModal;

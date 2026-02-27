import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../../styles/UpdateSellerModal.css';
import API_BASE_URL from '../../config/apiConfig.js';


const CreatableSelect = ({ value, onChange, options, onAddOption, placeholder }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState(value || '');
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    React.useEffect(() => {
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
        setActiveIndex(0);
    };

    const handleOptionClick = (opt) => {
        onChange(opt);
        setSearchTerm(opt);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const handleAddClick = () => {
        onAddOption(searchTerm);
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const filteredOptions = options.filter(opt =>
        opt && opt.toString().toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    const showAddOption = searchTerm && !filteredOptions.some(opt => opt && opt.toString().toLowerCase() === searchTerm.toLowerCase());

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault();
                setIsOpen(true);
                setActiveIndex(0);
            }
            return;
        }

        const totalOptions = filteredOptions.length + (showAddOption ? 1 : 0);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % totalOptions);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
                handleOptionClick(filteredOptions[activeIndex]);
            } else if (showAddOption && activeIndex === filteredOptions.length) {
                handleAddClick();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="custom-select-container" ref={containerRef} style={{ position: 'relative' }}>
            <input
                className="update-seller-input"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder || "Select or Type..."}
            />
            {isOpen && (filteredOptions.length > 0 || showAddOption) && (
                <div className="custom-select-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                    {filteredOptions.map((opt, index) => (
                        <div
                            key={opt}
                            className="custom-select-option"
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                backgroundColor: index === activeIndex ? '#f0f0f0' : 'transparent'
                            }}
                            onClick={() => handleOptionClick(opt)}
                        >
                            {opt}
                        </div>
                    ))}
                    {showAddOption && (
                        <div
                            className="custom-select-add-option"
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                color: 'blue',
                                borderTop: '1px solid #eee',
                                backgroundColor: filteredOptions.length === activeIndex ? '#f0f0f0' : 'transparent'
                            }}
                            onClick={handleAddClick}
                        >
                            Add "{searchTerm}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function UpdateSellerModal({ isOpen, onClose, seller, onUpdate, isPage }) {
    const [formData, setFormData] = useState({
        sellerGstNumber: '',
        sellerTradeName: '',
        sellerName: '',
        sellerPrefix: '',
        sellerEmail: '',
        sellerMobileNumber: '',
        sellerCountry: '',
        sellerState: '',
        sellerCity: '',
        sellerPinCode: '',
        sellerStateCode: '',
        sellerPanCardNumber: '',
        sellerCinNumber: '',
        sellerBankAccountName: '',
        sellerBankName: '',
        sellerAccountNo: '',
        sellerIfscCode: '',
        sellerTypeId: '',
        saleTypeId: '',
        sellerBankAddress: '',
        sellerAddress: ''
    });

    const [sellerTypes, setSellerTypes] = useState([]);
    const [saleTypes, setSaleTypes] = useState([]);
    const [allCountries, setAllCountries] = useState([]);
    const [countryList, setCountryList] = useState([]);
    const [allStates, setAllStates] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (seller && (isOpen || isPage)) {
            setFormData({
                sellerGstNumber: seller.sellerGstNumber || '',
                sellerTradeName: seller.sellerTradeName || '',
                sellerName: seller.sellerName || '',
                sellerPrefix: seller.sellerPrefix || '',
                sellerEmail: seller.sellerEmail || '',
                sellerMobileNumber: seller.sellerMobileNumber || '',
                sellerCountry: seller.sellerCountry || '',
                sellerState: seller.sellerState || '',
                sellerCity: seller.sellerCity || '',
                sellerPinCode: seller.sellerPinCode || '',
                sellerStateCode: seller.sellerStateCode || '',
                sellerPanCardNumber: seller.sellerPanCardNumber || '',
                sellerCinNumber: seller.sellerCinNumber || '',
                sellerBankAccountName: seller.sellerBankAccountName || '',
                sellerBankName: seller.sellerBankName || '',
                sellerAccountNo: seller.sellerAccountNo || '',
                sellerIfscCode: seller.sellerIfscCode || '',
                sellerTypeId: seller.sellerTypeId?._id || seller.sellerTypeId || '',
                saleTypeId: seller.saleTypeId?._id || seller.saleTypeId || '',
                sellerBankAddress: seller.sellerBankAddress || '',
                sellerAddress: seller.sellerAddress || ''
            });
        }
    }, [seller, isOpen, isPage]);

    useEffect(() => {
        if (isOpen || isPage) fetchInitialData();
    }, [isOpen, isPage]);

    useEffect(() => {
        const fetchStates = async () => {
            const country = allCountries.find(c => c.countryName && formData.sellerCountry && c.countryName.toLowerCase() === formData.sellerCountry.toLowerCase());
            if (country) {
                const token = sessionStorage.getItem('token');
                try {
                    const res = await fetch(`${API_BASE_URL}/state`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const states = await res.json();
                        setAllStates(states);
                        setStateList(states.map(s => s.stateName));
                    }
                } catch (error) {
                    console.error("Error fetching states:", error);
                }
            } else {
                setStateList([]);
            }
        };
        fetchStates();
    }, [formData.sellerCountry, allCountries]);

    useEffect(() => {
        const fetchCities = async () => {
            const state = allStates.find(s => s.stateName && formData.sellerState && s.stateName.toLowerCase() === formData.sellerState.toLowerCase());
            if (state) {
                const token = sessionStorage.getItem('token');
                try {
                    const res = await fetch(`${API_BASE_URL}/city`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const cities = await res.json();
                        setCityList(cities.map(c => c.cityName));
                    }
                } catch (error) {
                    console.error("Error fetching cities:", error);
                }
            } else {
                setCityList([]);
            }
        };
        fetchCities();
    }, [formData.sellerState, allStates]);

    const handleAddState = async (newStateName) => {
        if (!newStateName) return;
        const country = allCountries.find(c => c.countryName === formData.sellerCountry);
        if (!country) {
            toast.warning("please select country then add new state");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/state`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ stateName: newStateName, countryId: country.countryId })
            });

            if (res.ok) {
                const data = await res.json();
                setAllStates(prev => [...prev, data.state]);
                setStateList(prev => [...prev, data.state.stateName]);
                toast.success(`State "${newStateName}" added successfully`);
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to add state");
            }
        } catch (error) {
            console.error("Add State Error:", error);
            toast.error("Server error while adding state");
        }
    };

    const handleAddCity = async (newCityName) => {
        if (!newCityName) return;
        const state = allStates.find(s => s.stateName === formData.sellerState);
        if (!state) {
            toast.warning("please select state or country then add new city", {
                style: { backgroundColor: '#ffcc00', color: 'black' }
            });
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/city`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cityName: newCityName, stateId: state.stateId })
            });

            if (res.ok) {
                const data = await res.json();
                setCityList(prev => [...prev, data.city.cityName]);
                toast.success(`City "${newCityName}" added successfully`);
            } else {
                const err = await res.json();
                toast.error(err.message || "Failed to add city");
            }
        } catch (error) {
            console.error("Add City Error:", error);
            toast.error("Server error while adding city");
        }
    };

    const fetchInitialData = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const stRes = await fetch(`${API_BASE_URL}/customer-type`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (stRes.ok) setSellerTypes(await stRes.json());

            const saleRes = await fetch(`${API_BASE_URL}/sale-type`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (saleRes.ok) setSaleTypes(await saleRes.json());

            const countryRes = await fetch(`${API_BASE_URL}/country`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (countryRes.ok) {
                const countries = await countryRes.json();
                setAllCountries(countries);
                setCountryList(countries.map(c => c.countryName));
            }
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    const handleAddCountry = async (cName) => {
        if (!cName) return;
        try {
            const token = sessionStorage.getItem('token');
            const code = cName.substring(0, 3).toUpperCase();

            const response = await fetch(`${API_BASE_URL}/country`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ countryName: cName, countryCode: code })
            });

            if (response.ok) {
                const data = await response.json();
                setAllCountries(prev => [...prev, data.country]);
                setCountryList(prev => [...prev, data.country.countryName]);
                toast.success(`Country "${cName}" added successfully`);
            } else {
                const err = await response.json();
                toast.error(err.message || "Failed to add country");
            }
        } catch (error) {
            console.error("Add Country Error:", error);
            toast.error("Server error while adding country");
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();



        if (!seller?._id) {
            toast.error("Seller ID is missing. Please close and re-open the edit page.");
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/seller/${seller._id || seller.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Seller Updated Successfully!");
                if (onUpdate) onUpdate();
                onClose();
            } else {
                toast.error(`${data.message}${data.error ? ': ' + data.error : ''}`);
            }
        } catch (error) {
            console.error("Update Error:", error);
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "update-seller-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="update-seller-header">
                    <h2 className="update-seller-title">Update Seller</h2>
                    <button className="update-seller-close" onClick={onClose}>✕</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Update Seller</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="update-seller-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>

                    {/* 3 Column Grid for Fields */}
                    <div className="update-seller-grid-3">
                        <div className="update-seller-field">
                            <label className="update-seller-label">Trade Name</label>
                            <input className="update-seller-input" name="sellerTradeName" value={formData.sellerTradeName} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Name</label>
                            <input className="update-seller-input" name="sellerName" value={formData.sellerName} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Prefix</label>
                            <input className="update-seller-input" placeholder="Enter Prefix" name="sellerPrefix" value={formData.sellerPrefix} onChange={handleChange} />
                        </div>

                        <div className="update-seller-field">
                            <label className="update-seller-label">Email</label>
                            <input className="update-seller-input" placeholder="Enter Email" name="sellerEmail" value={formData.sellerEmail} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Mobile Number</label>
                            <input className="update-seller-input" placeholder="Enter Mobile Number" name="sellerMobileNumber" value={formData.sellerMobileNumber} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">GST Number</label>
                            <input className="update-seller-input" name="sellerGstNumber" value={formData.sellerGstNumber} onChange={handleChange} />
                        </div>

                        <div className="update-seller-field">
                            <label className="update-seller-label">Pan Card Number</label>
                            <input className="update-seller-input" name="sellerPanCardNumber" value={formData.sellerPanCardNumber} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Country</label>
                            <CreatableSelect
                                value={formData.sellerCountry}
                                options={countryList}
                                onChange={(val) => setFormData(prev => ({ ...prev, sellerCountry: val }))}
                                onAddOption={(newVal) => {
                                    handleAddCountry(newVal);
                                    setFormData(prev => ({ ...prev, sellerCountry: newVal }));
                                }}
                                placeholder="Select or Type Country"
                            />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">State</label>
                            <CreatableSelect
                                value={formData.sellerState}
                                options={stateList}
                                onChange={(val) => setFormData(prev => ({ ...prev, sellerState: val }))}
                                onAddOption={handleAddState}
                                placeholder="Select or Type State"
                            />
                        </div>

                        <div className="update-seller-field">
                            <label className="update-seller-label">City</label>
                            <CreatableSelect
                                value={formData.sellerCity}
                                options={cityList}
                                onChange={(val) => setFormData(prev => ({ ...prev, sellerCity: val }))}
                                onAddOption={handleAddCity}
                                placeholder="Select or Type City"
                            />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">State Code</label>
                            <input className="update-seller-input" name="sellerStateCode" value={formData.sellerStateCode} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Pin Code</label>
                            <input className="update-seller-input" name="sellerPinCode" value={formData.sellerPinCode} onChange={handleChange} />
                        </div>

                        <div className="update-seller-field">
                            <label className="update-seller-label">Seller Type</label>
                            <select className="update-seller-select" name="sellerTypeId" value={formData.sellerTypeId} onChange={handleChange}>
                                <option value="" style={{ color: '#333' }}>--Select Type--</option>
                                {sellerTypes.map(st => (
                                    <option key={st._id || st.id} value={st._id || st.id} style={{ color: '#333' }}>
                                        {st.customerTypeName || st.name || st.saleTypeName || `Type ${st.customerTypeId || st._id || '?'}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Sale Type</label>
                            <select className="update-seller-select" name="saleTypeId" value={formData.saleTypeId} onChange={handleChange}>
                                <option value="" style={{ color: '#333' }}>--Select Sale Type--</option>
                                {saleTypes.map(st => (
                                    <option key={st._id || st.id} value={st._id || st.id} style={{ color: '#333' }}>
                                        {st.saleTypeName || st.customerTypeName || st.name || `Sale Type ${st.saleTypeId || st._id || '?'}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Bank Name</label>
                            <input className="update-seller-input" placeholder="Enter Bank Name" name="sellerBankName" value={formData.sellerBankName} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Bank Account Name</label>
                            <input className="update-seller-input" placeholder="Enter Bank Account Name" name="sellerBankAccountName" value={formData.sellerBankAccountName} onChange={handleChange} />
                        </div>

                        <div className="update-seller-field">
                            <label className="update-seller-label">Account No</label>
                            <input className="update-seller-input" placeholder="Enter Account No" name="sellerAccountNo" value={formData.sellerAccountNo} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">IFSC Code</label>
                            <input className="update-seller-input" placeholder="Enter IFSC Code" name="sellerIfscCode" value={formData.sellerIfscCode} onChange={handleChange} />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">CIN Number</label>
                            <input className="update-seller-input" placeholder="Enter CIN Number" name="sellerCinNumber" value={formData.sellerCinNumber} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Full Width Text Areas - Stacked */}
                    <div className="update-seller-grid-2">
                        <div className="update-seller-field">
                            <label className="update-seller-label">Bank Address</label>
                            <textarea
                                className="update-seller-textarea"
                                placeholder="Bank Address"
                                name="sellerBankAddress"
                                value={formData.sellerBankAddress}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="update-seller-field">
                            <label className="update-seller-label">Seller Address</label>
                            <textarea
                                className="update-seller-textarea"
                                placeholder="Seller Address"
                                name="sellerAddress"
                                value={formData.sellerAddress}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="update-seller-actions">
                        <button type="button" className="update-seller-btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="update-seller-btn-submit">Submit</button>
                    </div>

                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="update-seller-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default UpdateSellerModal;

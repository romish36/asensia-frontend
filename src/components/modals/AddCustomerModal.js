import React, { useState, useRef, useEffect } from 'react';
import '../../styles/AddCustomerModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';
import fetchApi from '../../utils/api.js';


const CreatableSelect = ({ value, onChange, options, onAddOption, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [activeIndex, setActiveIndex] = useState(-1);
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

    const filteredOptions = (options || []).filter(opt =>
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
        <div className="custom-select-container" ref={containerRef} style={{ width: '100%' }}>
            <input
                className="add-customer-input"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder || "Select or Type..."}
                style={{ width: '100%' }}
            />
            {isOpen && (filteredOptions.length > 0 || showAddOption) && (
                <div className="custom-select-dropdown">
                    {filteredOptions.map((opt, index) => (
                        <div
                            key={opt}
                            className="custom-select-option"
                            style={{ backgroundColor: index === activeIndex ? '#f3f4f6' : 'transparent' }}
                            onClick={() => handleOptionClick(opt)}
                        >
                            {opt}
                        </div>
                    ))}
                    {showAddOption && (
                        <div
                            className="custom-select-add-option"
                            style={{ backgroundColor: activeIndex === filteredOptions.length ? '#f3f4f6' : 'transparent' }}
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

function AddCustomerModal({ isOpen, onClose, isPage }) {
    const [formData, setFormData] = useState({
        customerGst: '',
        customerTradeName: '',
        customerName: '',
        customerReferenceName: '',
        customerMobileNumber: '',
        customerEmail: '',
        customerCountry: '',
        customerState: '',
        customerCity: '',
        customerPinCode: '',
        customerStateCode: '',
        customerPanNo: '',
        customerTypeId: '',
        saleTypeId: '',
        customerAddress: '',
        companyId: ''
    });

    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [customerTypes, setCustomerTypes] = useState([]);
    const [saleTypes, setSaleTypes] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [allCountries, setAllCountries] = useState([]);
    const [allStates, setAllStates] = useState([]);
    const [loading, setLoading] = useState(false);

    const user = JSON.parse(sessionStorage.getItem('user'));
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch Customer Types
            const ctData = await fetchApi(`/customer-type${isSuperAdmin && formData.companyId ? `?companyId=${formData.companyId}` : ''}`);
            setCustomerTypes(Array.isArray(ctData) ? ctData : []);

            // Fetch Sale Types
            const stData = await fetchApi(`/sale-type${isSuperAdmin && formData.companyId ? `?companyId=${formData.companyId}` : ''}`);
            setSaleTypes(Array.isArray(stData) ? stData : []);

            // Fetch Companies if Super Admin
            if (isSuperAdmin) {
                const cData = await fetchApi('/company');
                setCompanies(cData);
            }

            // Fetch Countries
            const countries = await fetchApi('/country');
            setAllCountries(countries);
            setCountryList(countries.map(c => c.countryName));
        } catch (error) {
            console.error("Error fetching initial data:", error);
        }
    };

    // Re-fetch types when company changes (for Super Admin)
    useEffect(() => {
        if (isSuperAdmin && formData.companyId) {
            const reFetchTypes = async () => {
                try {
                    const ctData = await fetchApi(`/customer-type?companyId=${formData.companyId}`);
                    setCustomerTypes(Array.isArray(ctData) ? ctData : []);
                    const stData = await fetchApi(`/sale-type?companyId=${formData.companyId}`);
                    setSaleTypes(Array.isArray(stData) ? stData : []);
                } catch (error) {
                    console.error("Error re-fetching types:", error);
                }
            };
            reFetchTypes();
        }
    }, [formData.companyId, isSuperAdmin]);

    useEffect(() => {
        const fetchStates = async () => {
            const country = allCountries.find(c => c.countryName === formData.customerCountry);
            if (country) {
                const token = sessionStorage.getItem('token');
                try {
                    const states = await fetchApi(`/state?countryId=${country.countryId}`);
                    setAllStates(states);
                    setStateList(states.map(s => s.stateName));
                } catch (error) {
                    console.error("Error fetching states:", error);
                }
            } else {
                setStateList([]);
            }
        };
        fetchStates();
    }, [formData.customerCountry, allCountries]);

    useEffect(() => {
        const fetchCities = async () => {
            const state = allStates.find(s => s.stateName === formData.customerState);
            if (state) {
                const token = sessionStorage.getItem('token');
                try {
                    const cities = await fetchApi(`/city?stateId=${state.stateId}`);
                    setCityList(cities.map(c => c.cityName));
                } catch (error) {
                    console.error("Error fetching cities:", error);
                }
            } else {
                setCityList([]);
            }
        };
        fetchCities();
    }, [formData.customerState, allStates]);

    const handleAddCountry = async (newCountryName) => {
        if (!newCountryName) return;
        try {
            const token = sessionStorage.getItem('token');
            const code = newCountryName.substring(0, 3).toUpperCase();

            const response = await fetch(`${API_BASE_URL}/country`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ countryName: newCountryName, countryCode: code })
            });

            if (response.ok) {
                const data = await response.json();
                setAllCountries(prev => [...prev, data.country]);
                setCountryList(prev => [...prev, data.country.countryName]);
                toast.success(`Country "${newCountryName}" added successfully`);
            } else {
                const err = await response.json();
                toast.error(err.message || "Failed to add country");
            }
        } catch (error) {
            console.error("Add Country Error:", error);
            toast.error("Server error while adding country");
        }
    };

    const handleAddState = async (newStateName) => {
        if (!newStateName) return;
        const country = allCountries.find(c => c.countryName === formData.customerCountry);
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
        const state = allStates.find(s => s.stateName === formData.customerState);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSuperAdmin && !formData.companyId) {
            toast.error("Company selection is required");
            return;
        }

        setLoading(true);
        try {
            const submissionData = { ...formData };
            if (!submissionData.customerTypeId || submissionData.customerTypeId === '') delete submissionData.customerTypeId;
            if (!submissionData.saleTypeId || submissionData.saleTypeId === '') delete submissionData.saleTypeId;

            await fetchApi('/customer', {
                method: 'POST',
                body: JSON.stringify(submissionData)
            });
            toast.success('Customer added successfully!');
            onClose();
        } catch (error) {
            console.error("Save Error:", error);
            toast.error(error.message || "Failed to add customer");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            customerGst: '',
            customerTradeName: '',
            customerName: '',
            customerReferenceName: '',
            customerMobileNumber: '',
            customerEmail: '',
            customerCountry: '',
            customerState: '',
            customerCity: '',
            customerPinCode: '',
            customerStateCode: '',
            customerPanNo: '',
            customerTypeId: '',
            saleTypeId: '',
            customerAddress: '',
            companyId: isSuperAdmin ? '' : (user?.companyId || '')
        });
    };

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-customer-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="add-customer-header">
                    <h2 className="add-customer-title">Add Customer</h2>
                    <button className="add-customer-close" onClick={onClose}>✕</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Add Customer</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-customer-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    {/* Row 1 - 5 columns */}
                    <div className="add-customer-row">
                        {isSuperAdmin && (
                            <div className="add-customer-field">
                                <label className="add-customer-label">Select Company</label>
                                <select
                                    className="add-customer-select"
                                    name="companyId"
                                    value={formData.companyId}
                                    onChange={handleChange}
                                >
                                    <option value="">--Select Company--</option>
                                    {companies.map(c => (
                                        <option key={c._id} value={c._id}>{c.companyName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="add-customer-field-with-btn">
                            <label className="add-customer-label">Customer GST</label>
                            <div className="add-customer-input-group">
                                <input
                                    className="add-customer-input"
                                    placeholder="ENTER CUSTOMER GST"
                                    name="customerGst"
                                    value={formData.customerGst}
                                    onChange={handleChange}
                                />
                                <button type="button" className="add-customer-btn-verify">Verify</button>
                            </div>
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Trade Name</label>
                            <input
                                className="add-customer-input"
                                placeholder="Enter Customer Trade Name"
                                name="customerTradeName"
                                value={formData.customerTradeName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Name</label>
                            <input
                                className="add-customer-input"
                                placeholder="Enter Customer Name"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Reference Name</label>
                            <input
                                className="add-customer-input"
                                placeholder="Enter Reference Name"
                                name="customerReferenceName"
                                value={formData.customerReferenceName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="add-customer-row">
                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Mobile Number</label>
                            <input
                                className="add-customer-input"
                                placeholder="Enter Mobile Number"
                                name="customerMobileNumber"
                                value={formData.customerMobileNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Email</label>
                            <input
                                className="add-customer-input"
                                type="email"
                                placeholder="Enter Email"
                                name="customerEmail"
                                value={formData.customerEmail}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Country</label>
                            <CreatableSelect
                                value={formData.customerCountry}
                                options={countryList}
                                onChange={(val) => setFormData(prev => ({ ...prev, customerCountry: val }))}
                                onAddOption={(newVal) => {
                                    handleAddCountry(newVal);
                                    setFormData(prev => ({ ...prev, customerCountry: newVal }));
                                }}
                                placeholder="Select or Type Country"
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer State</label>
                            <CreatableSelect
                                value={formData.customerState}
                                options={stateList}
                                onChange={(val) => setFormData(prev => ({ ...prev, customerState: val }))}
                                onAddOption={(newVal) => {
                                    handleAddState(newVal);
                                    setFormData(prev => ({ ...prev, customerState: newVal }));
                                }}
                                placeholder="Select or Type State"
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer City</label>
                            <CreatableSelect
                                value={formData.customerCity}
                                options={cityList}
                                onChange={(val) => setFormData(prev => ({ ...prev, customerCity: val }))}
                                onAddOption={(newVal) => {
                                    handleAddCity(newVal);
                                    setFormData(prev => ({ ...prev, customerCity: newVal }));
                                }}
                                placeholder="Select or Type City"
                            />
                        </div>
                    </div>

                    <div className="add-customer-row">
                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Pin Code</label>
                            <input
                                className="add-customer-input"
                                placeholder="Enter Customer Pin Code"
                                name="customerPinCode"
                                value={formData.customerPinCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer State Code</label>
                            <input
                                className="add-customer-input"
                                placeholder="Enter Customer State Code"
                                name="customerStateCode"
                                value={formData.customerStateCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer PAN No</label>
                            <input
                                className="add-customer-input"
                                placeholder="Enter Customer PAN No"
                                name="customerPanNo"
                                value={formData.customerPanNo}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Type</label>
                            <select
                                className="add-customer-select"
                                name="customerTypeId"
                                value={formData.customerTypeId}
                                onChange={handleChange}
                            >
                                <option value="" style={{ color: '#333' }}>--Select Type--</option>
                                {customerTypes.map(ct => {
                                    console.log('CT item:', ct); // Debug to see why customers might be here
                                    const displayName = ct.customerTypeName ||
                                        ct.name ||
                                        ct.saleTypeName ||
                                        (typeof ct.customerTypeId === 'object' ? ct.customerTypeId?.customerTypeName : null) ||
                                        ct.customerName || // Fallback to customer name if it IS a customer object
                                        `Type ${ct.customerTypeId || ct._id || '?'}`;

                                    return (
                                        <option key={ct._id || ct.id} value={ct._id || ct.id} style={{ color: '#333' }}>
                                            {displayName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="add-customer-field">
                            <label className="add-customer-label">Customer Sale Type</label>
                            <select
                                className="add-customer-select"
                                name="saleTypeId"
                                value={formData.saleTypeId}
                                onChange={handleChange}
                            >
                                <option value="" style={{ color: '#333' }}>--Select Sale Type--</option>
                                {saleTypes.map(st => (
                                    <option key={st._id || st.id} value={st._id || st.id} style={{ color: '#333' }}>
                                        {st.saleTypeName || st.customerTypeName || st.name || `Sale Type ${st.saleTypeId || st._id || '?'}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {/* Row 4 - Full width textarea */}
                    <div className="add-customer-field add-customer-field-full">
                        <label className="add-customer-label">Customer Address</label>
                        <textarea
                            className="add-customer-textarea"
                            placeholder="Enter Customer Address"
                            name="customerAddress"
                            value={formData.customerAddress}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="add-customer-actions">
                        {!isPage && <button type="button" className="add-customer-btn-reset" onClick={handleReset}>Reset</button>}
                        {isPage && <button type="button" className="add-customer-btn-reset" onClick={onClose} style={{ background: '#fff', border: '1px solid #ddd', color: '#333' }}>Cancel</button>}
                        <button type="submit" className="add-customer-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="add-customer-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default AddCustomerModal;

import React, { useState, useEffect } from 'react';
import '../../styles/EditCustomerModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';
import fetchApi from '../../utils/api.js';


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
                className="edit-customer-input"
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

const EditCustomerModal = ({ isOpen, onClose, customer, isPage }) => {
    const [formData, setFormData] = useState({
        customerName: '',
        customerTradeName: '',
        customerReferenceName: '',
        customerMobileNumber: '',
        customerEmail: '',
        customerCountry: '',
        customerState: '',
        customerCity: '',
        customerPinCode: '',
        customerStateCode: '',
        customerGst: '',
        customerPanNo: '',
        customerTypeId: '',
        saleTypeId: '',
        customerAddress: ''
    });

    const [customerTypes, setCustomerTypes] = useState([]);
    const [saleTypes, setSaleTypes] = useState([]);
    const [allCountries, setAllCountries] = useState([]);
    const [countryList, setCountryList] = useState([]);
    const [allStates, setAllStates] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchStates = async () => {
            const country = allCountries.find(c => c.countryName && formData.customerCountry && c.countryName.toLowerCase() === formData.customerCountry.toLowerCase());
            if (country) {
                const token = sessionStorage.getItem('token');
                try {
                    const states = await fetchApi('/state');
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
            const state = allStates.find(s => s.stateName && formData.customerState && s.stateName.toLowerCase() === formData.customerState.toLowerCase());
            if (state) {
                const token = sessionStorage.getItem('token');
                try {
                    const cities = await fetchApi('/city');
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

    const fetchInitialData = async () => {
        try {
            const compId = customer?.companyId || formData.companyId;
            const ctUrl = `/customer-type${compId ? `?companyId=${compId}` : ''}`;
            const stUrl = `/sale-type${compId ? `?companyId=${compId}` : ''}`;

            const cTypes = await fetchApi(ctUrl);
            setCustomerTypes(Array.isArray(cTypes) ? cTypes : []);

            const sTypes = await fetchApi(stUrl);
            setSaleTypes(Array.isArray(sTypes) ? sTypes : []);

            const countries = await fetchApi('/country');
            setAllCountries(countries);
            setCountryList(countries.map(c => c.countryName));
        } catch (error) {
            console.error("Error fetching options:", error);
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


    useEffect(() => {
        if (customer) {
            setFormData({
                customerName: customer.customerName || '',
                customerTradeName: customer.customerTradeName || '',
                customerReferenceName: customer.customerReferenceName || '',
                customerMobileNumber: customer.customerMobileNumber || '',
                customerEmail: customer.customerEmail || '',
                customerCountry: customer.customerCountry || '',
                customerState: customer.customerState || '',
                customerCity: customer.customerCity || '',
                customerPinCode: customer.customerPinCode || '',
                customerStateCode: customer.customerStateCode || '',
                customerGst: customer.customerGst || '',
                customerPanNo: customer.customerPanNo || '',
                customerTypeId: customer.customerTypeId?._id || customer.customerTypeId || '',
                saleTypeId: customer.saleTypeId?._id || customer.saleTypeId || '',
                customerAddress: customer.customerAddress || ''
            });
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submissionData = { ...formData };
            if (!submissionData.customerTypeId || submissionData.customerTypeId === '') delete submissionData.customerTypeId;
            if (!submissionData.saleTypeId || submissionData.saleTypeId === '') delete submissionData.saleTypeId;

            await fetchApi(`/customer/${customer._id || customer.id}`, {
                method: 'PUT',
                body: JSON.stringify(submissionData)
            });
            toast.success("Customer Updated Successfully!");
            onClose();
        } catch (error) {
            console.error("Update Error:", error);
            toast.error(error.message || "Failed to update customer");
        } finally {
            setLoading(false);
        }
    };


    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "edit-customer-modal"} onClick={e => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="edit-customer-header">
                    <h3 className="edit-customer-title">Update Customer</h3>
                    <button className="edit-customer-close" onClick={onClose}>&times;</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Update Customer</div>}

            <div className={isPage ? "page-card__body" : "edit-customer-body"}>
                <form onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    <div className="edit-customer-grid">
                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Name</label>
                            <input
                                className="edit-customer-input"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Trade Name</label>
                            <input
                                className="edit-customer-input"
                                name="customerTradeName"
                                value={formData.customerTradeName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Reference Name</label>
                            <input
                                className="edit-customer-input"
                                name="customerReferenceName"
                                placeholder="Enter Customer Reference Name"
                                value={formData.customerReferenceName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Mobile Number</label>
                            <input
                                className="edit-customer-input"
                                name="customerMobileNumber"
                                placeholder="Enter Customer Mobile Number"
                                value={formData.customerMobileNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Email</label>
                            <input
                                className="edit-customer-input"
                                name="customerEmail"
                                placeholder="Enter Customer Email"
                                value={formData.customerEmail}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Country</label>
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

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer State</label>
                            <CreatableSelect
                                value={formData.customerState}
                                options={stateList}
                                onChange={(val) => setFormData(prev => ({ ...prev, customerState: val }))}
                                onAddOption={handleAddState}
                                placeholder="Select or Type State"
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer City</label>
                            <CreatableSelect
                                value={formData.customerCity}
                                options={cityList}
                                onChange={(val) => setFormData(prev => ({ ...prev, customerCity: val }))}
                                onAddOption={handleAddCity}
                                placeholder="Select or Type City"
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Pin Code</label>
                            <input
                                className="edit-customer-input"
                                name="customerPinCode"
                                value={formData.customerPinCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer State Code</label>
                            <input
                                className="edit-customer-input"
                                name="customerStateCode"
                                value={formData.customerStateCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer GST</label>
                            <input
                                className="edit-customer-input"
                                name="customerGst"
                                value={formData.customerGst}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer PAN No</label>
                            <input
                                className="edit-customer-input"
                                name="customerPanNo"
                                value={formData.customerPanNo}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Type</label>
                            <select
                                className="edit-customer-select"
                                name="customerTypeId"
                                value={formData.customerTypeId}
                                onChange={handleChange}
                            >
                                <option value="" style={{ color: '#333' }}>--Select Type--</option>
                                {customerTypes.map(ct => {
                                    console.log('Edit CT item:', ct);
                                    const displayName = ct.customerTypeName ||
                                        ct.name ||
                                        ct.saleTypeName ||
                                        (typeof ct.customerTypeId === 'object' ? ct.customerTypeId?.customerTypeName : null) ||
                                        ct.customerName ||
                                        `Type ${ct.customerTypeId || ct._id || '?'}`;

                                    return (
                                        <option key={ct._id || ct.id} value={ct._id || ct.id} style={{ color: '#333' }}>
                                            {displayName}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="edit-customer-form-group">
                            <label className="edit-customer-label">Customer Sale Type</label>
                            <select
                                className="edit-customer-select"
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

                        <div className="edit-customer-form-group full-width">
                            <label className="edit-customer-label">Customer Address</label>
                            <textarea
                                className="edit-customer-textarea"
                                name="customerAddress"
                                value={formData.customerAddress}
                                onChange={handleChange}
                            />
                        </div>

                    </div>

                    <div className="edit-customer-actions">
                        <button type="button" className="btn-customer-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-customer-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="edit-customer-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default EditCustomerModal;

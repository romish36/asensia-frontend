import React, { useState, useEffect } from 'react';
import '../../styles/EditTransporterModal.css';
import { toast } from 'react-toastify';
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
                className="edit-transporter-input"
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

const EditTransporterModal = ({ isOpen, onClose, transporter, isPage, onTransporterUpdated }) => {
    const [formData, setFormData] = useState({
        tradeName: '',
        name: '',
        referenceName: '',
        mobileNumber: '',
        email: '',
        country: '',
        state: '',
        city: '',
        pinCode: '',
        stateCode: '',
        gst: '',
        panNo: '',
        transporterType: 'Corporate',
        address: ''
    });

    const [allCountries, setAllCountries] = useState([]);
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [allStates, setAllStates] = useState([]);
    const [cityList, setCityList] = useState([]);

    const fetchCountries = async () => {
        const token = sessionStorage.getItem('token');
        try {
            const response = await fetch(`${API_BASE_URL}/country`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const countries = await response.json();
                setAllCountries(countries);
                setCountryList(countries.map(c => c.countryName));
            }
        } catch (error) {
            console.error("Error fetching countries:", error);
        }
    };

    useEffect(() => {
        if (isOpen || isPage) fetchCountries();
    }, [isOpen, isPage]);

    useEffect(() => {
        const fetchStates = async () => {
            const country = allCountries.find(c => c.countryName === formData.country);
            if (country) {
                const token = sessionStorage.getItem('token');
                try {
                    const res = await fetch(`${API_BASE_URL}/state?countryId=${country.countryId}`, {
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
    }, [formData.country, allCountries]);

    useEffect(() => {
        const fetchCities = async () => {
            const state = allStates.find(s => s.stateName === formData.state);
            if (state) {
                const token = sessionStorage.getItem('token');
                try {
                    const res = await fetch(`${API_BASE_URL}/city?stateId=${state.stateId}`, {
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
    }, [formData.state, allStates]);

    const handleAddCountry = async (cName) => {
        if (!cName) return;
        try {
            const token = sessionStorage.getItem('token');
            const code = cName.substring(0, 3).toUpperCase();

            const response = await fetch(`${API_BASE_URL}/transporter`, {
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
        const country = allCountries.find(c => c.countryName === formData.country);
        if (!country) {
            toast.warning("please select country then add new state");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/transporter`, {
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
        const state = allStates.find(s => s.stateName === formData.state);
        if (!state) {
            toast.warning("please select state or country then add new city", {
                style: { backgroundColor: '#ffcc00', color: 'black' }
            });
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/transporter`, {
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
        if (transporter) {
            setFormData({
                tradeName: transporter.transporterTradeName || '',
                name: transporter.transporterName || '',
                referenceName: transporter.transporterReferenceName || '',
                mobileNumber: transporter.transporterMobileNumber || '',
                email: transporter.transporterEmail || '',
                country: transporter.transporterCountry || '',
                state: transporter.transporterState || '',
                city: transporter.transporterCity || '',
                pinCode: transporter.transporterPinCode || '',
                stateCode: transporter.transporterStateCode || '',
                gst: transporter.transporterGst || '',
                panNo: transporter.transporterPanNo || '',
                transporterType: transporter.transporterType || 'Corporate',
                address: transporter.transporterAddress || ''
            });
        }
    }, [transporter]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = sessionStorage.getItem('token');
            const payload = {
                transporterTradeName: formData.tradeName,
                transporterName: formData.name,
                transporterReferenceName: formData.referenceName,
                transporterMobileNumber: formData.mobileNumber,
                transporterEmail: formData.email,
                transporterCountry: formData.country,
                transporterState: formData.state,
                transporterCity: formData.city,
                transporterPinCode: formData.pinCode,
                transporterStateCode: formData.stateCode,
                transporterGst: formData.gst,
                transporterPanNo: formData.panNo,
                transporterType: formData.transporterType,
                transporterAddress: formData.address
            };

            const response = await fetch(`${API_BASE_URL}/transporter/${transporter._id || transporter.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Transporter Updated Successfully!");
                if (onTransporterUpdated) onTransporterUpdated(data.transporter);
                onClose();
            } else {
                toast.error(data.message || "Failed to update transporter");
            }

        } catch (error) {
            console.error("Update Transporter Error:", error);
            toast.error("Server error");
        }
    };

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "edit-transporter-modal"} onClick={e => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="edit-transporter-header">
                    <h3 className="edit-transporter-title">Update Transporter</h3>
                    <button className="edit-transporter-close" onClick={onClose}>&times;</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Update Transporter</div>}

            <div className={isPage ? "page-card__body" : "edit-transporter-body"}>
                <form onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    <div className="edit-transporter-grid">
                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Trade Name</label>
                            <input
                                className="edit-transporter-input"
                                name="tradeName"
                                value={formData.tradeName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Name</label>
                            <input
                                className="edit-transporter-input"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Reference Name</label>
                            <input
                                className="edit-transporter-input"
                                name="referenceName"
                                placeholder="Enter Transporter Reference Name"
                                value={formData.referenceName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Mobile Number</label>
                            <input
                                className="edit-transporter-input"
                                name="mobileNumber"
                                placeholder="Enter Transporter Mobile Number"
                                value={formData.mobileNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Email</label>
                            <input
                                className="edit-transporter-input"
                                name="email"
                                placeholder="Enter Transporter Email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Country</label>
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

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter State</label>
                            <CreatableSelect
                                value={formData.state}
                                options={stateList}
                                onChange={(val) => setFormData(prev => ({ ...prev, state: val }))}
                                onAddOption={handleAddState}
                                placeholder="Select or Type State"
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter City</label>
                            <CreatableSelect
                                value={formData.city}
                                options={cityList}
                                onChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
                                onAddOption={handleAddCity}
                                placeholder="Select or Type City"
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Pin Code</label>
                            <input
                                className="edit-transporter-input"
                                name="pinCode"
                                placeholder="Enter Transporter Pin Code"
                                value={formData.pinCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter State Code</label>
                            <input
                                className="edit-transporter-input"
                                name="stateCode"
                                placeholder="Enter Transporter State Code"
                                value={formData.stateCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter GST</label>
                            <input
                                className="edit-transporter-input"
                                name="gst"
                                value={formData.gst}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter PAN No</label>
                            <input
                                className="edit-transporter-input"
                                name="panNo"
                                placeholder="Enter Transporter PAN No"
                                value={formData.panNo}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="edit-transporter-form-group">
                            <label className="edit-transporter-label">Transporter Type</label>
                            <select
                                className="edit-transporter-select"
                                name="transporterType"
                                value={formData.transporterType}
                                onChange={handleChange}
                            >
                                <option value="Corporate">Corporate</option>
                                <option value="Regular">Regular</option>
                                <option value="Individual">Individual</option>
                            </select>
                        </div>

                        <div className="edit-transporter-form-group full-width">
                            <label className="edit-transporter-label">Transporter Address</label>
                            <textarea
                                className="edit-transporter-textarea"
                                name="address"
                                placeholder="Enter transporter Address"
                                value={formData.address}
                                onChange={handleChange}
                            />
                        </div>

                    </div>

                    <div className="edit-transporter-actions">
                        <button type="button" className="btn-transporter-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-transporter-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="edit-transporter-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default EditTransporterModal;

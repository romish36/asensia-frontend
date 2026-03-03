import React, { useState, useRef, useEffect } from 'react';
import '../../styles/AddTransporterModal.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/apiConfig.js';


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
                className="add-transporter-input"
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

function AddTransporterModal({ isOpen, onClose, isPage, onTransporterAdded }) {
    const [formData, setFormData] = useState({
        transporterGst: '',
        transporterTradeName: '',
        transporterName: '',
        transporterReferenceName: '',
        transporterMobileNumber: '',
        transporterEmail: '',
        transporterCountry: '',
        transporterState: '',
        transporterCity: '',
        transporterPinCode: '',
        transporterStateCode: '',
        transporterPanNo: '',
        transporterType: 'Corporate',
        transporterAddress: ''
    });

    // Dynamic Lists - ideally fetch from API
    const [allCountries, setAllCountries] = useState([]);
    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [allStates, setAllStates] = useState([]);
    const [transporterTypeList, setTransporterTypeList] = useState(['Corporate', 'Individual', 'Regular']);

    useEffect(() => {
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
        fetchCountries();
    }, []);

    useEffect(() => {
        const fetchStates = async () => {
            const country = allCountries.find(c => c.countryName === formData.transporterCountry);
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
    }, [formData.transporterCountry, allCountries]);

    useEffect(() => {
        const fetchCities = async () => {
            const state = allStates.find(s => s.stateName === formData.transporterState);
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
    }, [formData.transporterState, allStates]);

    const handleAddCity = async (newCityName) => {
        if (!newCityName) return;
        const state = allStates.find(s => s.stateName === formData.transporterState);
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
        const country = allCountries.find(c => c.countryName === formData.transporterCountry);
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


    const handleAddTransporterType = (newType) => {
        if (!newType) return;
        setTransporterTypeList(prev => [...prev, newType]);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();



        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/transporter`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Transporter added successfully!');
                if (onTransporterAdded) onTransporterAdded(data.transporter);
                onClose();
            } else {
                toast.error(data.message || 'Failed to add transporter');
            }
        } catch (error) {
            console.error("Add Transporter Error:", error);
            toast.error("Server error");
        }
    };

    const handleReset = () => {
        setFormData({
            transporterGst: '',
            transporterTradeName: '',
            transporterName: '',
            transporterReferenceName: '',
            transporterMobileNumber: '',
            transporterEmail: '',
            transporterCountry: '',
            transporterState: '',
            transporterCity: '',
            transporterPinCode: '',
            transporterStateCode: '',
            transporterPanNo: '',
            transporterType: 'Corporate',
            transporterAddress: ''
        });
    };

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-transporter-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="add-transporter-header">
                    <h2 className="add-transporter-title">Add Transporter</h2>
                    <button className="add-transporter-close" onClick={onClose}>✕</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Add Transporter</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-transporter-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    {/* Row 1 */}
                    <div className="add-transporter-row">
                        <div className="add-transporter-field-with-btn">
                            <label className="add-transporter-label">Transporter GST</label>
                            <div className="add-transporter-input-group">
                                <input
                                    className="add-transporter-input"
                                    placeholder="ENTER TRANSPORTER GST"
                                    name="transporterGst"
                                    value={formData.transporterGst}
                                    onChange={handleChange}
                                />
                                <button type="button" className="add-transporter-btn-verify">Verify</button>
                            </div>
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Name</label>
                            <input
                                className="add-transporter-input"
                                placeholder="Enter Transporter Name"
                                name="transporterName"
                                value={formData.transporterName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Trade Name</label>
                            <input
                                className="add-transporter-input"
                                placeholder="Enter Transporter Trade Name"
                                name="transporterTradeName"
                                value={formData.transporterTradeName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Reference Name</label>
                            <input
                                className="add-transporter-input"
                                placeholder="Enter Reference Name"
                                name="transporterReferenceName"
                                value={formData.transporterReferenceName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Mobile Number</label>
                            <input
                                className="add-transporter-input"
                                placeholder="Enter Mobile Number"
                                name="transporterMobileNumber"
                                value={formData.transporterMobileNumber}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="add-transporter-row-6">
                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Email</label>
                            <input
                                className="add-transporter-input"
                                type="email"
                                placeholder="Enter Email"
                                name="transporterEmail"
                                value={formData.transporterEmail}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Country</label>
                            <CreatableSelect
                                value={formData.transporterCountry}
                                options={countryList}
                                onChange={(val) => setFormData(prev => ({ ...prev, transporterCountry: val }))}
                                onAddOption={(newVal) => {
                                    handleAddCountry(newVal);
                                    setFormData(prev => ({ ...prev, transporterCountry: newVal }));
                                }}
                                placeholder="Select or Type Country"
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter State</label>
                            <CreatableSelect
                                value={formData.transporterState}
                                options={stateList}
                                onChange={(val) => setFormData(prev => ({ ...prev, transporterState: val }))}
                                onAddOption={(newVal) => {
                                    handleAddState(newVal);
                                    setFormData(prev => ({ ...prev, transporterState: newVal }));
                                }}
                                placeholder="Select or Type State"
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter City</label>
                            <CreatableSelect
                                value={formData.transporterCity}
                                options={cityList}
                                onChange={(val) => setFormData(prev => ({ ...prev, transporterCity: val }))}
                                onAddOption={(newVal) => {
                                    handleAddCity(newVal);
                                    setFormData(prev => ({ ...prev, transporterCity: newVal }));
                                }}
                                placeholder="Select or Type City"
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Pin Code</label>
                            <input
                                className="add-transporter-input"
                                placeholder="Enter Transporter Pin Code"
                                name="transporterPinCode"
                                value={formData.transporterPinCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter State Code</label>
                            <input
                                className="add-transporter-input"
                                placeholder="Enter Transporter State Code"
                                name="transporterStateCode"
                                value={formData.transporterStateCode}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="add-transporter-row-6">
                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter PAN No</label>
                            <input
                                className="add-transporter-input"
                                placeholder="Enter Transporter PAN No"
                                name="transporterPanNo"
                                value={formData.transporterPanNo}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-transporter-field">
                            <label className="add-transporter-label">Transporter Type</label>
                            <CreatableSelect
                                value={formData.transporterType}
                                options={transporterTypeList}
                                onChange={(val) => setFormData(prev => ({ ...prev, transporterType: val }))}
                                onAddOption={(newVal) => {
                                    handleAddTransporterType(newVal);
                                    setFormData(prev => ({ ...prev, transporterType: newVal }));
                                }}
                                placeholder="Select or Type Transporter Type"
                            />
                        </div>
                    </div>

                    {/* Row 4 */}
                    <div className="add-transporter-field add-transporter-field-full">
                        <label className="add-transporter-label">Transporter Address</label>
                        <textarea
                            className="add-transporter-textarea"
                            placeholder="Enter Transporter Address"
                            name="transporterAddress"
                            value={formData.transporterAddress}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="add-transporter-actions">
                        {!isPage && <button type="button" className="add-transporter-btn-reset" onClick={handleReset}>Reset</button>}
                        {isPage && <button type="button" className="add-transporter-btn-reset" onClick={onClose} style={{ background: '#fff', border: '1px solid #ddd', color: '#333' }}>Cancel</button>}
                        <button type="submit" className="add-transporter-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="add-transporter-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default AddTransporterModal;

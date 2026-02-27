import React, { useState, useRef, useEffect } from 'react';
import '../../styles/AddSellerModal.css';
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
                className="add-seller-input"
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

function AddSellerModal({ isOpen, onClose, isPage }) {
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
        sellerAddress: '',
        companyId: ''
    });

    const [countryList, setCountryList] = useState([]);
    const [stateList, setStateList] = useState([]);
    const [cityList, setCityList] = useState([]);
    const [sellerTypes, setSellerTypes] = useState([]);
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
        const token = sessionStorage.getItem('token');
        try {
            // Fetch Seller Types (using CustomerType model for consistency or if separate model exists)
            const stRes = await fetch(`${API_BASE_URL}/customer-type`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (stRes.ok) setSellerTypes(await stRes.json());

            // Fetch Sale Types
            const saleRes = await fetch(`${API_BASE_URL}/sale-type`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (saleRes.ok) setSaleTypes(await saleRes.json());

            // Fetch Companies if Super Admin
            if (isSuperAdmin) {
                const cRes = await fetch(`${API_BASE_URL}/company`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (cRes.ok) setCompanies(await cRes.json());
            }

            // Fetch Countries
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

    useEffect(() => {
        const fetchStates = async () => {
            const country = allCountries.find(c => c.countryName === formData.sellerCountry);
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
            const state = allStates.find(s => s.stateName === formData.sellerState);
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

    const handleAddCountry = async (newCountryName) => {
        if (!newCountryName) return;

        // Optimistic update or wait? Let's wait to ensure it saved.
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
                // checking if error is "exists" might be good, but toast error works
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
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/seller`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Seller added successfully!');
                onClose();
            } else {
                toast.error(`${data.message}${data.error ? ': ' + data.error : ''}`);
            }
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("Server error");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
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
            sellerAddress: '',
            companyId: ''
        });
    };

    if (!isOpen && !isPage) return null;

    const formContent = (
        <div className={isPage ? "page-card" : "add-seller-modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
            {!isPage && (
                <div className="add-seller-header">
                    <h2 className="add-seller-title">Add Seller</h2>
                    <button className="add-seller-close" onClick={onClose}>✕</button>
                </div>
            )}
            {isPage && <div className="page-card__title">Add Seller</div>}

            <div className={isPage ? "page-card__body" : ""}>
                <form className="add-seller-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>
                    {/* Row 1 */}
                    <div className="add-seller-row">
                        {isSuperAdmin && (
                            <div className="add-seller-field">
                                <label className="add-seller-label">Select Company</label>
                                <select
                                    className="add-seller-select"
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
                        <div className="add-seller-field-with-btn">
                            <label className="add-seller-label">Seller GST</label>
                            <div className="add-seller-input-group">
                                <input
                                    className="add-seller-input"
                                    placeholder="ENTER SELLER GST"
                                    name="sellerGstNumber"
                                    value={formData.sellerGstNumber}
                                    onChange={handleChange}
                                />
                                <button type="button" className="add-seller-btn-verify">Verify</button>
                            </div>
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller Trade Name</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller Trade Name"
                                name="sellerTradeName"
                                value={formData.sellerTradeName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller Name</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller Name"
                                name="sellerName"
                                value={formData.sellerName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Prefix</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller Prefix"
                                name="sellerPrefix"
                                value={formData.sellerPrefix}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="add-seller-row">
                        <div className="add-seller-field">
                            <label className="add-seller-label">Email</label>
                            <input
                                className="add-seller-input"
                                type="email"
                                placeholder="Enter Seller Email"
                                name="sellerEmail"
                                value={formData.sellerEmail}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Mobile Number</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller Mobile Number"
                                name="sellerMobileNumber"
                                value={formData.sellerMobileNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller Country</label>
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

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller State</label>
                            <CreatableSelect
                                value={formData.sellerState}
                                options={stateList}
                                onChange={(val) => setFormData(prev => ({ ...prev, sellerState: val }))}
                                onAddOption={(newVal) => {
                                    handleAddState(newVal);
                                    setFormData(prev => ({ ...prev, sellerState: newVal }));
                                }}
                                placeholder="Select or Type State"
                            />
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="add-seller-row">
                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller City</label>
                            <CreatableSelect
                                value={formData.sellerCity}
                                options={cityList}
                                onChange={(val) => setFormData(prev => ({ ...prev, sellerCity: val }))}
                                onAddOption={(newVal) => {
                                    handleAddCity(newVal);
                                    setFormData(prev => ({ ...prev, sellerCity: newVal }));
                                }}
                                placeholder="Select or Type City"
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller Pin Code</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller Pin Code"
                                name="sellerPinCode"
                                value={formData.sellerPinCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller State Code</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller State Code"
                                name="sellerStateCode"
                                value={formData.sellerStateCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller PAN No</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller PAN No"
                                name="sellerPanCardNumber"
                                value={formData.sellerPanCardNumber}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 4 */}
                    <div className="add-seller-row">
                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller CIN Number</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Seller CIN Number"
                                name="sellerCinNumber"
                                value={formData.sellerCinNumber}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Bank Account Name</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Bank Account Name"
                                name="sellerBankAccountName"
                                value={formData.sellerBankAccountName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Bank Name</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Bank Name"
                                name="sellerBankName"
                                value={formData.sellerBankName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Bank A/C No.</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter Bank A/C No."
                                name="sellerAccountNo"
                                value={formData.sellerAccountNo}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Row 5 */}
                    <div className="add-seller-row">
                        <div className="add-seller-field">
                            <label className="add-seller-label">IFSC Code</label>
                            <input
                                className="add-seller-input"
                                placeholder="Enter IFSC Code"
                                name="sellerIfscCode"
                                value={formData.sellerIfscCode}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller Type</label>
                            <select
                                className="add-seller-select"
                                name="sellerTypeId"
                                value={formData.sellerTypeId}
                                onChange={handleChange}
                            >
                                <option value="">--Select Type--</option>
                                {sellerTypes.map(st => (
                                    <option key={st._id} value={st._id}>{st.customerTypeName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Sale Type</label>
                            <select
                                className="add-seller-select"
                                name="saleTypeId"
                                value={formData.saleTypeId}
                                onChange={handleChange}
                            >
                                <option value="">--Select Sale Type--</option>
                                {saleTypes.map(st => (
                                    <option key={st._id} value={st._id}>{st.saleTypeName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 6 - Textareas */}
                    <div className="add-seller-row-2">
                        <div className="add-seller-field">
                            <label className="add-seller-label">Bank Address</label>
                            <textarea
                                className="add-seller-textarea"
                                placeholder="Bank Address"
                                name="sellerBankAddress"
                                value={formData.sellerBankAddress}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="add-seller-field">
                            <label className="add-seller-label">Seller Address</label>
                            <textarea
                                className="add-seller-textarea"
                                placeholder="Seller Address"
                                name="sellerAddress"
                                value={formData.sellerAddress}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="add-seller-actions">
                        {!isPage && <button type="button" className="add-seller-btn-reset" onClick={handleReset}>Reset</button>}
                        {isPage && <button type="button" className="add-seller-btn-reset" onClick={onClose} style={{ background: '#fff', border: '1px solid #ddd', color: '#333' }}>Cancel</button>}
                        <button type="submit" className="add-seller-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );

    if (isPage) return formContent;

    return (
        <div className="add-seller-modal-overlay" onClick={onClose}>
            {formContent}
        </div>
    );
}

export default AddSellerModal;

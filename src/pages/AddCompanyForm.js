import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import CreatableSelect from 'react-select/creatable';
import '../styles/AddCompanyForm.css';
import API_BASE_URL from '../config/apiConfig.js';
import { usePermissionContext } from '../contexts/PermissionContext';
import AirDatePicker from '../components/ui/AirDatePicker';

const AddCompanyForm = ({ isOpen, onClose, company, isPage }) => {
    const { fetchMyPermissions } = usePermissionContext();
    const [formData, setFormData] = useState({
        companyName: '',
        companyPersonName: '',
        companyEmail: '',
        companyMobileNumber_1: '',
        companyMobileNumber_2: '',
        companyWebsiteUrl: '',
        companyGstNumber: '',
        companyPanCardNumber: '',
        companyAadharCardNumber: '',
        companyCountry: '',
        companyState: '',
        companyCity: '',
        companyStateCode: '',
        companyPinCode: '',
        companyMapUrl: '',
        companyBankName: '',
        companyBankAccountName: '',
        companyBankAccountNumber: '',
        companySwiftCode: '',
        companyIbanNo: '',
        companyBankIfscCode: '',
        companyBackground: 1, // Default 1 (Domestic)
        eWayBillUsername: '',
        eWayBillPassword: '',
        companyAddress: '',
        companyBankAddress: '',
        // Images (Base64 Strings)
        companyLogoImage: '',
        companyLetterHeadHeaderImage: '',
        companyLetterHeadFooterImage: '',
        companyDigitalSignature: '',
        companyPanCardFrontImage: '',
        companyPanCardBackImage: '',
        companyAadharCardFrontImage: '',
        companyAadharCardBackImage: '',
        companyOtherDocuments_1: '',
        companyOtherDocuments_2: '',
        companyOtherDocuments_3: '',
        companyOtherDocuments_4: '',
        companyOtherDocuments_5: '',
        countryId: '',
        stateId: '',
        cityId: ''
    });

    const [fileData, setFileData] = useState({});

    // --- Plan States ---
    const [plans, setPlans] = useState([]);
    const [planData, setPlanData] = useState({
        planId: '',
        planName: '',
        planPrice: 0,
        planDiscount: 0,
        couponCode: '',
        couponDiscountAmount: 0,
        finalPrice: 0,
        planStartDate: new Date().toISOString().split('T')[0],
        planExpiryDate: ''
    });

    const [couponInput, setCouponInput] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isRenewing, setIsRenewing] = useState(false);

    // --- Dropdown Data States ---
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState({ country: false, state: false, city: false });

    // --- Fetch Data ---
    useEffect(() => {
        fetchCountries();
        fetchPlans();
    }, []);

    useEffect(() => {
        if (company) {
            setFormData({
                companyName: company.companyName || '',
                companyPersonName: company.companyPersonName || '',
                companyEmail: company.companyEmail || '',
                companyMobileNumber_1: company.companyMobileNumber_1 || '',
                companyMobileNumber_2: company.companyMobileNumber_2 || '',
                companyWebsiteUrl: company.companyWebsiteUrl || '',
                companyGstNumber: company.companyGstNumber || '',
                companyPanCardNumber: company.companyPanCardNumber || '',
                companyAadharCardNumber: company.companyAadharCardNumber || '',
                companyCountry: company.companyCountry || 'India',
                companyState: company.companyState || '',
                companyCity: company.companyCity || '',
                companyStateCode: company.companyStateCode || '',
                companyPinCode: company.companyPinCode || '',
                companyMapUrl: company.companyMapUrl || '',
                companyBankName: company.companyBankName || '',
                companyBankAccountName: company.companyBankAccountName || '',
                companyBankAccountNumber: company.companyBankAccountNumber || '',
                companySwiftCode: company.companySwiftCode || '',
                companyIbanNo: company.companyIbanNo || '',
                companyBankIfscCode: company.companyBankIfscCode || '',
                companyBackground: company.companyBackground || 1,
                eWayBillUsername: company.eWayBillUsername || '',
                eWayBillPassword: company.eWayBillPassword || '',
                companyAddress: company.companyAddress || '',
                companyBankAddress: company.companyBankAddress || '',
                companyLogoImage: company.companyLogoImage || '',
                companyLetterHeadHeaderImage: company.companyLetterHeadHeaderImage || '',
                companyLetterHeadFooterImage: company.companyLetterHeadFooterImage || '',
                companyDigitalSignature: company.companyDigitalSignature || '',
                companyPanCardFrontImage: company.companyPanCardFrontImage || '',
                companyPanCardBackImage: company.companyPanCardBackImage || '',
                companyAadharCardFrontImage: company.companyAadharCardFrontImage || '',
                companyAadharCardBackImage: company.companyAadharCardBackImage || '',
                companyOtherDocuments_1: company.companyOtherDocuments_1 || '',
                companyOtherDocuments_2: company.companyOtherDocuments_2 || '',
                companyOtherDocuments_3: company.companyOtherDocuments_3 || '',
                companyOtherDocuments_4: company.companyOtherDocuments_4 || '',
                companyOtherDocuments_5: company.companyOtherDocuments_5 || '',
                countryId: company.countryId || '',
                stateId: company.stateId || '',
                cityId: company.cityId || ''
            });

            // Pre-fill plan data if editing
            if (company.planId) {
                const expiryDateStr = company.planExpiryDate
                    ? new Date(company.planExpiryDate).toISOString().split('T')[0]
                    : '';
                const startDateStr = company.planStartDate
                    ? new Date(company.planStartDate).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0];
                setPlanData({
                    planId: company.planId._id || company.planId || '',
                    planName: company.planName || '',
                    planDurationDays: company.planDurationDays || '',
                    planPrice: company.planPrice || 0,
                    planDiscount: company.planDiscount || 0,
                    couponCode: company.couponCode || '',
                    couponDiscountAmount: company.couponDiscountAmount || 0,
                    finalPrice: company.finalPrice || 0,
                    planStartDate: startDateStr,
                    planExpiryDate: expiryDateStr
                });
                if (company.couponCode) {
                    setCouponInput(company.couponCode);
                    setCouponApplied(true);
                }
            }

            if (company.countryId) {
                fetchStates(company.countryId);
            }
            if (company.stateId) {
                fetchCities(company.stateId);
            }
        }
    }, [company]);

    const fetchCountries = async () => {
        setIsLoading(prev => ({ ...prev, country: true }));
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/country`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCountries(data.map(c => ({ label: c.countryName, value: c.countryId, code: c.countryCode })));
            }
        } catch (error) {
            console.error("Error fetching countries:", error);
        }
        setIsLoading(prev => ({ ...prev, country: false }));
    };

    const fetchPlans = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/plan`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Handle both paginated and non-paginated responses
                if (data.plans && Array.isArray(data.plans)) {
                    setPlans(data.plans);
                } else if (Array.isArray(data)) {
                    setPlans(data);
                }
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    };

    const fetchStates = async (countryId) => {
        if (!countryId) return;
        setIsLoading(prev => ({ ...prev, state: true }));
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/state?countryId=${countryId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStates(data.map(s => ({ label: s.stateName, value: s.stateId })));
            }
        } catch (error) {
            console.error("Error fetching states:", error);
        }
        setIsLoading(prev => ({ ...prev, state: false }));
    };

    const fetchCities = async (stateId) => {
        if (!stateId) return;
        setIsLoading(prev => ({ ...prev, city: true }));
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/city?stateId=${stateId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCities(data.map(c => ({ label: c.cityName, value: c.cityId })));
            }
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
        setIsLoading(prev => ({ ...prev, city: false }));
    };

    // --- Handle Create ---

    const handleCreateCountry = async (inputValue) => {
        setIsLoading(prev => ({ ...prev, country: true }));
        // Simple heuristic: use name as code (uppercase, first 3 chars or full if needed), 
        // to make it "one-click" as requested.
        const newCode = inputValue.substring(0, 3).toUpperCase();

        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/country`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ countryName: inputValue, countryCode: newCode })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`Country "${inputValue}" Added`);
                const newOption = { label: data.country.countryName, value: data.country.countryId, code: data.country.countryCode };
                setCountries(prev => [...prev, newOption]);
                // Select it
                setFormData(prev => ({
                    ...prev,
                    countryId: newOption.value,
                    companyCountry: newOption.label,
                    stateId: '', companyState: '',
                    cityId: '', companyCity: ''
                }));
                setStates([]);
                setCities([]);
                // No states to fetch for new country yet
            } else {
                toast.error(data.message || "Failed to add country");
            }
        } catch (error) {
            console.error("Error adding country:", error);
            toast.error("Server error");
        }
        setIsLoading(prev => ({ ...prev, country: false }));
    };

    const handleCreateState = async (inputValue) => {
        if (!formData.countryId) {
            toast.error("Please select a country first");
            return;
        }
        setIsLoading(prev => ({ ...prev, state: true }));
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ stateName: inputValue, countryId: formData.countryId })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`State "${inputValue}" Added`);
                const newOption = { label: data.state.stateName, value: data.state.stateId };
                setStates(prev => [...prev, newOption]);
                setFormData(prev => ({
                    ...prev,
                    stateId: newOption.value,
                    companyState: newOption.label,
                    cityId: '', companyCity: ''
                }));
                // No cities yet
                setCities([]);
            } else {
                toast.error(data.message || "Failed to add state");
            }
        } catch (error) {
            console.error("Error adding state:", error);
            toast.error("Server error");
        }
        setIsLoading(prev => ({ ...prev, state: false }));
    };

    const handleCreateCity = async (inputValue) => {
        if (!formData.stateId) {
            toast.error("Please select a state first");
            return;
        }
        setIsLoading(prev => ({ ...prev, city: true }));
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/city`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ cityName: inputValue, stateId: formData.stateId })
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(`City "${inputValue}" Added`);
                const newOption = { label: data.city.cityName, value: data.city.cityId };
                setCities(prev => [...prev, newOption]);
                setFormData(prev => ({
                    ...prev,
                    cityId: newOption.value,
                    companyCity: newOption.label
                }));
            } else {
                toast.error(data.message || "Failed to add city");
            }
        } catch (error) {
            console.error("Error adding city:", error);
            toast.error("Server error");
        }
        setIsLoading(prev => ({ ...prev, city: false }));
    };

    // --- Change Handlers ---

    const handleCountrySelect = (option) => {
        if (option) {
            setFormData(prev => ({
                ...prev,
                countryId: option.value,
                companyCountry: option.label,
                stateId: '', companyState: '',
                cityId: '', companyCity: ''
            }));
            fetchStates(option.value);
            setStates([]); // temporary clear
        } else {
            setFormData(prev => ({
                ...prev,
                countryId: '',
                companyCountry: '',
                stateId: '', companyState: '',
                cityId: '', companyCity: ''
            }));
            setStates([]);
            setCities([]);
        }
    };

    const handleStateSelect = (option) => {
        if (option) {
            setFormData(prev => ({
                ...prev,
                stateId: option.value,
                companyState: option.label,
                cityId: '', companyCity: ''
            }));
            fetchCities(option.value);
            setCities([]); // temporary clear
        } else {
            setFormData(prev => ({
                ...prev,
                stateId: '',
                companyState: '',
                cityId: '', companyCity: ''
            }));
            setCities([]);
        }
    };

    const handleCitySelect = (option) => {
        if (option) {
            setFormData(prev => ({
                ...prev,
                cityId: option.value,
                companyCity: option.label
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                cityId: '',
                companyCity: ''
            }));
        }
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Plan Selection Handler ---
    const calculateFinalPrice = (price, planDiscount, coupon) => {
        let basePrice = price * (1 - (planDiscount / 100));
        let couponDiscount = 0;

        if (coupon) {
            if (coupon.discountType === 'percentage') {
                couponDiscount = basePrice * (coupon.discountValue / 100);
            } else {
                couponDiscount = coupon.discountValue;
            }
        }

        return {
            couponDiscount,
            finalPrice: Math.max(0, basePrice - couponDiscount)
        };
    };

    const handlePlanChange = (e) => {
        const selectedId = e.target.value;
        setCouponApplied(false);
        setCouponInput('');
        if (!selectedId) {
            setPlanData(prev => ({
                ...prev,
                planId: '',
                planName: '',
                planDurationDays: '',
                planPrice: 0,
                planDiscount: 0,
                couponCode: '',
                couponDiscountAmount: 0,
                finalPrice: 0,
                planExpiryDate: ''
            }));
            return;
        }
        const selectedPlan = plans.find(p => p._id === selectedId);
        if (selectedPlan) {
            const startDate = planData.planStartDate ? new Date(planData.planStartDate) : new Date();
            const expiry = new Date(startDate);
            expiry.setDate(expiry.getDate() + selectedPlan.planDurationDays);
            const expiryStr = expiry.toISOString().split('T')[0];
            const { couponDiscount, finalPrice } = calculateFinalPrice(selectedPlan.planPrice, selectedPlan.planDiscount, null);

            setPlanData(prev => ({
                ...prev,
                planId: selectedPlan._id,
                planName: selectedPlan.planName,
                planDurationDays: selectedPlan.planDurationDays,
                planPrice: selectedPlan.planPrice || 0,
                planDiscount: selectedPlan.planDiscount || 0,
                couponCode: '',
                couponDiscountAmount: couponDiscount,
                finalPrice: finalPrice,
                planExpiryDate: expiryStr
            }));
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponInput) {
            toast.error("Please enter a coupon code");
            return;
        }
        if (!planData.planId) {
            toast.error("Please select a plan first");
            return;
        }

        setIsValidatingCoupon(true);
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/coupon/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    couponCode: couponInput,
                    planId: planData.planId,
                    companyId: company?._id
                })
            });

            const data = await response.json();
            if (data.valid) {
                const { couponDiscount, finalPrice } = calculateFinalPrice(planData.planPrice, planData.planDiscount, data.coupon);
                setPlanData(prev => ({
                    ...prev,
                    couponCode: data.coupon.couponCode,
                    couponDiscountAmount: couponDiscount,
                    finalPrice: finalPrice
                }));
                setCouponApplied(true);
                toast.success(data.message);
            } else {
                toast.error(data.message || "Invalid coupon");
            }
        } catch (error) {
            console.error("Error validating coupon:", error);
            toast.error("Failed to validate coupon");
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        const { couponDiscount, finalPrice } = calculateFinalPrice(planData.planPrice, planData.planDiscount, null);
        setPlanData(prev => ({
            ...prev,
            couponCode: '',
            couponDiscountAmount: 0,
            finalPrice: finalPrice
        }));
        setCouponApplied(false);
        setCouponInput('');
        toast.info("Coupon removed");
    };

    const handleStartDateChange = (newStartDate) => {
        if (!newStartDate) return;

        setPlanData(prev => {
            let updatedExpiry = prev.planExpiryDate;
            if (prev.planDurationDays) {
                const startDate = new Date(newStartDate);
                const expiry = new Date(startDate);
                expiry.setDate(expiry.getDate() + parseInt(prev.planDurationDays));
                updatedExpiry = expiry.toISOString().split('T')[0];
            }
            return {
                ...prev,
                planStartDate: newStartDate,
                planExpiryDate: updatedExpiry
            };
        });
    };

    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const maxSize = 2500 * 1024; // 2500 KB in bytes

            if (file.size > maxSize) {
                toast.error("image is too large");
                e.target.value = ''; // Reset input
                return;
            }

            setFileData(prev => ({ ...prev, [name]: file }));
            try {
                const base64 = await convertToBase64(file);
                setFormData(prev => ({ ...prev, [name]: base64 }));
            } catch (error) {
                console.error("Error converting file:", error);
                toast.error("Error processing file");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.companyName) {
            toast.error("Company Name is required");
            return;
        }

        if (!formData.countryId) {
            toast.error("Country is required");
            return;
        }

        if (!formData.stateId) {
            toast.error("State is required");
            return;
        }

        if (!formData.cityId) {
            toast.error("City is required");
            return;
        }

        const data = new FormData();
        // Append text fields
        Object.keys(formData).forEach(key => {
            // Don't append if it's an image field we are sending via files
            if (![
                'companyLogoImage',
                'companyLetterHeadHeaderImage',
                'companyLetterHeadFooterImage',
                'companyDigitalSignature',
                'companyPanCardFrontImage',
                'companyPanCardBackImage',
                'companyAadharCardFrontImage',
                'companyAadharCardBackImage',
                'companyOtherDocuments_1',
                'companyOtherDocuments_2',
                'companyOtherDocuments_3',
                'companyOtherDocuments_4',
                'companyOtherDocuments_5'
            ].includes(key)) {
                data.append(key, formData[key]);
            }
        });

        // Append plan fields
        if (planData.planId) {
            data.append('planId', planData.planId);
            data.append('planStartDate', planData.planStartDate);
            data.append('planExpiryDate', planData.planExpiryDate);
            if (planData.couponCode) {
                data.append('couponCode', planData.couponCode);
            }
        }

        // Append files
        Object.keys(fileData).forEach(key => {
            data.append(key, fileData[key]);
        });

        try {
            const token = sessionStorage.getItem('token');
            const companyId = company ? (company._id || company.id) : null;

            if (company && !companyId) {
                toast.error("Invalid Company ID. Please refresh and try again.");
                return;
            }

            const url = company ? `${API_BASE_URL}/company/${companyId}` : `${API_BASE_URL}/company`;
            const method = company ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            const resData = await response.json();

            if (response.ok) {
                toast.success(company ? "Company Updated Successfully" : "Company Added Successfully");
                await fetchMyPermissions(); // Refresh Sidebar Logo and Details
                onClose(); // Switch back to list view
            } else {
                toast.error(resData.message || 'Failed to save company');
            }
        } catch (error) {
            console.error("Error saving company:", error);
            toast.error("Server error");
        }
    };

    if (!isOpen) return null;

    const sectionStyle = {
        gridColumn: '1 / -1',
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: '1rem',
        marginTop: '1.5rem',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '0.5rem'
    };

    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            borderRadius: '0.375rem',
            borderColor: '#e2e8f0',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#cbd5e1'
            }
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999
        })
    };

    const requiredStar = <span style={{ color: 'red', marginLeft: '2px' }}>*</span>;

    const renderImagePreview = (fieldName, label, isRequired = false) => (
        <div className="company-field">
            <label>{label} {isRequired && requiredStar}</label>
            <input
                type="file"
                name={fieldName}
                onChange={handleFileChange}
                accept="image/*,.webp"
                required={isRequired && !formData[fieldName]}
            />
            {formData[fieldName] && (
                <div className="image-preview-box" style={{ marginTop: '10px' }}>
                    <img
                        src={formData[fieldName].startsWith('data:') || formData[fieldName].startsWith('http') ? formData[fieldName] : `${API_BASE_URL.replace('/api', '')}/${formData[fieldName].replace(/\\/g, '/').startsWith('/') ? formData[fieldName].replace(/\\/g, '/').substring(1) : formData[fieldName].replace(/\\/g, '/')}`}
                        alt="Preview"
                        style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div className={isPage ? "list-page-container" : "modal-overlay"}>
            <div className={isPage ? "" : "modal"}>
                <div className="modal-header">
                    <h2 className="modal-title">{company ? 'Update Company' : 'Add Company'}</h2>
                    {!isPage && <button className="modal-close" onClick={onClose}>&times;</button>}
                </div>
                <div className="company-form-body">
                    <form onSubmit={handleSubmit}>
                        <div className="company-grid">

                            {/* --- Section 1: Company Personal Information --- */}
                            <h3 style={{ ...sectionStyle, marginTop: 0 }}>Company Personal Information</h3>

                            <div className="company-field">
                                <label>Company Name {requiredStar}</label>
                                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
                            </div>
                            <div className="company-field">
                                <label>Person Name {requiredStar}</label>
                                <input type="text" name="companyPersonName" value={formData.companyPersonName} onChange={handleChange} required />
                            </div>
                            <div className="company-field">
                                <label>Email {requiredStar}</label>
                                <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} required />
                            </div>
                            <div className="company-field">
                                <label>Mobile 1 {requiredStar}</label>
                                <input type="text" name="companyMobileNumber_1" value={formData.companyMobileNumber_1} onChange={handleChange} required />
                            </div>
                            <div className="company-field">
                                <label>Mobile 2</label>
                                <input type="text" name="companyMobileNumber_2" value={formData.companyMobileNumber_2} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>Website URL</label>
                                <input type="text" name="companyWebsiteUrl" value={formData.companyWebsiteUrl} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>GST Number</label>
                                <input type="text" name="companyGstNumber" value={formData.companyGstNumber} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>PAN Card Number {requiredStar}</label>
                                <input type="text" name="companyPanCardNumber" value={formData.companyPanCardNumber} onChange={handleChange} required />
                            </div>
                            <div className="company-field">
                                <label>Aadhar Card Number</label>
                                <input type="text" name="companyAadharCardNumber" value={formData.companyAadharCardNumber} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>Background {requiredStar}</label>
                                <select name="companyBackground" value={formData.companyBackground} onChange={handleChange} required>
                                    <option value={1}>Domestic</option>
                                    <option value={2}>International</option>
                                </select>
                            </div>
                            <div className="company-field">
                                <label>EWay Bill Username</label>
                                <input type="text" name="eWayBillUsername" value={formData.eWayBillUsername} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>EWay Bill Password</label>
                                <input type="text" name="eWayBillPassword" value={formData.eWayBillPassword} onChange={handleChange} />
                            </div>

                            {/* --- Section 2: Company Address Information --- */}
                            <h3 style={sectionStyle}>Company Address Information</h3>

                            <div className="company-field">
                                <label>Country {requiredStar}</label>
                                <CreatableSelect
                                    isClearable
                                    isDisabled={isLoading.country}
                                    isLoading={isLoading.country}
                                    onChange={handleCountrySelect}
                                    onCreateOption={handleCreateCountry}
                                    options={countries}
                                    value={countries.find(c => c.value === formData.countryId) || (formData.companyCountry ? { label: formData.companyCountry, value: formData.countryId } : null)}
                                    placeholder="Select or Add Country"
                                    styles={customSelectStyles}
                                />
                            </div>

                            <div className="company-field">
                                <label>State {requiredStar}</label>
                                <CreatableSelect
                                    isClearable
                                    isDisabled={!formData.countryId || isLoading.state}
                                    isLoading={isLoading.state}
                                    onChange={handleStateSelect}
                                    onCreateOption={handleCreateState}
                                    options={states}
                                    value={states.find(s => s.value === formData.stateId) || (formData.companyState ? { label: formData.companyState, value: formData.stateId } : null)}
                                    placeholder="Select or Add State"
                                    styles={customSelectStyles}
                                />
                            </div>

                            <div className="company-field">
                                <label>City {requiredStar}</label>
                                <CreatableSelect
                                    isClearable
                                    isDisabled={!formData.stateId || isLoading.city}
                                    isLoading={isLoading.city}
                                    onChange={handleCitySelect}
                                    onCreateOption={handleCreateCity}
                                    options={cities}
                                    value={cities.find(c => c.value === formData.cityId) || (formData.companyCity ? { label: formData.companyCity, value: formData.cityId } : null)}
                                    placeholder="Select or Add City"
                                    styles={customSelectStyles}
                                />
                            </div>

                            <div className="company-field">
                                <label>State Code {requiredStar}</label>
                                <input type="text" name="companyStateCode" value={formData.companyStateCode} onChange={handleChange} required />
                            </div>
                            <div className="company-field">
                                <label>Pin Code {requiredStar}</label>
                                <input type="text" name="companyPinCode" value={formData.companyPinCode} onChange={handleChange} required />
                            </div>
                            <div className="company-field">
                                <label>Map URL</label>
                                <input type="text" name="companyMapUrl" value={formData.companyMapUrl} onChange={handleChange} />
                            </div>
                            <div className="company-field full-width">
                                <label>Company Address {requiredStar}</label>
                                <textarea name="companyAddress" value={formData.companyAddress} onChange={handleChange} rows="3" required></textarea>
                            </div>

                            {/* --- Section 3: Company Bank Information --- */}
                            <h3 style={sectionStyle}>Company Bank Information</h3>

                            <div className="company-field">
                                <label>Bank Name</label>
                                <input type="text" name="companyBankName" value={formData.companyBankName} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>Bank Account Name</label>
                                <input type="text" name="companyBankAccountName" value={formData.companyBankAccountName} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>Bank Account Number</label>
                                <input type="text" name="companyBankAccountNumber" value={formData.companyBankAccountNumber} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>Swift Code</label>
                                <input type="text" name="companySwiftCode" value={formData.companySwiftCode} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>IBAN No</label>
                                <input type="text" name="companyIbanNo" value={formData.companyIbanNo} onChange={handleChange} />
                            </div>
                            <div className="company-field">
                                <label>IFSC Code</label>
                                <input type="text" name="companyBankIfscCode" value={formData.companyBankIfscCode} onChange={handleChange} />
                            </div>
                            <div className="company-field full-width">
                                <label>Bank Address</label>
                                <textarea name="companyBankAddress" value={formData.companyBankAddress} onChange={handleChange} rows="3"></textarea>
                            </div>

                            {/* --- Section 4: Plan / Subscription --- */}
                            <h3 style={sectionStyle}>Plan / Subscription</h3>

                            <div className="company-field">
                                <label>Plan Name</label>
                                <select
                                    value={planData.planId}
                                    onChange={handlePlanChange}
                                    style={{ width: '100%' }}
                                    disabled={!!company && !isRenewing}
                                >
                                    <option value="">-- Select Plan --</option>
                                    {plans.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.planName} ({p.planDurationDays} days)
                                        </option>
                                    ))}
                                </select>
                                {!!company && !isRenewing && (
                                    <button
                                        type="button"
                                        onClick={() => setIsRenewing(true)}
                                        style={{
                                            marginTop: '8px',
                                            padding: '4px 12px',
                                            fontSize: '12px',
                                            backgroundColor: '#1e3a8a',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Renew or Change Plan
                                    </button>
                                )}
                            </div>

                            <div className="company-field">
                                <label>Plan Start Date {requiredStar}</label>
                                <AirDatePicker
                                    name="planStartDate"
                                    value={planData.planStartDate}
                                    onChange={handleStartDateChange}
                                    required={!!planData.planId}
                                    disabled={!!company && !isRenewing}
                                    placeholder="Select Start Date"
                                />
                            </div>

                            <div className="company-field">
                                <label>Plan Duration (Days)</label>
                                <input
                                    type="text"
                                    value={planData.planDurationDays ? `${planData.planDurationDays} days` : ''}
                                    readOnly
                                    placeholder="Auto-calculated from plan"
                                    style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="company-field">
                                <label>Plan Expiry Date</label>
                                <input
                                    type="text"
                                    value={planData.planExpiryDate
                                        ? new Date(planData.planExpiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                                        : ''}
                                    readOnly
                                    placeholder="Auto-calculated (start date + plan days)"
                                    style={{
                                        backgroundColor: '#f8fafc',
                                        cursor: 'not-allowed',
                                        color: planData.planExpiryDate
                                            ? (new Date(planData.planExpiryDate) < new Date() ? '#dc2626' : '#16a34a')
                                            : '#64748b'
                                    }}
                                />
                            </div>

                            <div className="company-field">
                                <label>Plan Price (₹)</label>
                                <input
                                    type="text"
                                    value={`₹${planData.planPrice || 0}`}
                                    readOnly
                                    style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="company-field">
                                <label>Discount (%)</label>
                                <input
                                    type="text"
                                    value={`${planData.planDiscount || 0}%`}
                                    readOnly
                                    style={{ backgroundColor: '#f8fafc', cursor: 'not-allowed', color: '#1e3a8a' }}
                                />
                            </div>

                            <div className="company-field">
                                <label>Amount to Pay (₹)</label>
                                <input
                                    type="text"
                                    value={`₹${planData.finalPrice || 0}`}
                                    readOnly
                                    style={{ backgroundColor: '#f0fdf4', cursor: 'not-allowed', color: '#16a34a', fontWeight: 'bold' }}
                                />
                            </div>

                            <div className="company-field full-width">
                                <label>Apply Coupon Code</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value)}
                                        placeholder="Enter coupon code"
                                        disabled={couponApplied || !planData.planId || (!!company && !isRenewing)}
                                        style={{ textTransform: 'uppercase', flex: 1 }}
                                    />
                                    {couponApplied ? (
                                        <button
                                            type="button"
                                            onClick={handleRemoveCoupon}
                                            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '0 15px', borderRadius: '8px', cursor: 'pointer' }}
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={isValidatingCoupon || !planData.planId || (!!company && !isRenewing)}
                                            style={{ backgroundColor: (!!company && !isRenewing) ? '#94a3b8' : '#1e3a8a', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: (!!company && !isRenewing) ? 'not-allowed' : 'pointer' }}
                                        >
                                            {isValidatingCoupon ? '...' : 'Apply'}
                                        </button>
                                    )}
                                </div>
                                {couponApplied && planData.couponDiscountAmount > 0 && (
                                    <div style={{ marginTop: '5px', fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
                                        Coupon Applied! You saved ₹{planData.couponDiscountAmount.toFixed(2)}
                                    </div>
                                )}
                            </div>

                            {/* --- Section 5: Images --- */}
                            <h3 style={sectionStyle}>Images</h3>

                            {renderImagePreview('companyLogoImage', 'Logo Image', true)}
                            {renderImagePreview('companyLetterHeadHeaderImage', 'Header Image')}
                            {renderImagePreview('companyLetterHeadFooterImage', 'Footer Image')}
                            {renderImagePreview('companyDigitalSignature', 'Digital Signature')}
                            {renderImagePreview('companyPanCardFrontImage', 'PAN Front')}
                            {renderImagePreview('companyPanCardBackImage', 'PAN Back')}
                            {renderImagePreview('companyAadharCardFrontImage', 'Aadhar Front')}
                            {renderImagePreview('companyAadharCardBackImage', 'Aadhar Back')}
                        </div>

                        <div className="company-form-actions">
                            <button type="submit" className="btn-submit">Submit</button>
                            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddCompanyForm;

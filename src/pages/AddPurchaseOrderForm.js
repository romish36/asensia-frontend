import React, { useState, useEffect, useRef } from 'react';
import '../styles/AddPurchaseOrderForm.css';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/apiConfig.js';
import AirDatePicker from '../components/ui/AirDatePicker';


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

  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = safeOptions.filter(opt =>
    (opt || '').toString().toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const showAddOption = searchTerm && !filteredOptions.some(opt => (opt || '').toLowerCase() === (searchTerm || '').toLowerCase());

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
    <div className="custom-select-container" ref={containerRef}>
      <input
        className="custom-select-input"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder || "Select or Type..."}
      />
      {isOpen && (filteredOptions.length > 0 || showAddOption) && (
        <div className="custom-select-dropdown">
          {filteredOptions.map((opt, index) => (
            <div
              key={opt}
              className="custom-select-option"
              style={{ backgroundColor: index === activeIndex ? '#e6f7ff' : 'transparent' }}
              onClick={() => handleOptionClick(opt)}
            >
              {opt}
            </div>
          ))}
          {showAddOption && (
            <div
              className="custom-select-add-option"
              style={{ backgroundColor: filteredOptions.length === activeIndex ? '#e6f7ff' : 'transparent' }}
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

function AddPurchaseOrderForm({ isOpen, onClose, editingRow, isPage }) {
  const isEdit = !!editingRow;

  const [general, setGeneral] = useState({
    seller: '',
    invoiceNo: '',
    invoiceDate: '',
    vehicleNo: '',
    lrNo: '',
    eWayBillNo: '',
    freightPercent: '0',
    insurancePercent: '0',
    remarks: '',
    termsAndConditions: '',
  });

  const [productRows, setProductRows] = useState([
    {
      id: Date.now(),
      category: '',
      product: '',
      hsnCode: '',
      grade: '',
      unit: 'PCS',
      color: '',
      quantity: '1',
      rate: '',
      total: '',
      showNewProduct: false,
      newProduct: {
        name: '',
        hsn: '',
        modelNumber: '',
        finishGlaze: '',
        salePrice: '',
        type: 'Stock'
      }
    },
  ]);

  // Lists from DB
  const [sellers, setSellers] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [colorList, setColorList] = useState([]);
  const [gradeList, setGradeList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [ownCompany, setOwnCompany] = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [allStates, setAllStates] = useState([]);
  const [cityList, setCityList] = useState([]);

  const [newSeller, setNewSeller] = useState({
    gst: '', tradeName: '', name: '', prefix: '', email: '',
    mobile: '', country: '', state: '', city: '', pinCode: '', stateCode: '',
    pan: '', cin: '', bankAccountName: '', bankName: '', bankAccNo: '', ifsc: '',
    type: '', bankAddress: '', address: ''
  });

  useEffect(() => {
    fetchMasterData();
    if (isEdit && editingRow) {
      setGeneral({
        seller: editingRow.companyName || '',
        invoiceNo: editingRow.invoiceNo || '',
        invoiceDate: editingRow.invoiceDate || '',
        vehicleNo: editingRow.vehicleNo || '',
        lrNo: editingRow.lrNo || '',
        eWayBillNo: editingRow.eWayBillNo || '',
        freightPercent: editingRow.freight || '0',
        insurancePercent: editingRow.insurance || '0',
        remarks: editingRow.remarks || '',
        termsAndConditions: editingRow.termsCondtion || '',
      });
      if (editingRow.items && editingRow.items.length) {
        setProductRows(editingRow.items.map(it => ({ ...it, id: it._id || Date.now() })));
      }
    } else {
      setGeneral({
        seller: '',
        invoiceNo: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        vehicleNo: '',
        lrNo: '',
        eWayBillNo: '',
        freightPercent: '0',
        insurancePercent: '0',
        remarks: '',
        termsAndConditions: '',
      });
      setProductRows([
        {
          id: Date.now(),
          category: '',
          product: '',
          hsnCode: '',
          grade: '',
          unit: 'PCS',
          color: '',
          quantity: '1',
          rate: '',
          total: '',
          showNewProduct: false,
          newProduct: {}
        },
      ]);
    }
  }, [isEdit, editingRow]);

  const fetchMasterData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const user = JSON.parse(sessionStorage.getItem('user'));
      const headers = { 'Authorization': `Bearer ${token}` };

      const [sellRes, catRes, colRes, gradRes, prodRes, compRes, countryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/seller`, { headers }),
        fetch(`${API_BASE_URL}/category`, { headers }),
        fetch(`${API_BASE_URL}/color`, { headers }),
        fetch(`${API_BASE_URL}/grade`, { headers }),
        fetch(`${API_BASE_URL}/product`, { headers }),
        fetch(`${API_BASE_URL}/company`, { headers }),
        fetch(`${API_BASE_URL}/country`, { headers })
      ]);

      if (sellRes.ok) setSellers(await sellRes.json());
      if (catRes.ok) setCategoryList((await catRes.json()).map(c => c.categoryName));
      if (colRes.ok) setColorList((await colRes.json()).map(c => c.colorName));
      if (gradRes.ok) setGradeList((await gradRes.json()).map(g => g.gradeName));
      if (prodRes.ok) setProductList(await prodRes.json());
      if (compRes.ok) {
        const companies = await compRes.json();
        // Use the first company or the one matching user's companyId
        setOwnCompany(Array.isArray(companies) ? companies[0] : companies);
      }
      if (countryRes.ok) {
        const countries = await countryRes.json();
        setAllCountries(countries);
        setCountryList(countries.map(c => c.countryName));
      }

    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  useEffect(() => {
    const fetchStates = async () => {
      const country = allCountries.find(c => c.countryName === newSeller.country);
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
  }, [newSeller.country, allCountries]);

  useEffect(() => {
    const fetchCities = async () => {
      const state = allStates.find(s => s.stateName === newSeller.state);
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
  }, [newSeller.state, allStates]);

  const updateGeneral = (field, value) => {
    setGeneral((prev) => ({ ...prev, [field]: value }));
  };

  const updateNewSeller = (field, value) => {
    setNewSeller(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCountry = async (cityName) => {
    if (!cityName) return;
    try {
      const token = sessionStorage.getItem('token');
      const code = cityName.substring(0, 3).toUpperCase();
      const response = await fetch(`${API_BASE_URL}/country`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ countryName: cityName, countryCode: code })
      });

      if (response.ok) {
        const data = await response.json();
        setAllCountries(prev => [...prev, data.country]);
        setCountryList(prev => [...prev, data.country.countryName]);
        toast.success(`Country "${cityName}" added successfully`);
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
    const country = allCountries.find(c => c.countryName === newSeller.country);
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
    const state = allStates.find(s => s.stateName === newSeller.state);
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

  const updateProductRow = (id, field, value) => {
    setProductRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };

          // Reset product if category changes
          if (field === 'category') {
            updated.product = '';
            updated.hsnCode = '';
            updated.showNewProduct = false;
          }

          // Handle 'Product' dropdown 'Other' selection
          if (field === 'product') {
            if (value === 'Other') {
              updated.showNewProduct = true;
              if (!updated.newProduct) {
                updated.newProduct = {
                  name: '',
                  hsn: '',
                  modelNumber: '',
                  finishGlaze: '',
                  salePrice: '',
                  type: 'Stock'
                };
              }
            } else {
              updated.showNewProduct = false;
              // Auto-fill HSN and Rate from productList if available
              const selected = productList.find(p => p.productName === value);
              if (selected) {
                updated.hsnCode = selected.productHsnCode || '';
                updated.rate = selected.productSalePrice || '';
                const qty = Number(updated.quantity) || 0;
                const rate = Number(updated.rate) || 0;
                updated.total = (qty * rate).toFixed(2);
              }
            }
          }

          if (field === 'quantity' || field === 'rate') {
            const qty = Number(updated.quantity) || 0;
            const rate = Number(updated.rate) || 0;
            updated.total = (qty * rate).toFixed(2);
          }
          return updated;
        }
        return r;
      })
    );
  };

  const updateNewProductField = (id, field, value) => {
    setProductRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            newProduct: {
              ...r.newProduct || {},
              [field]: value
            }
          };
        }
        return r;
      })
    );
  };

  const handleAddCategory = async (newCategory) => {
    if (!newCategory) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categoryName: newCategory })
      });

      if (response.ok) {
        setCategoryList(prev => [...prev, newCategory]);
        toast.success(`Category "${newCategory}" Added Successfully!`);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to add category to database");
      }
    } catch (error) {
      console.error("Add Category Error:", error);
      toast.error("Server error while adding category");
    }
  };

  const handleAddColor = async (newColor) => {
    if (!newColor) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/color`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ colorName: newColor })
      });

      if (response.ok) {
        setColorList(prev => [...prev, newColor]);
        toast.success(`Color "${newColor}" Added Successfully!`);
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to add color to database");
      }
    } catch (error) {
      console.error("Add Color Error:", error);
      toast.error("Server error while adding color");
    }
  };

  const addProductRow = () => {
    setProductRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: '',
        product: '',
        hsnCode: '',
        grade: '',
        unit: 'PCS',
        color: '',
        quantity: '1',
        rate: '',
        total: '',
        showNewProduct: false,
        newProduct: {}
      },
    ]);
  };

  const removeProductRow = (id) => {
    if (productRows.length > 1) {
      setProductRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      toast.warn("At least one product item is required.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mandatory Field Validation
    if (!general.seller) {
      toast.error("Seller is mandatory");
      return;
    }
    if (!general.invoiceNo) {
      toast.error("Invoice No is mandatory");
      return;
    }

    for (let i = 0; i < productRows.length; i++) {
      const row = productRows[i];
      if (!row.category) {
        toast.error(`Category is mandatory for Item ${i + 1}`);
        return;
      }
      if (!row.product) {
        toast.error(`Product is mandatory for Item ${i + 1}`);
        return;
      }
      if (row.product === 'Other' && (!row.newProduct?.name)) {
        toast.error(`Please enter New Product Name for Item ${i + 1}`);
        return;
      }
      if (!row.rate) {
        toast.error(`Rate is mandatory for Item ${i + 1}`);
        return;
      }
    }

    let selectedSellerObj = sellers.find(s => s.sellerTradeName === general.seller);
    const token = sessionStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // If 'Other' is selected, create the seller first
    if (general.seller === 'Other') {
      if (!newSeller.tradeName) {
        toast.error("Seller trade name is mandatory for new seller");
        return;
      }
      try {
        const sellerPayload = {
          sellerTradeName: newSeller.tradeName,
          sellerName: newSeller.name,
          sellerMobileNumber: newSeller.mobile,
          sellerEmail: newSeller.email,
          sellerGstNumber: newSeller.gst,
          sellerPanCardNumber: newSeller.pan,
          sellerCinNumber: newSeller.cin,
          sellerCountry: newSeller.country,
          sellerState: newSeller.state,
          sellerCity: newSeller.city,
          sellerPinCode: newSeller.pinCode,
          sellerAddress: newSeller.address,
          sellerBankName: newSeller.bankName,
          sellerBankAccountName: newSeller.bankAccountName,
          sellerAccountNo: newSeller.bankAccNo,
          sellerIfscCode: newSeller.ifsc,
          sellerPrefix: newSeller.prefix,
          companyId: JSON.parse(sessionStorage.getItem('user'))?.role === 'SUPER_ADMIN' ? ownCompany?._id : undefined
        };

        const sellRes = await fetch(`${API_BASE_URL}/seller`, {
          method: 'POST',
          headers,
          body: JSON.stringify(sellerPayload)
        });

        if (sellRes.ok) {
          const sellData = await sellRes.json();
          selectedSellerObj = sellData.seller;
          toast.success("New seller added successfully");
        } else {
          const sellErr = await sellRes.json();
          toast.error("Failed to add new seller: " + (sellErr.message || "Unknown error"));
          return;
        }
      } catch (error) {
        console.error("Seller Creation Error:", error);
        toast.error("Server error while adding seller");
        return;
      }
    }

    const payload = {
      // Buyer Details (This Company)
      buyerId: ownCompany?.companyId,
      buyerTradeName: ownCompany?.companyName,
      buyerMobileNumber: ownCompany?.companyMobileNumber,
      buyerEmail: ownCompany?.companyEmail,
      buyerPanCardNumber: ownCompany?.companyPanNumber,
      buyerGstNumber: ownCompany?.companyGstNumber,
      buyerCountry: ownCompany?.companyCountry,
      buyerState: ownCompany?.companyState,
      buyerCity: ownCompany?.companyCity,
      buyerPinCode: ownCompany?.companyPinCode,
      buyerAddress: ownCompany?.companyAddress,
      buyerBankName: ownCompany?.companyBankName,
      buyerBankAccountName: ownCompany?.companyBankAccountName,
      buyerAccountNo: ownCompany?.companyBankAccountNumber,
      buyerIfscCode: ownCompany?.companyBankIfscCode,

      // Seller Details
      companyName: selectedSellerObj?.sellerTradeName,
      companyMobileNumber: selectedSellerObj?.sellerMobileNumber,
      companyEmail: selectedSellerObj?.sellerEmail,
      companyGstNumber: selectedSellerObj?.sellerGstNumber,
      companyPanCardNumber: selectedSellerObj?.sellerPanCardNumber,
      companyCountry: selectedSellerObj?.sellerCountry || editingRow?.companyCountry,
      companyState: selectedSellerObj?.sellerState || editingRow?.companyState,
      companyCity: selectedSellerObj?.sellerCity || editingRow?.companyCity,
      companyPinCode: selectedSellerObj?.sellerPinCode || editingRow?.companyPinCode,
      companyAddress: selectedSellerObj?.sellerAddress || editingRow?.companyAddress,
      purchaseCompanyId: selectedSellerObj?.sellerId, // Storing seller numeric ID

      invoiceNo: general.invoiceNo,
      invoiceDate: general.invoiceDate,
      vehicleNo: general.vehicleNo,
      lrNo: general.lrNo,
      eWayBillNo: general.eWayBillNo,
      freight: general.freightPercent,
      insurance: general.insurancePercent,
      remarks: general.remarks,
      termsCondtion: general.termsAndConditions,

      items: productRows.map(r => ({
        category: r.category,
        product: r.product === 'Other' ? (r.newProduct?.name || 'Other') : r.product,
        hsnCode: r.product === 'Other' ? (r.newProduct?.hsn || r.hsnCode) : r.hsnCode,
        modelNumber: r.product === 'Other' ? (r.newProduct?.modelNumber || '') : (r.modelNumber || ''),
        productFinishGlaze: r.product === 'Other' ? (r.newProduct?.finishGlaze || '') : (r.productFinishGlaze || ''),
        productSalePrice: r.product === 'Other' ? (r.newProduct?.salePrice || '') : '',
        grade: r.grade,
        unit: r.unit,
        color: r.color,
        quantity: Number(r.quantity),
        rate: r.rate,
        total: r.total
      })),
      totalAmount: productRows.reduce((sum, r) => sum + (Number(r.total) || 0), 0)
    };

    try {
      const url = isEdit ? `${API_BASE_URL}/purchase-order/${editingRow._id}` : `${API_BASE_URL}/purchase-order`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(isEdit ? 'Purchase Order Updated!' : 'Purchase Order Created!');
        onClose();
      } else {
        const err = await response.json();
        toast.error(err.message || "Operation failed");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Server error");
    }
  };

  if (!isOpen && !isPage) return null;

  const formContent = (
    <div className={isPage ? "page-card" : "modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
      <div className={isPage ? "page-card__title" : "modal-header"}>
        {isPage ? (
          isEdit ? 'Update Purchase Invoice' : 'Add Purchase Invoice'
        ) : (
          <>
            <h2 className="modal-title">{isEdit ? 'Update Purchase Invoice' : 'Add Purchase Invoice'}</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </>
        )}
      </div>

      <div className={isPage ? "page-card__body" : ""}>
        <form className="po-form" onSubmit={handleSubmit} style={isPage ? { padding: '0' } : {}}>

          {/* Row 1: Seller, Invoice No, Invoice Date, Vehicle No */}
          <div className="po-grid-4-equal">
            <div className="po-field">
              <label className="po-label">Seller <span style={{ color: 'red' }}>*</span></label>
              <select
                className="po-select"
                value={general.seller}
                onChange={(e) => updateGeneral('seller', e.target.value)}
              >
                <option value="">Select Seller</option>
                {sellers
                  .sort((a, b) => (a.sellerTradeName || a.sellerName || '').localeCompare(b.sellerTradeName || b.sellerName || ''))
                  .map((s) => (
                    <option key={s._id} value={s.sellerTradeName}>
                      {s.sellerTradeName}{s.sellerName ? ` (${s.sellerName})` : ''}
                    </option>
                  ))}
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="po-field">
              <label className="po-label">Invoice No <span style={{ color: 'red' }}>*</span></label>
              <input
                className="po-input"
                placeholder=""
                value={general.invoiceNo}
                onChange={(e) => updateGeneral('invoiceNo', e.target.value)}
              />
            </div>

            <div className="po-field">
              <label className="po-label">Invoice Date</label>
              <AirDatePicker
                className="po-input"
                value={general.invoiceDate}
                onChange={(val) => updateGeneral('invoiceDate', val)}
                placeholder="Select Date"
              />
            </div>

            <div className="po-field">
              <label className="po-label">Vehicle No</label>
              <input
                className="po-input"
                placeholder="Enter Vehicle No"
                value={general.vehicleNo}
                onChange={(e) => updateGeneral('vehicleNo', e.target.value)}
              />
            </div>
          </div>

          {/* Add New Seller Section */}
          {general.seller === 'Other' && (
            <div className="add-seller-section">
              <div className="add-seller-title">Add Seller</div>

              {/* Row 1: Seller GST, Trade Name, Name, Prefix, Email */}
              <div className="add-seller-grid-row-5">
                <div className="po-field">
                  <label className="po-label">Seller GST</label>
                  <div className="add-seller-input-group">
                    <input
                      className="po-input"
                      placeholder="ENTER SELLER GST"
                      value={newSeller.gst}
                      onChange={e => updateNewSeller('gst', e.target.value)}
                    />
                    <button type="button" className="btn-verify-gst">Verify GST</button>
                  </div>
                </div>
                <div className="po-field">
                  <label className="po-label">Seller Trade Name</label>
                  <input className="po-input" placeholder="Enter Seller Trade Name" value={newSeller.tradeName} onChange={e => updateNewSeller('tradeName', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller Name</label>
                  <input className="po-input" placeholder="Enter Seller Name" value={newSeller.name} onChange={e => updateNewSeller('name', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Prefix</label>
                  <input className="po-input" placeholder="Enter Seller Prefix" value={newSeller.prefix} onChange={e => updateNewSeller('prefix', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Email</label>
                  <input className="po-input" placeholder="Enter Seller Email" value={newSeller.email} onChange={e => updateNewSeller('email', e.target.value)} />
                </div>
              </div>

              {/* Row 2: Mobile, Country, State, City, Pin, State Code */}
              <div className="add-seller-grid-row-6">
                <div className="po-field">
                  <label className="po-label">Mobile Numer</label>
                  <input className="po-input" placeholder="Enter Seller Mobile Num" value={newSeller.mobile} onChange={e => updateNewSeller('mobile', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller Country</label>
                  <CreatableSelect
                    value={newSeller.country}
                    options={countryList}
                    onChange={(val) => updateNewSeller('country', val)}
                    onAddOption={(newVal) => {
                      handleAddCountry(newVal);
                      updateNewSeller('country', newVal);
                    }}
                    placeholder="Select or Type Country"
                  />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller State</label>
                  <CreatableSelect
                    value={newSeller.state}
                    options={stateList}
                    onChange={(val) => updateNewSeller('state', val)}
                    onAddOption={(newVal) => {
                      handleAddState(newVal);
                      updateNewSeller('state', newVal);
                    }}
                    placeholder="Select or Type State"
                  />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller City</label>
                  <CreatableSelect
                    value={newSeller.city}
                    options={cityList}
                    onChange={(val) => updateNewSeller('city', val)}
                    onAddOption={(newVal) => {
                      handleAddCity(newVal);
                      updateNewSeller('city', newVal);
                    }}
                    placeholder="Select or Type City"
                  />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller Pin Code</label>
                  <input className="po-input" placeholder="Enter Seller Pin Code" value={newSeller.pinCode} onChange={e => updateNewSeller('pinCode', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller State Code</label>
                  <input className="po-input" placeholder="Enter Seller State Code" value={newSeller.stateCode} onChange={e => updateNewSeller('stateCode', e.target.value)} />
                </div>
              </div>

              {/* Row 3: PAN, CIN, Bank Details */}
              <div className="add-seller-grid-row-6">
                <div className="po-field">
                  <label className="po-label">Seller PAN No</label>
                  <input className="po-input" placeholder="Enter Seller PAN No" value={newSeller.pan} onChange={e => updateNewSeller('pan', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller CIN Number</label>
                  <input className="po-input" placeholder="Enter Seller CIN Number" value={newSeller.cin} onChange={e => updateNewSeller('cin', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Bank Account Name</label>
                  <input className="po-input" placeholder="Enter Bank Account Nan" value={newSeller.bankAccountName} onChange={e => updateNewSeller('bankAccountName', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Bank Name</label>
                  <input className="po-input" placeholder="Enter Bank Name" value={newSeller.bankName} onChange={e => updateNewSeller('bankName', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">Bank A/C No.</label>
                  <input className="po-input" placeholder="Enter Bank A/C No." value={newSeller.bankAccNo} onChange={e => updateNewSeller('bankAccNo', e.target.value)} />
                </div>
                <div className="po-field">
                  <label className="po-label">IFSC Code</label>
                  <input className="po-input" placeholder="Enter IFSC Code" value={newSeller.ifsc} onChange={e => updateNewSeller('ifsc', e.target.value)} />
                </div>
              </div>

              {/* Row 4: Seller Type */}
              <div className="po-field" style={{ width: '16%', marginBottom: '20px' }}>
                <label className="po-label">Seller Type</label>
                <input className="po-input" placeholder="Enter New Type" value={newSeller.type} onChange={e => updateNewSeller('type', e.target.value)} />
              </div>

              {/* Row 5: Addresses (2 Columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="po-field">
                  <label className="po-label">Bank Address</label>
                  <textarea
                    className="po-textarea"
                    placeholder="Bank Address"
                    value={newSeller.bankAddress}
                    onChange={e => updateNewSeller('bankAddress', e.target.value)}
                  />
                </div>
                <div className="po-field">
                  <label className="po-label">Seller Address</label>
                  <textarea
                    className="po-textarea"
                    placeholder="Seller Address"
                    value={newSeller.address}
                    onChange={e => updateNewSeller('address', e.target.value)}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Row 2: L.R. No, E-Way Bill, Freight, Insurance */}
          <div className="po-grid-4-equal">
            <div className="po-field">
              <label className="po-label">L.R. No.</label>
              <input
                className="po-input"
                placeholder="Enter L.R. No."
                value={general.lrNo}
                onChange={(e) => updateGeneral('lrNo', e.target.value)}
              />
            </div>

            <div className="po-field">
              <label className="po-label">E-Way Bill No</label>
              <input
                className="po-input"
                placeholder="Enter E-Way Bill No"
                value={general.eWayBillNo}
                onChange={(e) => updateGeneral('eWayBillNo', e.target.value)}
              />
            </div>

            <div className="po-field">
              <label className="po-label">Freight (%)</label>
              <input
                className="po-input"
                type="number"
                value={general.freightPercent}
                onChange={(e) => updateGeneral('freightPercent', e.target.value)}
              />
            </div>

            <div className="po-field">
              <label className="po-label">Insurance (%)</label>
              <input
                className="po-input"
                type="number"
                value={general.insurancePercent}
                onChange={(e) => updateGeneral('insurancePercent', e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Remarks */}
          <div className="po-field" style={{ marginBottom: '20px' }}>
            <label className="po-label">Remarks</label>
            <input
              className="po-input"
              placeholder="Enter Remarks"
              value={general.remarks}
              onChange={(e) => updateGeneral('remarks', e.target.value)}
            />
          </div>

          {/* Terms & Conditions */}
          <div className="po-section">
            <label className="po-label" style={{ marginBottom: '5px', display: 'block' }}>Terms & Conditions</label>
            <textarea
              className="po-textarea"
              placeholder="Enter Terms & Conditions"
              value={general.termsAndConditions}
              onChange={(e) => updateGeneral('termsAndConditions', e.target.value)}
            />
          </div>

          {/* Product Details */}
          <div>
            {productRows.map((row, idx) => (
              <div key={row.id} className="po-product-box">
                {/* Product Header: Title and Delete Icon */}
                <div className="po-item-header">
                  <div className="po-item-title">Item {idx + 1}</div>
                  <button
                    type="button"
                    className="po-btn-icon-delete"
                    onClick={() => removeProductRow(row.id)}
                    title="Remove Item"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>

                {/* Row 1: Size, Product, HSN, Grade */}
                <div className="po-prod-row-1">
                  <div className="po-field">
                    <label className="po-label">Category <span style={{ color: 'red' }}>*</span></label>
                    <CreatableSelect
                      value={row.category}
                      options={categoryList}
                      onChange={(val) => updateProductRow(row.id, 'category', val)}
                      onAddOption={(newVal) => {
                        handleAddCategory(newVal);
                        updateProductRow(row.id, 'category', newVal);
                      }}
                      placeholder="Select Category"
                    />
                  </div>

                  <div className="po-field">
                    <label className="po-label">Product <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="po-select"
                      value={row.product}
                      onChange={(e) => updateProductRow(row.id, 'product', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {row.category && productList
                        .filter(p => p.categoryId?.categoryName === row.category)
                        .map((p) => (
                          <option key={p._id} value={p.productName}>{p.productName}</option>
                        ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="po-field">
                    <label className="po-label">HSN Code</label>
                    <input
                      className="po-input"
                      value={row.hsnCode}
                      onChange={(e) => updateProductRow(row.id, 'hsnCode', e.target.value)}
                    />
                  </div>

                  <div className="po-field">
                    <label className="po-label">Grade</label>
                    <select
                      className="po-select"
                      value={row.grade}
                      onChange={(e) => updateProductRow(row.id, 'grade', e.target.value)}
                    >
                      <option value="">Select Grade</option>
                      {gradeList.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-form for New Product if 'Other' selected */}
                {row.showNewProduct && (
                  <div className="po-new-product-section">
                    <div className="po-new-product-title">New Product Details</div>
                    <div className="po-new-product-grid">
                      <div className="po-field"><label className="po-label">Product Name</label><input className="po-input" placeholder="Enter Product Name" value={row.newProduct.name} onChange={e => updateNewProductField(row.id, 'name', e.target.value)} /></div>
                      <div className="po-field"><label className="po-label">Product HSN Code</label><input className="po-input" placeholder="Enter HSN" value={row.newProduct.hsn} onChange={e => updateNewProductField(row.id, 'hsn', e.target.value)} /></div>
                      <div className="po-field"><label className="po-label">Product Model Number</label><input className="po-input" placeholder="Enter Model Number" value={row.newProduct.modelNumber} onChange={e => updateNewProductField(row.id, 'modelNumber', e.target.value)} /></div>
                      <div className="po-field"><label className="po-label">Product Finish Glaze</label><input className="po-input" placeholder="Enter Finish Glaze" value={row.newProduct.finishGlaze} onChange={e => updateNewProductField(row.id, 'finishGlaze', e.target.value)} /></div>
                      <div className="po-field"><label className="po-label">Product Sale Price</label><input className="po-input" placeholder="Enter Sale Price" value={row.newProduct.salePrice} onChange={e => updateNewProductField(row.id, 'salePrice', e.target.value)} /></div>
                    </div>
                  </div>
                )}

                {/* Row 2: Unit, Color, Quantity, Rate, Total */}
                <div className="po-prod-row-2">
                  <div className="po-field">
                    <label className="po-label">Unit</label>
                    <input
                      className="po-input"
                      value={row.unit}
                      onChange={(e) => updateProductRow(row.id, 'unit', e.target.value)}
                    />
                  </div>

                  <div className="po-field">
                    <label className="po-label">Color</label>
                    <CreatableSelect
                      value={row.color}
                      options={colorList}
                      onChange={(val) => updateProductRow(row.id, 'color', val)}
                      onAddOption={(newVal) => {
                        handleAddColor(newVal);
                        updateProductRow(row.id, 'color', newVal);
                      }}
                      placeholder="Select Color"
                    />
                  </div>

                  <div className="po-field">
                    <label className="po-label">Quantity</label>
                    <input
                      type="number"
                      className="po-input"
                      value={row.quantity}
                      onChange={(e) => updateProductRow(row.id, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="po-field">
                    <label className="po-label">Rate <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="number"
                      className="po-input"
                      value={row.rate}
                      onChange={(e) => updateProductRow(row.id, 'rate', e.target.value)}
                    />
                  </div>

                  <div className="po-field">
                    <label className="po-label">Total</label>
                    <input
                      className="po-input"
                      value={row.total}
                      readOnly
                      style={{ backgroundColor: '#f9fafb' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="po-actions">
            <button type="button" className="po-btn-add" onClick={addProductRow}>
              ADD MORE
            </button>
            <div>
              <button type="button" className="po-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="po-btn-submit">
                {isEdit ? 'Update Purchase Order' : 'Create Purchase Order'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );

  if (isPage) return formContent;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {formContent}
    </div>
  );
}

export default AddPurchaseOrderForm;

import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import '../styles/AddNormalInvoiceForm.css';
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

function AddNormalInvoiceForm({ isOpen, onClose, editingRow, isPage }) {
  const isEdit = !!editingRow;
  const user = JSON.parse(sessionStorage.getItem('user'));

  // General Form State
  const [formData, setFormData] = useState({
    customer: '',
    saleType: '',
    invoiceName: '',
    invoiceNo: '',
    invoiceDate: '',
    transporter: '',
    lrNo: '',
    vehicleNo: '',
    containerNo: '',
    sealNo: '',
    insurance: '0',
    extraChargesName: 'Extra Charges',
    extraChargesAmount: '0',
    partyDeliveryAddress: '',
    paymentTerms: '100% PAYMENT AGAINST SCAN COPY OF DOCUMENTS. ',
    termsConditions: ''
  });

  const [showDeliveryAddress, setShowDeliveryAddress] = useState(false);

  // Items State
  const [items, setItems] = useState([]);

  // Master Lists State
  const [customers, setCustomers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [colorList, setColorList] = useState([]);
  const [saleTypes, setSaleTypes] = useState([]);
  const [invoiceNames, setInvoiceNames] = useState([]);
  const [products, setProducts] = useState([]);
  const [gradeList, setGradeList] = useState([]);
  const [ownCompany, setOwnCompany] = useState(null);
  const [allCountries, setAllCountries] = useState([]);
  const [countryList, setCountryList] = useState([]);
  const [customerStateList, setCustomerStateList] = useState([]);
  const [allCustomerStates, setAllCustomerStates] = useState([]);
  const [customerCityList, setCustomerCityList] = useState([]);
  const [transporterStateList, setTransporterStateList] = useState([]);
  const [allTransporterStates, setAllTransporterStates] = useState([]);
  const [transporterCityList, setTransporterCityList] = useState([]);
  const [customerTypeList, setCustomerTypeList] = useState([]);


  // Initialize Data
  useEffect(() => {
    fetchMasterData();
    if (isEdit && editingRow) {
      setFormData({
        customer: editingRow.customerName || '',
        saleType: editingRow.saleTypeName || '',
        invoiceName: editingRow.invoiceTypeName || '',
        invoiceNo: editingRow.invoiceNo || '',
        invoiceDate: editingRow.invoiceDate || '',
        transporter: editingRow.transporterName || '',
        lrNo: editingRow.lrNo || '',
        vehicleNo: editingRow.vehicleNo || '',
        containerNo: editingRow.containerNo || '',
        sealNo: editingRow.sealNo || '',
        insurance: editingRow.insurance || '0',
        extraChargesName: editingRow.extraChargesName || 'Extra Charges',
        extraChargesAmount: editingRow.extrChargesAmount || '0',
        partyDeliveryAddress: editingRow.customerDeliveryAddress || '',
        paymentTerms: editingRow.paymentTerms || '',
        termsConditions: editingRow.termsCondition || ''
      });
      setShowDeliveryAddress(!!editingRow.customerDeliveryAddress);

      if (editingRow.items && editingRow.items.length) {
        setItems(editingRow.items.map(it => ({
          ...it,
          id: it._id || Date.now(),
          newProduct: it.newProduct || {}
        })));
      }
    } else {
      setFormData({
        customer: '',
        invoiceNo: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        transporter: '',
        lrNo: '',
        vehicleNo: '',
        containerNo: '',
        sealNo: '',
        insurance: '0',
        extraChargesName: 'Extra Charges',
        extraChargesAmount: '0',
        partyDeliveryAddress: '',
        paymentTerms: '100% PAYMENT AGAINST SCAN COPY OF DOCUMENTS. ',
        termsConditions: `1. Goods Once Supplied will not be taken back or exchanged.
2. We are not responsible for any shortage or damage in transist.
3. Interest at the rate of 18% shall be charged on all amounts unpaid within 15 days from the supply date.
4. Rs. 250 will be charged, when cheque would bounce.
5. Subject to MORBI Jurisdiction. E. & O.E`
      });
      setItems([{
        id: Date.now(),
        category: '',
        product: '',
        hsnCode: '',
        grade: 'PREMIUM',
        modelNumber: '',
        color: 'WHITE',
        sizeName: '',
        unit: 'PCS',
        quantity: '1',
        rate: '',
        total: '',
        newProduct: {}
      }]);
    }
  }, [isEdit, editingRow]);

  // Sync customer ID after customers list is loaded during edit
  useEffect(() => {
    if (isEdit && editingRow && customers.length && !formData.customer.match(/^[0-9a-fA-F]{24}$/)) {
      // If customer is currently a name string or numeric ID, find its MongoDB _id
      const found = customers.find(c =>
        c._id === editingRow.customer ||
        c.customerId === editingRow.customerId ||
        c.customerName === editingRow.customerName
      );
      if (found) {
        setFormData(prev => ({ ...prev, customer: found._id }));
      }
    }
  }, [isEdit, editingRow, customers, formData.customer]);

  const fetchMasterData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all master data in parallel
      const [custRes, transRes, catRes, colRes, saleRes, invNameRes, prodRes, compRes, gradRes, countryRes, custTypeRes] = await Promise.all([
        fetch(`${API_BASE_URL}/customer`, { headers }),
        fetch(`${API_BASE_URL}/transporter`, { headers }),
        fetch(`${API_BASE_URL}/category`, { headers }),
        fetch(`${API_BASE_URL}/color`, { headers }),
        fetch(`${API_BASE_URL}/sale-type`, { headers }),
        fetch(`${API_BASE_URL}/invoice-name`, { headers }),
        fetch(`${API_BASE_URL}/product`, { headers }),
        user?.companyId ? fetch(`${API_BASE_URL}/company/${user.companyId}`, { headers }) : Promise.resolve({ ok: false }),
        fetch(`${API_BASE_URL}/grade`, { headers }),
        fetch(`${API_BASE_URL}/country`, { headers }),
        fetch(`${API_BASE_URL}/customer-type`, { headers })
      ]);

      if (custRes.ok) setCustomers(await custRes.json());
      if (transRes.ok) setTransporters(await transRes.json());
      if (catRes.ok) setCategoryList((await catRes.json()).map(c => c.categoryName).filter(Boolean));
      if (colRes.ok) setColorList((await colRes.json()).map(c => c.colorName).filter(Boolean));
      if (saleRes.ok) setSaleTypes(await saleRes.json());
      if (invNameRes.ok) setInvoiceNames(await invNameRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (gradRes.ok) setGradeList((await gradRes.json()).map(g => g.gradeName).filter(Boolean));
      if (compRes.ok) setOwnCompany(await compRes.json());
      if (countryRes.ok) {
        const countries = await countryRes.json();
        setAllCountries(countries);
        setCountryList(countries.map(c => c.countryName).filter(Boolean));
      }
      if (custTypeRes.ok) setCustomerTypeList(await custTypeRes.json());

    } catch (error) {
      console.error("Error fetching master data:", error);
      toast.error("Failed to load some form data");
    }
  };

  const handleAddCategory = async (newCat) => {
    if (!newCat) return;
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categoryName: newCat })
      });

      if (response.ok) {
        setCategoryList(prev => [...prev, newCat]);
        toast.success(`Category "${newCat}" Added Successfully!`);
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

  const [newCustomer, setNewCustomer] = useState({
    gst: '', tradeName: '', name: '', refName: '', mobile: '',
    email: '', country: '', state: '', city: '', pincode: '', stateCode: '',
    pan: '', type: '', address: ''
  });
  const [newTransporter, setNewTransporter] = useState({
    gst: '', tradeName: '', name: '', refName: '', mobile: '',
    email: '', country: '', state: '', city: '', pincode: '', stateCode: '',
    pan: '', type: '', address: ''
  });

  useEffect(() => {
    const fetchStates = async (countryName, setStates, setAllStates) => {
      const country = allCountries.find(c => c.countryName === countryName);
      if (country) {
        const token = sessionStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE_URL}/state?countryId=${country.countryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const states = await res.json();
            if (setAllStates) setAllStates(states);
            setStates(states.map(s => s.stateName));
          }
        } catch (error) {
          console.error("Error fetching states:", error);
        }
      } else {
        setStates([]);
      }
    };
    fetchStates(newCustomer.country, setCustomerStateList, setAllCustomerStates);
  }, [newCustomer.country, allCountries]);

  useEffect(() => {
    const fetchStates = async (countryName, setStates, setAllStates) => {
      const country = allCountries.find(c => c.countryName === countryName);
      if (country) {
        const token = sessionStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE_URL}/state?countryId=${country.countryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const states = await res.json();
            if (setAllStates) setAllStates(states);
            setStates(states.map(s => s.stateName));
          }
        } catch (error) {
          console.error("Error fetching states:", error);
        }
      } else {
        setStates([]);
      }
    };
    fetchStates(newTransporter.country, setTransporterStateList, setAllTransporterStates);
  }, [newTransporter.country, allCountries]);

  useEffect(() => {
    const fetchCities = async (stateName, allStates, setCities) => {
      const state = allStates.find(s => s.stateName === stateName);
      if (state) {
        const token = sessionStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE_URL}/city?stateId=${state.stateId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const cities = await res.json();
            setCities(cities.map(c => c.cityName));
          }
        } catch (error) {
          console.error("Error fetching cities:", error);
        }
      } else {
        setCities([]);
      }
    };
    fetchCities(newCustomer.state, allCustomerStates, setCustomerCityList);
  }, [newCustomer.state, allCustomerStates]);

  useEffect(() => {
    const fetchCities = async (stateName, allStates, setCities) => {
      const state = allStates.find(s => s.stateName === stateName);
      if (state) {
        const token = sessionStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE_URL}/city?stateId=${state.stateId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const cities = await res.json();
            setCities(cities.map(c => c.cityName));
          }
        } catch (error) {
          console.error("Error fetching cities:", error);
        }
      } else {
        setCities([]);
      }
    };
    fetchCities(newTransporter.state, allTransporterStates, setTransporterCityList);
  }, [newTransporter.state, allTransporterStates]);

  const updateNewCustomer = (field, value) => {
    setNewCustomer(prev => ({ ...prev, [field]: value }));
  };
  const updateNewTransporter = (field, value) => {
    setNewTransporter(prev => ({ ...prev, [field]: value }));
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
        const newCountry = data.country || { countryName: cName, countryId: Date.now() }; // Fallback if backend response structure differs
        setAllCountries(prev => [...prev, newCountry]);
        setCountryList(prev => [...prev, newCountry.countryName]);
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

  const handleAddState = async (newStateName, countryName, setStates, setAllStates) => {
    if (!newStateName) return;
    const country = allCountries.find(c => c.countryName === countryName);
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
        const newState = data.state || { stateName: newStateName, stateId: Date.now() };
        if (setAllStates) setAllStates(prev => [...prev, newState]);
        setStates(prev => [...prev, newState.stateName]);
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

  const handleAddCity = async (newCityName, stateName, allStates, setCities) => {
    if (!newCityName) return;
    const state = allStates.find(s => s.stateName === stateName);
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
        const newCity = data.city || { cityName: newCityName, cityId: Date.now() };
        setCities(prev => [...prev, newCity.cityName]);
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

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    setItems(prevItems => {
      const newItems = [...prevItems];
      const item = { ...newItems[index], [name]: value };

      // Reset product if category changes
      if (name === 'category') {
        item.product = '';
        item.hsnCode = '';
        item.rate = '';
        item.total = '';
      }

      // Auto-calculate total
      if (name === 'quantity' || name === 'rate') {
        const qty = parseFloat(name === 'quantity' ? value : item.quantity) || 0;
        const rate = parseFloat(name === 'rate' ? value : item.rate) || 0;
        item.total = (qty * rate).toFixed(2);
      }

      newItems[index] = item;
      return newItems;
    });
  };

  const updateItemNewProduct = (index, field, value) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index].newProduct = {
        ...newItems[index].newProduct || {},
        [field]: value
      };
      return newItems;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      category: '',
      product: '',
      hsnCode: '',
      grade: 'PREMIUM',
      modelNumber: '',
      color: 'WHITE',
      sizeName: '',
      unit: 'PCS',
      quantity: '1',
      rate: '',
      total: '',
      newProduct: {}
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.warn("At least one product item is required.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const user = JSON.parse(sessionStorage.getItem('user'));

      // Mandatory Field Validation
      if (!formData.customer) {
        toast.error("Customer is mandatory");
        return;
      }
      if (!formData.invoiceNo) {
        toast.error("Invoice No is mandatory");
        return;
      }
      if (!formData.transporter) {
        toast.error("Transporter is mandatory");
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.category) {
          toast.error(`Category is mandatory for Item ${i + 1}`);
          return;
        }
        if (!item.product) {
          toast.error(`Product is mandatory for Item ${i + 1}`);
          return;
        }
        if (!item.hsnCode) {
          toast.error(`HSN Code is mandatory for Item ${i + 1}`);
          return;
        }
        if (!item.rate) {
          toast.error(`Rate is mandatory for Item ${i + 1}`);
          return;
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // Find details for selected entities
      let selectedCustomer = customers.find(c => c._id === formData.customer);
      let customerName = selectedCustomer ? selectedCustomer.customerName : formData.customer;

      // Handle 'Other' Customer
      if (formData.customer === 'Other') {
        if (!newCustomer.name) {
          toast.error("Customer name is mandatory for new customer");
          return;
        }
        try {
          const custPayload = {
            customerName: newCustomer.name,
            customerTradeName: newCustomer.tradeName,
            customerMobileNumber: newCustomer.mobile,
            customerEmail: newCustomer.email,
            customerGst: newCustomer.gst,
            customerPanNo: newCustomer.pan,
            customerCountry: newCustomer.country,
            customerState: newCustomer.state,
            customerCity: newCustomer.city,
            customerPinCode: newCustomer.pincode,
            customerAddress: newCustomer.address,
            customerState: newCustomer.state,
            customerReferenceName: newCustomer.refName,
            customerStateCode: newCustomer.stateCode,
            customerTypeId: newCustomer.type
          };

          const custRes = await fetch(`${API_BASE_URL}/customer`, {
            method: 'POST',
            headers,
            body: JSON.stringify(custPayload)
          });

          if (custRes.ok) {
            const custData = await custRes.json();
            selectedCustomer = custData.customer;
            customerName = selectedCustomer.customerName;
            toast.success("New customer added successfully");
          } else {
            const custErr = await custRes.json();
            toast.error("Failed to add new customer: " + (custErr.message || "Unknown error"));
            return;
          }
        } catch (error) {
          console.error("Customer Creation Error:", error);
          toast.error("Server error while adding customer");
          return;
        }
      }

      let selectedTransporter = transporters.find(t => t.transporterName === formData.transporter);
      let transporterName = formData.transporter;

      // Handle 'Other' Transporter
      if (formData.transporter === 'Other') {
        if (!newTransporter.name) {
          toast.error("Transporter name is mandatory for new transporter");
          return;
        }
        try {
          const transPayload = {
            transporterName: newTransporter.name,
            transporterTradeName: newTransporter.tradeName,
            transporterMobileNumber: newTransporter.mobile,
            transporterEmail: newTransporter.email,
            transporterGst: newTransporter.gst,
            transporterPanNo: newTransporter.pan,
            transporterCountry: newTransporter.country,
            transporterState: newTransporter.state,
            transporterCity: newTransporter.city,
            transporterPinCode: newTransporter.pincode,
            transporterAddress: newTransporter.address,
            transporterReferenceName: newTransporter.refName,
            transporterStateCode: newTransporter.stateCode
          };

          const transRes = await fetch(`${API_BASE_URL}/transporter`, {
            method: 'POST',
            headers,
            body: JSON.stringify(transPayload)
          });

          if (transRes.ok) {
            const transData = await transRes.json();
            selectedTransporter = transData.transporter;
            transporterName = selectedTransporter.transporterName;
            toast.success("New transporter added successfully");
          } else {
            const transErr = await transRes.json();
            toast.error("Failed to add new transporter: " + (transErr.message || "Unknown error"));
            return;
          }
        } catch (error) {
          console.error("Transporter Creation Error:", error);
          toast.error("Server error while adding transporter");
          return;
        }
      }

      const selectedSaleType = saleTypes.find(s => s.saleTypeName === formData.saleType);
      const selectedInvoiceName = invoiceNames.find(i => i.invoiceShortName === formData.invoiceName);

      // Calculate total amount (Subtotal + Charges)
      const totalAmount = items.reduce((sum, it) => sum + (parseFloat(it.total) || 0), 0) + (parseFloat(formData.extraChargesAmount) || 0);

      const payload = {
        // Company
        invoiceCompanyId: ownCompany?.companyId,
        invoiceCompanyName: ownCompany?.companyName,
        invoiceCompanyMobileNumber: ownCompany?.companyMobileNumber,
        invoiceCompanyEmail: ownCompany?.companyEmail,
        invoiceCompanyGstNumber: ownCompany?.companyGstNumber,
        invoiceCompanyPanNumber: ownCompany?.companyPanNumber,
        invoiceCompanyAddress: ownCompany?.companyAddress,
        invoiceCompanyCountry: ownCompany?.companyCountry,
        invoiceCompanyState: ownCompany?.companyState,
        invoiceCompanyCity: ownCompany?.companyCity,
        invoiceCompanyPinCode: ownCompany?.companyPinCode,
        invoiceCompanyStateCode: ownCompany?.companyStateCode,
        invoiceCompanyBankName: ownCompany?.companyBankName,
        invoiceCompanyBankAccountName: ownCompany?.companyBankAccountName,
        invoiceCompanyBankAccountNumber: ownCompany?.companyBankAccountNumber,
        invoiceCompanyBankIfscCode: ownCompany?.companyBankIfscCode,
        invoiceCompanyBankAddress: ownCompany?.companyBankAddress,

        // Customer
        customerId: selectedCustomer?.customerId,
        customerName: customerName,
        customerTradeName: selectedCustomer?.customerTradeName,
        customerPinCode: selectedCustomer?.customerPinCode,
        customerAddress: selectedCustomer?.customerAddress,
        customerDeliveryAddress: formData.partyDeliveryAddress,
        customerGst: selectedCustomer?.customerGst,
        customerPanNo: selectedCustomer?.customerPanNo,
        customerPlaceOfSupply: selectedCustomer?.customerState || selectedCustomer?.customerPlaceOfSupply || editingRow?.customerPlaceOfSupply || editingRow?.customerState,
        customerState: selectedCustomer?.customerState || newCustomer.state || editingRow?.customerState,
        customerStateCode: selectedCustomer?.customerStateCode || editingRow?.customerStateCode,

        // Transporter
        transporterId: selectedTransporter?.transporterId,
        transporterName: transporterName,
        transporterTradeName: selectedTransporter?.transporterTradeName,
        transporterMobileNumber: selectedTransporter?.transporterMobileNumber,
        transporterEmail: selectedTransporter?.transporterEmail,
        transporterGstNumber: selectedTransporter?.transporterGstNumber,

        // Sale Type & Invoice Name
        saleTypeId: selectedSaleType?.saleTypeId,
        saleTypeName: formData.saleType,
        saleTypeTax1: selectedSaleType?.saleTypeTax1,
        saleTypeTax2: selectedSaleType?.saleTypeTax2,

        invoiceTypeId: selectedInvoiceName?.invoiceNameId,
        invoiceTypeName: formData.invoiceName,

        // Invoice Details
        invoiceNo: formData.invoiceNo,
        invoiceDate: formData.invoiceDate,
        vehicleNo: formData.vehicleNo,
        lrNo: formData.lrNo,
        containerNo: formData.containerNo,
        sealNo: formData.sealNo,

        // Charges & Terms
        insurance: formData.insurance,
        extraChargesName: formData.extraChargesName,
        extrChargesAmount: formData.extraChargesAmount,
        paymentTerms: formData.paymentTerms,
        termsCondition: formData.termsConditions,

        // Products
        items: items.map(it => ({
          category: it.category,
          product: it.product === 'Other' ? (it.newProduct?.name || 'Other') : it.product,
          hsnCode: it.product === 'Other' ? (it.newProduct?.hsn || it.hsnCode) : it.hsnCode,
          grade: it.grade,
          modelNumber: it.product === 'Other' ? (it.newProduct?.modelNumber || it.modelNumber) : it.modelNumber,
          color: it.color,
          sizeName: it.sizeName,
          sizeId: it.sizeId,
          unit: it.unit,
          quantity: parseFloat(it.quantity) || 0,
          rate: parseFloat(it.rate) || 0,
          total: parseFloat(it.total) || 0
        })),
        totalAmount: totalAmount,
        companyId: user.companyId
      };

      const url = isEdit ? `${API_BASE_URL}/sales-invoice/${editingRow?._id || editingRow?.id}` : `${API_BASE_URL}/sales-invoice`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(isEdit ? "Invoice Updated Successfully!" : "Invoice Created Successfully!");
        if (onClose) onClose();
      } else {
        const err = await response.json();
        toast.error(err.message || "Failed to save invoice");
      }

    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Server error while saving");
    }
  };

  if (!isOpen && !isPage) return null;

  const formContent = (
    <div className={isPage ? "page-card" : "modal"} onClick={(e) => !isPage && e.stopPropagation()} style={isPage ? { maxWidth: '100%', margin: '0' } : {}}>
      {!isPage && (
        <div className="invoice-header">
          <h2 className="invoice-title">{isEdit ? 'Update Invoice' : 'Add Invoice'}</h2>
          <button className="invoice-close" onClick={onClose}>✕</button>
        </div>
      )}
      {isPage && <div className="page-card__title">{isEdit ? 'Update Invoice' : 'Add Invoice'}</div>}

      <div className={isPage ? "page-card__body" : ""}>
        <form onSubmit={handleSubmit} className="po-form" style={isPage ? { padding: '0' } : {}}>

          {/* TOP SECTION: Row 1 - Customer, Invoice No, Date */}
          <div className="invoice-grid-3">
            <div className="invoice-field">
              <label className="invoice-label">Customer <span style={{ color: 'red' }}>*</span></label>
              <select
                className="invoice-select"
                name="customer"
                value={formData.customer}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange(e);
                  const selected = customers.find(c => c._id === val);
                  if (selected) {
                    setFormData(prev => ({
                      ...prev,
                      partyDeliveryAddress: selected.customerAddress || ''
                    }));
                  }
                }}
              >
                <option value="">Select Customer</option>
                {customers
                  .sort((a, b) => (a.customerTradeName || a.customerName || '').localeCompare(b.customerTradeName || b.customerName || ''))
                  .map(c => (
                    <option key={c._id} value={c._id}>
                      {c.customerTradeName || c.customerName}{c.customerTradeName && c.customerName ? ` (${c.customerName})` : ''}
                    </option>
                  ))}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Invoice No. <span style={{ color: 'red' }}>*</span></label>
              <input className="invoice-input" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} />
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Invoice Date</label>
              <AirDatePicker
                className="invoice-input"
                value={formData.invoiceDate}
                onChange={(val) => handleChange({ target: { name: 'invoiceDate', value: val } })}
                placeholder="Select Date"
              />
            </div>
          </div>

          {/* Add Customer Section (After Row 1) */}
          {formData.customer === 'Other' && (
            <div className="add-customer-section">
              <div className="add-customer-title">Add Customer</div>

              {/* Row 1: GST, Trade, Name, Ref, Mobile */}
              <div className="add-customer-grid-row-5">
                <div className="invoice-field">
                  <label className="invoice-label">Customer GST</label>
                  <div className="add-customer-input-group">
                    <input
                      className="invoice-input"
                      placeholder="ENTER CUSTOMER GST"
                      value={newCustomer.gst}
                      onChange={e => updateNewCustomer('gst', e.target.value)}
                    />
                    <button type="button" className="btn-verify">Verify GST</button>
                  </div>
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Trade Name</label>
                  <input className="invoice-input" placeholder="Enter Customer Trade Name" value={newCustomer.tradeName} onChange={e => updateNewCustomer('tradeName', e.target.value)} />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Name</label>
                  <input className="invoice-input" placeholder="Enter Customer Name" value={newCustomer.name} onChange={e => updateNewCustomer('name', e.target.value)} />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Reference Name</label>
                  <input className="invoice-input" placeholder="Enter Reference Name" value={newCustomer.refName} onChange={e => updateNewCustomer('refName', e.target.value)} />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Mobile Number</label>
                  <input className="invoice-input" placeholder="Enter Mobile Number" value={newCustomer.mobile} onChange={e => updateNewCustomer('mobile', e.target.value)} />
                </div>
              </div>

              {/* Row 2: Email, Country, State, City, Pin, State Code */}
              <div className="add-customer-grid-row-6">
                <div className="invoice-field">
                  <label className="invoice-label">Customer Email</label>
                  <input className="invoice-input" placeholder="Enter Email" value={newCustomer.email} onChange={e => updateNewCustomer('email', e.target.value)} />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Country</label>
                  <CreatableSelect
                    value={newCustomer.country}
                    options={countryList}
                    onChange={(val) => updateNewCustomer('country', val)}
                    onAddOption={(newVal) => {
                      handleAddCountry(newVal);
                      updateNewCustomer('country', newVal);
                    }}
                    placeholder="Select or Type Country"
                  />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer State</label>
                  <CreatableSelect
                    value={newCustomer.state}
                    options={customerStateList}
                    onChange={(val) => updateNewCustomer('state', val)}
                    onAddOption={(newVal) => {
                      handleAddState(newVal, newCustomer.country, setCustomerStateList, setAllCustomerStates);
                      updateNewCustomer('state', newVal);
                    }}
                    placeholder="Select or Type State"
                  />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer City</label>
                  <CreatableSelect
                    value={newCustomer.city}
                    options={customerCityList}
                    onChange={(val) => updateNewCustomer('city', val)}
                    onAddOption={(newVal) => {
                      handleAddCity(newVal, newCustomer.state, allCustomerStates, setCustomerCityList);
                      updateNewCustomer('city', newVal);
                    }}
                    placeholder="Select or Type City"
                  />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Pin Code</label>
                  <input className="invoice-input" placeholder="Enter Customer Pin Code" value={newCustomer.pincode} onChange={e => updateNewCustomer('pincode', e.target.value)} />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer State Code</label>
                  <input className="invoice-input" placeholder="Enter Customer State Code" value={newCustomer.stateCode} onChange={e => updateNewCustomer('stateCode', e.target.value)} />
                </div>
              </div>

              {/* Row 3: PAN, Type (Using grid-6 but only filling first 2) */}
              <div className="add-customer-grid-row-6">
                <div className="invoice-field">
                  <label className="invoice-label">Customer PAN No</label>
                  <input className="invoice-input" placeholder="Enter Customer PAN No" value={newCustomer.pan} onChange={e => updateNewCustomer('pan', e.target.value)} />
                </div>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Type</label>
                  <select className="invoice-select" value={newCustomer.type} onChange={e => updateNewCustomer('type', e.target.value)}>
                    <option value="">Select Customer Type</option>
                    {customerTypeList.map((type) => (
                      <option key={type._id} value={type._id}>{type.customerTypeName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Address */}
              <div className="invoice-field">
                <label className="invoice-label">Customer Address</label>
                <textarea
                  className="customer-textarea"
                  placeholder="Enter Customer Address"
                  value={newCustomer.address}
                  onChange={e => updateNewCustomer('address', e.target.value)}
                />
              </div>

            </div>
          )
          }

          {/* TOP SECTION: Row 2 - Transporter, Sale Type, Invoice Name */}
          <div className="invoice-grid-3">
            <div className="invoice-field">
              <label className="invoice-label">Transporter <span style={{ color: 'red' }}>*</span></label>
              <select className="invoice-select" name="transporter" value={formData.transporter} onChange={handleChange}>
                <option value="">Select Transporter</option>
                {transporters.map(t => (
                  <option key={t._id} value={t.transporterName}>{t.transporterName}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Sale Type</label>
              <select className="invoice-select" name="saleType" value={formData.saleType} onChange={handleChange}>
                <option value="">Select Sale Type</option>
                {saleTypes.map(s => (
                  <option key={s._id} value={s.saleTypeName}>{s.saleTypeName}</option>
                ))}
              </select>
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Invoice Name</label>
              <select className="invoice-select" name="invoiceName" value={formData.invoiceName} onChange={handleChange}>
                <option value="">Select Invoice Name</option>
                {invoiceNames.map(i => (
                  <option key={i._id} value={i.invoiceShortName}>{i.invoiceShortName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Transporter Section (After Row 2) */}
          {
            formData.transporter === 'Other' && (
              <div className="add-customer-section">
                <div className="add-customer-title">Add Transporter</div>

                {/* Row 1: GST, Trade, Name, Ref, Mobile */}
                <div className="add-customer-grid-row-5">
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter GST</label>
                    <div className="add-customer-input-group">
                      <input
                        className="invoice-input"
                        placeholder="ENTER TRANSPORTER GST"
                        value={newTransporter.gst}
                        onChange={e => updateNewTransporter('gst', e.target.value)}
                      />
                      <button type="button" className="btn-verify">Verify GST</button>
                    </div>
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Trade Name</label>
                    <input className="invoice-input" placeholder="Enter Transporter Trade" value={newTransporter.tradeName} onChange={e => updateNewTransporter('tradeName', e.target.value)} />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Name</label>
                    <input className="invoice-input" placeholder="Enter Transporter Name" value={newTransporter.name} onChange={e => updateNewTransporter('name', e.target.value)} />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Reference Name</label>
                    <input className="invoice-input" placeholder="Enter Reference Name" value={newTransporter.refName} onChange={e => updateNewTransporter('refName', e.target.value)} />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Mobile Number</label>
                    <input className="invoice-input" placeholder="Enter Mobile Number" value={newTransporter.mobile} onChange={e => updateNewTransporter('mobile', e.target.value)} />
                  </div>
                </div>

                {/* Row 2: Email, Country, State, City, Pin, State Code */}
                <div className="add-customer-grid-row-6">
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Email</label>
                    <input className="invoice-input" placeholder="Enter Email" value={newTransporter.email} onChange={e => updateNewTransporter('email', e.target.value)} />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Country</label>
                    <CreatableSelect
                      value={newTransporter.country}
                      options={countryList}
                      onChange={(val) => updateNewTransporter('country', val)}
                      onAddOption={(newVal) => {
                        handleAddCountry(newVal);
                        updateNewTransporter('country', newVal);
                      }}
                      placeholder="Select or Type Country"
                    />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter State</label>
                    <CreatableSelect
                      value={newTransporter.state}
                      options={transporterStateList}
                      onChange={(val) => updateNewTransporter('state', val)}
                      onAddOption={(newVal) => {
                        handleAddState(newVal, newTransporter.country, setTransporterStateList, setAllTransporterStates);
                        updateNewTransporter('state', newVal);
                      }}
                      placeholder="Select or Type State"
                    />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter City</label>
                    <CreatableSelect
                      value={newTransporter.city}
                      options={transporterCityList}
                      onChange={(val) => updateNewTransporter('city', val)}
                      onAddOption={(newVal) => {
                        handleAddCity(newVal, newTransporter.state, allTransporterStates, setTransporterCityList);
                        updateNewTransporter('city', newVal);
                      }}
                      placeholder="Select or Type City"
                    />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Pin Code</label>
                    <input className="invoice-input" placeholder="Enter Transporter Pin Code" value={newTransporter.pincode} onChange={e => updateNewTransporter('pincode', e.target.value)} />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter State Code</label>
                    <input className="invoice-input" placeholder="Enter Transporter State" value={newTransporter.stateCode} onChange={e => updateNewTransporter('stateCode', e.target.value)} />
                  </div>
                </div>

                {/* Row 3: PAN, Type */}
                <div className="add-customer-grid-row-6">
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter PAN No</label>
                    <input className="invoice-input" placeholder="Enter Transporter PAN No" value={newTransporter.pan} onChange={e => updateNewTransporter('pan', e.target.value)} />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Transporter Type</label>
                    <input className="invoice-input" placeholder="Enter Transporter Type" value={newTransporter.type} onChange={e => updateNewTransporter('type', e.target.value)} />
                  </div>
                </div>

                {/* Row 4: Address */}
                <div className="invoice-field">
                  <label className="invoice-label">Transporter Address</label>
                  <textarea
                    className="customer-textarea"
                    placeholder="Enter Transporter Address"
                    value={newTransporter.address}
                    onChange={e => updateNewTransporter('address', e.target.value)}
                  />
                </div>

              </div>
            )
          }

          {/* Row 2: L.R No, Vehicle No, Container No, Seal No */}
          <div className="invoice-grid-4">
            <div className="invoice-field">
              <label className="invoice-label">L/R. No.</label>
              <input className="invoice-input" placeholder="Enter L/R. No." name="lrNo" value={formData.lrNo} onChange={handleChange} />
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Vehicle No</label>
              <input className="invoice-input" placeholder="Enter Vehicle No" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} />
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Container No</label>
              <input className="invoice-input" placeholder="Enter Container No" name="containerNo" value={formData.containerNo} onChange={handleChange} />
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Seal No</label>
              <input className="invoice-input" placeholder="Enter Seal No" name="sealNo" value={formData.sealNo} onChange={handleChange} />
            </div>
          </div>

          {/* Row 3: Insurance, Extra Charges Name, Extra Charges Amount */}
          <div className="invoice-grid-3">
            <div className="invoice-field">
              <label className="invoice-label">Insurance (%)</label>
              <input className="invoice-input" name="insurance" value={formData.insurance} onChange={handleChange} />
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Extra Charges Name</label>
              <input className="invoice-input" name="extraChargesName" value={formData.extraChargesName} onChange={handleChange} />
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Extra Charges Amount</label>
              <input className="invoice-input" name="extraChargesAmount" value={formData.extraChargesAmount} onChange={handleChange} />
            </div>
          </div>

          {/* Row 4: Payment Terms, Change Delivery Address */}
          <div className="invoice-row-mixed-terms">
            <div className="invoice-field">
              <label className="invoice-label">Payment Terms</label>
              <input className="invoice-input" name="paymentTerms" value={formData.paymentTerms} onChange={handleChange} />
            </div>
            <div className="invoice-field">
              <label className="invoice-label">Change Delivery Address</label>
              <div style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                <input
                  type="checkbox"
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  checked={showDeliveryAddress}
                  onChange={(e) => setShowDeliveryAddress(e.target.checked)}
                />
              </div>
            </div>
          </div>

          {/* Conditional Party Delivery Address */}
          {
            showDeliveryAddress && (
              <div className="invoice-grid-1" style={{ marginBottom: '20px' }}>
                <div className="invoice-field">
                  <label className="invoice-label">Customer Delivery Address</label>
                  <input
                    className="invoice-input"
                    name="partyDeliveryAddress"
                    placeholder="Enter Customer Delivery Address"
                    value={formData.partyDeliveryAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )
          }

          {/* Row 5: TERMS AND CONDITIONS */}
          <div className="invoice-field" style={{ marginBottom: '20px' }}>
            <label className="invoice-label">Terms & Conditions</label>
            <textarea
              className="invoice-textarea"
              rows="5"
              name="termsConditions"
              value={formData.termsConditions}
              onChange={handleChange}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '20px 0' }} />

          {/* ITEM LIST */}
          <div>
            {items.map((item, index) => (
              <div key={item.id} className="invoice-items-container">
                {/* Product Header: Title and Delete Icon */}
                <div className="invoice-item-header">
                  <div className="invoice-item-title">Item {index + 1}</div>
                  <button
                    type="button"
                    className="invoice-btn-icon-delete"
                    onClick={() => removeItem(index)}
                    title="Remove Item"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>

                {/* ITEM SECTION ROW 1: Category, Product, HSN, Grade */}
                <div className="invoice-item-grid-1">
                  <div className="invoice-field">
                    <label className="invoice-label">Category <span style={{ color: 'red' }}>*</span></label>
                    <CreatableSelect
                      value={item.category}
                      options={categoryList}
                      onChange={(val) => handleItemChange(index, { target: { name: 'category', value: val } })}
                      onAddOption={(newCat) => {
                        handleAddCategory(newCat);
                        handleItemChange(index, { target: { name: 'category', value: newCat } });
                      }}
                      placeholder="Select Category"
                    />
                  </div>
                  <div className="po-field">
                    <label className="po-label">Product <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="po-select"
                      name="product"
                      value={item.product}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleItemChange(index, e);
                        const selected = products.find(p => p.productName === val);
                        if (selected) {
                          handleItemChange(index, { target: { name: 'hsnCode', value: selected.productHsnCode || selected.hsnCode || '' } });
                          handleItemChange(index, { target: { name: 'rate', value: selected.productSalePrice || selected.salesRate || '' } });
                          handleItemChange(index, { target: { name: 'sizeName', value: selected.sizeName || '' } });
                          handleItemChange(index, { target: { name: 'sizeId', value: selected.sizeId || '' } });
                          handleItemChange(index, { target: { name: 'unit', value: selected.unit || 'PCS' } });
                        }
                      }}
                    >
                      <option value="">Select Product</option>
                      {item.category && products
                        .filter(p => p.categoryId?.categoryName === item.category)
                        .map(p => (
                          <option key={p._id} value={p.productName}>{p.productName}</option>
                        ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="po-field">
                    <label className="po-label">HSN Code <span style={{ color: 'red' }}>*</span></label>
                    <input className="po-input" placeholder="" name="hsnCode" value={item.hsnCode} onChange={(e) => handleItemChange(index, e)} />
                  </div>
                  <div className="po-field">
                    <label className="po-label">Grade <span style={{ color: 'red' }}>*</span></label>
                    <select className="invoice-select" name="grade" value={item.grade} onChange={(e) => handleItemChange(index, e)}>
                      <option value="">Select Grade</option>
                      {gradeList.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* New Product Subform */}
                {item.product === 'Other' && (
                  <div className="add-customer-section">
                    <div className="add-customer-title">New Product</div>
                    <div className="add-customer-grid-row-6">
                      <div className="invoice-field"><label className="invoice-label">Name</label><input className="invoice-input" value={item.newProduct?.name || ''} onChange={e => updateItemNewProduct(index, 'name', e.target.value)} /></div>
                      <div className="invoice-field"><label className="invoice-label">HSN Code</label><input className="invoice-input" value={item.newProduct?.hsn || ''} onChange={e => updateItemNewProduct(index, 'hsn', e.target.value)} /></div>
                      <div className="invoice-field"><label className="invoice-label">Model Number</label><input className="invoice-input" value={item.newProduct?.modelNumber || ''} onChange={e => updateItemNewProduct(index, 'modelNumber', e.target.value)} /></div>
                      <div className="invoice-field"><label className="invoice-label">Finish Glaze</label><input className="invoice-input" value={item.newProduct?.finishGlaze || ''} onChange={e => updateItemNewProduct(index, 'finishGlaze', e.target.value)} /></div>
                      <div className="invoice-field"><label className="invoice-label">Sale Price</label><input className="invoice-input" value={item.newProduct?.salePrice || ''} onChange={e => updateItemNewProduct(index, 'salePrice', e.target.value)} /></div>
                    </div>
                  </div>
                )}

                {/* ITEM SECTION ROW 2: Unit, Color, Quantity, Rate, Total */}
                <div className="invoice-item-grid-2">
                  <div className="invoice-field">
                    <label className="invoice-label">Unit</label>
                    <input className="invoice-input" name="unit" value={item.unit} onChange={(e) => handleItemChange(index, e)} placeholder="PCS" />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Color</label>
                    <CreatableSelect
                      value={item.color}
                      options={colorList}
                      onChange={(val) => handleItemChange(index, { target: { name: 'color', value: val } })}
                      onAddOption={(newColor) => {
                        handleAddColor(newColor);
                        handleItemChange(index, { target: { name: 'color', value: newColor } });
                      }}
                      placeholder="Select Color"
                    />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Quantity</label>
                    <input className="invoice-input" type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} />
                  </div>

                  <div className="po-field">
                    <label className="po-label">Rate <span style={{ color: 'red' }}>*</span></label>
                    <input type="number" className="po-input" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} />
                  </div>
                  <div className="invoice-field">
                    <label className="invoice-label">Total</label>
                    <input className="invoice-input" name="total" value={item.total} readOnly />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="invoice-actions" style={isPage ? { paddingBottom: '20px' } : {}}>
            <button type="button" className="btn-add-more" onClick={addItem}> ADD MORE </button>
            <div>
              <button type="button" className="btn-cancel" onClick={onClose} style={{ marginRight: '10px', height: '36px', borderRadius: '4px', border: '1px solid #d1d5db', background: '#fff', padding: '0 20px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" className="btn-primary"> Submit </button>
            </div>
          </div>

        </form >
      </div >
    </div >
  );

  if (isPage) return formContent;

  return (
    <div className="modal-overlay" onClick={onClose}>
      {formContent}
    </div>
  );
}

export default AddNormalInvoiceForm;

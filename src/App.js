import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { PermissionProvider, usePermissionContext } from './contexts/PermissionContext';

// Layout
import AppLayout from './components/layout/AppLayout';
import { MENU_ITEMS, SETTINGS_ITEMS } from './components/layout/AppLayout';

// Pages
import Dashboard from './pages/Dashboard';
import PurchaseInvoiceList from './pages/PurchaseInvoiceList';
import InvoiceList from './pages/InvoiceList';
import InvoicePreview from './pages/InvoicePreview';
import PurchaseInvoicePreview from './pages/PurchaseInvoicePreview';
import InStock from './pages/InStock';
import OutStock from './pages/OutStock';
import SellerList from './pages/SellerList';
import CustomerList from './pages/CustomerList';
import AddPurchaseOrderForm from './pages/AddPurchaseOrderForm';
import AddNormalInvoiceForm from './pages/AddNormalInvoiceForm';
import SellerProfile from './pages/SellerProfile';
import CustomerProfile from './pages/CustomerProfile';
import TransporterProfile from './pages/TransporterProfile';
import TransporterList from './pages/TransporterList';
import ProductList from './pages/ProductList';
import BundlePage from './pages/BundlePage'; // New Import
import CategoryList from './pages/CategoryList';
import ExpensesList from './pages/ExpensesList';
import CompanyList from './pages/CompanyList';
import UserList from './pages/UserList';
import CustomerTypeList from './pages/CustomerTypeList';
import GradeList from './pages/GradeList';
import InvoiceNameList from './pages/InvoiceNameList';
import PaymentModeList from './pages/PaymentModeList';
import SaleTypeList from './pages/SaleTypeList';
import ColorList from './pages/ColorList';
import ExpensesPurposeList from './pages/ExpensesPurposeList';
import LoginPage from './pages/LoginPage';
import AddStockPage from './pages/AddStockPage';
import RemoveStockPage from './pages/RemoveStockPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AddCompanyForm from './pages/AddCompanyForm';
import UserForm from './pages/UserForm';
import UserPermissions from './pages/UserPermissions';
import CustomerTypeForm from './pages/CustomerTypeForm';
import InvoiceNameForm from './pages/InvoiceNameForm';
import PaymentModeForm from './pages/PaymentModeForm';
import SaleTypeForm from './pages/SaleTypeForm';
import ColorForm from './pages/ColorForm';
import ExpensesPurposeForm from './pages/ExpensesPurposeForm';
import InvoiceCopyList from './pages/InvoiceCopyList';
import InvoiceCopyForm from './pages/InvoiceCopyForm';
import PlanList from './pages/PlanList';
import PlanForm from './pages/PlanForm';
import CompanyProfile from './pages/CompanyProfile';
import CouponList from './pages/CouponList';
import CouponForm from './pages/CouponForm';
import ChatPage from './pages/ChatPage';

// Modals
import AddSellerModal from './components/modals/AddSellerModal';
import UpdateSellerModal from './components/modals/UpdateSellerModal';
import AddCustomerModal from './components/modals/AddCustomerModal';
import EditCustomerModal from './components/modals/EditCustomerModal';
import AddTransporterModal from './components/modals/AddTransporterModal';
import EditTransporterModal from './components/modals/EditTransporterModal';
import AddProductModal from './components/modals/AddProductModal';
import EditProductModal from './components/modals/EditProductModal';
import AddCategoryModal from './components/modals/AddCategoryModal';
import EditCategoryModal from './components/modals/EditCategoryModal';
import AddGradeModal from './components/modals/AddGradeModal';
import EditGradeModal from './components/modals/EditGradeModal';
import AddExpensesModal from './components/modals/AddExpensesModal';
import EditExpensesModal from './components/modals/EditExpensesModal';

// Styles
import './styles/layout.css';

// Helper component for Company Settings redirect
const CompanyProfileRedirect = ({ onPermissions, onEditUser, onChat }) => {
  const { company } = usePermissionContext();
  return (
    <CompanyProfile
      company={company}
      onPermissions={onPermissions}
      onEditUser={onEditUser}
      onChat={onChat}
    />
  );
};

const rolePrefixes = {
  'SUPER_ADMIN': 'super-admin',
  'ADMIN': 'admin',
  'USER': 'user'
};

// Safe JSON parse helper
const getSessionUser = () => {
  try {
    const userStr = sessionStorage.getItem('user');
    return userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Session user parse error:", error);
    return null;
  }
};

function ProtectedRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  const user = getSessionUser();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const urlRole = pathParts[0];

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const expectedPrefix = rolePrefixes[user.role];

  // If user tries to access a role path that doesn't belong to them
  if (urlRole && Object.values(rolePrefixes).includes(urlRole) && urlRole !== expectedPrefix) {
    return <Navigate to={`/${expectedPrefix}/dashboard`} replace />;
  }

  return children;
}

function PermissionProtectedRoute({ children, module, action = 'view' }) {
  const { hasPermission, loading } = usePermissionContext();
  const user = getSessionUser();
  const rolePrefix = user?.role === 'SUPER_ADMIN' ? '/super-admin' : (user?.role === 'ADMIN' ? '/admin' : '/user');

  if (loading) return null; // Or a spinner

  if (!hasPermission(module, action)) {
    return <Navigate to={`${rolePrefix}/dashboard`} replace />;
  }

  return children;
}

// Component to decide what to show in /settings/company
const CompanySettingsRouter = ({ onAddCompany, onEditCompany, onViewProfile, onPermissions, onEditUser, onChat }) => {
  const user = getSessionUser();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
    return <CompanyProfileRedirect onPermissions={onPermissions} onEditUser={onEditUser} onChat={onChat} />;
  }

  return (
    <CompanyList
      onAddCompany={onAddCompany}
      onEditCompany={onEditCompany}
      onViewProfile={onViewProfile}
    />
  );
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';

  // State Management for shared data between routes
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedNormalInvoice, setSelectedNormalInvoice] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCustomerType, setSelectedCustomerType] = useState(null);
  const [selectedInvoiceName, setSelectedInvoiceName] = useState(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(null);
  const [selectedSaleType, setSelectedSaleType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedExpensesPurpose, setSelectedExpensesPurpose] = useState(null);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedInvoiceCopy, setSelectedInvoiceCopy] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [previewData, setPreviewData] = useState(null);



  // Master List State
  const [grades, setGrades] = useState([
    { id: 1, name: 'PRE' },
    { id: 2, name: 'PREMIUM' },
    { id: 3, name: 'GRADE A' },
    { id: 4, name: 'GRADE B' },
    { id: 5, name: 'STANDARD' },
  ]);
  const [customerTypes, setCustomerTypes] = useState([
    { id: 1, name: 'RETAIL' },
    { id: 2, name: 'WHOLESALE' },
    { id: 3, name: 'DISTRIBUTOR' },
  ]);
  const [invoiceNames, setInvoiceNames] = useState([
    { id: 1, name: 'Tax Invoice', active: true },
    { id: 2, name: 'Proforma Invoice', active: true },
  ]);
  const [paymentModes, setPaymentModes] = useState([
    { id: 1, name: 'UPI' },
    { id: 2, name: 'Net Banking' },
    { id: 3, name: 'Cheque' },
    { id: 4, name: 'NEFT' },
    { id: 5, name: 'Cash' },
  ]);
  const [colors, setColors] = useState([
    { id: 1, name: 'Blue' },
    { id: 2, name: 'GREY' },
    { id: 3, name: 'MARBLE' },
    { id: 4, name: 'BLACK' },
    { id: 5, name: 'WHITE' }
  ]);
  const [expensesPurposes, setExpensesPurposes] = useState([
    { id: 1, name: 'PACKING BOX' },
    { id: 2, name: 'DIGITAL MARKETING' },
    { id: 3, name: 'Office Electricity Bill' },
    { id: 4, name: 'Office Rent' }
  ]);

  const handleAddMaster = (listKey, item) => {
    const setters = {
      grades: setGrades,
      customerTypes: setCustomerTypes,
      invoiceNames: setInvoiceNames,
      paymentModes: setPaymentModes,
      colors: setColors,
      expensesPurposes: setExpensesPurposes
    };
    const paths = {
      grades: '/settings/grade',
      customerTypes: '/settings/customer-type',
      invoiceNames: '/settings/invoice-name',
      paymentModes: '/settings/payment-mode',
      colors: '/settings/color',
      expensesPurposes: '/settings/expenses-purpose'
    };

    if (setters[listKey]) {
      setters[listKey](prev => [...prev, { ...item, id: Date.now() }]);
      navigate(`${getRolePrefix()}${paths[listKey]}`);
    }
  };

  const handleUpdateMaster = (listKey, updatedItem) => {
    const setters = {
      grades: setGrades,
      customerTypes: setCustomerTypes,
      invoiceNames: setInvoiceNames,
      paymentModes: setPaymentModes,
      colors: setColors,
      expensesPurposes: setExpensesPurposes
    };
    const paths = {
      grades: '/settings/grade',
      customerTypes: '/settings/customer-type',
      invoiceNames: '/settings/invoice-name',
      paymentModes: '/settings/payment-mode',
      colors: '/settings/color',
      expensesPurposes: '/settings/expenses-purpose'
    };

    if (setters[listKey]) {
      setters[listKey](prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      navigate(`${getRolePrefix()}${paths[listKey]}`);
    }
  };

  const handleDeleteMaster = (listKey, id) => {
    const setters = {
      grades: setGrades,
      customerTypes: setCustomerTypes,
      invoiceNames: setInvoiceNames,
      paymentModes: setPaymentModes,
      colors: setColors,
      expensesPurposes: setExpensesPurposes
    };
    if (setters[listKey]) {
      setters[listKey](prev => prev.filter(item => item.id !== id));
    }
  };

  // Navigation Logic
  const getRolePrefix = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || !user.role) return '';
    if (user.role === 'SUPER_ADMIN') return '/super-admin';
    if (user.role === 'ADMIN') return '/admin';
    return '/user';
  };

  const handlePreviewInvoice = (data) => {
    setPreviewData(data);
    navigate(`${getRolePrefix()}/invoice-preview`);
  };

  const handlePreviewPurchaseInvoice = (data) => {
    setPreviewData(data);
    navigate(`${getRolePrefix()}/purchase-invoice-preview`);
  };

  const handleNavigateToCustomerProfile = (customer) => {
    setSelectedCustomer(customer);
    navigate(`${getRolePrefix()}/customer-profile`);
  };

  const handleNavigateToSellerProfile = (seller) => {
    setSelectedSeller(seller);
    navigate(`${getRolePrefix()}/seller-profile`);
  };

  const handleNavigateToTransporterProfile = (transporter) => {
    setSelectedTransporter(transporter);
    navigate(`${getRolePrefix()}/transporter-profile`);
  };

  const handleNavigateToCompanyProfile = (company) => {
    setSelectedCompany(company);
    navigate(`${getRolePrefix()}/settings/company/profile`);
  };

  const activeKey = useMemo(() => {
    const rolePrefix = getRolePrefix();
    const cleanPath = location.pathname.startsWith(rolePrefix) ? location.pathname.slice(rolePrefix.length) : location.pathname;

    const all = [...MENU_ITEMS, ...SETTINGS_ITEMS];
    const found = all.find(i => cleanPath === i.path || (i.path !== '/dashboard' && cleanPath.startsWith(i.path + '/')));

    if (found) return found.key;

    // Manual mappings for paths that don't match the standard hierarchy
    if (cleanPath.startsWith('/purchase-invoice')) return 'purchase-invoice';
    if (cleanPath.startsWith('/invoice')) return 'invoice';
    if (cleanPath.startsWith('/seller')) return 'seller';
    if (cleanPath.startsWith('/customer')) return 'customer';
    if (cleanPath.startsWith('/transporter')) return 'transporter';
    if (cleanPath.startsWith('/product')) return 'product';
    if (cleanPath.startsWith('/category')) return 'category';
    if (cleanPath.startsWith('/expenses')) return 'expenses';
    if (cleanPath.startsWith('/in-stock')) return 'in-stock';
    if (cleanPath.startsWith('/out-stock')) return 'out-stock';
    if (cleanPath.startsWith('/chat')) return 'chat';

    // Settings mappings
    if (cleanPath.startsWith('/settings/company/profile')) return 'company';
    if (cleanPath.startsWith('/settings/company')) return 'company';
    if (cleanPath.startsWith('/settings/user')) return 'user';
    if (cleanPath.startsWith('/settings/grade')) return 'grade';
    if (cleanPath.startsWith('/settings/customer-type')) return 'customer-type';
    if (cleanPath.startsWith('/settings/invoice-name')) return 'invoice-name';
    if (cleanPath.startsWith('/settings/payment-mode')) return 'payment-mode';
    if (cleanPath.startsWith('/settings/sale-type')) return 'sale-type';
    if (cleanPath.startsWith('/settings/color')) return 'color';
    if (cleanPath.startsWith('/settings/expenses-purpose')) return 'expenses-purpose';
    if (cleanPath.startsWith('/settings/invoice-copy')) return 'invoice-copy';
    if (cleanPath.startsWith('/settings/plan')) return 'plan';

    return '';
  }, [location.pathname]);

  const activeTitle = useMemo(() => {
    const found = [...MENU_ITEMS, ...SETTINGS_ITEMS].find((i) => i.key === activeKey);
    return found ? found.label : 'Dashboard';
  }, [activeKey]);

  const handleNavSelect = (key) => {
    const item = [...MENU_ITEMS, ...SETTINGS_ITEMS].find(i => i.key === key);
    if (item) navigate(`${getRolePrefix()}${item.path}`);
  };

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  // Auto-logout after 5 minutes of inactivity
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;
    const TIMEOUT_DURATION = 60 * 60 * 1000; // 60 minutes

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        handleLogout();
      }, TIMEOUT_DURATION);
    };

    const handleActivity = () => {
      resetTimer();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    events.forEach(event => window.addEventListener(event, handleActivity));

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, handleLogout]);

  const getDashboardRedirect = () => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Navigate to={`${getRolePrefix()}/dashboard`} replace />;
  };

  return (
    <PermissionProvider>
      <Routes>
        <Route path="/login" element={isAuthenticated ? getDashboardRedirect() : <LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Redirect from root to role-based dashboard */}
        <Route path="/" element={getDashboardRedirect()} />

        {/* Catch-all for role-based routes */}
        <Route path="/:role/*" element={
          <ProtectedRoute>
            <AppLayout
              activeKey={activeKey}
              activeTitle={activeTitle}
              onNavSelect={handleNavSelect}
              onLogout={handleLogout}
            >
              <Routes>
                <Route path="/" element={<Navigate to="dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard onNavigate={(path) => navigate(`${getRolePrefix()}${path}`)} />} />

                {/* Specific logic for navigation from Dashboard or other components */}

                {/* Purchase Invoice */}
                <Route path="/purchase-invoice" element={
                  <PermissionProtectedRoute module="Purchase Order">
                    <PurchaseInvoiceList
                      onPreview={handlePreviewPurchaseInvoice}
                      onAddInvoice={() => {
                        setSelectedInvoice(null);
                        navigate(`${getRolePrefix()}/purchase-invoice/add`);
                      }}
                      onEditInvoice={(invoice) => {
                        setSelectedInvoice(invoice);
                        navigate(`${getRolePrefix()}/purchase-invoice/edit`);
                      }}
                      onNavigateToProfile={handleNavigateToSellerProfile}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/purchase-invoice/add" element={<PermissionProtectedRoute module="Purchase Order" action="add"><AddPurchaseOrderForm isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/purchase-invoice`)} /></PermissionProtectedRoute>} />
                <Route path="/purchase-invoice/edit" element={<PermissionProtectedRoute module="Purchase Order" action="update"><AddPurchaseOrderForm isPage={true} isOpen={true} editingRow={selectedInvoice} onClose={() => navigate(`${getRolePrefix()}/purchase-invoice`)} /></PermissionProtectedRoute>} />
                <Route path="/purchase-invoice-preview" element={
                  <PermissionProtectedRoute module="Purchase Order" action="view">
                    <PurchaseInvoicePreview
                      data={previewData}
                      onBack={() => navigate(`${getRolePrefix()}/purchase-invoice`)}
                      onEdit={() => {
                        setSelectedInvoice(previewData);
                        navigate(`${getRolePrefix()}/purchase-invoice/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />

                {/* Invoice */}
                <Route path="/invoice" element={
                  <PermissionProtectedRoute module="Invoice">
                    <InvoiceList
                      onPreview={handlePreviewInvoice}
                      onNavigateToProfile={handleNavigateToCustomerProfile}
                      onAddInvoice={() => {
                        setSelectedNormalInvoice(null);
                        navigate(`${getRolePrefix()}/invoice/add`);
                      }}
                      onEditInvoice={(invoice) => {
                        setSelectedNormalInvoice(invoice);
                        navigate(`${getRolePrefix()}/invoice/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/invoice/add" element={<PermissionProtectedRoute module="Invoice" action="add"><AddNormalInvoiceForm isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/invoice`)} /></PermissionProtectedRoute>} />
                <Route path="/invoice/edit" element={<PermissionProtectedRoute module="Invoice" action="update"><AddNormalInvoiceForm isPage={true} isOpen={true} editingRow={selectedNormalInvoice} isEdit={true} onClose={() => navigate(`${getRolePrefix()}/invoice`)} /></PermissionProtectedRoute>} />
                <Route path="/invoice-preview" element={<PermissionProtectedRoute module="Invoice" action="view"><InvoicePreview data={previewData} onBack={() => navigate(`${getRolePrefix()}/invoice`)} /></PermissionProtectedRoute>} />

                {/* In/Out Stock */}
                <Route path="/in-stock" element={<PermissionProtectedRoute module="InStock"><InStock /></PermissionProtectedRoute>} />
                <Route path="/in-stock/add" element={<PermissionProtectedRoute module="InStock" action="add"><AddStockPage /></PermissionProtectedRoute>} />
                <Route path="/out-stock" element={<PermissionProtectedRoute module="OutStock"><OutStock /></PermissionProtectedRoute>} />
                <Route path="/out-stock/remove" element={<PermissionProtectedRoute module="OutStock" action="delete"><RemoveStockPage /></PermissionProtectedRoute>} />


                {/* Seller */}
                <Route path="/seller" element={
                  <PermissionProtectedRoute module="Seller">
                    <SellerList
                      onNavigateToProfile={handleNavigateToSellerProfile}
                      onAddSeller={() => navigate(`${getRolePrefix()}/seller/add`)}
                      onEditSeller={(seller) => {
                        setSelectedSeller(seller);
                        navigate(`${getRolePrefix()}/seller/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/seller/add" element={<PermissionProtectedRoute module="Seller" action="add"><AddSellerModal isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/seller`)} /></PermissionProtectedRoute>} />
                <Route path="/seller/edit" element={<PermissionProtectedRoute module="Seller" action="update"><UpdateSellerModal isPage={true} isOpen={true} seller={selectedSeller} onClose={() => navigate(`${getRolePrefix()}/seller`)} /></PermissionProtectedRoute>} />
                <Route path="/seller-profile" element={<PermissionProtectedRoute module="Seller" action="view"><SellerProfile seller={selectedSeller} onBack={() => navigate(`${getRolePrefix()}/seller`)} onEdit={() => navigate(`${getRolePrefix()}/seller/edit`)} onPreview={handlePreviewPurchaseInvoice} /></PermissionProtectedRoute>} />

                {/* Customer */}
                <Route path="/customer" element={
                  <PermissionProtectedRoute module="Customer">
                    <CustomerList
                      onNavigateToProfile={handleNavigateToCustomerProfile}
                      onAddCustomer={() => navigate(`${getRolePrefix()}/customer/add`)}
                      onEditCustomer={(customer) => {
                        setSelectedCustomer(customer);
                        navigate(`${getRolePrefix()}/customer/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/customer/add" element={<PermissionProtectedRoute module="Customer" action="add"><AddCustomerModal isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/customer`)} /></PermissionProtectedRoute>} />
                <Route path="/customer/edit" element={<PermissionProtectedRoute module="Customer" action="update"><EditCustomerModal isPage={true} isOpen={true} customer={selectedCustomer} onClose={() => navigate(`${getRolePrefix()}/customer`)} /></PermissionProtectedRoute>} />
                <Route path="/customer-profile" element={<PermissionProtectedRoute module="Customer" action="view"><CustomerProfile customer={selectedCustomer} onBack={() => navigate(`${getRolePrefix()}/customer`)} onEdit={() => navigate(`${getRolePrefix()}/customer/edit`)} onPreviewInvoice={handlePreviewInvoice} /></PermissionProtectedRoute>} />

                {/* Transporter */}
                <Route path="/transporter" element={
                  <PermissionProtectedRoute module="Transporter">
                    <TransporterList
                      onNavigateToProfile={handleNavigateToTransporterProfile}
                      onAddTransporter={() => navigate(`${getRolePrefix()}/transporter/add`)}
                      onEditTransporter={(transporter) => {
                        setSelectedTransporter(transporter);
                        navigate(`${getRolePrefix()}/transporter/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/transporter/add" element={<PermissionProtectedRoute module="Transporter" action="add"><AddTransporterModal isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/transporter`)} /></PermissionProtectedRoute>} />
                <Route path="/transporter/edit" element={<PermissionProtectedRoute module="Transporter" action="update"><EditTransporterModal isPage={true} isOpen={true} transporter={selectedTransporter} onClose={() => navigate(`${getRolePrefix()}/transporter`)} /></PermissionProtectedRoute>} />
                <Route path="/transporter-profile" element={<PermissionProtectedRoute module="Transporter" action="view"><TransporterProfile transporter={selectedTransporter} onBack={() => navigate(`${getRolePrefix()}/transporter`)} onEdit={() => navigate(`${getRolePrefix()}/transporter/edit`)} /></PermissionProtectedRoute>} />

                {/* Product */}
                <Route path="/product" element={
                  <PermissionProtectedRoute module="Product">
                    <ProductList
                      onAddProduct={() => navigate(`${getRolePrefix()}/product/add`)}
                      onEditProduct={(product) => {
                        setSelectedProduct(product);
                        navigate(`${getRolePrefix()}/product/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/product/add" element={<PermissionProtectedRoute module="Product" action="add"><AddProductModal isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/product`)} /></PermissionProtectedRoute>} />
                <Route path="/product/edit" element={<PermissionProtectedRoute module="Product" action="update"><EditProductModal isPage={true} isOpen={true} product={selectedProduct} onClose={() => navigate(`${getRolePrefix()}/product`)} /></PermissionProtectedRoute>} />
                <Route path="/product/bundle/:id" element={<PermissionProtectedRoute module="Product" action="view"><BundlePage /></PermissionProtectedRoute>} />

                {/* Category */}
                <Route path="/category" element={
                  <PermissionProtectedRoute module="Category">
                    <CategoryList
                      onAddCategory={() => navigate(`${getRolePrefix()}/category/add`)}
                      onEditCategory={(category) => {
                        setSelectedCategory(category);
                        navigate(`${getRolePrefix()}/category/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/category/add" element={
                  <PermissionProtectedRoute module="Category" action="add">
                    <AddCategoryModal
                      isPage={true}
                      isOpen={true}
                      onClose={() => navigate(`${getRolePrefix()}/category`)}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/category/edit" element={
                  <PermissionProtectedRoute module="Category" action="update">
                    <EditCategoryModal
                      isPage={true}
                      isOpen={true}
                      category={selectedCategory}
                      onClose={() => navigate(`${getRolePrefix()}/category`)}
                    />
                  </PermissionProtectedRoute>
                } />

                {/* Expenses */}
                <Route path="/expenses" element={
                  <PermissionProtectedRoute module="Expense">
                    <ExpensesList
                      onAddExpenses={() => navigate(`${getRolePrefix()}/expenses/add`)}
                      onEditExpenses={(expense) => {
                        setSelectedExpense(expense);
                        navigate(`${getRolePrefix()}/expenses/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/expenses/add" element={<PermissionProtectedRoute module="Expense" action="add"><AddExpensesModal isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/expenses`)} /></PermissionProtectedRoute>} />
                <Route path="/expenses/edit" element={<PermissionProtectedRoute module="Expense" action="update"><EditExpensesModal isPage={true} isOpen={true} expense={selectedExpense} onClose={() => navigate(`${getRolePrefix()}/expenses`)} /></PermissionProtectedRoute>} />

                {/* Profile Routes */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/edit" element={<EditProfilePage />} />
                <Route path="/change-password" element={<ChangePasswordPage />} />
                <Route path="/chat" element={<ChatPage />} />

                {/* Settings */}
                <Route path="/settings/company" element={
                  <PermissionProtectedRoute module="Company">
                    <CompanySettingsRouter
                      onAddCompany={() => {
                        setSelectedCompany(null);
                        navigate(`${getRolePrefix()}/settings/company/add`);
                      }}
                      onEditCompany={(company) => {
                        setSelectedCompany(company);
                        navigate(`${getRolePrefix()}/settings/company/edit`);
                      }}
                      onViewProfile={handleNavigateToCompanyProfile}
                      onPermissions={(u) => {
                        setSelectedUserForPermissions(u);
                        navigate(`${getRolePrefix()}/settings/user/permissions`);
                      }}
                      onChat={(user) => navigate(`${getRolePrefix()}/chat`, { state: { partner: user } })}
                      onEditUser={(user) => {
                        setSelectedUser(user);
                        navigate(`${getRolePrefix()}/settings/user/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/company/add" element={<PermissionProtectedRoute module="Company" action="add"><AddCompanyForm isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/settings/company`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/company/edit" element={<PermissionProtectedRoute module="Company" action="update"><AddCompanyForm isPage={true} isOpen={true} company={selectedCompany} onClose={() => navigate(`${getRolePrefix()}/settings/company`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/company/profile" element={
                  <PermissionProtectedRoute module="Company" action="view">
                    <CompanyProfile
                      company={selectedCompany}
                      onBack={() => navigate(`${getRolePrefix()}/settings/company`)}
                      onPermissions={(user) => {
                        setSelectedUserForPermissions(user);
                        navigate(`${getRolePrefix()}/settings/user/permissions`);
                      }}
                      onChat={(user) => navigate(`${getRolePrefix()}/chat`, { state: { partner: user } })}
                      onEditUser={(user) => {
                        setSelectedUser(user);
                        navigate(`${getRolePrefix()}/settings/user/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/user" element={
                  <PermissionProtectedRoute module="User">
                    <UserList
                      onAddUser={() => {
                        setSelectedUser(null);
                        navigate(`${getRolePrefix()}/settings/user/add`);
                      }}
                      onEditUser={(user) => {
                        setSelectedUser(user);
                        navigate(`${getRolePrefix()}/settings/user/edit`);
                      }}
                      onPermissions={(user) => {
                        setSelectedUserForPermissions(user);
                        navigate(`${getRolePrefix()}/settings/user/permissions`);
                      }}
                      onChat={(user) => navigate(`${getRolePrefix()}/chat`, { state: { partner: user } })}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/user/add" element={<PermissionProtectedRoute module="User" action="add"><UserForm isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/settings/user`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/user/edit" element={<PermissionProtectedRoute module="User" action="update"><UserForm isPage={true} isOpen={true} user={selectedUser} onClose={() => navigate(`${getRolePrefix()}/settings/user`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/user/permissions" element={<PermissionProtectedRoute module="User" action="status"><UserPermissions user={selectedUserForPermissions} onClose={() => navigate(`${getRolePrefix()}/settings/user`)} /></PermissionProtectedRoute>} />

                {/* Plan Management (SUPER_ADMIN only) */}
                <Route path="/settings/plan" element={
                  <PlanList
                    onAddPlan={() => {
                      setSelectedPlan(null);
                      navigate(`${getRolePrefix()}/settings/plan/add`);
                    }}
                    onEditPlan={(plan) => {
                      setSelectedPlan(plan);
                      navigate(`${getRolePrefix()}/settings/plan/edit`);
                    }}
                  />
                } />
                <Route path="/settings/plan/add" element={<PlanForm isPage={true} onCancel={() => navigate(`${getRolePrefix()}/settings/plan`)} onSuccess={() => navigate(`${getRolePrefix()}/settings/plan`)} />} />
                <Route path="/settings/plan/edit" element={<PlanForm isPage={true} plan={selectedPlan} onCancel={() => navigate(`${getRolePrefix()}/settings/plan`)} onSuccess={() => navigate(`${getRolePrefix()}/settings/plan`)} />} />

                {/* Coupon Management (SUPER_ADMIN only) */}
                <Route path="/settings/coupon" element={<CouponList />} />
                <Route path="/settings/coupon/add" element={<CouponForm onCancel={() => navigate(`${getRolePrefix()}/settings/coupon`)} onSuccess={() => navigate(`${getRolePrefix()}/settings/coupon`)} />} />
                <Route path="/settings/coupon/edit" element={<CouponForm onCancel={() => navigate(`${getRolePrefix()}/settings/coupon`)} onSuccess={() => navigate(`${getRolePrefix()}/settings/coupon`)} />} />



                <Route path="/settings/grade" element={<PermissionProtectedRoute module="Grade"><GradeList onAddGrade={() => navigate(`${getRolePrefix()}/settings/grade/add`)} onEditGrade={(grade) => { setSelectedGrade(grade); navigate(`${getRolePrefix()}/settings/grade/edit`); }} /></PermissionProtectedRoute>} />
                <Route path="/settings/grade/add" element={<PermissionProtectedRoute module="Grade" action="add"><AddGradeModal isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/settings/grade`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/grade/edit" element={<PermissionProtectedRoute module="Grade" action="update"><EditGradeModal isPage={true} isOpen={true} grade={selectedGrade} onClose={() => navigate(`${getRolePrefix()}/settings/grade`)} /></PermissionProtectedRoute>} />

                <Route path="/settings/customer-type" element={
                  <PermissionProtectedRoute module="CustomerType">
                    <CustomerTypeList
                      onAddType={() => {
                        setSelectedCustomerType(null);
                        navigate(`${getRolePrefix()}/settings/customer-type/add`);
                      }}
                      onEditType={(type) => {
                        setSelectedCustomerType(type);
                        navigate(`${getRolePrefix()}/settings/customer-type/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/customer-type/add" element={
                  <PermissionProtectedRoute module="CustomerType" action="add">
                    <CustomerTypeForm
                      isPage={true}
                      isOpen={true}
                      onClose={() => navigate(`${getRolePrefix()}/settings/customer-type`)}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/customer-type/edit" element={
                  <PermissionProtectedRoute module="CustomerType" action="update">
                    <CustomerTypeForm
                      isPage={true}
                      isOpen={true}
                      customerType={selectedCustomerType}
                      onClose={() => navigate(`${getRolePrefix()}/settings/customer-type`)}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/invoice-name" element={
                  <PermissionProtectedRoute module="InvoiceName">
                    <InvoiceNameList
                      onAdd={() => {
                        setSelectedInvoiceName(null);
                        navigate(`${getRolePrefix()}/settings/invoice-name/add`);
                      }}
                      onEdit={(item) => {
                        setSelectedInvoiceName(item);
                        navigate(`${getRolePrefix()}/settings/invoice-name/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/invoice-name/add" element={
                  <PermissionProtectedRoute module="InvoiceName" action="add">
                    <InvoiceNameForm
                      isPage={true}
                      isOpen={true}
                      onClose={() => navigate(`${getRolePrefix()}/settings/invoice-name`)}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/invoice-name/edit" element={
                  <PermissionProtectedRoute module="InvoiceName" action="update">
                    <InvoiceNameForm
                      isPage={true}
                      isOpen={true}
                      invoiceName={selectedInvoiceName}
                      onClose={() => navigate(`${getRolePrefix()}/settings/invoice-name`)}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/payment-mode" element={
                  <PermissionProtectedRoute module="PaymentMode">
                    <PaymentModeList
                      onAdd={() => {
                        setSelectedPaymentMode(null);
                        navigate(`${getRolePrefix()}/settings/payment-mode/add`);
                      }}
                      onEdit={(item) => {
                        setSelectedPaymentMode(item);
                        navigate(`${getRolePrefix()}/settings/payment-mode/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/payment-mode/add" element={<PermissionProtectedRoute module="PaymentMode" action="add"><PaymentModeForm isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/settings/payment-mode`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/payment-mode/edit" element={<PermissionProtectedRoute module="PaymentMode" action="update"><PaymentModeForm isPage={true} isOpen={true} paymentMode={selectedPaymentMode} onClose={() => navigate(`${getRolePrefix()}/settings/payment-mode`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/sale-type" element={
                  <PermissionProtectedRoute module="SaleType">
                    <SaleTypeList
                      onAdd={() => {
                        setSelectedSaleType(null);
                        navigate(`${getRolePrefix()}/settings/sale-type/add`);
                      }}
                      onEdit={(item) => {
                        setSelectedSaleType(item);
                        navigate(`${getRolePrefix()}/settings/sale-type/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/sale-type/add" element={<PermissionProtectedRoute module="SaleType" action="add"><SaleTypeForm isPage={true} isOpen={true} onClose={() => navigate(`${getRolePrefix()}/settings/sale-type`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/sale-type/edit" element={<PermissionProtectedRoute module="SaleType" action="update"><SaleTypeForm isPage={true} isOpen={true} saleType={selectedSaleType} onClose={() => navigate(`${getRolePrefix()}/settings/sale-type`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/color" element={
                  <PermissionProtectedRoute module="Color">
                    <ColorList
                      data={colors}
                      setData={setColors}
                      onAdd={() => {
                        setSelectedColor(null);
                        navigate(`${getRolePrefix()}/settings/color/add`);
                      }}
                      onEdit={(item) => {
                        setSelectedColor(item);
                        navigate(`${getRolePrefix()}/settings/color/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/color/add" element={<PermissionProtectedRoute module="Color" action="add"><ColorForm isPage={true} isOpen={true} existingColors={colors} onAdd={(name) => handleAddMaster('colors', { name })} onClose={() => navigate(`${getRolePrefix()}/settings/color`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/color/edit" element={<PermissionProtectedRoute module="Color" action="update"><ColorForm isPage={true} isOpen={true} color={selectedColor} existingColors={colors} onUpdate={(item) => handleUpdateMaster('colors', item)} onClose={() => navigate(`${getRolePrefix()}/settings/color`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/expenses-purpose" element={
                  <PermissionProtectedRoute module="ExpensePurpose">
                    <ExpensesPurposeList
                      data={expensesPurposes}
                      onAdd={() => {
                        setSelectedExpensesPurpose(null);
                        navigate(`${getRolePrefix()}/settings/expenses-purpose/add`);
                      }}
                      onEdit={(item) => {
                        setSelectedExpensesPurpose(item);
                        navigate(`${getRolePrefix()}/settings/expenses-purpose/edit`);
                      }}
                      onDelete={(id) => handleDeleteMaster('expensesPurposes', id)}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/expenses-purpose/add" element={<PermissionProtectedRoute module="ExpensePurpose" action="add"><ExpensesPurposeForm isPage={true} isOpen={true} existingPurposes={expensesPurposes} onAdd={(name) => handleAddMaster('expensesPurposes', { name })} onClose={() => navigate(`${getRolePrefix()}/settings/expenses-purpose`)} /></PermissionProtectedRoute>} />
                <Route path="/settings/expenses-purpose/edit" element={<PermissionProtectedRoute module="ExpensePurpose" action="update"><ExpensesPurposeForm isPage={true} isOpen={true} expensesPurpose={selectedExpensesPurpose} existingPurposes={expensesPurposes} onUpdate={(item) => handleUpdateMaster('expensesPurposes', item)} onClose={() => navigate(`${getRolePrefix()}/settings/expenses-purpose`)} /></PermissionProtectedRoute>} />

                <Route path="/settings/invoice-copy" element={
                  <PermissionProtectedRoute module="Invoice Copy">
                    <InvoiceCopyList
                      onAdd={() => {
                        setSelectedInvoiceCopy(null);
                        navigate(`${getRolePrefix()}/settings/invoice-copy/add`);
                      }}
                      onEdit={(copy) => {
                        setSelectedInvoiceCopy(copy);
                        navigate(`${getRolePrefix()}/settings/invoice-copy/edit`);
                      }}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/invoice-copy/add" element={
                  <PermissionProtectedRoute module="Invoice Copy" action="add">
                    <InvoiceCopyForm
                      isPage={true}
                      isOpen={true}
                      onClose={() => navigate(`${getRolePrefix()}/settings/invoice-copy`)}
                    />
                  </PermissionProtectedRoute>
                } />
                <Route path="/settings/invoice-copy/edit" element={
                  <PermissionProtectedRoute module="Invoice Copy" action="update">
                    <InvoiceCopyForm
                      isPage={true}
                      isOpen={true}
                      copy={selectedInvoiceCopy}
                      onClose={() => navigate(`${getRolePrefix()}/settings/invoice-copy`)}
                    />
                  </PermissionProtectedRoute>
                } />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Catch everything else and redirect to role-based dashboard */}
        <Route path="*" element={getDashboardRedirect()} />
      </Routes>
      <ToastContainer />
    </PermissionProvider>
  );
}

export default App;

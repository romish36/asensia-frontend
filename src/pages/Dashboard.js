import React, { useMemo, useState, useEffect } from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';
import DashboardCharts from '../components/DashboardCharts';
import DashboardTables from '../components/DashboardTables';
import LowStockAlertTable from '../components/LowStockAlertTable';
import PieChartComponent from '../components/PieChartComponent';
import API_BASE_URL from '../config/apiConfig';
import fetchApi from '../utils/api.js';

const ICONS = {
  purchase: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  invoice: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
  ),
  seller: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"></path>
      <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"></path>
      <path d="M5 21V10.85"></path>
      <path d="M19 21V10.85"></path>
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path>
    </svg>
  ),
  customer: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  transporter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  ),
  product: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  ),
  category: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  ),
  inStock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8l-2-2H5L3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"></path>
      <path d="M10 12l2 2 2-2"></path>
      <path d="M12 14V7"></path>
    </svg>
  ),
  outStock: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8l-2-2H5L3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"></path>
      <path d="M14 12l-2-2-2 2"></path>
      <path d="M12 10v7"></path>
    </svg>
  ),
  money: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h12"></path>
      <path d="M6 9h12"></path>
      <path d="M17 9c0 7-11 7-11 7"></path>
      <path d="M14.5 21L6 13"></path>
    </svg>
  ),
  alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  plan: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  coupon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-10 10" />
      <path d="M21 7.5a2.5 2.5 0 0 0-2.5-2.5H16l-3-3v3.5l-3-3v3.5H3.5A2.5 2.5 0 0 0 1 7.5v9A2.5 2.5 0 0 0 3.5 19H7l3 3v-3.5l3 3v-3.5h2.5a2.5 2.5 0 0 0 2.5-2.5v-9z" />
    </svg>
  ),
};

function Dashboard({ onNavigate }) {
  const { hasPermission, setAppLoading } = usePermissionContext();
  const [userData, setUserData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome');

  const [dashboardStats, setDashboardStats] = useState({
    counts: {},
    lowStockProducts: [],
    recentPurchasePayments: [],
    recentSalesPayments: [],
    pieData: [],
    salesHistory: [],
    purchaseVsPayment: []
  });

  // Fetch user data from sessionStorage and company data from API
  useEffect(() => {
    const user = sessionStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setUserData(parsedUser);

        // If SUPER_ADMIN, set welcome message immediately (no company needed)
        if (parsedUser.role?.toUpperCase() === 'SUPER_ADMIN') {
          setWelcomeMessage('Welcome Super Admin');
        } else if (parsedUser.companyId) {
          // Fetch company data for ADMIN and USER roles
          fetchCompanyData(parsedUser.companyId, parsedUser);
        } else {
          // Fallback for users without companyId
          setWelcomeMessage(`Welcome ${parsedUser.name || 'User'}`);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const fetchCompanyData = async (companyId, user) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/company/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const company = await response.json();
        setCompanyData(company);

        // Generate welcome message with company data
        const role = user.role?.toUpperCase();
        const companyName = company.companyName || company.name || 'Company';

        if (role === 'ADMIN') {
          setWelcomeMessage(`Welcome Admin Of ${companyName}`);
        } else {
          // USER role
          setWelcomeMessage(`Welcome ${user.name} from ${companyName}`);
        }
      } else {
        console.error('Failed to fetch company data:', response.status);
        // Fallback message if company fetch fails
        const role = user.role?.toUpperCase();
        if (role === 'ADMIN') {
          setWelcomeMessage('Welcome Admin');
        } else {
          setWelcomeMessage(`Welcome ${user.name}`);
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
      // Fallback message on error
      const role = user.role?.toUpperCase();
      if (role === 'ADMIN') {
        setWelcomeMessage('Welcome Admin');
      } else {
        setWelcomeMessage(`Welcome ${user.name}`);
      }
    }
  };

  const generateWelcomeMessage = (user, company) => {
    if (!user) return;

    const role = user.role?.toUpperCase();

    if (role === 'SUPER_ADMIN') {
      setWelcomeMessage('Welcome Super Admin');
    } else if (role === 'ADMIN') {
      const companyName = company?.companyName || company?.name || 'Company';
      setWelcomeMessage(`Welcome Admin Of ${companyName}`);
    } else {
      // USER role
      const userName = user.name || 'User';
      const companyName = company?.companyName || company?.name || 'Company';
      setWelcomeMessage(`Welcome ${userName} from ${companyName}`);
    }
  };

  // Update welcome message when company data is fetched
  useEffect(() => {
    if (userData && companyData) {
      generateWelcomeMessage(userData, companyData);
    }
  }, [companyData]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setAppLoading(true);
        const data = await fetchApi('/dashboard/stats');
        if (data) {
          setDashboardStats(data);
        }
      } catch (error) {
        console.error("Dashboard Stats Fetch Error:", error);
      } finally {
        setAppLoading(false);
      }
    };

    fetchStats();
    // const interval = setInterval(fetchStats, 30000); // Poll every 30s
    // return () => clearInterval(interval);
  }, []);

  const mappedRecentPurchasePayments = useMemo(() => {
    if (!dashboardStats.recentPurchasePayments) return [];
    return dashboardStats.recentPurchasePayments.map(p => ({
      id: p._id,
      partyName: p.buyerTradeName || 'N/A',
      reference: p.paymentModeName || `PAY-${p.purchaseOrderPaymentId}`,
      date: p.paymentDate,
      amount: p.paymentAmount
    }));
  }, [dashboardStats.recentPurchasePayments]);

  const mappedRecentSalesPayments = useMemo(() => {
    if (!dashboardStats.recentSalesPayments) return [];
    return dashboardStats.recentSalesPayments.map(p => ({
      id: p._id,
      partyName: p.customerName || 'N/A',
      reference: p.paymentModeName || `PAY-${p.invoicePaymentId}`,
      date: p.paymentDate,
      amount: p.paymentAmount
    }));
  }, [dashboardStats.recentSalesPayments]);

  const mappedLowStock = useMemo(() => {
    if (!dashboardStats.lowStockProducts) return [];
    return dashboardStats.lowStockProducts.map(p => ({
      id: p._id,
      name: p.productName,
      sku: p.productHsnCode || 'N/A',
      category: p.categoryId?.categoryName || p.sizeName || 'N/A',
      stock: p.productStock
    }));
  }, [dashboardStats.lowStockProducts]);

  const isSuperAdmin = useMemo(() => userData?.role?.toUpperCase() === 'SUPER_ADMIN', [userData]);

  const cards = useMemo(() => {
    const counts = dashboardStats.counts || {};

    if (isSuperAdmin) {
      return [
        {
          title: 'Company',
          count: counts.companies || 0,
          icon: ICONS.seller,
          color: '#2563eb',
          onClick: () => onNavigate('/settings/company'),
          module: 'Company'
        },
        {
          title: 'Users',
          count: counts.users || 0,
          icon: ICONS.user,
          color: '#7c3aed',
          onClick: () => onNavigate('/settings/user'),
          module: 'User'
        },
        {
          title: 'Plans',
          count: counts.plans || 0,
          icon: ICONS.plan,
          color: '#0891b2',
          onClick: () => onNavigate('/settings/plan'),
          module: 'Plan'
        },
        {
          title: 'Coupons',
          count: counts.coupons || 0,
          icon: ICONS.coupon,
          color: '#dc2626',
          onClick: () => onNavigate('/settings/coupon'),
          module: 'Coupon'
        }
      ].filter(card => hasPermission(card.module, 'view'));
    }

    const allCards = [
      { title: 'Purchase Invoice', count: counts.purchaseInvoices || 0, icon: ICONS.purchase, color: '#7c3aed', onClick: () => onNavigate('/purchase-invoice'), module: 'Purchase Order' },
      { title: 'Invoice', count: counts.invoices || 0, icon: ICONS.invoice, color: '#0891b2', onClick: () => onNavigate('/invoice'), module: 'Invoice' },
      { title: 'Seller', count: counts.sellers || 0, icon: ICONS.seller, color: '#111827', onClick: () => onNavigate('/seller'), module: 'Seller' },
      { title: 'Customer', count: counts.customers || 0, icon: ICONS.customer, color: '#2563eb', onClick: () => onNavigate('/customer'), module: 'Customer' },
      { title: 'Transporter', count: counts.transporters || 0, icon: ICONS.transporter, color: '#4f46e5', onClick: () => onNavigate('/transporter'), module: 'Transporter' },
      { title: 'Product', count: counts.products || 0, icon: ICONS.product, color: '#374151', onClick: () => onNavigate('/product'), module: 'Product' },
      { title: 'Category', count: counts.categories || 0, icon: ICONS.category, color: '#dc2626', onClick: () => onNavigate('/category'), module: 'Category' },
      { title: 'Stock In', count: counts.totalInStock || 0, icon: ICONS.inStock, color: '#16a34a', onClick: () => onNavigate('/in-stock'), module: 'InStock' },
      { title: 'Stock Out', count: counts.totalOutStock || 0, icon: ICONS.outStock, color: '#16a34a', onClick: () => onNavigate('/out-stock'), module: 'OutStock' },
      { title: 'Purchase Amount', count: `₹${(counts.totalPurchaseAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ICONS.money, color: '#0b3a54', onClick: () => onNavigate('/purchase-invoice'), module: 'Purchase Order' },
      { title: 'Sale Amount', count: `₹${(counts.totalSalesAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ICONS.money, color: '#059669', onClick: () => onNavigate('/invoice'), module: 'Invoice' },
      { title: 'Total Loss', count: `₹${(counts.totalLoss || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: ICONS.alert, color: '#ef4444' },
    ];

    return allCards.filter(card => {
      if (!card.module) return true;
      return hasPermission(card.module, 'view');
    });
  }, [dashboardStats.counts, hasPermission, onNavigate, isSuperAdmin]);

  return (
    <div className="dashboard">
      <div style={{
        background: 'linear-gradient(135deg, #0b3a54 0%, #16a34a 100%)',
        padding: '24px 32px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: '600',
          margin: 0,
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}>
          {welcomeMessage}
        </h2>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            className="dashboard-card"
            style={{ '--card-color': card.color }}
            onClick={card.onClick}
            disabled={!card.onClick}
          >
            <div className="dashboard-card__top">
              <span className="dashboard-card__count">{card.count}</span>
              <div className="dashboard-card__icon">{card.icon}</div>
            </div>
            <div className="dashboard-card__bottom">
              <h3 className="dashboard-card__title">{card.title}</h3>
            </div>
          </button>
        ))}
      </div>

      {!isSuperAdmin && (
        <>
          <DashboardTables
            purchaseData={mappedRecentPurchasePayments}
            salesData={mappedRecentSalesPayments}
          />

          <div className="dashboard-tables mt-32">
            <LowStockAlertTable products={mappedLowStock} />
            <PieChartComponent data={dashboardStats.pieData || []} />
          </div>

          <DashboardCharts
            salesData={dashboardStats.salesHistory || []}
            purchaseVsPaymentData={dashboardStats.purchaseVsPayment || []}
          />
        </>
      )}
    </div>
  );
}

export default Dashboard;

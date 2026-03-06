import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { usePermissionContext } from '../../contexts/PermissionContext';
import { io } from 'socket.io-client';
import API_BASE_URL from '../../config/apiConfig';

const SOCKET_URL = API_BASE_URL.replace('/api', '');

export const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'purchase-invoice', label: 'Purchase Invoice', path: '/purchase-invoice', module: 'Purchase Order' },
  { key: 'invoice', label: 'Invoice', path: '/invoice', module: 'Invoice' },
  { key: 'in-stock', label: 'In Stock', path: '/in-stock', module: 'InStock' },
  { key: 'out-stock', label: 'Out Stock', path: '/out-stock', module: 'OutStock' },
  { key: 'seller', label: 'Seller', path: '/seller', module: 'Seller' },
  { key: 'customer', label: 'Customer', path: '/customer', module: 'Customer' },
  { key: 'transporter', label: 'Transporter', path: '/transporter', module: 'Transporter' },
  { key: 'product', label: 'Product', path: '/product', module: 'Product' },
  { key: 'category', label: 'Category', path: '/category', module: 'Category' },
  { key: 'expenses', label: 'Expenses', path: '/expenses', module: 'Expense' },
  { key: 'chat', label: 'Live Chat', path: '/chat' },
];

export const SETTINGS_ITEMS = [
  { key: 'company', label: 'Company', path: '/settings/company', module: 'Company' },
  { key: 'user', label: 'User', path: '/settings/user', module: 'User' },
  { key: 'grade', label: 'Grade', path: '/settings/grade', module: 'Grade' },
  { key: 'customer-type', label: 'Customer Type', path: '/settings/customer-type', module: 'CustomerType' },
  { key: 'invoice-name', label: 'Invoice Name', path: '/settings/invoice-name', module: 'InvoiceName' },
  { key: 'payment-mode', label: 'Payment Mode', path: '/settings/payment-mode', module: 'PaymentMode' },
  { key: 'sale-type', label: 'Sale Type', path: '/settings/sale-type', module: 'SaleType' },
  { key: 'color', label: 'Color', path: '/settings/color', module: 'Color' },
  { key: 'expenses-purpose', label: 'Expenses Purpose', path: '/settings/expenses-purpose', module: 'ExpensePurpose' },
  { key: 'invoice-copy', label: 'Invoice Copy', path: '/settings/invoice-copy', module: 'Invoice Copy' },
  { key: 'plan', label: 'Plans', path: '/settings/plan', module: 'Plan' },
  { key: 'coupon', label: 'Coupons', path: '/settings/coupon', module: 'Coupon' },
];

function AppLayout({ children, activeKey, activeTitle, onNavSelect, onLogout }) {
  const { hasPermission, company, loading, appLoading } = usePermissionContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const socketRef = React.useRef(null);

  React.useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    // Initial fetch
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/chat/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (isSubscribed) {
          setUnreadCount(data.count);
        }
      } catch (err) {
        // console.error('Error fetching unread count:', err);
      }
    };
    fetchUnread();

    // Socket for real-time updates
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
    }
    const socket = socketRef.current;

    const handleConnect = () => {
      socket.emit('identify', token);
    };

    const handleUnreadUpdate = (data) => {
      // Ignore if we are the sender (though server shouldn't send it)
      const user = JSON.parse(sessionStorage.getItem('user'));
      if (data && data.senderId === user?._id) return;

      if (isSubscribed) {
        fetchUnread();
      }
    };

    const handleUnreadCleared = () => {
      if (isSubscribed) {
        fetchUnread();
      }
    };

    socket.on('connect', handleConnect);
    socket.on('unreadUpdate', handleUnreadUpdate);
    socket.on('unreadCleared', handleUnreadCleared);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      isSubscribed = false;
      socket.off('connect', handleConnect);
      socket.off('unreadUpdate', handleUnreadUpdate);
      socket.off('unreadCleared', handleUnreadCleared);
      // We don't disconnect here in development to avoid strict mode issues
      // The socket will be disconnected when the user logs out (token becomes null)
      // or when the browser session ends.
    };
  }, []);

  const filteredItems = useMemo(() => {
    const userRole = JSON.parse(sessionStorage.getItem('user'))?.role;
    let baseItems = [];

    if (userRole === 'SUPER_ADMIN') {
      baseItems = [
        { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        { key: 'company', label: 'Company List', path: '/settings/company', module: 'Company' },
        { key: 'user', label: 'User', path: '/settings/user', module: 'User' },
        { key: 'plan', label: 'Plans', path: '/settings/plan', module: 'Plan' },
        { key: 'coupon', label: 'Coupons', path: '/settings/coupon', module: 'Coupon' },
        { key: 'chat', label: 'Live Chat', path: '/chat' }
      ].filter(item => {
        if (item.key === 'dashboard' || item.key === 'chat') return true;
        return hasPermission(item.module, 'view');
      });
    } else {
      baseItems = MENU_ITEMS.filter(item => {
        if (item.key === 'dashboard' || item.key === 'chat') return true;
        return hasPermission(item.module, 'view');
      });
    }

    return baseItems.map(item => {
      if (item.key === 'chat' && unreadCount > 0) {
        return { ...item, badge: unreadCount };
      }
      return item;
    });
  }, [hasPermission, unreadCount]);

  const filteredSettingsItems = useMemo(() => {
    const userRole = JSON.parse(sessionStorage.getItem('user'))?.role;
    if (userRole === 'SUPER_ADMIN') {
      return [];
    }
    return SETTINGS_ITEMS.filter(item => {
      // If module is not defined, we might want to restrict it or show it.
      // For 'Company', if it's missing in permissions, hasPermission will return false for non-superadmins.
      return hasPermission(item.module, 'view');
    });
  }, [hasPermission]);

  const user = JSON.parse(sessionStorage.getItem('user'));
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="app-shell">
      <Sidebar
        companyName={isSuperAdmin ? "Super Admin" : (company?.companyName || "Asencia")}
        companyLogo={company?.companyLogoImage}
        isSuperAdmin={isSuperAdmin}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        onClose={() => setSidebarOpen(false)}
        items={filteredItems}
        settingsItems={filteredSettingsItems}
        activeKey={activeKey}
        onSelect={(key) => {
          onNavSelect(key);
          setSidebarOpen(false);
        }}
      />

      <div className="app-shell__content">
        <Header
          title={activeTitle || ''}
          onOpenSidebar={() => setSidebarOpen(true)}
          profile={{
            name: JSON.parse(sessionStorage.getItem('user'))?.userName || 'User',
            role: JSON.parse(sessionStorage.getItem('user'))?.role || 'Profile',
            image: JSON.parse(sessionStorage.getItem('user'))?.userProfile || ''
          }}
          onLogout={onLogout}
        />
        <main className="app-shell__main" role="main">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default AppLayout;

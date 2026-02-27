import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../config/apiConfig';
import superLogo from '../../assets/images/super_logo.png';

const SERVER_URL = API_BASE_URL.replace('/api', '');

function NavIcon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: 'nav-icon__svg',
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M12 12V3L4 7v5h8Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 12h8V7l-8-4v9Z" stroke="currentColor" strokeWidth="2" />
          <path d="M4 12v5l8 4v-9H4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 12v9l8-4v-5h-8Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'purchase-invoice':
    case 'invoice':
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6V3Z" stroke="currentColor" strokeWidth="2" />
          <path d="M15 3v3h3" stroke="currentColor" strokeWidth="2" />
          <path d="M8 11h8M8 15h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'in-stock':
      return (
        <svg {...common}>
          <path d="M4 7h16v14H4V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 7V5h8v2" stroke="currentColor" strokeWidth="2" />
          <path d="M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 14l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'out-stock':
      return (
        <svg {...common}>
          <path d="M4 7h16v14H4V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 7V5h8v2" stroke="currentColor" strokeWidth="2" />
          <path d="M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 13l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'seller':
      return (
        <svg {...common}>
          <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 8h3M18.5 6.5v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'customer':
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M4 21a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'transporter':
      return (
        <svg {...common}>
          <path d="M3 7h11v10H3V7Z" stroke="currentColor" strokeWidth="2" />
          <path d="M14 10h4l3 3v4h-7v-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" stroke="currentColor" strokeWidth="2" />
          <path d="M18 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'product':
      return (
        <svg {...common}>
          <path d="M12 3l8 4-8 4-8-4 8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M4 7v10l8 4 8-4V7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M12 11v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'category':
      return (
        <svg {...common}>
          <path d="M5 5h6v6H5V5Z" stroke="currentColor" strokeWidth="2" />
          <path d="M13 5h6v6h-6V5Z" stroke="currentColor" strokeWidth="2" />
          <path d="M5 13h6v6H5v-6Z" stroke="currentColor" strokeWidth="2" />
          <path d="M13 13h6v6h-6v-6Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'company':
      return (
        <svg {...common}>
          <path d="M3 21h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 21V7l7-4 7 4v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 21V11h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'expenses':
      return (
        <svg {...common}>
          <path d="M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M17 7c0-2-2-3-5-3S7 5 7 7s2 3 5 3 5 1 5 3-2 3-5 3-5-1-5-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'plan':
      return (
        <svg {...common}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'coupon':
      return (
        <svg {...common}>
          <path d="M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M21 7.5a2.5 2.5 0 0 0-2.5-2.5H16l-3-3v3.5l-3-3v3.5H3.5A2.5 2.5 0 0 0 1 7.5v9A2.5 2.5 0 0 0 3.5 19H7l3 3v-3.5l3 3v-3.5h2.5a2.5 2.5 0 0 0 2.5-2.5v-9z" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function Sidebar({
  companyLogo,
  companyName,
  isOpen,
  isCollapsed,
  isSuperAdmin,
  onToggleCollapsed,
  onClose,
  items,
  settingsItems,
  activeKey,
  onSelect,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const isSettingsActive = useMemo(
    () => settingsItems.some((i) => i.key === activeKey),
    [settingsItems, activeKey]
  );

  useEffect(() => {
    if (isSettingsActive) setSettingsOpen(true);
  }, [isSettingsActive]);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--open' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__top">
          <div
            className="sidebar__brand"
            onClick={() => isCollapsed && onToggleCollapsed()}
            style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
          >
            <img
              className="sidebar__logo"
              src={isSuperAdmin
                ? superLogo
                : (companyLogo
                  ? (companyLogo.startsWith('data:') ? companyLogo : `${SERVER_URL}/${companyLogo.startsWith('/') ? companyLogo.substring(1) : companyLogo}`)
                  : superLogo)
              }
              alt={isSuperAdmin ? "Super Admin Logo" : (companyName || "Asencia Logo")}
            />
            {!isCollapsed && <div className="sidebar__brandText">
              <div className="sidebar__brandName">{companyName || "Asencia"}</div>
            </div>}
          </div>

          <div className="sidebar__topActions">
            <button
              type="button"
              className="icon-btn sidebar__toggle"
              onClick={onToggleCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? '›' : '‹'}
            </button>

            <button type="button" className="icon-btn sidebar__close" onClick={onClose} aria-label="Close sidebar">
              ✕
            </button>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Sidebar navigation">
          <div className="nav-group">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`nav-item ${activeKey === item.key ? 'nav-item--active' : ''}`}
                onClick={() => onSelect(item.key)}
                title={item.label}
              >
                <span className="nav-icon" aria-hidden="true">
                  <NavIcon name={item.key} />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </div>

          {settingsItems.length > 0 && (
            <div className="nav-group">
              <div className="sidebar-sectionLabel">SETTINGS</div>

              <button
                type="button"
                className={`settings-head ${settingsOpen ? 'settings-head--open' : ''}`}
                onClick={() => setSettingsOpen((v) => !v)}
                aria-expanded={settingsOpen}
                title="Settings"
              >
                <span className="settings-head__left">
                  <span className="settings-head__icon" aria-hidden="true">⚙</span>
                  <span className="settings-head__text">Settings</span>
                </span>

                <span className="settings-head__chev" aria-hidden="true">▾</span>
              </button>

              <div className={`settings-list ${settingsOpen ? 'settings-list--open' : ''}`}>
                {settingsItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`settings-item ${activeKey === item.key ? 'settings-item--active' : ''}`}
                    onClick={() => onSelect(item.key)}
                    title={item.label}
                  >
                    <span className="settings-item__dot" aria-hidden="true" />
                    <span className="settings-item__label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;

import React from 'react';
import ProfileDropdown from '../ProfileDropdown';

function Header({ title, onOpenSidebar, profile, onLogout }) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <button
          type="button"
          className="icon-btn app-header__menu"
          onClick={onOpenSidebar}
          aria-label="Open sidebar"
        >
          <span className="icon-btn__bars" />
        </button>
      </div>

      <div className="app-header__right">
        <ProfileDropdown
          userName={profile?.name || 'User'}
          userImage={profile?.image}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

export default Header;

import React from 'react';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__inner">© {new Date().getFullYear()} Asencia</div>
    </footer>
  );
}

export default Footer;

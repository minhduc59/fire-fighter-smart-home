import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Theo dõi cuộn trang để thay đổi kiểu header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng menu mobile khi chuyển trang
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <div className="header-brand">
          <i className="fa-brands fa-nfc-directional"></i>
          <h1>FireGuard</h1>
        </div>
        
        <div className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <i className="fa-solid fa-timeline" style={{ marginRight: '5px' }}></i>
          <span>Dashboard</span>
          </Link>
          <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
            <i className="fas fa-history" style={{marginRight:'5px'}}></i>
            <span>History</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
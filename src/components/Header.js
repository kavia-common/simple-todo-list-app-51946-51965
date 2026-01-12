import React from 'react';
import './Header.css';

// PUBLIC_INTERFACE
const Header = () => {
  /**
   * Header component that displays the application title and branding.
   * Provides a consistent top navigation area for the app.
   */
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">
          <span className="header-icon">✓</span>
          TodoList
        </h1>
        <p className="header-subtitle">Stay organized, stay productive</p>
      </div>
    </header>
  );
};

export default Header;

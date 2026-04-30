import React from 'react';
import Header from './Header';
import Footer from './Footer';
import './Layout.css'; // 기본 스타일링을 위한 CSS

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="inner-container">
          <div className="utils">
            <Link to="/">HOME</Link>
            {!user ? (
              <>
                <Link to="/login">로그인</Link>
                <Link to="/register">회원가입</Link>
                <Link to="/admin-login">관리자</Link>
              </>
            ) : (
              <>
                <span>{user.phone_number || user.username}님</span>
                <button onClick={handleLogout} className="logout-btn">로그아웃</button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="header-main">
        <div className="inner-container">
          <h1 className="logo">
            <Link to="/">
              <img src="/images/logo.png" alt="서울올림픽파크텔" />
            </Link>
          </h1>
          <nav className="gnb">
            <Link to="/">일일알바 채용정보</Link>
            <Link to="/notices">공지사항</Link>
            <Link to="/mypage">마이페이지</Link>
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <Link to="/admin" style={{ color: 'red' }}>관리자 대시보드</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

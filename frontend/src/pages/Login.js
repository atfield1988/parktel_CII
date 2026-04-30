// frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(phone_number, password);
      navigate('/mypage');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || '로그인에 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd' }}>
      <h2>회원 로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="전화번호 (숫자만)"
            value={phone_number}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#1f77ce', color: 'white', border: 'none' }}>
          로그인
        </button>
      </form>
      <div style={{ marginTop: '10px' }}>
        <Link to="/register">회원가입</Link> |{' '}
        <Link to="/admin-login">관리자 로그인</Link>
      </div>
    </div>
  );
};

export default Login;

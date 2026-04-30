// frontend/src/pages/Register.js
import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [phone_number, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { phone_number });
      // 서버가 initial_password를 반환하면 이를 표시
      const initialPassword = response?.data?.initial_password;
      alert(
        `회원가입 신청이 완료되었습니다.\n` +
        (initialPassword
          ? `임시 비밀번호: [ ${initialPassword} ]\n관리자 승인 후 로그인하세요.`
          : `관리자 승인 후 로그인하세요.`)
      );
      navigate('/login');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ddd' }}>
      <h2>회원가입</h2>
      <p>관리자 승인을 위해 전화번호로 가입합니다.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="전화번호 (10~11자리 숫자만)"
            value={phone_number}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: '#1f77ce', color: 'white', border: 'none' }}>
          {loading ? '신청 중...' : '회원가입 신청'}
        </button>
      </form>
    </div>
  );
};

export default Register;

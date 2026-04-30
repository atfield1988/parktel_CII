// frontend/src/pages/EnhancedMypage.js
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import './EnhancedMypage.css';

const EnhancedMypage = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mypage/my-applications');
      setApplications(response.data);
    } catch (err) {
      setError('신청 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (applicationId) => {
    if (!window.confirm('정말 신청을 취소하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/applications/${applicationId}`);
      alert('신청이 취소되었습니다.');
      fetchMyApplications();
    } catch (err) {
      alert(err.response?.data?.detail || '취소에 실패했습니다.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await api.put('/mypage/change-password', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      });
      alert('비밀번호가 변경되었습니다.');
      setShowPasswordForm(false);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      alert(err.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'pending': return '대기중';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'pending': return 'status-pending';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  if (loading) return <div className="loading">로딩 중...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="enhanced-mypage">
      <div className="mypage-header">
        <h2>마이페이지</h2>
      </div>

      {/* User Info Section */}
      <div className="user-info-section">
        <div className="info-card">
          <h3>내 정보</h3>
          <div className="info-row">
            <span className="label">전화번호:</span>
            <span className="value">{user?.phone_number}</span>
          </div>
          {user?.username && (
            <div className="info-row">
              <span className="label">사용자명:</span>
              <span className="value">{user.username}</span>
            </div>
          )}
          <div className="info-row">
            <span className="label">가입일:</span>
            <span className="value">{formatDate(user?.created_at)}</span>
          </div>
          <button 
            className="btn btn-outline"
            onClick={() => setShowPasswordForm(true)}
          >
            비밀번호 변경
          </button>
        </div>
      </div>

      {/* Applications Section */}
      <div className="applications-section">
        <h3>내 신청 내역 ({applications.length}건)</h3>
        
        {applications.length === 0 ? (
          <div className="empty-state">
            <p>신청 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="applications-list">
            {applications.map(app => (
              <div key={app.id} className="application-card">
                <div className="card-header">
                  <h4>{app.schedule.title}</h4>
                  <span className={`status-badge ${getStatusClass(app.status)}`}>
                    {getStatusText(app.status)}
                  </span>
                </div>
                
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">근무 날짜:</span>
                    <span className="value">{formatDate(app.schedule.work_date)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">근무 시간:</span>
                    <span className="value">
                      {app.schedule.start_time_str} ~ {app.schedule.end_time_str}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">신청일:</span>
                    <span className="value">{formatDateTime(app.created_at)}</span>
                  </div>
                  {app.schedule.description && (
                    <div className="info-row">
                      <span className="label">설명:</span>
                      <span className="value">{app.schedule.description}</span>
                    </div>
                  )}
                </div>
                
                {app.status === 'pending' && (
                  <div className="card-footer">
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancelApplication(app.id)}
                    >
                      신청 취소
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>비밀번호 변경</h3>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>현재 비밀번호 *</label>
                <input
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(e) => setPasswordForm(prev => ({...prev, old_password: e.target.value}))}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label>새 비밀번호 *</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm(prev => ({...prev, new_password: e.target.value}))}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label>새 비밀번호 확인 *</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm(prev => ({...prev, confirm_password: e.target.value}))}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
                  }}
                  className="btn btn-secondary"
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  변경
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMypage;

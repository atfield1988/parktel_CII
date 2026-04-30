// frontend/src/pages/Mypage.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const MyPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchMyApplications();
  }, [user]);

  const fetchMyApplications = async () => {
    try {
      const response = await api.get('/mypage/my-applications');
      setApplications(response.data);
    } catch (err) {
      console.error('신청 내역 로딩 실패', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (applicationId, status) => {
    if (status !== 'pending') {
      alert('승인된 신청은 취소할 수 없습니다.');
      return;
    }

    if (!window.confirm('이 신청을 취소하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/applications/${applicationId}`);
      alert('신청이 취소되었습니다.');
      fetchMyApplications(); // Refresh list
    } catch (err) {
      const detail = err?.response?.data?.detail;
      alert('취소 실패: ' + (detail || '서버 오류'));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { background: '#FFA500', color: 'white', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' },
      approved: { background: '#28a745', color: 'white', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' },
      rejected: { background: '#dc3545', color: 'white', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }
    };

    const labels = {
      pending: '대기중',
      approved: '승인됨',
      rejected: '거절됨'
    };

    return (
      <span style={styles[status] || {}}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '20px' }}>
      <h2>마이페이지</h2>
      <h3>{user?.phone_number || user?.username}님, 환영합니다.</h3>
      <p>
        <Link to="/change-password" style={{ color: '#0066cc', textDecoration: 'underline' }}>
          비밀번호 변경
        </Link>
      </p>

      <h3 style={{ marginTop: '30px' }}>나의 신청 내역</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>신청일</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>근무 내용</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>근무일</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>근무시간</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>상태</th>
            <th style={{ padding: '12px', border: '1px solid #ddd' }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {applications && applications.length > 0 ? (
            applications.map((app) => (
              <tr key={app.id}>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {new Date(app.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                  {app.schedule ? (
                    <Link 
                      to={`/schedules/${app.schedule.id}`}
                      style={{ color: '#0066cc', textDecoration: 'underline' }}
                    >
                      {app.schedule.title}
                    </Link>
                  ) : (
                    <span style={{ color: '#999' }}>삭제된 스케줄</span>
                  )}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {app.schedule ? new Date(app.schedule.work_date).toLocaleDateString() : '-'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {app.schedule ? `${app.schedule.start_time_str} ~ ${app.schedule.end_time_str}` : '-'}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {getStatusBadge(app.status)}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {app.status === 'pending' ? (
                    <button
                      onClick={() => handleCancelApplication(app.id, app.status)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      취소
                    </button>
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: '20px', border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>
                신청 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {applications && applications.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '5px' }}>
          <h4 style={{ marginTop: 0 }}>📌 안내사항</h4>
          <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
            <li><strong>대기중:</strong> 관리자 승인을 기다리고 있습니다. 취소 가능합니다.</li>
            <li><strong>승인됨:</strong> 신청이 승인되었습니다. 근무일에 출근해주세요.</li>
            <li><strong>거절됨:</strong> 신청이 거절되었습니다.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyPage;

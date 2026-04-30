// frontend/src/pages/NoticeDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './NoticeDetail.css';

const NoticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNoticeDetail();
  }, [id]);

  const fetchNoticeDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/notices/${id}`);
      setNotice(response.data);
    } catch (err) {
      console.error('공지사항 로딩 실패', err);
      setError('공지사항을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/notices');
  };

  if (loading) {
    return (
      <div className="notice-detail-container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="notice-detail-container">
        <div className="error">{error || '공지사항을 찾을 수 없습니다.'}</div>
        <button onClick={handleBack} className="btn btn-secondary">
          목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="notice-detail-container">
      <div className="notice-detail-card">
        {/* Header */}
        <div className="notice-header">
          <div className="notice-title-section">
            {notice.is_pinned && <span className="pin-badge">📌 필독</span>}
            <h2 className="notice-title">{notice.title}</h2>
          </div>
          <div className="notice-meta">
            <span className="meta-item">
              <strong>작성일:</strong> {new Date(notice.created_at).toLocaleString('ko-KR')}
            </span>
            <span className="meta-item">
              <strong>조회수:</strong> {notice.view_count.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="notice-content">
          <div className="content-text">
            {notice.content.split('\n').map((line, index) => (
              <p key={index}>{line || '\u00A0'}</p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="notice-footer">
          <button onClick={handleBack} className="btn btn-primary">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetail;

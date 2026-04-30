// frontend/src/pages/NoticeList.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';

const NoticeList = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await api.get('/notices');
        setNotices(response.data);
      } catch (err) {
        console.error('공지사항 로딩 실패', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <h2>공지사항</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>번호</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>제목</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>작성일</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>조회수</th>
          </tr>
        </thead>
        <tbody>
          {notices.length > 0 ? (
            notices.map((notice) => (
              <tr key={notice.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {notice.is_pinned ? <span style={{ color: 'red' }}>[필독]</span> : notice.id}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <Link to={`/notices/${notice.id}`}>{notice.title}</Link>
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {new Date(notice.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                  {notice.view_count}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                등록된 공지사항이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default NoticeList;

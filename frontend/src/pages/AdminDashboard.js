// frontend/src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  // User Management State
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // Schedule Management State
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    work_date: '',
    start_time_str: '',
    end_time_str: '',
    capacity: 1
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  
  // Notice Management State
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    is_pinned: false
  });
  const [editingNotice, setEditingNotice] = useState(null);
  
  // Grant Admin State
  const [grantAdminModal, setGrantAdminModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminUsername, setAdminUsername] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Fetch data based on active tab
  useEffect(() => {
    if (activeTab === 'users') {
      fetchPendingUsers();
      fetchAllUsers();
    } else if (activeTab === 'schedules') {
      fetchSchedules();
    } else if (activeTab === 'notices') {
      fetchNotices();
    }
  }, [activeTab]);

  // ===== USER MANAGEMENT =====
  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/admin/pending-users');
      setPendingUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch pending users', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setAllUsers(response.data);
    } catch (err) {
      console.error('Failed to fetch all users', err);
    }
  };

  const handleUserApproval = async (user_id, status) => {
    const action = status === 'approved' ? '승인' : '거절';
    if (!window.confirm(`이 사용자를 '${action}' 하시겠습니까?`)) return;

    try {
      await api.post('/admin/approve-user', { user_id, status });
      fetchPendingUsers();
      fetchAllUsers();
      alert(`사용자가 ${action}되었습니다.`);
    } catch (err) {
      alert('처리 실패: ' + (err?.response?.data?.detail || '서버 오류'));
    }
  };

  const openGrantAdminModal = (user) => {
    setSelectedUser(user);
    setAdminUsername('');
    setGrantAdminModal(true);
  };

  const handleGrantAdmin = async () => {
    if (!adminUsername.trim()) {
      alert('관리자 ID를 입력하세요.');
      return;
    }

    try {
      await api.post('/admin/grant-admin', {
        user_id: selectedUser.id,
        username: adminUsername
      });
      alert('관리자 권한이 부여되었습니다.');
      setGrantAdminModal(false);
      fetchAllUsers();
    } catch (err) {
      alert('실패: ' + (err?.response?.data?.detail || '서버 오류'));
    }
  };

  // ===== SCHEDULE MANAGEMENT =====
  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules');
      setSchedules(response.data);
    } catch (err) {
      console.error('Failed to fetch schedules', err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert date and times to datetime
      const workDate = new Date(scheduleForm.work_date);
      const [startHour, startMin] = scheduleForm.start_time_str.split(':');
      const [endHour, endMin] = scheduleForm.end_time_str.split(':');
      
      const startTime = new Date(workDate);
      startTime.setHours(parseInt(startHour), parseInt(startMin), 0);
      
      const endTime = new Date(workDate);
      endTime.setHours(parseInt(endHour), parseInt(endMin), 0);

      const payload = {
        ...scheduleForm,
        work_date: workDate.toISOString(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        capacity: parseInt(scheduleForm.capacity)
      };

      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule.id}`, payload);
        alert('스케줄이 수정되었습니다.');
      } else {
        await api.post('/schedules', payload);
        alert('스케줄이 생성되었습니다.');
      }

      resetScheduleForm();
      fetchSchedules();
    } catch (err) {
      alert('실패: ' + (err?.response?.data?.detail || '서버 오류'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSchedule = (schedule) => {
    const workDate = new Date(schedule.work_date).toISOString().split('T')[0];
    setScheduleForm({
      title: schedule.title,
      description: schedule.description || '',
      work_date: workDate,
      start_time_str: schedule.start_time_str,
      end_time_str: schedule.end_time_str,
      capacity: schedule.capacity
    });
    setEditingSchedule(schedule);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('이 스케줄을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/schedules/${scheduleId}`);
      alert('스케줄이 삭제되었습니다.');
      fetchSchedules();
    } catch (err) {
      alert('삭제 실패: ' + (err?.response?.data?.detail || '서버 오류'));
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      title: '',
      description: '',
      work_date: '',
      start_time_str: '',
      end_time_str: '',
      capacity: 1
    });
    setEditingSchedule(null);
  };

  // ===== NOTICE MANAGEMENT =====
  const fetchNotices = async () => {
    try {
      const response = await api.get('/notices?limit=50');
      setNotices(response.data);
    } catch (err) {
      console.error('Failed to fetch notices', err);
    }
  };

  const handleNoticeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingNotice) {
        await api.put(`/notices/${editingNotice.id}`, noticeForm);
        alert('공지사항이 수정되었습니다.');
      } else {
        await api.post('/notices', noticeForm);
        alert('공지사항이 생성되었습니다.');
      }

      resetNoticeForm();
      fetchNotices();
    } catch (err) {
      alert('실패: ' + (err?.response?.data?.detail || '서버 오류'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotice = (notice) => {
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      is_pinned: notice.is_pinned
    });
    setEditingNotice(notice);
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('이 공지사항을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/notices/${noticeId}`);
      alert('공지사항이 삭제되었습니다.');
      fetchNotices();
    } catch (err) {
      alert('삭제 실패: ' + (err?.response?.data?.detail || '서버 오류'));
    }
  };

  const resetNoticeForm = () => {
    setNoticeForm({
      title: '',
      content: '',
      is_pinned: false
    });
    setEditingNotice(null);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>관리자 대시보드</h2>
      <p>{user?.username}님, 환영합니다.</p>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '2px solid #ddd', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'users' ? '#0066cc' : '#f5f5f5',
            color: activeTab === 'users' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px 5px 0 0',
            marginRight: '5px',
            cursor: 'pointer'
          }}
        >
          사용자 관리
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'schedules' ? '#0066cc' : '#f5f5f5',
            color: activeTab === 'schedules' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px 5px 0 0',
            marginRight: '5px',
            cursor: 'pointer'
          }}
        >
          스케줄 관리
        </button>
        <button
          onClick={() => setActiveTab('notices')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'notices' ? '#0066cc' : '#f5f5f5',
            color: activeTab === 'notices' ? 'white' : '#333',
            border: 'none',
            borderRadius: '5px 5px 0 0',
            cursor: 'pointer'
          }}
        >
          공지사항 관리
        </button>
      </div>

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div>
          <h3>신규 회원 승인 대기 목록</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>전화번호</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>신청일</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>처리</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length > 0 ? (
                pendingUsers.map((pUser) => (
                  <tr key={pUser.id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{pUser.id}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{pUser.phone_number}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(pUser.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleUserApproval(pUser.id, 'approved')}
                        style={{ background: 'blue', color: 'white', marginRight: '5px', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleUserApproval(pUser.id, 'rejected')}
                        style={{ background: 'red', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        거절
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    승인 대기 중인 회원이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {user?.role === 'super_admin' && (
            <>
              <h3>전체 사용자 목록 (관리자 권한 부여)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>전화번호</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>사용자명</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>역할</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>상태</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.filter(u => u.status === 'approved' && u.role === 'user').map((u) => (
                    <tr key={u.id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.id}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.phone_number}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.username || '-'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.role}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.status}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <button
                          onClick={() => openGrantAdminModal(u)}
                          style={{ background: 'purple', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          관리자 권한 부여
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* SCHEDULE MANAGEMENT TAB */}
      {activeTab === 'schedules' && (
        <div>
          <h3>{editingSchedule ? '스케줄 수정' : '스케줄 생성'}</h3>
          <form onSubmit={handleScheduleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '5px', marginBottom: '30px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>제목:</label><br />
              <input
                type="text"
                value={scheduleForm.title}
                onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>설명:</label><br />
              <textarea
                value={scheduleForm.description}
                onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                style={{ width: '100%', padding: '8px', minHeight: '60px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>근무일:</label><br />
              <input
                type="date"
                value={scheduleForm.work_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, work_date: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label>시작 시간 (HH:MM):</label><br />
                <input
                  type="text"
                  placeholder="09:00"
                  value={scheduleForm.start_time_str}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time_str: e.target.value })}
                  pattern="[0-9]{2}:[0-9]{2}"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>종료 시간 (HH:MM):</label><br />
                <input
                  type="text"
                  placeholder="18:00"
                  value={scheduleForm.end_time_str}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time_str: e.target.value })}
                  pattern="[0-9]{2}:[0-9]{2}"
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>정원:</label><br />
              <input
                type="number"
                min="1"
                value={scheduleForm.capacity}
                onChange={(e) => setScheduleForm({ ...scheduleForm, capacity: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <button type="submit" disabled={loading} style={{ background: '#0066cc', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>
                {loading ? '처리 중...' : (editingSchedule ? '수정' : '생성')}
              </button>
              {editingSchedule && (
                <button type="button" onClick={resetScheduleForm} style={{ background: '#999', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  취소
                </button>
              )}
            </div>
          </form>

          <h3>스케줄 목록</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>제목</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>근무일</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>시간</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>정원</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length > 0 ? (
                schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{schedule.title}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(schedule.work_date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {schedule.start_time_str} ~ {schedule.end_time_str}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {schedule.current_applicants} / {schedule.capacity}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEditSchedule(schedule)}
                        style={{ background: 'orange', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        style={{ background: 'red', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    등록된 스케줄이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* NOTICE MANAGEMENT TAB */}
      {activeTab === 'notices' && (
        <div>
          <h3>{editingNotice ? '공지사항 수정' : '공지사항 생성'}</h3>
          <form onSubmit={handleNoticeSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '5px', marginBottom: '30px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label>제목:</label><br />
              <input
                type="text"
                value={noticeForm.title}
                onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                required
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>내용:</label><br />
              <textarea
                value={noticeForm.content}
                onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', minHeight: '120px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={noticeForm.is_pinned}
                  onChange={(e) => setNoticeForm({ ...noticeForm, is_pinned: e.target.checked })}
                />
                {' '}상단 고정
              </label>
            </div>
            <div>
              <button type="submit" disabled={loading} style={{ background: '#0066cc', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>
                {loading ? '처리 중...' : (editingNotice ? '수정' : '생성')}
              </button>
              {editingNotice && (
                <button type="button" onClick={resetNoticeForm} style={{ background: '#999', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  취소
                </button>
              )}
            </div>
          </form>

          <h3>공지사항 목록</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>제목</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>작성일</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>조회수</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>고정</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {notices.length > 0 ? (
                notices.map((notice) => (
                  <tr key={notice.id}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{notice.title}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {new Date(notice.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{notice.view_count}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {notice.is_pinned ? '✓' : '-'}
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleEditNotice(notice)}
                        style={{ background: 'orange', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(notice.id)}
                        style={{ background: 'red', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    등록된 공지사항이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant Admin Modal */}
      {grantAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>관리자 권한 부여</h3>
            <p>사용자: {selectedUser?.phone_number}</p>
            <div style={{ marginBottom: '15px' }}>
              <label>관리자 ID:</label><br />
              <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="예: admin01"
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>
            <div>
              <button
                onClick={handleGrantAdmin}
                style={{ background: 'purple', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}
              >
                권한 부여
              </button>
              <button
                onClick={() => setGrantAdminModal(false)}
                style={{ background: '#999', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

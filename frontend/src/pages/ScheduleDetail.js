import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// [수정] 관리자용 신청자 목록 (승인/거절 기능 포함)
const AdminApplicantList = ({ scheduleId, onStatusChange }) => {
  const [applicants, setApplicants] = useState([]);  // 수정: 초기값 []
  const [loading, setLoading] = useState(true);
  // 신청자 목록을 불러오는 함수
  const fetchApplicants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/applications/schedule/${scheduleId}`);
      setApplicants(response.data);
    } catch (err) {
      console.error('신청자 목록 로딩 실패', err);
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);
  // 관리자가 신청 상태를 변경하는 핸들러
  const handleUpdateStatus = async (application_id, new_status) => {
    const actionText = new_status === 'approved' ? '승인' : '거절';
    if (!window.confirm(`이 신청을 '${actionText}'하시겠습니까?`)) {
      return;
    }
    try {
      // admin.py의 엔드포인트 호출
      await api.post('/admin/applications/update-status', {
        application_id,
        new_status
      });
     
      // 목록 새로고침 (또는 상태만 로컬에서 변경)
      setApplicants(
        applicants.map(app =>
          app.id === application_id ? {...app, status: new_status } : app
        )
      );
     
      // [중요] 부모 컴포넌트(ScheduleDetail)에 변경 사항을 알려 정원(current_applicants)을 새로고침
      onStatusChange();
    } catch (err) {
      alert(`처리 실패: ${err.response?.data?.detail || '서버 오류'}`);
    }
  };
  if (loading) return <p>신청자 목록 로딩 중...</p>;
  return (
    <div style={{ marginTop: '30px', borderTop: '2px solid #333' }}>
      <h3>관리자: 신청자 목록 (신청 시간순)</h3>
      {applicants && applicants.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>전화번호</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>신청시간</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>상태</th>
              <th style={{ padding: '8px', border: '1px solid #ddd' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map(app => (
              <tr key={app.id}>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{app.user?.phone_number || '-'}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(app.created_at).toLocaleString()}</td>
                <td style={{ padding: '8px', border: '1px solid #ddd', color: app.status === 'approved' ? 'green' : (app.status === 'rejected' ? 'red' : 'orange') }}>
                  {app.status}
                </td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => handleUpdateStatus(app.id, 'approved')} style={{ background: 'blue', color: 'white', marginRight: '5px' }}>승인</button>
                      <button onClick={() => handleUpdateStatus(app.id, 'rejected')} style={{ background: 'red', color: 'white' }}>거절</button>
                    </>
                  )}
                  {app.status === 'approved' && (
                     <button onClick={() => handleUpdateStatus(app.id, 'rejected')} style={{ background: 'gray', color: 'white' }}>승인 취소</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
         <p>신청자가 없습니다.</p>
      )}
    </div>
  );
};
// --- ScheduleDetail 메인 컴포넌트 ---
const ScheduleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
 
  // [오류 수정] const = useState(null);
  const [schedule, setSchedule] = useState(null);  // 수정: [schedule, setSchedule]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 스케줄 정보를 다시 불러오는 함수
  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      // [수정] 백엔드에서 이제 pending_applicants 포함된 데이터를 보냄
      const response = await api.get(`/schedules/${id}`);
      setSchedule(response.data);
    } catch (err) {
      setError('스케줄 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);  // 수정: [fetchSchedule]
  const handleApply = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    if (!window.confirm('이 스케줄에 신청하시겠습니까?')) return;
    try {
      await api.post('/applications/', { schedule_id: id });
      alert('신청이 완료되었습니다. 관리자 승인을 기다려주세요.');
      navigate('/mypage');
    } catch (err) {
      const detail = err?.response?.data?.detail;
      alert('신청 실패: ' + (detail || '서버 오류'));
    }
  };
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');  // 수정: !! 제거 (선택적)
  if (loading) return <p>로딩 중...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!schedule) return <p>스케줄 정보가 없습니다.</p>;
  // [신규] 마감 여부 계산
  const totalApplicants = (schedule.current_applicants || 0) + (schedule.pending_applicants || 0);
  const isFull = totalApplicants >= schedule.capacity;
  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <h1>{schedule.title}</h1>
      <p style={{ color: '#555', fontSize: '1.1em' }}>{schedule.description}</p>
      <hr />
      <p><strong>근무일:</strong> {new Date(schedule.work_date).toLocaleDateString()}</p>
      <p><strong>근무시간:</strong> {schedule.start_time_str} ~ {schedule.end_time_str}</p>
     
      {/* [신규] 신청 현황 UI 개선 */}
      <p><strong>신청 현황 (대기+승인 / 총 정원):</strong> {totalApplicants} / {schedule.capacity}</p>
      <p style={{ color: '#777' }}>(승인 완료: {schedule.current_applicants}명)</p>
     
      <hr />
      {/* [신규] '신청 마감' 시 버튼 비활성화 */}
      {!isAdmin && (
        <button
          onClick={handleApply}
          disabled={isFull}
          style={{
            padding: '15px 30px',
            fontSize: '1.2em',
            background: isFull ? 'gray' : 'green',
            color: 'white',
            border: 'none',
            cursor: isFull ? 'not-allowed' : 'pointer'
          }}
        >
          {isFull ? '신청 마감' : '이 스케줄에 신청하기'}
        </button>
      )}
      {isAdmin && (
        <AdminApplicantList
          scheduleId={id}
          onStatusChange={fetchSchedule}
        />
      )}
    </div>
  );
};
export default ScheduleDetail;
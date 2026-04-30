import React, { useState, useEffect } from 'react';
import Slider from 'react-slick'; // react-slick 임포트
import api from '../services/api';
import { Link } from 'react-router-dom';
import './Home.css'; // 별도 CSS 파일 필요

const Home = () => {
  const [schedules, setSchedules] = useState([]);  // 수정: [schedules, setSchedules] 및 초기값 []
  const [loading, setLoading] = useState(true);  // 수정: setLoading(true);
  const [error, setError] = useState(null);
  // 배너 캐러셀 설정
  const bannerSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
  };
  useEffect(() => {
    // 스케줄(채용공고) 목록 불러오기
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        // [수정] 백엔드에서 이제 pending_applicants 포함된 데이터를 보냄
        const response = await api.get('/schedules');
        setSchedules(response.data);
      } catch (err) {
        setError('데이터를 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedules();
  }, []);  // 수정: 빈 배열 추가
  // [신규] 마감 여부 계산 함수
  const getScheduleStatus = (schedule) => {
    // current_applicants (승인됨) + pending_applicants (대기중)
    const totalApplicants = (schedule.current_applicants || 0) + (schedule.pending_applicants || 0);  // 수정: || 0
   
    if (totalApplicants >= schedule.capacity) {
      return { isFull: true, text: '신청 마감' };
    }
    return { isFull: false, text: '신청 가능' };
  };
  return (
    <div className="home-container">
      {/* --- 배너 섹션 --- */}
      <div className="main-banner">
        <Slider {...bannerSettings}>
          <div>
            <img src="/images/banner1.jpg" alt="서울올림픽파크텔 외관" />
          </div>
          <div>
            <img src="/images/banner2.jpg" alt="호텔 웨딩홀" />
          </div>
          <div>
            <img src="/images/banner3.jpg" alt="호텔 연회장" />
          </div>
        </Slider>
      </div>
      {/* --- 채용정보 섹션 --- */}
      <div className="job-listing-section">
        <h2>일일알바 채용정보</h2>
        {loading && <p>로딩 중...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
       
        <table className="job-table">
          <thead>
            <tr>
              <th>근무일</th>
              <th>모집내용</th>
              <th>근무시간</th>
              <th>신청현황</th>
              <th>상태</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {schedules && schedules.length > 0 ? (
              schedules.map(job => {
                // [수정] 마감 여부 계산
                const status = getScheduleStatus(job);
                const totalApplicants = (job.current_applicants || 0) + (job.pending_applicants || 0);  // 수정: || 0
                return (
                  <tr key={job.id}>
                    <td>{new Date(job.work_date).toLocaleDateString()}</td>
                    <td>{job.title}</td>
                    <td>{job.start_time_str} ~ {job.end_time_str}</td>
                    <td>{`${totalApplicants} / ${job.capacity}`} (승인: {job.current_applicants})</td>
                    <td>
                      {status.isFull ?
                        <span className="status-closed">{status.text}</span> :
                        <span className="status-open">{status.text}</span>
                      }
                    </td>
                    <td>
                      <Link to={`/schedules/${job.id}`} className="apply-btn">상세보기</Link>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6">등록된 채용정보가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Home;
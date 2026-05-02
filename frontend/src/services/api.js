import axios from 'axios';

// 🔧 변경: 환경에 따라 자동으로 API URL 설정
const getApiBaseUrl = () => {
  // 1. Render 배포 환경 (환경 변수 사용)
  if (process.env.REACT_APP_API_URL) {
    // Render 환경 변수에는 도메인만 있으므로 끝에 '/api'를 붙여줍니다.
    // 예: https://parktel-backend.onrender.com -> https://parktel-backend.onrender.com/api
    return `${process.env.REACT_APP_API_URL}/api`;
  }

  // 2. 로컬 개발 환경
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8000/api';
  }

  // 3. 운영 기본값은 HTTPS만 허용
  return 'https://parktel-backend.onrender.com/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰이 있으면 헤더에 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

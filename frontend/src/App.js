import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Mypage from './pages/Mypage';
import AdminDashboard from './pages/AdminDashboard';
import ScheduleDetail from './pages/ScheduleDetail';
import NoticeList from './pages/NoticeList';
import NoticeDetail from './pages/NoticeDetail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/schedules/:id" element={<ScheduleDetail />} />
            <Route path="/notices" element={<NoticeList />} />
            <Route path="/notices/:id" element={<NoticeDetail />} />
            
            {/* Protected Routes - Require Login */}
            <Route element={<ProtectedRoute />}>
              <Route path="/mypage" element={<Mypage />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;

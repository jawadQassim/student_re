import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import { getRoleHomePath } from './data/roleRoutes';

function RootRedirect() {
  const { user } = useAuth();

  return <Navigate replace to={user ? getRoleHomePath(user.role) : '/login'} />;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();

  return user ? <Navigate replace to={getRoleHomePath(user.role)} /> : children;
}

function ProtectedRoute({ allowedRole, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (user.role !== allowedRole) {
    return <Navigate replace to={getRoleHomePath(user.role)} />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route element={<RootRedirect />} path="/" />
      <Route
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
        path="/login"
      />
      <Route
        element={
          <ProtectedRoute allowedRole="Admin">
            <DashboardLayout />
          </ProtectedRoute>
        }
        path="/admin/*"
      />
      <Route
        element={
          <ProtectedRoute allowedRole="Teacher">
            <DashboardLayout />
          </ProtectedRoute>
        }
        path="/teacher/*"
      />
      <Route
        element={
          <ProtectedRoute allowedRole="Student">
            <DashboardLayout />
          </ProtectedRoute>
        }
        path="/student/*"
      />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}

export default App;

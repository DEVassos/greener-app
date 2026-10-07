import { Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import AuthProvider from './providers/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Área pública: o dashboard abre direto, sem login */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Área restrita: sem sessão, o ProtectedRoute manda para /login */}
        <Route
          path="/configuracao"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

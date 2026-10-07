import { Navigate, Route, Routes } from 'react-router';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Área pública: o dashboard abre direto, sem login */}
      <Route path="/" element={<DashboardPage />} />

      {/* Área restrita: configuração do monitoramento */}
      <Route path="/configuracao" element={<SettingsPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

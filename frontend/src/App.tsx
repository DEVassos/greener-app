import { Navigate, Route, Routes } from 'react-router';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Área pública: o dashboard abre direto, sem login */}
      <Route path="/" element={<DashboardPage />} />

      {/* Configuração do monitoramento: rota reservada; a proteção por login (JWT) é escopo da #25 */}
      <Route path="/configuracao" element={<SettingsPage />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

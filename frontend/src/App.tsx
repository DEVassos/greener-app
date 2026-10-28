import { Navigate, Route, Routes } from 'react-router';
import ComparePage from './pages/ComparePage';
import DashboardPage from './pages/DashboardPage';
import EmissionsPage from './pages/EmissionsPage';
import SettingsPage from './pages/SettingsPage';
import MonitoringProvider from './providers/MonitoringProvider';

export default function App() {
  return (
    <MonitoringProvider>
      <Routes>
        {/* Área pública: o dashboard abre direto, sem login */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/emissoes" element={<EmissionsPage />} />
        <Route path="/comparacao" element={<ComparePage />} />

        {/* Configuração do monitoramento: rota reservada; a proteção por login (JWT) é escopo da #25 */}
        <Route path="/configuracao" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MonitoringProvider>
  );
}

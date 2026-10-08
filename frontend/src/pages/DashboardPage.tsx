import AppHeader from '../components/AppHeader';
import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <div className="page">
      <AppHeader />

      <main className="content">
        <h1 className="sr-only">Dashboard de energia e emissões</h1>

        <footer className="page-footer">EcoPulse · DEVassos · Fatec Jacareí 2DSM 2026-2</footer>
      </main>
    </div>
  );
}

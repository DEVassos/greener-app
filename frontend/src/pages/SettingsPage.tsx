import AppHeader from '../components/AppHeader';
import './DashboardPage.css';

/** Área restrita: parâmetros do monitoramento (intervalos de coleta, serviços, fatores). */
export default function SettingsPage() {
  return (
    <div className="dashboard">
      <AppHeader />

      <main className="content">
        <section className="panel p-6">
          <h1 className="m-0 font-display text-2xl font-semibold">Configuração</h1>
          <p className="mt-2 mb-0 text-muted">
            Área restrita do administrador. Os parâmetros do monitoramento entram junto com a autenticação (US07).
          </p>
        </section>
      </main>
    </div>
  );
}

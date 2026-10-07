import AppHeader from '../components/AppHeader';
import { useMonitoringSettings } from '../hooks/useMonitoringSettings';
import './DashboardPage.css';

/** Área restrita: parâmetros do monitoramento, lidos de uma rota que exige o token da sessão. */
export default function SettingsPage() {
  const { settings, loading, error } = useMonitoringSettings();

  return (
    <div className="dashboard">
      <AppHeader />

      <main className="content">
        <section className="panel p-6">
          <h1 className="m-0 font-display text-2xl font-semibold">Configuração</h1>
          <p className="mt-2 mb-0 text-muted">Parâmetros do monitoramento. Área restrita do administrador.</p>

          {loading && (
            <p className="mt-6 mb-0 text-muted" role="status">
              Carregando configuração…
            </p>
          )}

          {error && (
            <p className="mt-6 mb-0 rounded-lg border border-error/60 bg-error/10 px-4 py-3" role="alert">
              {error}
            </p>
          )}

          {settings && (
            <dl className="mt-6 mb-0 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <dt className="text-sm text-muted">Intervalo de coleta</dt>
                <dd className="m-0 mt-1 font-mono text-lg">{settings.collectIntervalSeconds} s</dd>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <dt className="text-sm text-muted">API de intensidade de carbono</dt>
                <dd className="m-0 mt-1 break-all font-mono text-lg">{settings.carbonApiUrl}</dd>
              </div>
            </dl>
          )}
        </section>
      </main>
    </div>
  );
}

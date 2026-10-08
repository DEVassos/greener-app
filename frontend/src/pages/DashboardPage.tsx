import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LastUpdated from '../components/LastUpdated';
import LoadingState from '../components/LoadingState';
import ServicesTable from '../components/ServicesTable';
import { useMonitoring } from '../hooks/useMonitoring';
import { useServices } from '../hooks/useServices';
import { isDemoMode } from '../services/services.service';
import './DashboardPage.css';

export default function DashboardPage() {
  const { data, loading, error, updatedAt, refresh } = useServices();
  const { refreshIntervalMs } = useMonitoring();

  return (
    <div className="page">
      {isDemoMode && (
        <div className="demo-banner" role="note">
          Você está vendo uma demonstração com dados ilustrativos: o frontend ainda não está ligado ao backend.
        </div>
      )}

      <AppHeader>
        <LastUpdated updatedAt={updatedAt} intervalSeconds={refreshIntervalMs / 1000} stale={error !== ''}>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label="Atualizar agora"
            title="Atualizar agora"
            className="grid size-9 cursor-pointer place-items-center rounded-lg border border-border bg-transparent text-muted hover:border-muted hover:text-text disabled:cursor-wait disabled:opacity-60"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={loading ? 'size-4 motion-safe:animate-spin' : 'size-4'}
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </LastUpdated>
      </AppHeader>

      <main className="content">
        <h1 className="sr-only">Dashboard de energia e emissões</h1>

        {/* Falha não apaga o que já estava na tela: o erro aparece junto com o último dado */}
        {error && <ErrorState message={error} onRetry={refresh} />}

        {loading && !data && <LoadingState message="Carregando serviços…" />}

        {data && data.services.length === 0 && (
          <EmptyState
            title="Nenhum serviço monitorado ainda"
            description="Os serviços aparecem aqui assim que o agregador os descobrir na próxima coleta."
          />
        )}

        {data && data.services.length > 0 && <ServicesTable services={data.services} period={data.period} />}
      </main>

      <footer className="page-footer">EcoPulse · DEVassos · Fatec Jacareí 2DSM 2026-2</footer>
    </div>
  );
}

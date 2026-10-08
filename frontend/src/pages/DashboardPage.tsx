import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LastUpdated from '../components/LastUpdated';
import LoadingState from '../components/LoadingState';
import ServicesTable from '../components/ServicesTable';
import { useServices } from '../hooks/useServices';
import { isDemoMode } from '../services/services.service';
import './DashboardPage.css';

export default function DashboardPage() {
  const { data, loading, error, updatedAt, reload } = useServices();

  return (
    <div className="dashboard">
      {isDemoMode && (
        <div className="demo-banner" role="note">
          Você está vendo uma demonstração com dados ilustrativos: o frontend ainda não está ligado ao backend.
        </div>
      )}

      <AppHeader>
        <LastUpdated updatedAt={updatedAt} stale={error !== ''} />
      </AppHeader>

      <main className="content">
        <h1 className="sr-only">Dashboard de energia e emissões</h1>

        {/* Falha não apaga o que já estava na tela: o erro aparece junto com o último dado */}
        {error && <ErrorState message={error} onRetry={reload} />}

        {loading && !data && <LoadingState message="Carregando serviços…" />}

        {data && data.services.length === 0 && (
          <EmptyState
            title="Nenhum serviço monitorado ainda"
            description="Os serviços aparecem aqui assim que o agregador os descobrir na próxima coleta."
          />
        )}

        {data && data.services.length > 0 && <ServicesTable services={data.services} period={data.period} />}

        <footer className="page-footer">EcoPulse · DEVassos · Fatec Jacareí 2DSM 2026-2</footer>
      </main>
    </div>
  );
}

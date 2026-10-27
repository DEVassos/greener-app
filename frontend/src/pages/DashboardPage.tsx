import { useState } from 'react';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import KpiPanel from '../components/KpiPanel';
import LastUpdated from '../components/LastUpdated';
import LoadingState from '../components/LoadingState';
import ServiceDetailsDialog from '../components/ServiceDetailsDialog';
import ServicesTable from '../components/ServicesTable';
import { useMonitoring } from '../hooks/useMonitoring';
import { useServices } from '../hooks/useServices';
import { isDemoMode } from '../services/services.service';
import { summarizeStatus } from '../utils/summary';
import './DashboardPage.css';

export default function DashboardPage() {
  const { data, loading, error, updatedAt, refresh } = useServices();
  const { refreshIntervalMs } = useMonitoring();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // A janela usa a linha atual da lista: status, CPU e última leitura acompanham cada atualização
  const selected = data?.services.find((service) => service.id === selectedId) ?? null;

  return (
    <div className="page">
      {isDemoMode && (
        <div className="demo-banner" role="note">
          Você está vendo uma demonstração com dados ilustrativos: o frontend ainda não está ligado ao backend.
        </div>
      )}

      <AppHeader updatedAt={updatedAt}>
        <LastUpdated updatedAt={updatedAt} intervalSeconds={refreshIntervalMs / 1000} stale={error !== ''}>
          <button
            type="button"
            // aria-disabled em vez de disabled: o botão não perde o foco do teclado a cada ciclo
            onClick={() => {
              if (!loading) refresh();
            }}
            aria-disabled={loading}
            aria-label="Atualizar agora"
            title="Atualizar agora"
            className="btn-outline grid size-9 place-items-center"
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

        {/* Sem dado ainda, os cards não aparecem (nunca zeros inventados); depois de uma falha, mostram o último dado */}
        {data && data.services.length > 0 && (
          <KpiPanel summary={summarizeStatus(data.services)} staleSince={error ? updatedAt : null} />
        )}

        {data && data.services.length > 0 && (
          <ServicesTable services={data.services} period={data.period} onSelect={(service) => setSelectedId(service.id)} />
        )}

        {/* Montada só enquanto aberta: fechar desmonta e cancela o polling do histórico */}
        {selected && <ServiceDetailsDialog key={selected.id} service={selected} onClose={() => setSelectedId(null)} />}
      </main>

      <footer className="page-footer">EcoPulse · DEVassos · Fatec Jacareí 2DSM 2026-2</footer>
    </div>
  );
}

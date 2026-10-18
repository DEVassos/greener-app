import { Fragment } from 'react';
import type { CollectionStatus, ServiceCollection } from '../services/collections.types';
import { formatDayTime, formatDuration, formatNumber } from '../utils/format';
import MissingValue from './MissingValue';

/** Resultado da coleta em texto e cor (nunca só pela cor), no mesmo estilo do StatusBadge. */
const COLLECTION_STATUS: Record<CollectionStatus, { label: string; className: string }> = {
  ok: { label: 'OK', className: 'border-primary/50 bg-primary/10 text-emerald-300' },
  erro: { label: 'Erro', className: 'border-error/50 bg-error/10 text-red-300' },
  sem_metricas: { label: 'Sem métricas', className: 'border-warning/50 bg-warning/10 text-orange-300' },
};

function CollectionStatusBadge({ status }: { status: CollectionStatus }) {
  const { label, className } = COLLECTION_STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}

function metric(value: number | null, decimals: number) {
  return value === null ? <MissingValue label="sem métrica nesta coleta" title="Sem métrica nesta coleta" /> : formatNumber(value, decimals);
}

/**
 * O worker vence a coleta em `collectedAt + collectionIntervalSeconds`, mas só a executa na
 * próxima batida de POLLING_INTERVAL_MS (30 s). A folga cobre a duração do ciclo e a latência.
 * O polling não é exposto pela API, então os padrões do backend ficam repetidos aqui.
 */
const POLLING_INTERVAL_SECONDS = 30;
const CYCLE_SLACK_SECONDS = 30;
const DEFAULT_COLLECTION_INTERVAL_SECONDS = 30;

/** Duração do buraco entre duas coletas, quando ele é maior do que o intervalo normal do serviço. */
function missingCollectionSeconds(newer: ServiceCollection, older: ServiceCollection): number | null {
  const seconds = (Date.parse(newer.collectedAt) - Date.parse(older.collectedAt)) / 1_000;
  if (!Number.isFinite(seconds)) return null;
  // A coleta anterior é a que agendou a seguinte; sem intervalo nela (erro/sem métricas), usa a mais nova.
  const interval = older.collectionIntervalSeconds ?? newer.collectionIntervalSeconds ?? DEFAULT_COLLECTION_INTERVAL_SECONDS;
  const tolerance = Math.max(1, interval) + POLLING_INTERVAL_SECONDS + CYCLE_SLACK_SECONDS;
  return seconds > tolerance ? seconds : null;
}

/** Linha entre duas coletas: mostra o período em que não houve registro nenhum. */
function MissingCollectionRow({ seconds }: { seconds: number }) {
  return (
    <tr className="border-t border-dashed border-warning/40 bg-warning/5">
      <td colSpan={7} className="px-4 py-2 text-center text-xs text-muted">
        Sem coleta por <strong className="font-mono font-medium text-text">{formatDuration(seconds)}</strong>
      </td>
    </tr>
  );
}

interface Props {
  /** Da coleta mais recente para a mais antiga, como a API devolve. */
  collections: ServiceCollection[];
}

/** Histórico de coletas de um serviço (RF10), com o período exibido explícito na legenda. */
export default function CollectionsHistoryTable({ collections }: Props) {
  const newest = collections[0];
  const oldest = collections[collections.length - 1];
  const gaps = collections.map((collection, index) =>
    index === 0 ? null : missingCollectionSeconds(collections[index - 1], collection));

  return (
    // relative: os textos sr-only (position: absolute) das células ficam dentro da rolagem, sem alargar a janela
    <div className="relative overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <caption className="px-4 py-3 text-left text-sm text-muted">
          {collections.length === 1 ? '1 coleta' : `${collections.length} coletas mais recentes`}
          {newest && oldest && (
            <>
              {' · de '}
              <strong className="font-mono font-medium text-text">{formatDayTime(oldest.collectedAt)}</strong>
              {' a '}
              <strong className="font-mono font-medium text-text">{formatDayTime(newest.collectedAt)}</strong>
            </>
          )}
        </caption>
        <thead>
          <tr className="whitespace-nowrap text-left text-xs text-muted">
            <th scope="col" className="px-4 py-2 font-medium">Data/hora</th>
            <th scope="col" className="px-4 py-2 font-medium">Status</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">CPU (%)</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Memória (GB)</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Disco (GB)</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Rede (GB)</th>
            <th scope="col" className="px-4 py-2 font-medium">Observação</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection, index) => {
            const gap = gaps[index];
            return (
              <Fragment key={collection.id}>
                {gap !== null && <MissingCollectionRow seconds={gap} />}
                <tr className="border-t border-border">
                  <th scope="row" className="whitespace-nowrap px-4 py-2 text-left font-mono font-normal text-muted">
                    {formatDayTime(collection.collectedAt)}
                  </th>
                  <td className="px-4 py-2">
                    <CollectionStatusBadge status={collection.status} />
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{metric(collection.cpuPercent, 1)}</td>
                  <td className="px-4 py-2 text-right font-mono">{metric(collection.memoryGb, 2)}</td>
                  <td className="px-4 py-2 text-right font-mono">{metric(collection.diskGb, 2)}</td>
                  <td className="px-4 py-2 text-right font-mono">{metric(collection.networkGb, 3)}</td>
                  <td className="px-4 py-2 text-muted">{collection.errorMessage}</td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
      {gaps.some((gap) => gap !== null) && (
        <p className="m-0 border-t border-border px-4 py-2 text-xs text-muted">
          <strong className="font-medium text-text">Sem coleta</strong> indica um período sem nenhum registro.
          Isso não prova que o serviço estava indisponível: o worker pode ter sido interrompido ou a descoberta
          de serviços pode ter falhado.
        </p>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import type { MonitoredService, ServiceStatus } from '../services/services.types';
import { formatNumber, formatTime } from '../utils/format';
import MissingValue from './MissingValue';
import StatusBadge from './StatusBadge';

type SortKey = 'name' | 'cpuPercent' | 'energyKwh' | 'emissionsG' | 'lastReadingAt' | 'location' | 'status';

interface Column {
  key: SortKey;
  label: string;
  numeric?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Serviço' },
  { key: 'cpuPercent', label: 'CPU', numeric: true },
  { key: 'energyKwh', label: 'Energia (kWh)', numeric: true },
  { key: 'emissionsG', label: 'Emissão (g CO₂e)', numeric: true },
  { key: 'lastReadingAt', label: 'Última leitura', numeric: true },
  { key: 'location', label: 'Localização' },
  { key: 'status', label: 'Status' },
];

/** Ordem crescente do status: o que precisa de atenção vem primeiro. */
const STATUS_ORDER: Record<ServiceStatus, number> = {
  indisponivel: 0,
  sem_metricas: 1,
  ativo: 2,
  removido: 3,
};

interface Props {
  services: MonitoredService[];
  /** Período dos valores de energia e emissão (ex.: "última 1 hora"). */
  period: string;
  /** Clique na linha (ou Enter no nome): abre os detalhes e o histórico do serviço. */
  onSelect: (service: MonitoredService) => void;
}

/** Valor de ordenação da coluna: localização por região, país e cidade; status pela gravidade. */
function sortValue(service: MonitoredService, key: SortKey): string | number | null {
  if (key === 'location') return [service.region, service.country, service.city].filter(Boolean).join(' ') || null;
  if (key === 'status') return STATUS_ORDER[service.status];
  return service[key];
}

/** Compara dois serviços pela coluna; valores ausentes (sem métrica) vão sempre para o fim. */
function compare(a: MonitoredService, b: MonitoredService, key: SortKey, direction: 1 | -1): number {
  const left = sortValue(a, key);
  const right = sortValue(b, key);
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right, 'pt-BR') * direction;
  return ((left as number) - (right as number)) * direction;
}

/** Tabela operacional dos serviços monitorados (RF09, RF12): busca por nome, ordenação por coluna e clique para os detalhes. */
export default function ServicesTable({ services, period, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('emissionsG');
  const [direction, setDirection] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return services
      .filter((service) => service.name.toLocaleLowerCase('pt-BR').includes(term))
      .sort((a, b) => compare(a, b, sortKey, direction));
  }, [services, search, sortKey, direction]);

  function sortBy(column: Column) {
    if (column.key === sortKey) {
      setDirection((current) => (current === 1 ? -1 : 1));
    } else {
      setSortKey(column.key);
      // Texto começa em A→Z (status: mais grave primeiro); números começam do maior para o menor
      setDirection(column.numeric ? -1 : 1);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface" aria-labelledby="services-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 id="services-title" className="m-0 font-display text-lg font-semibold">
          Serviços monitorados <span className="text-sm font-medium text-muted">· {period}</span>
        </h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only">Buscar serviço por nome</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome…"
            className="h-10 w-60 max-w-full rounded-lg border border-border bg-surface-2 px-3 font-sans text-sm text-text outline-none placeholder:text-muted focus:border-primary"
          />
        </label>
      </div>

      {/* Rolagem horizontal em telas estreitas: a tabela nunca quebra o layout (RNF01) */}
      {/* relative: os textos sr-only (position: absolute) das células ficam dentro da rolagem, sem alargar a página */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="whitespace-nowrap text-left text-xs text-muted">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-5 py-3 font-medium ${column.numeric ? 'text-right' : ''}`}
                  aria-sort={sortKey === column.key ? (direction === 1 ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    onClick={() => sortBy(column)}
                    className={`cursor-pointer border-0 bg-transparent p-0 font-sans text-xs font-medium hover:text-text ${sortKey === column.key ? 'text-text' : 'text-muted'}`}
                  >
                    {column.label}
                    <span aria-hidden="true"> {sortKey === column.key ? (direction === 1 ? '↑' : '↓') : '↕'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((service) => (
              // O clique vale para a linha toda; o botão do nome dá o mesmo acesso pelo teclado (o clique dele sobe até aqui).
              // Focar o botão antes de abrir faz o foco voltar para ele ao fechar, mesmo com clique fora do nome.
              <tr
                key={service.id}
                onClick={(event) => {
                  event.currentTarget.querySelector('button')?.focus();
                  onSelect(service);
                }}
                className="cursor-pointer border-t border-border hover:bg-surface-2"
              >
                <th scope="row" className="px-5 py-3 text-left font-medium">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    title="Ver detalhes e histórico de coletas"
                    className="cursor-pointer border-0 bg-transparent p-0 text-left font-sans text-sm font-medium text-text underline decoration-border underline-offset-4 hover:decoration-primary"
                  >
                    {service.name}
                  </button>
                </th>
                <td className="px-5 py-3 text-right font-mono">
                  {service.cpuPercent === null ? <MissingValue /> : `${formatNumber(service.cpuPercent, 0)}%`}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {service.energyKwh === null ? <MissingValue /> : formatNumber(service.energyKwh, 4)}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {service.emissionsG === null ? <MissingValue /> : formatNumber(service.emissionsG, 1)}
                </td>
                <td className="px-5 py-3 text-right font-mono text-muted">
                  {service.lastReadingAt === null ? 'nunca' : formatTime(service.lastReadingAt)}
                </td>
                <td className="px-5 py-3">
                  {service.region && (
                    <span className="mr-2 rounded-md border border-secondary/40 bg-secondary/10 px-2 py-0.5 font-mono text-xs text-secondary">
                      {service.region}
                    </span>
                  )}
                  <span className="text-muted">
                    {[service.city, service.country].filter(Boolean).join(', ') ||
                      (!service.region && (
                        <span title="Localização não informada pelo agregador">
                          —<span className="sr-only">sem localização</span>
                        </span>
                      ))}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={service.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={COLUMNS.length} className="px-5 py-8 text-center text-muted">
                  Nenhum serviço com “{search.trim()}” no nome.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

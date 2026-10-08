import { useMemo, useState } from 'react';
import type { MonitoredService } from '../services/services.types';
import { formatNumber, formatTime } from '../utils/format';
import StatusBadge from './StatusBadge';

type SortKey = 'name' | 'cpuPercent' | 'energyKwh' | 'emissionsG' | 'lastReadingAt';

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
];

interface Props {
  services: MonitoredService[];
  /** Período dos valores de energia e emissão (ex.: "última 1 hora"). */
  period: string;
}

/** Compara dois serviços pela coluna; valores ausentes (sem métrica) vão sempre para o fim. */
function compare(a: MonitoredService, b: MonitoredService, key: SortKey, direction: 1 | -1): number {
  const left = a[key];
  const right = b[key];
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right, 'pt-BR') * direction;
  return ((left as number) - (right as number)) * direction;
}

function Missing() {
  return (
    <span className="text-faint" title="Sem métrica nesta leitura">
      —<span className="sr-only">sem métrica</span>
    </span>
  );
}

/** Tabela operacional dos serviços monitorados (RF09, RF12): busca por nome e ordenação por coluna. */
export default function ServicesTable({ services, period }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('emissionsG');
  const [direction, setDirection] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return services
      .filter((service) => service.name.toLocaleLowerCase('pt-BR').includes(term))
      .sort((a, b) => compare(a, b, sortKey, direction));
  }, [services, search, sortKey, direction]);

  function sortBy(key: SortKey) {
    if (key === sortKey) {
      setDirection((current) => (current === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      // Nome começa em A→Z; números começam do maior para o menor
      setDirection(key === 'name' ? 1 : -1);
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
            className="h-10 w-60 max-w-full rounded-lg border border-border bg-surface-2 px-3 font-sans text-sm text-text outline-none placeholder:text-faint focus:border-primary"
          />
        </label>
      </div>

      {/* Rolagem horizontal em telas estreitas: a tabela nunca quebra o layout (RNF01) */}
      <div className="overflow-x-auto">
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
                    onClick={() => sortBy(column.key)}
                    className={`cursor-pointer border-0 bg-transparent p-0 font-sans text-xs font-medium hover:text-text ${sortKey === column.key ? 'text-text' : 'text-muted'}`}
                  >
                    {column.label}
                    <span aria-hidden="true"> {sortKey === column.key ? (direction === 1 ? '↑' : '↓') : '↕'}</span>
                  </button>
                </th>
              ))}
              <th scope="col" className="px-5 py-3 font-medium">
                Localização
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((service) => (
              <tr key={service.id} className="border-t border-border">
                <th scope="row" className="px-5 py-3 text-left font-medium">
                  {service.name}
                </th>
                <td className="px-5 py-3 text-right font-mono">
                  {service.cpuPercent === null ? <Missing /> : `${formatNumber(service.cpuPercent, 0)}%`}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {service.energyKwh === null ? <Missing /> : formatNumber(service.energyKwh, 4)}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {service.emissionsG === null ? <Missing /> : formatNumber(service.emissionsG, 1)}
                </td>
                <td className="px-5 py-3 text-right font-mono text-muted">
                  {service.lastReadingAt === null ? 'nunca' : formatTime(service.lastReadingAt)}
                </td>
                <td className="px-5 py-3">
                  <span className="mr-2 rounded-md border border-secondary/40 bg-secondary/10 px-2 py-0.5 font-mono text-xs text-secondary">
                    {service.region}
                  </span>
                  <span className="text-muted">{service.city ? `${service.city}, ${service.country}` : service.country}</span>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={service.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={COLUMNS.length + 2} className="px-5 py-8 text-center text-muted">
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

import { useMemo, useState } from 'react';
import type { MonitoredService, ServiceStatus } from '../services/services.types';
import { formatNumber, formatSignificant, formatTime } from '../utils/format';
import MissingValue from './MissingValue';
import StatusBadge from './StatusBadge';

type SortKey = 'name' | 'cpuPercent' | 'energyKwh' | 'emissionsG' | 'lastReadingAt' | 'location' | 'status';

interface Column {
  key: SortKey;
  label: string;
  numeric?: boolean;
}

// Status logo depois do nome: em notebook, a última coluna fica longe demais do serviço
const COLUMNS: Column[] = [
  { key: 'name', label: 'Serviço' },
  { key: 'status', label: 'Status' },
  { key: 'cpuPercent', label: 'CPU', numeric: true },
  { key: 'energyKwh', label: 'Energia (kWh)', numeric: true },
  { key: 'emissionsG', label: 'Emissão (g CO₂e)', numeric: true },
  { key: 'lastReadingAt', label: 'Última leitura', numeric: true },
  { key: 'location', label: 'Localização' },
];

/** Energia e Emissão são as duas colunas do período: a legenda dele fica só sobre elas. */
const PERIOD_FIRST = COLUMNS.findIndex((column) => column.key === 'energyKwh');
const PERIOD_SPAN = 2;
const AFTER_PERIOD = COLUMNS.length - PERIOD_FIRST - PERIOD_SPAN;

/** Ordem crescente do status: o que precisa de atenção vem primeiro. */
const STATUS_ORDER: Record<ServiceStatus, number> = {
  indisponivel: 0,
  sem_metricas: 1,
  ativo: 2,
  removido: 3,
};

interface Props {
  services: MonitoredService[];
  /** Período dos valores de energia e emissão (ex.: "última leitura (intervalo de coleta)"), mostrado sobre essas duas colunas. */
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

/** Localização em texto discreto: "Ashburn, United States · Virginia" (cidade, país · região), só com as partes informadas. */
function locationText(service: MonitoredService): string {
  const place = [service.city, service.country].filter(Boolean).join(', ');
  return [place, service.region].filter(Boolean).join(' · ');
}

/** Tabela operacional dos serviços monitorados (RF09, RF12): busca por nome, ordenação por coluna e clique para os detalhes. */
export default function ServicesTable({ services, period, onSelect }: Props) {
  const [search, setSearch] = useState('');
  // Ordem inicial por gravidade (Status crescente): indisponíveis e sem métricas no topo, acima da dobra
  const [sortKey, setSortKey] = useState<SortKey>('status');
  const [direction, setDirection] = useState<1 | -1>(1);

  const rows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return services
      .filter((service) => service.name.toLocaleLowerCase('pt-BR').includes(term))
      .sort(
        (a, b) =>
          compare(a, b, sortKey, direction) ||
          // Mesmo status: maior emissão primeiro, nos dois sentidos
          (sortKey === 'status' ? compare(a, b, 'emissionsG', -1) : 0),
      );
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-2.5">
        <h2 id="services-title" className="m-0 font-display text-lg font-semibold">
          Serviços monitorados
        </h2>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only">Buscar serviço por nome</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome…"
            className="h-9 w-60 max-w-full rounded-lg border border-border bg-surface-2 px-3 font-sans text-sm text-text outline-none placeholder:text-muted focus:border-primary"
          />
        </label>
      </div>

      {/* Rolagem horizontal em telas estreitas: a tabela nunca quebra o layout (RNF01) */}
      {/* relative: os textos sr-only (position: absolute) das células ficam dentro da rolagem, sem alargar a página */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          {/* Grupos de colunas: a legenda do período (scope="colgroup") vale só para Energia e Emissão */}
          <colgroup span={PERIOD_FIRST} />
          <colgroup span={PERIOD_SPAN} />
          <colgroup span={AFTER_PERIOD} />
          <thead>
            <tr className="text-xs text-muted">
              <td colSpan={PERIOD_FIRST} />
              <th scope="colgroup" colSpan={PERIOD_SPAN} className="px-5 pt-1 font-normal whitespace-nowrap">
                <span className="block border-b border-border pb-0.5 text-center">{period}</span>
              </th>
              <td colSpan={AFTER_PERIOD} />
            </tr>
            <tr className="whitespace-nowrap text-left text-xs text-muted">
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-5 pt-1.5 pb-2 font-medium ${column.numeric ? 'text-right' : ''}`}
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
                <th scope="row" className="px-5 py-2 text-left font-medium">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    title="Ver detalhes e histórico de coletas"
                    className="cursor-pointer border-0 bg-transparent p-0 text-left font-sans text-sm font-medium text-text underline decoration-border underline-offset-4 hover:decoration-primary"
                  >
                    {service.name}
                  </button>
                </th>
                {/* O badge é o único elemento colorido da linha */}
                <td className="px-5 py-2">
                  <StatusBadge status={service.status} />
                </td>
                <td className="px-5 py-2 text-right font-mono">
                  {service.cpuPercent === null ? <MissingValue /> : `${formatNumber(service.cpuPercent, 0)}%`}
                </td>
                {/* 2 algarismos significativos: 0,040 g em vez de "0,0" para emissões pequenas */}
                <td className="px-5 py-2 text-right font-mono">
                  {service.energyKwh === null ? <MissingValue /> : formatSignificant(service.energyKwh, 2)}
                </td>
                <td className="px-5 py-2 text-right font-mono">
                  {service.emissionsG === null ? <MissingValue /> : formatSignificant(service.emissionsG, 2)}
                </td>
                <td className="px-5 py-2 text-right font-mono text-muted">
                  {service.lastReadingAt === null ? 'nunca' : formatTime(service.lastReadingAt)}
                </td>
                <td className="whitespace-nowrap px-5 py-2 text-muted">
                  {locationText(service) || (
                    <span title="Localização não informada pelo agregador">
                      —<span className="sr-only">sem localização</span>
                    </span>
                  )}
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

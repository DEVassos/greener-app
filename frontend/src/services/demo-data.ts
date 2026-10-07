// Dados ilustrativos do protótipo (APIs do cliente em 01/10/2026).
// Usados só enquanto VITE_API_URL não estiver definida — a tela avisa que é uma demonstração.

import type { MonitoredService, ServicesResponse } from './services.types';

/** Horário de uma leitura feita há alguns segundos, para a demonstração parecer viva. */
function secondsAgo(seconds: number): string {
  return new Date(Date.now() - seconds * 1000).toISOString();
}

export function demoServices(): ServicesResponse {
  const services: MonitoredService[] = [
    { id: 'fraud-detector', name: 'Fraud Detector', country: 'Estados Unidos', region: 'us-east', city: 'Virgínia', cpuPercent: 68, energyKwh: 0.0713, emissionsG: 26.9, status: 'ativo', lastReadingAt: secondsAgo(4) },
    { id: 'recommendation-ai', name: 'Recommendation AI', country: 'Irlanda', region: 'eu-west', city: 'Dublin', cpuPercent: 74, energyKwh: 0.0868, emissionsG: 25.6, status: 'ativo', lastReadingAt: secondsAgo(6) },
    { id: 'audit-stream', name: 'Audit Stream', country: 'Japão', region: 'jp-east', city: 'Tóquio', cpuPercent: 41, energyKwh: 0.0533, emissionsG: 24.8, status: 'ativo', lastReadingAt: secondsAgo(5) },
    { id: 'checkout-worker', name: 'Checkout Worker', country: 'Estados Unidos', region: 'us-east', city: 'Virgínia', cpuPercent: 45, energyKwh: 0.0467, emissionsG: 17.7, status: 'ativo', lastReadingAt: secondsAgo(3) },
    { id: 'reporting-batch', name: 'Reporting Batch', country: 'Canadá', region: 'ca-central', city: 'Montreal', cpuPercent: 52, energyKwh: 0.0726, emissionsG: 2.9, status: 'ativo', lastReadingAt: secondsAgo(8) },
    { id: 'email-dispatcher', name: 'Email Dispatcher', country: 'Brasil', region: 'br-sudeste', city: 'São Paulo', cpuPercent: null, energyKwh: null, emissionsG: null, status: 'indisponivel', lastReadingAt: secondsAgo(1260) },
    { id: 'inventory-sync', name: 'Inventory Sync', country: 'Canadá', region: 'ca-central', city: null, cpuPercent: null, energyKwh: null, emissionsG: null, status: 'sem_metricas', lastReadingAt: null },
  ];
  return { services, period: 'última 1 hora' };
}

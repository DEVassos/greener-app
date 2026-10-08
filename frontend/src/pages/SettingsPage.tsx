import AppHeader from '../components/AppHeader';

/** Configuração do monitoramento. Rota reservada: a proteção por login (JWT) é escopo da #25. */
export default function SettingsPage() {
  return (
    <div className="page">
      <AppHeader />

      <main className="content">
        <section className="panel p-6">
          <h1 className="m-0 font-display text-2xl font-semibold">Configuração</h1>
          <p className="mt-2 mb-0 text-muted">Nenhum parâmetro de monitoramento disponível nesta versão.</p>
        </section>
      </main>
    </div>
  );
}

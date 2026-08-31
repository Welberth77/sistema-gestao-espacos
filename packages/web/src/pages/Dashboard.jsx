// Dashboard.jsx — no esqueleto (T-19), confirma que dados + motor estão ligados.
// A versão completa (cards, mapa do prédio, gráficos) vem nas tarefas T-25 e T-26.
import { useApp } from '../state/AppState.jsx';
import { PageHeader, Stat } from '../components/ui.jsx';

export default function Dashboard() {
  const { salas, setores, equipes, execucaoAtual, gerar } = useApp();

  const totalFuncionarios = equipes.reduce((a, e) => a + e.pessoas, 0);
  const capacidade = salas.reduce((a, s) => a + s.capacidade, 0);

  return (
    <>
      <PageHeader
        title="Dashboard executivo"
        subtitle="Visão geral do prédio e da última otimização."
        actions={<button className="btn-primary" onClick={gerar}>Gerar alocação</button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Salas cadastradas" value={salas.length} hint={`${capacidade} assentos no total`} />
        <Stat label="Setores" value={setores.length} />
        <Stat label="Equipes" value={equipes.length} hint={`${totalFuncionarios} funcionários`} />
        <Stat
          label="Última otimização"
          value={execucaoAtual ? `${execucaoAtual.alocadas}/${execucaoAtual.equipes_analisadas}` : '—'}
          hint={execucaoAtual ? `${execucaoAtual.nao_alocadas} não alocada(s)` : 'nenhuma execução ainda'}
          tone={execucaoAtual && execucaoAtual.nao_alocadas > 0 ? 'warn' : 'good'}
        />
      </div>

      {execucaoAtual ? (
        <div className="card p-6">
          <p className="text-sm text-slate-600">
            Execução <span className="font-mono font-medium">#{execucaoAtual.id}</span> gerada em{' '}
            <span className="font-medium">{execucaoAtual.tempo_ms} ms</span> pelo motor{' '}
            <span className="font-mono">{execucaoAtual.versao_motor}</span>. Ocupação prevista de{' '}
            <span className="font-medium">{Math.round(execucaoAtual.ocupacao_prevista * 100)}%</span>.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            O dashboard completo (mapa do prédio, ocupação por andar e indicadores) chega nas tarefas T-25 e T-26.
          </p>
        </div>
      ) : (
        <div className="card p-10 text-center text-slate-500">
          Nenhuma alocação gerada ainda. Clique em <span className="font-medium text-slate-700">Gerar alocação</span> para ver o motor em ação.
        </div>
      )}
    </>
  );
}

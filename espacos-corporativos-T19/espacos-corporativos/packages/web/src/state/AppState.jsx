// AppState.jsx — estado global em memória (MVP sem backend).
// Carrega os dados-semente, chama o motor de alocação no navegador e mantém
// o histórico de execuções e intervenções (governança) em estado React.
import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { gerarAlocacao, gerarBaseline, calcularMetricas } from '@espacos/engine';
import { seedSalas, seedSetores, seedEquipes, seedRestricoes } from '../data/seed.js';

const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [salas, setSalas] = useState(seedSalas);
  const [setores, setSetores] = useState(seedSetores);
  const [equipes, setEquipes] = useState(seedEquipes);
  const [restricoes, setRestricoes] = useState(seedRestricoes);
  const [execucoes, setExecucoes] = useState([]); // governança (mais recente primeiro)
  const [intervencoes, setIntervencoes] = useState([]);
  const [role, setRole] = useState('geral'); // 'geral' | 'setor'

  const usuario = role === 'geral' ? 'coordenador-geral' : 'coordenador-setor';
  const dataset = useMemo(
    () => ({ salas, equipes, setores, restricoes }),
    [salas, equipes, setores, restricoes]
  );

  // --- MOTOR (seção 6) + GOVERNANÇA (seção 12) ---
  const gerar = useCallback(() => {
    const resultado = gerarAlocacao(dataset);
    const registro = {
      id: (execucoes[0]?.id || 0) + 1,
      datahora: new Date().toISOString(),
      usuario,
      status: 'pendente',
      versao_motor: resultado.versao_motor,
      tempo_ms: resultado.tempo_ms,
      ...resultado.contadores,
      resultado, // guarda a proposta completa (alocações + não-alocadas + métricas)
    };
    setExecucoes((prev) => [registro, ...prev]);
    return registro;
  }, [dataset, usuario, execucoes]);

  // --- INTERVENÇÃO HUMANA (seção 10) ---
  const registrarIntervencao = useCallback((execId, tipo, detalhe) => {
    setIntervencoes((prev) => [
      { id: prev.length + 1, execucao_id: execId, usuario, tipo, detalhe, datahora: new Date().toISOString() },
      ...prev,
    ]);
  }, [usuario]);

  const aprovar = useCallback((execId) => {
    setExecucoes((prev) => prev.map((e) => (e.id === execId ? { ...e, status: 'aprovada' } : e)));
    registrarIntervencao(execId, 'aprovar', 'Recomendação aprovada');
  }, [registrarIntervencao]);

  const rejeitar = useCallback((execId, motivo = 'Recomendação rejeitada') => {
    setExecucoes((prev) => prev.map((e) => (e.id === execId ? { ...e, status: 'rejeitada' } : e)));
    registrarIntervencao(execId, 'rejeitar', motivo);
  }, [registrarIntervencao]);

  const editarAlocacao = useCallback((execId, equipeId, novaSalaId) => {
    setExecucoes((prev) =>
      prev.map((exec) => {
        if (exec.id !== execId) return exec;
        const novaSala = salas.find((s) => s.id === novaSalaId);
        if (!novaSala) return exec;
        const alocacoes = exec.resultado.alocacoes.map((a) => {
          if (a.equipe.id !== equipeId) return a;
          return {
            ...a,
            sala: novaSala,
            ocupacao: Math.round((a.equipe.pessoas / novaSala.capacidade) * 10000) / 10000,
            manual: true,
            justificativa: {
              ...a.justificativa,
              manual: true,
              resumo: `Alteração manual: ${a.equipe.nome} movida para a sala ${novaSalaId} pelo coordenador.`,
            },
          };
        });
        const metricas = calcularMetricas(alocacoes, exec.resultado.nao_alocadas, salas, 0);
        return { ...exec, resultado: { ...exec.resultado, alocacoes, metricas } };
      })
    );
    registrarIntervencao(execId, 'editar', `${equipeId} -> sala ${novaSalaId}`);
  }, [salas, registrarIntervencao]);

  // Execução vigente: a aprovada mais recente, ou a mais recente de todas.
  const execucaoAtual = useMemo(
    () => execucoes.find((e) => e.status === 'aprovada') || execucoes[0] || null,
    [execucoes]
  );

  // --- COMPARAÇÃO (seção 8) ---
  const comparacao = useCallback(() => {
    const otimizado = gerarAlocacao(dataset);
    const baseline = gerarBaseline(dataset);
    return { antes: baseline.metricas, depois: otimizado.metricas };
  }, [dataset]);

  // --- CRUD das entradas (seção 5) ---
  const addSala = useCallback((sala) => setSalas((p) => [...p, sala]), []);
  const updateSala = useCallback((id, patch) => setSalas((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s))), []);
  const removeSala = useCallback((id) => setSalas((p) => p.filter((s) => s.id !== id)), []);

  const addEquipe = useCallback((equipe) => setEquipes((p) => [...p, equipe]), []);
  const updateEquipe = useCallback((id, patch) => setEquipes((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e))), []);
  const removeEquipe = useCallback((id) => setEquipes((p) => p.filter((e) => e.id !== id)), []);

  const addProximidade = useCallback((a, b) =>
    setRestricoes((r) => ({ ...r, proximidades: [...r.proximidades, [a, b]] })), []);
  const addSeparacao = useCallback((a, b) =>
    setRestricoes((r) => ({ ...r, separacoes: [...r.separacoes, [a, b]] })), []);

  const setorNome = useCallback((id) => setores.find((s) => s.id === id)?.nome || `#${id}`, [setores]);

  const value = {
    salas, setores, equipes, restricoes, execucoes, intervencoes,
    role, setRole, usuario, dataset, execucaoAtual,
    gerar, aprovar, rejeitar, editarAlocacao, comparacao,
    addSala, updateSala, removeSala, addEquipe, updateEquipe, removeEquipe,
    addProximidade, addSeparacao, setorNome,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppStateProvider');
  return ctx;
}

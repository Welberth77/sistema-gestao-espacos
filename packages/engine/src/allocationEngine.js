// allocationEngine.js
// MOTOR DE ALOCAÇÃO — allocation-engine-v1
// Heurística gulosa com função de pontuação (seções 4 e 6 do enunciado).
//
// Estratégia:
//   1. Ordena equipes por prioridade (desc) e depois por tamanho (desc):
//      as maiores e mais críticas são as mais difíceis de alocar, então vão primeiro.
//   2. Para cada equipe, monta o conjunto de salas candidatas que passam por
//      TODAS as restrições rígidas.
//   3. Pontua cada candidata pela função-objetivo e escolhe a de maior nota.
//   4. Equipes sem candidata viram exceções com causa e encaminhamento (seção 11).
//
// O motor é PURO: não acessa banco, rede nem relógio de parede além do cronômetro.

import { checarRestricoesRigidas, checarCapacidade, checarRecursos, checarAcessibilidade } from './constraints.js';
import { pontuarSala } from './scoring.js';
import { calcularMetricas } from './metrics.js';

export const VERSAO_MOTOR = 'allocation-engine-v1';

/**
 * @param {object} dados
 * @param {Array} dados.salas
 * @param {Array} dados.equipes
 * @param {Array} dados.setores
 * @param {object} dados.restricoes { proximidades: [[a,b]], separacoes: [[a,b]] }
 * @returns {object} resultado da alocação
 */
export function gerarAlocacao({ salas, equipes, setores = [], restricoes = {} }) {
  const inicio = now();

  const proximidades = restricoes.proximidades || [];
  const separacoes = restricoes.separacoes || [];

  // Mapa de equipes relacionadas (proximidade), em ambas as direções.
  const relacionados = new Map();
  for (const [a, b] of proximidades) {
    if (!relacionados.has(a)) relacionados.set(a, new Set());
    if (!relacionados.has(b)) relacionados.set(b, new Set());
    relacionados.get(a).add(b);
    relacionados.get(b).add(a);
  }

  // Estado da execução
  const salasOcupadas = new Set(); // sala_id já usada
  const andaresPorSetor = new Map(); // setor_id -> Set(andares)
  const equipesPorAndar = new Map(); // andar -> Set(equipe_id)

  const alocacoes = [];
  const naoAlocadas = [];

  // 1. Ordenação gulosa
  const ordenadas = [...equipes].sort((a, b) => {
    if (b.prioridade !== a.prioridade) return b.prioridade - a.prioridade;
    return b.pessoas - a.pessoas;
  });

  const contextoBase = { salasOcupadas, separacoes, andaresPorSetor };

  for (const equipe of ordenadas) {
    // 2. Conjunto de candidatas
    const candidatas = [];
    for (const sala of salas) {
      const { ok } = checarRestricoesRigidas(sala, equipe, contextoBase);
      if (ok) candidatas.push(sala);
    }

    if (candidatas.length === 0) {
      naoAlocadas.push(diagnosticar(equipe, salas));
      continue;
    }

    // 3. Pontuação e escolha
    const contextoPontuacao = { equipesPorAndar, relacionados };
    const avaliadas = candidatas
      .map((sala) => ({ sala, ...pontuarSala(sala, equipe, contextoPontuacao) }))
      .sort((x, y) => y.nota - x.nota);

    const escolhida = avaliadas[0];
    const sala = escolhida.sala;

    // Atualiza estado
    salasOcupadas.add(sala.id);
    if (!andaresPorSetor.has(equipe.setor_id)) andaresPorSetor.set(equipe.setor_id, new Set());
    andaresPorSetor.get(equipe.setor_id).add(sala.andar);
    if (!equipesPorAndar.has(sala.andar)) equipesPorAndar.set(sala.andar, new Set());
    equipesPorAndar.get(sala.andar).add(equipe.id);

    // Registro com dados de EXPLICABILIDADE (seção 9)
    alocacoes.push({
      equipe,
      sala,
      nota: round(escolhida.nota),
      ocupacao: round(equipe.pessoas / sala.capacidade),
      alternativas_avaliadas: avaliadas.length,
      justificativa: montarJustificativa(equipe, sala, escolhida, avaliadas.length),
    });
  }

  const tempo_ms = Math.round((now() - inicio) * 100) / 100;
  const metricas = calcularMetricas(alocacoes, naoAlocadas, salas, 0);

  return {
    versao_motor: VERSAO_MOTOR,
    tempo_ms,
    alocacoes,
    nao_alocadas: naoAlocadas,
    metricas,
    contadores: {
      equipes_analisadas: equipes.length,
      salas_analisadas: salas.length,
      alocadas: alocacoes.length,
      nao_alocadas: naoAlocadas.length,
      violacoes: 0,
      ocupacao_prevista: metricas.ocupacao_media,
    },
  };
}

/** Monta a explicação legível de uma alocação (seção 9). */
function montarJustificativa(equipe, sala, escolhida, alternativas) {
  const { detalhes } = escolhida;
  const razoes = [];
  razoes.push(`Ocupação prevista de ${pct(detalhes.ocupacao)} (${equipe.pessoas}/${sala.capacidade}).`);
  if (detalhes.andarPreferido) razoes.push(`Atende à preferência pelo ${sala.andar}º andar.`);
  if (detalhes.proximidadePontos > 0) razoes.push('Fica próxima de equipes relacionadas já alocadas neste andar.');
  if ((equipe.requisitos || []).length > 0) razoes.push(`Recursos necessários atendidos: ${equipe.requisitos.join(', ')}.`);
  if (equipe.precisa_acessibilidade) razoes.push('Restrição de acessibilidade atendida.');

  return {
    sala_id: sala.id,
    capacidade: sala.capacidade,
    pessoas: equipe.pessoas,
    ocupacao_prevista: round(detalhes.ocupacao),
    recursos_atendidos: (equipe.requisitos || []).length === 0 ? true : true,
    restricao_andar_atendida: equipe.andar_preferido == null || equipe.andar_preferido === sala.andar,
    alternativas_avaliadas: alternativas,
    resumo:
      `Sala ${sala.id} recomendada para ${equipe.nome}. ` +
      razoes.join(' ') +
      ` Apresentou o melhor equilíbrio entre capacidade, localização e restrições dentre ${alternativas} alternativa(s) avaliada(s).`,
    fatores: detalhes,
  };
}

/**
 * Diagnostica por que uma equipe não pôde ser alocada (seção 11).
 * Devolve a causa e um encaminhamento possível — nunca esconde o problema.
 */
function diagnosticar(equipe, salas) {
  const disponiveis = salas.filter((s) => s.disponivel);
  const maiorCapacidade = disponiveis.reduce((m, s) => Math.max(m, s.capacidade), 0);

  let restricao = 'Sem sala compatível disponível';
  let causa = 'Nenhuma sala livre atendeu a todas as restrições após as alocações anteriores.';
  let encaminhamento = 'Reveja as restrições da equipe ou disponibilize salas adicionais e execute nova otimização.';

  if (maiorCapacidade < equipe.pessoas) {
    restricao = 'Capacidade insuficiente';
    causa = `A maior sala disponível comporta ${maiorCapacidade} pessoas; a equipe tem ${equipe.pessoas}.`;
    encaminhamento = 'Dividir a equipe, liberar uma sala maior ou reservar um auditório de maior capacidade.';
  } else {
    // Existe capacidade em tese; verifica se recurso/acessibilidade barram sozinhos.
    const porCapacidade = disponiveis.filter((s) => checarCapacidade(s, equipe).ok);
    const semRecurso = porCapacidade.filter((s) => checarRecursos(s, equipe).ok).length === 0;
    const semAcesso =
      equipe.precisa_acessibilidade && porCapacidade.filter((s) => checarAcessibilidade(s, equipe).ok).length === 0;
    if (semRecurso && (equipe.requisitos || []).length > 0) {
      restricao = 'Recurso obrigatório indisponível';
      causa = `Nenhuma sala com capacidade suficiente possui: ${equipe.requisitos.join(', ')}.`;
      encaminhamento = 'Equipar uma sala com os recursos exigidos ou revisar os requisitos da equipe.';
    } else if (semAcesso) {
      restricao = 'Acessibilidade obrigatória não atendida';
      causa = 'Nenhuma sala acessível com capacidade suficiente estava livre.';
      encaminhamento = 'Disponibilizar uma sala acessível ou reavaliar a exigência de acessibilidade.';
    }
  }

  return { equipe, restricao, causa, encaminhamento };
}

function pct(x) {
  return `${Math.round(x * 100)}%`;
}
function round(n) {
  return Math.round(n * 10000) / 10000;
}
function now() {
  if (typeof performance !== 'undefined' && performance.now) return performance.now();
  return Date.now();
}

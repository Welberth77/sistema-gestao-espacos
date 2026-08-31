// baseline.js
// Estratégia INGÊNUA (first-fit) que representa a "situação inicial" (seção 8).
// Percorre as equipes na ordem original e pega a PRIMEIRA sala livre que caiba,
// ignorando restrições flexíveis e algumas rígidas — de propósito.
// Serve de referência para provar que a otimização traz ganho real.
// As violações são contadas a posteriori, sem escondê-las.

import { calcularMetricas } from './metrics.js';

export function gerarBaseline({ salas, equipes, restricoes = {} }) {
  const separacoes = restricoes.separacoes || [];
  const salasOcupadas = new Set();
  const andaresPorSetor = new Map();

  const alocacoes = [];
  const naoAlocadas = [];
  let violacoes = 0;

  for (const equipe of equipes) {
    // First-fit: primeira sala disponível cuja capacidade comporta a equipe.
    const sala = salas.find(
      (s) => s.disponivel && !salasOcupadas.has(s.id) && s.capacidade >= equipe.pessoas
    );

    if (!sala) {
      naoAlocadas.push({
        equipe,
        restricao: 'Sem sala livre com capacidade',
        causa: 'Estratégia inicial não encontrou sala disponível que coubesse.',
        encaminhamento: 'Executar a otimização.',
      });
      continue;
    }

    salasOcupadas.add(sala.id);
    if (!andaresPorSetor.has(equipe.setor_id)) andaresPorSetor.set(equipe.setor_id, new Set());

    // Conta violações que a estratégia ingênua comete (mas não corrige).
    if ((equipe.requisitos || []).some((r) => !(sala.recursos || []).includes(r))) violacoes++;
    if (equipe.precisa_acessibilidade && !sala.acessivel) violacoes++;
    if (sala.reservada_para_setor_id != null && sala.reservada_para_setor_id !== equipe.setor_id) violacoes++;
    for (const [a, b] of separacoes) {
      const outro = a === equipe.setor_id ? b : b === equipe.setor_id ? a : null;
      if (outro != null && andaresPorSetor.get(outro)?.has(sala.andar)) violacoes++;
    }

    andaresPorSetor.get(equipe.setor_id).add(sala.andar);
    alocacoes.push({ equipe, sala });
  }

  const metricas = calcularMetricas(alocacoes, naoAlocadas, salas, violacoes);
  return { alocacoes, nao_alocadas: naoAlocadas, metricas, violacoes };
}

// metrics.js
// Calcula as métricas de uma alocação, usadas no dashboard (seção 7),
// na comparação antes/depois (seção 8) e no registro de governança (seção 12).

/**
 * @param {Array} alocacoes  [{ equipe, sala }]
 * @param {Array} naoAlocadas [{ equipe, ... }]
 * @param {Array} salas  todas as salas do prédio
 * @param {number} violacoes  quantidade de restrições rígidas violadas
 */
export function calcularMetricas(alocacoes, naoAlocadas, salas, violacoes = 0) {
  const salasDisponiveis = salas.filter((s) => s.disponivel);
  const salasOcupadas = alocacoes.length;

  let assentosOciosos = 0;
  let somaOcupacao = 0;
  let funcionariosAlocados = 0;

  for (const { equipe, sala } of alocacoes) {
    assentosOciosos += sala.capacidade - equipe.pessoas;
    somaOcupacao += equipe.pessoas / sala.capacidade;
    funcionariosAlocados += equipe.pessoas;
  }

  const funcionariosNaoAlocados = naoAlocadas.reduce((acc, n) => acc + n.equipe.pessoas, 0);
  const ocupacaoMedia = salasOcupadas > 0 ? somaOcupacao / salasOcupadas : 0;

  // Ocupação por andar (1 a 9)
  const porAndar = {};
  for (const sala of salasDisponiveis) {
    if (!porAndar[sala.andar]) {
      porAndar[sala.andar] = { andar: sala.andar, capacidade: 0, alocados: 0, salas: 0, ocupadas: 0 };
    }
    porAndar[sala.andar].capacidade += sala.capacidade;
    porAndar[sala.andar].salas += 1;
  }
  for (const { equipe, sala } of alocacoes) {
    if (!porAndar[sala.andar]) {
      porAndar[sala.andar] = { andar: sala.andar, capacidade: 0, alocados: 0, salas: 0, ocupadas: 0 };
    }
    porAndar[sala.andar].alocados += equipe.pessoas;
    porAndar[sala.andar].ocupadas += 1;
  }
  const ocupacaoPorAndar = Object.values(porAndar)
    .map((a) => ({
      ...a,
      utilizacao: a.capacidade > 0 ? a.alocados / a.capacidade : 0,
    }))
    .sort((x, y) => x.andar - y.andar);

  const capacidadeTotal = salasDisponiveis.reduce((acc, s) => acc + s.capacidade, 0);

  return {
    ocupacao_media: round(ocupacaoMedia),
    assentos_ociosos: assentosOciosos,
    equipes_alocadas: alocacoes.length,
    equipes_nao_alocadas: naoAlocadas.length,
    funcionarios_alocados: funcionariosAlocados,
    funcionarios_nao_alocados: funcionariosNaoAlocados,
    salas_ocupadas: salasOcupadas,
    salas_disponiveis: salasDisponiveis.length,
    percentual_utilizacao_salas:
      salasDisponiveis.length > 0 ? round(salasOcupadas / salasDisponiveis.length) : 0,
    capacidade_total: capacidadeTotal,
    capacidade_disponivel: capacidadeTotal - funcionariosAlocados,
    violacoes,
    ocupacao_por_andar: ocupacaoPorAndar,
  };
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}

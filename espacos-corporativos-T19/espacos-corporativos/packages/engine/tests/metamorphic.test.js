// metamorphic.test.js — testes metamórficos (seção 15).
// Verificam PROPRIEDADES/RELAÇÕES esperadas, úteis quando não conhecemos
// antecipadamente a solução ótima.
import { describe, it, expect } from 'vitest';
import { gerarAlocacao } from '../src/allocationEngine.js';
import { cenario } from './fixtures.js';

describe('Testes metamórficos', () => {
  it('MT1 — Capacidade: nenhuma alocação excede a capacidade da sala', () => {
    const res = gerarAlocacao(cenario());
    const violou = res.alocacoes.some((a) => a.equipe.pessoas > a.sala.capacidade);
    expect(violou).toBe(false);
  });

  it('MT2 — Adição de sala não reduz o número de equipes alocadas', () => {
    const base = gerarAlocacao(cenario());

    const comSalaExtra = cenario();
    comSalaExtra.salas.push({
      id: 'EXTRA', andar: 5, capacidade: 60, tipo: 'Espaço Colaborativo',
      recursos: ['Projetor', 'Computadores', 'Videoconferência', 'Lab'],
      acessivel: true, disponivel: true, reservada_para_setor_id: null,
    });
    const depois = gerarAlocacao(comSalaExtra);

    expect(depois.contadores.alocadas).toBeGreaterThanOrEqual(base.contadores.alocadas);
  });

  it('MT3 — Remoção de restrição não reduz o espaço de soluções', () => {
    const comRestricao = cenario();
    comRestricao.restricoes.separacoes = [[1, 8]]; // Tecnologia e P&D separados
    const antes = gerarAlocacao(comRestricao);

    const semRestricao = cenario();
    semRestricao.restricoes.separacoes = []; // restrição removida
    const depois = gerarAlocacao(semRestricao);

    expect(depois.contadores.alocadas).toBeGreaterThanOrEqual(antes.contadores.alocadas);
  });

  it('MT4 — Renomear uma equipe não altera a qualidade global', () => {
    const original = gerarAlocacao(cenario());

    const renomeado = cenario();
    const alvo = renomeado.equipes.find((e) => e.id === 'E2');
    alvo.nome = alvo.nome + ' (renomeada)';
    const depois = gerarAlocacao(renomeado);

    expect(depois.contadores.alocadas).toBe(original.contadores.alocadas);
    expect(depois.metricas.ocupacao_media).toBe(original.metricas.ocupacao_media);
    expect(depois.metricas.assentos_ociosos).toBe(original.metricas.assentos_ociosos);
  });
});

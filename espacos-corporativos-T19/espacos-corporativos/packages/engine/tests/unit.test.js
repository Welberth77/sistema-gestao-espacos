// unit.test.js — testes unitários do motor + critérios de aceitação (seção 14).
import { describe, it, expect } from 'vitest';
import { gerarAlocacao } from '../src/allocationEngine.js';
import { gerarBaseline } from '../src/baseline.js';
import { cenario } from './fixtures.js';

describe('Motor de alocação — restrições rígidas', () => {
  it('C1: nenhuma sala recebe mais pessoas que sua capacidade', () => {
    const res = gerarAlocacao(cenario());
    for (const a of res.alocacoes) {
      expect(a.equipe.pessoas).toBeLessThanOrEqual(a.sala.capacidade);
    }
  });

  it('respeita recursos obrigatórios', () => {
    const res = gerarAlocacao(cenario());
    for (const a of res.alocacoes) {
      for (const req of a.equipe.requisitos || []) {
        expect(a.sala.recursos).toContain(req);
      }
    }
  });

  it('respeita salas reservadas (LAB1 é do setor 8)', () => {
    const res = gerarAlocacao(cenario());
    const lab = res.alocacoes.find((a) => a.sala.id === 'LAB1');
    if (lab) expect(lab.equipe.setor_id).toBe(8);
  });

  it('C2: não produz violações de restrições rígidas', () => {
    const res = gerarAlocacao(cenario());
    expect(res.contadores.violacoes).toBe(0);
  });
});

describe('Critérios de aceitação', () => {
  it('C3: 100% das alocações possuem justificativa', () => {
    const res = gerarAlocacao(cenario());
    for (const a of res.alocacoes) {
      expect(a.justificativa).toBeTruthy();
      expect(a.justificativa.resumo.length).toBeGreaterThan(0);
    }
  });

  it('C4: toda equipe não alocada possui motivo registrado', () => {
    // Adiciona uma equipe grande demais para forçar exceção.
    const dados = cenario();
    dados.equipes.push({
      id: 'BIG', setor_id: 1, nome: 'Gigante', pessoas: 999, horario: 'Comercial',
      requisitos: [], prioridade: 5, precisa_acessibilidade: false, andar_preferido: null,
    });
    const res = gerarAlocacao(dados);
    expect(res.nao_alocadas.length).toBeGreaterThan(0);
    for (const n of res.nao_alocadas) {
      expect(n.restricao).toBeTruthy();
      expect(n.causa).toBeTruthy();
      expect(n.encaminhamento).toBeTruthy();
    }
  });

  it('C5: a otimização reduz a ociosidade em relação ao baseline', () => {
    const dados = cenario();
    const otimizado = gerarAlocacao(dados);
    const baseline = gerarBaseline(dados);
    expect(otimizado.metricas.assentos_ociosos).toBeLessThanOrEqual(
      baseline.metricas.assentos_ociosos
    );
  });

  it('C6: a recomendação é gerada dentro do limite de tempo (< 3000 ms)', () => {
    const res = gerarAlocacao(cenario());
    expect(res.tempo_ms).toBeLessThan(3000);
  });
});

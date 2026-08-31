// scoring.js
// FUNÇÃO-OBJETIVO (seção 4 do enunciado): "o que é uma boa alocação".
// Cada sala candidata recebe uma nota. Quanto maior, melhor o encaixe.
// A nota equilibra: ocupação (encaixe justo), preferência de andar,
// proximidade de equipes relacionadas e evita uso indevido de salas especiais.

import { ehSalaEspecial } from './constraints.js';

export const PESOS = {
  ocupacao: 100, // recompensa encaixe justo -> minimiza assentos ociosos
  andarPreferido: 20, // atende preferência de andar
  proximidade: 15, // por equipe relacionada já presente no andar
  proximidadeMax: 30, // teto do bônus de proximidade
  penalidadeEspecial: 25, // usar auditório/laboratório sem necessidade
};

/**
 * Calcula a nota de uma sala candidata para uma equipe.
 * `contexto.equipesPorAndar` mapeia andar -> Set(equipe_id) já alocadas.
 * `contexto.relacionados` mapeia equipe_id -> Set(equipe_id relacionadas).
 */
export function pontuarSala(sala, equipe, contexto) {
  const { equipesPorAndar, relacionados } = contexto;

  const ocupacao = equipe.pessoas / sala.capacidade; // 0..1
  let nota = ocupacao * PESOS.ocupacao;

  const detalhes = {
    ocupacao,
    ocupacaoPontos: ocupacao * PESOS.ocupacao,
    andarPreferido: false,
    proximidadePontos: 0,
    penalidadeEspecial: 0,
  };

  // Preferência de andar
  if (equipe.andar_preferido != null && equipe.andar_preferido === sala.andar) {
    nota += PESOS.andarPreferido;
    detalhes.andarPreferido = true;
  }

  // Proximidade: equipes relacionadas já presentes neste andar
  const relacionadasDaEquipe = relacionados.get(equipe.id);
  if (relacionadasDaEquipe && relacionadasDaEquipe.size > 0) {
    const noAndar = equipesPorAndar.get(sala.andar);
    if (noAndar) {
      let bonus = 0;
      for (const rel of relacionadasDaEquipe) {
        if (noAndar.has(rel)) bonus += PESOS.proximidade;
      }
      bonus = Math.min(bonus, PESOS.proximidadeMax);
      nota += bonus;
      detalhes.proximidadePontos = bonus;
    }
  }

  // Penalidade por usar sala especial sem necessidade
  const precisaEspecial =
    (equipe.requisitos || []).includes('Lab') || sala.tipo === 'Auditório' && equipe.pessoas > sala.capacidade * 0.7;
  if (ehSalaEspecial(sala) && !precisaEspecial) {
    nota -= PESOS.penalidadeEspecial;
    detalhes.penalidadeEspecial = PESOS.penalidadeEspecial;
  }

  return { nota, detalhes };
}

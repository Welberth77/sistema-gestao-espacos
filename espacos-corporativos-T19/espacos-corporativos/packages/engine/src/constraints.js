// constraints.js
// Verificação das RESTRIÇÕES RÍGIDAS (hard constraints).
// Uma sala só é candidata para uma equipe se passar por TODAS estas verificações.
// Cada função devolve { ok: boolean, motivo?: string } para permitir diagnóstico
// de exceções (seção 11 do enunciado).

const TIPOS_ESPECIAIS = ['Auditório', 'Laboratório'];

/** A sala precisa estar marcada como disponível e ainda não ocupada nesta execução. */
export function checarDisponibilidade(sala, salasOcupadas) {
  if (!sala.disponivel) return { ok: false, motivo: 'Sala indisponível' };
  if (salasOcupadas.has(sala.id)) return { ok: false, motivo: 'Sala já ocupada nesta execução' };
  return { ok: true };
}

/** A capacidade da sala precisa comportar a equipe inteira. */
export function checarCapacidade(sala, equipe) {
  if (sala.capacidade < equipe.pessoas) {
    return { ok: false, motivo: `Capacidade ${sala.capacidade} < equipe ${equipe.pessoas}` };
  }
  return { ok: true };
}

/** Todos os recursos exigidos pela equipe precisam existir na sala. */
export function checarRecursos(sala, equipe) {
  const recursosSala = new Set(sala.recursos || []);
  const faltando = (equipe.requisitos || []).filter((r) => !recursosSala.has(r));
  if (faltando.length > 0) {
    return { ok: false, motivo: `Recurso(s) ausente(s): ${faltando.join(', ')}` };
  }
  return { ok: true };
}

/** Se a equipe exige acessibilidade, a sala precisa ser acessível. */
export function checarAcessibilidade(sala, equipe) {
  if (equipe.precisa_acessibilidade && !sala.acessivel) {
    return { ok: false, motivo: 'Equipe exige acessibilidade e a sala não é acessível' };
  }
  return { ok: true };
}

/** Sala reservada só pode receber equipes do setor dono da reserva. */
export function checarReserva(sala, equipe) {
  if (sala.reservada_para_setor_id != null && sala.reservada_para_setor_id !== equipe.setor_id) {
    return { ok: false, motivo: `Sala reservada para outro setor (#${sala.reservada_para_setor_id})` };
  }
  return { ok: true };
}

/**
 * Setores que não podem compartilhar área não podem ficar no mesmo andar.
 * `andaresPorSetor` mapeia setor_id -> Set(andares já ocupados por ele).
 */
export function checarSeparacao(sala, equipe, separacoes, andaresPorSetor) {
  for (const [setorA, setorB] of separacoes) {
    let outro = null;
    if (setorA === equipe.setor_id) outro = setorB;
    else if (setorB === equipe.setor_id) outro = setorA;
    if (outro == null) continue;
    const andaresDoOutro = andaresPorSetor.get(outro);
    if (andaresDoOutro && andaresDoOutro.has(sala.andar)) {
      return { ok: false, motivo: `Separação: setor #${outro} já está no ${sala.andar}º andar` };
    }
  }
  return { ok: true };
}

/**
 * Roda todas as restrições rígidas. Devolve { ok, motivos: [] }.
 * Usado para montar o conjunto de salas candidatas.
 */
export function checarRestricoesRigidas(sala, equipe, contexto) {
  const { salasOcupadas, separacoes, andaresPorSetor } = contexto;
  const checagens = [
    checarDisponibilidade(sala, salasOcupadas),
    checarCapacidade(sala, equipe),
    checarRecursos(sala, equipe),
    checarAcessibilidade(sala, equipe),
    checarReserva(sala, equipe),
    checarSeparacao(sala, equipe, separacoes, andaresPorSetor),
  ];
  const motivos = checagens.filter((c) => !c.ok).map((c) => c.motivo);
  return { ok: motivos.length === 0, motivos };
}

export function ehSalaEspecial(sala) {
  return TIPOS_ESPECIAIS.includes(sala.tipo);
}

// dados.js — carrega o dataset completo do banco no formato esperado pelo motor.
import { pool } from './db.js';

export async function carregarDataset() {
  const [salas, equipes, setores, prox, sep] = await Promise.all([
    pool.query('SELECT * FROM salas ORDER BY andar, id'),
    pool.query('SELECT * FROM equipes ORDER BY id'),
    pool.query('SELECT * FROM setores ORDER BY id'),
    pool.query('SELECT * FROM proximidades'),
    pool.query('SELECT * FROM separacoes'),
  ]);

  return {
    salas: salas.rows,
    equipes: equipes.rows,
    setores: setores.rows,
    restricoes: {
      proximidades: prox.rows.map((r) => [r.equipe_a_id, r.equipe_b_id]),
      separacoes: sep.rows.map((r) => [r.setor_a_id, r.setor_b_id]),
    },
  };
}

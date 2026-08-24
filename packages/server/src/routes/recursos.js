// routes/recursos.js — CRUD das entidades de entrada (seção 5).
import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// ---- SALAS ----
router.get('/salas', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM salas ORDER BY andar, id');
    res.json(r.rows);
  } catch (e) { next(e); }
});

router.post('/salas', async (req, res, next) => {
  try {
    const { id, andar, capacidade, tipo, recursos = [], acessivel = false, disponivel = true, reservada_para_setor_id = null } = req.body;
    const r = await pool.query(
      `INSERT INTO salas (id, andar, capacidade, tipo, recursos, acessivel, disponivel, reservada_para_setor_id)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8) RETURNING *`,
      [id, andar, capacidade, tipo, JSON.stringify(recursos), acessivel, disponivel, reservada_para_setor_id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});

router.put('/salas/:id', async (req, res, next) => {
  try {
    const { andar, capacidade, tipo, recursos, acessivel, disponivel, reservada_para_setor_id } = req.body;
    const r = await pool.query(
      `UPDATE salas SET andar=$1, capacidade=$2, tipo=$3, recursos=$4::jsonb, acessivel=$5, disponivel=$6, reservada_para_setor_id=$7
       WHERE id=$8 RETURNING *`,
      [andar, capacidade, tipo, JSON.stringify(recursos || []), acessivel, disponivel, reservada_para_setor_id, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

router.delete('/salas/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM salas WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (e) { next(e); }
});

// ---- SETORES ----
router.get('/setores', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM setores ORDER BY id');
    res.json(r.rows);
  } catch (e) { next(e); }
});

router.post('/setores', async (req, res, next) => {
  try {
    const { nome, coordenador, total_funcionarios = 0 } = req.body;
    const r = await pool.query(
      'INSERT INTO setores (nome, coordenador, total_funcionarios) VALUES ($1,$2,$3) RETURNING *',
      [nome, coordenador, total_funcionarios]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});

// ---- EQUIPES ----
router.get('/equipes', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM equipes ORDER BY id');
    res.json(r.rows);
  } catch (e) { next(e); }
});

router.post('/equipes', async (req, res, next) => {
  try {
    const { id, setor_id, nome, pessoas, horario = 'Comercial', requisitos = [], prioridade = 3, precisa_acessibilidade = false, andar_preferido = null } = req.body;
    const novoId = id || `E${Date.now().toString().slice(-6)}`;
    const r = await pool.query(
      `INSERT INTO equipes (id, setor_id, nome, pessoas, horario, requisitos, prioridade, precisa_acessibilidade, andar_preferido)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) RETURNING *`,
      [novoId, setor_id, nome, pessoas, horario, JSON.stringify(requisitos), prioridade, precisa_acessibilidade, andar_preferido]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { next(e); }
});

router.put('/equipes/:id', async (req, res, next) => {
  try {
    const { setor_id, nome, pessoas, horario, requisitos, prioridade, precisa_acessibilidade, andar_preferido } = req.body;
    const r = await pool.query(
      `UPDATE equipes SET setor_id=$1, nome=$2, pessoas=$3, horario=$4, requisitos=$5::jsonb, prioridade=$6, precisa_acessibilidade=$7, andar_preferido=$8
       WHERE id=$9 RETURNING *`,
      [setor_id, nome, pessoas, horario, JSON.stringify(requisitos || []), prioridade, precisa_acessibilidade, andar_preferido, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

router.delete('/equipes/:id', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM equipes WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (e) { next(e); }
});

// ---- RESTRIÇÕES ----
router.get('/restricoes', async (req, res, next) => {
  try {
    const [prox, sep] = await Promise.all([
      pool.query('SELECT * FROM proximidades'),
      pool.query('SELECT * FROM separacoes'),
    ]);
    res.json({ proximidades: prox.rows, separacoes: sep.rows });
  } catch (e) { next(e); }
});

router.post('/restricoes/proximidade', async (req, res, next) => {
  try {
    const { equipe_a_id, equipe_b_id } = req.body;
    await pool.query('INSERT INTO proximidades (equipe_a_id, equipe_b_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [equipe_a_id, equipe_b_id]);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/restricoes/separacao', async (req, res, next) => {
  try {
    const { setor_a_id, setor_b_id } = req.body;
    await pool.query('INSERT INTO separacoes (setor_a_id, setor_b_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [setor_a_id, setor_b_id]);
    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

export default router;

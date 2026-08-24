// routes/alocacoes.js — motor (seção 6), intervenção humana (seção 10) e governança (seção 12).
import { Router } from 'express';
import { gerarAlocacao } from '@espacos/engine';
import { pool, withTransaction } from '../db.js';
import { carregarDataset } from '../dados.js';

const router = Router();

// POST /api/alocacoes/gerar — roda o motor, persiste tudo e devolve a proposta.
router.post('/gerar', async (req, res, next) => {
  try {
    const usuario = req.body?.usuario || 'coordenador-geral';
    const dataset = await carregarDataset();
    const resultado = gerarAlocacao(dataset);

    const execId = await withTransaction(async (client) => {
      const exec = await client.query(
        `INSERT INTO execucoes
          (usuario, versao_motor, equipes_analisadas, salas_analisadas, alocadas, nao_alocadas, violacoes, ocupacao_prevista, tempo_ms, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pendente') RETURNING id`,
        [
          usuario,
          resultado.versao_motor,
          resultado.contadores.equipes_analisadas,
          resultado.contadores.salas_analisadas,
          resultado.contadores.alocadas,
          resultado.contadores.nao_alocadas,
          resultado.contadores.violacoes,
          resultado.contadores.ocupacao_prevista,
          resultado.tempo_ms,
        ]
      );
      const id = exec.rows[0].id;

      for (const a of resultado.alocacoes) {
        await client.query(
          `INSERT INTO alocacoes (execucao_id, equipe_id, sala_id, ocupacao, alternativas, justificativa, manual)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,false)`,
          [id, a.equipe.id, a.sala.id, a.ocupacao, a.alternativas_avaliadas, JSON.stringify(a.justificativa)]
        );
      }
      for (const n of resultado.nao_alocadas) {
        await client.query(
          `INSERT INTO nao_alocadas (execucao_id, equipe_id, restricao, causa, encaminhamento)
           VALUES ($1,$2,$3,$4,$5)`,
          [id, n.equipe.id, n.restricao, n.causa, n.encaminhamento]
        );
      }
      return id;
    });

    res.status(201).json({ execucao_id: execId, ...resultado });
  } catch (e) { next(e); }
});

// GET /api/alocacoes/:execId — proposta detalhada de uma execução.
router.get('/:execId', async (req, res, next) => {
  try {
    const { execId } = req.params;
    const [exec, alocs, nao] = await Promise.all([
      pool.query('SELECT * FROM execucoes WHERE id=$1', [execId]),
      pool.query(
        `SELECT a.*, e.nome AS equipe_nome, e.pessoas, e.setor_id, s.andar, s.capacidade, s.tipo
         FROM alocacoes a
         JOIN equipes e ON e.id=a.equipe_id
         JOIN salas s ON s.id=a.sala_id
         WHERE a.execucao_id=$1 ORDER BY s.andar, s.id`, [execId]
      ),
      pool.query(
        `SELECT n.*, e.nome AS equipe_nome, e.pessoas
         FROM nao_alocadas n JOIN equipes e ON e.id=n.equipe_id
         WHERE n.execucao_id=$1`, [execId]
      ),
    ]);
    if (exec.rows.length === 0) return res.status(404).json({ erro: 'Execução não encontrada' });
    res.json({ execucao: exec.rows[0], alocacoes: alocs.rows, nao_alocadas: nao.rows });
  } catch (e) { next(e); }
});

// POST /api/alocacoes/:execId/aprovar
router.post('/:execId/aprovar', async (req, res, next) => {
  try {
    const usuario = req.body?.usuario || 'coordenador-geral';
    await pool.query(`UPDATE execucoes SET status='aprovada' WHERE id=$1`, [req.params.execId]);
    await pool.query(
      `INSERT INTO intervencoes (execucao_id, usuario, tipo, detalhe) VALUES ($1,$2,'aprovar','Recomendação aprovada')`,
      [req.params.execId, usuario]
    );
    res.json({ ok: true, status: 'aprovada' });
  } catch (e) { next(e); }
});

// POST /api/alocacoes/:execId/rejeitar
router.post('/:execId/rejeitar', async (req, res, next) => {
  try {
    const usuario = req.body?.usuario || 'coordenador-geral';
    const motivo = req.body?.motivo || 'Recomendação rejeitada';
    await pool.query(`UPDATE execucoes SET status='rejeitada' WHERE id=$1`, [req.params.execId]);
    await pool.query(
      `INSERT INTO intervencoes (execucao_id, usuario, tipo, detalhe) VALUES ($1,$2,'rejeitar',$3)`,
      [req.params.execId, usuario, motivo]
    );
    res.json({ ok: true, status: 'rejeitada' });
  } catch (e) { next(e); }
});

// PUT /api/alocacoes/item/:id — edição manual de uma alocação (troca de sala).
router.put('/item/:id', async (req, res, next) => {
  try {
    const usuario = req.body?.usuario || 'coordenador-geral';
    const { sala_id } = req.body;
    const atual = await pool.query('SELECT * FROM alocacoes WHERE id=$1', [req.params.id]);
    if (atual.rows.length === 0) return res.status(404).json({ erro: 'Alocação não encontrada' });

    const equipe = await pool.query('SELECT * FROM equipes WHERE id=$1', [atual.rows[0].equipe_id]);
    const sala = await pool.query('SELECT * FROM salas WHERE id=$1', [sala_id]);
    if (sala.rows.length === 0) return res.status(400).json({ erro: 'Sala inexistente' });

    const ocupacao = equipe.rows[0].pessoas / sala.rows[0].capacidade;
    const just = {
      resumo: `Alteração manual: ${equipe.rows[0].nome} movida para a sala ${sala_id} pelo coordenador.`,
      manual: true,
      ocupacao_prevista: Math.round(ocupacao * 10000) / 10000,
    };

    await pool.query(
      `UPDATE alocacoes SET sala_id=$1, ocupacao=$2, justificativa=$3::jsonb, manual=true WHERE id=$4`,
      [sala_id, ocupacao, JSON.stringify(just), req.params.id]
    );
    await pool.query(
      `INSERT INTO intervencoes (execucao_id, usuario, tipo, detalhe) VALUES ($1,$2,'editar',$3)`,
      [atual.rows[0].execucao_id, usuario, `${equipe.rows[0].nome} -> sala ${sala_id}`]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;

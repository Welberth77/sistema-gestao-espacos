// routes/paineis.js — dashboard (7), comparação (8), governança (12),
// observabilidade (13) e execução dos testes metamórficos (15).
import { Router } from 'express';
import { gerarAlocacao, gerarBaseline } from '@espacos/engine';
import { pool } from '../db.js';
import { carregarDataset } from '../dados.js';

const router = Router();

// GET /api/dashboard — situação da última execução aprovada/mais recente.
router.get('/dashboard', async (req, res, next) => {
  try {
    const ultima = await pool.query(
      `SELECT id FROM execucoes ORDER BY (status='aprovada') DESC, datahora DESC LIMIT 1`
    );
    const dataset = await carregarDataset();

    if (ultima.rows.length === 0) {
      // Sem execução ainda: mostra o prédio vazio.
      const vazio = gerarAlocacao({ ...dataset, equipes: [] });
      return res.json({ execucao_id: null, metricas: vazio.metricas, gerado: false });
    }

    const execId = ultima.rows[0].id;
    const [exec, alocs, nao] = await Promise.all([
      pool.query('SELECT * FROM execucoes WHERE id=$1', [execId]),
      pool.query(
        `SELECT a.equipe_id, a.sala_id, e.pessoas, s.andar, s.capacidade
         FROM alocacoes a JOIN equipes e ON e.id=a.equipe_id JOIN salas s ON s.id=a.sala_id
         WHERE a.execucao_id=$1`, [execId]
      ),
      pool.query('SELECT equipe_id FROM nao_alocadas WHERE execucao_id=$1', [execId]),
    ]);

    // Reconstrói métricas a partir do estado persistido (respeita edições manuais).
    const alocacoes = alocs.rows.map((r) => ({
      equipe: { pessoas: r.pessoas },
      sala: { andar: r.andar, capacidade: r.capacidade },
    }));
    const naoAloc = nao.rows.map((r) => ({ equipe: { pessoas: 0 } }));

    const { calcularMetricas } = await import('@espacos/engine');
    const metricas = calcularMetricas(alocacoes, naoAloc, dataset.salas, exec.rows[0].violacoes);
    metricas.equipes_nao_alocadas = nao.rows.length;

    res.json({ execucao_id: execId, execucao: exec.rows[0], metricas, gerado: true });
  } catch (e) { next(e); }
});

// GET /api/comparacao — baseline (antes) vs otimizado (depois).
router.get('/comparacao', async (req, res, next) => {
  try {
    const dataset = await carregarDataset();
    const otimizado = gerarAlocacao(dataset);
    const baseline = gerarBaseline(dataset);
    res.json({
      antes: baseline.metricas,
      depois: otimizado.metricas,
      indicadores: [
        { indicador: 'Ocupação média', antes: pct(baseline.metricas.ocupacao_media), depois: pct(otimizado.metricas.ocupacao_media) },
        { indicador: 'Assentos ociosos', antes: baseline.metricas.assentos_ociosos, depois: otimizado.metricas.assentos_ociosos },
        { indicador: 'Equipes sem sala', antes: baseline.metricas.equipes_nao_alocadas, depois: otimizado.metricas.equipes_nao_alocadas },
        { indicador: 'Violações', antes: baseline.metricas.violacoes, depois: otimizado.metricas.violacoes },
      ],
    });
  } catch (e) { next(e); }
});

// GET /api/execucoes — histórico de governança.
router.get('/execucoes', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM execucoes ORDER BY datahora DESC LIMIT 50');
    res.json(r.rows);
  } catch (e) { next(e); }
});

// GET /api/execucoes/:id/intervencoes
router.get('/execucoes/:id/intervencoes', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM intervencoes WHERE execucao_id=$1 ORDER BY datahora', [req.params.id]);
    res.json(r.rows);
  } catch (e) { next(e); }
});

// GET /api/observabilidade — saúde do motor em produção (seção 13).
router.get('/observabilidade', async (req, res, next) => {
  try {
    const [agg, ultima, intervencoes, erros] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS execucoes, AVG(ocupacao_prevista) AS ocupacao_media,
                  SUM(nao_alocadas)::int AS total_nao_alocadas, SUM(violacoes)::int AS total_violacoes
                  FROM execucoes`),
      pool.query('SELECT tempo_ms, alocadas, nao_alocadas, ocupacao_prevista, datahora FROM execucoes ORDER BY datahora DESC LIMIT 1'),
      pool.query(`SELECT COUNT(*)::int AS c FROM intervencoes WHERE tipo='editar'`),
      pool.query(`SELECT COUNT(*)::int AS c FROM execucoes WHERE status='rejeitada'`),
    ]);

    const a = agg.rows[0];
    const u = ultima.rows[0] || {};
    const taxa = u.alocadas != null ? u.alocadas / (u.alocadas + u.nao_alocadas || 1) : 0;

    res.json({
      tempo_ultima_ms: u.tempo_ms ?? null,
      execucoes: a.execucoes,
      ocupacao_media: a.ocupacao_media ? Number(a.ocupacao_media) : 0,
      taxa_alocacao: Math.round(taxa * 10000) / 10000,
      conflitos: a.total_violacoes || 0,
      nao_alocadas: a.total_nao_alocadas || 0,
      intervencoes_manuais: intervencoes.rows[0].c,
      erros: erros.rows[0].c,
    });
  } catch (e) { next(e); }
});

// GET /api/testes/metamorficos — roda os testes metamórficos ao vivo (seção 15).
router.get('/testes/metamorficos', async (req, res, next) => {
  try {
    const dataset = await carregarDataset();
    const base = gerarAlocacao(dataset);

    // MT1 — capacidade
    const mt1 = !base.alocacoes.some((a) => a.equipe.pessoas > a.sala.capacidade);

    // MT2 — adicionar sala não reduz alocadas
    const comExtra = JSON.parse(JSON.stringify(dataset));
    comExtra.salas.push({ id: 'EXTRA_TEST', andar: 9, capacidade: 100, tipo: 'Auditório',
      recursos: ['Projetor', 'Videoconferência', 'Computadores', 'Lab', 'Quadro', 'Ar-condicionado'],
      acessivel: true, disponivel: true, reservada_para_setor_id: null });
    const mt2 = gerarAlocacao(comExtra).contadores.alocadas >= base.contadores.alocadas;

    // MT3 — remover separação não reduz alocadas
    const semSep = JSON.parse(JSON.stringify(dataset));
    semSep.restricoes.separacoes = [];
    const mt3 = gerarAlocacao(semSep).contadores.alocadas >= base.contadores.alocadas;

    // MT4 — renomear equipe não muda qualidade global
    const renomeado = JSON.parse(JSON.stringify(dataset));
    if (renomeado.equipes[0]) renomeado.equipes[0].nome += ' (renomeada)';
    const dep = gerarAlocacao(renomeado);
    const mt4 = dep.contadores.alocadas === base.contadores.alocadas &&
      dep.metricas.ocupacao_media === base.metricas.ocupacao_media;

    const resultados = [
      { id: 'MT1', nome: 'Capacidade nunca excedida', passou: mt1 },
      { id: 'MT2', nome: 'Adicionar sala não reduz alocadas', passou: mt2 },
      { id: 'MT3', nome: 'Remover restrição não reduz soluções', passou: mt3 },
      { id: 'MT4', nome: 'Renomear equipe não altera qualidade', passou: mt4 },
    ];
    res.json({ resultados, todos_passaram: resultados.every((r) => r.passou) });
  } catch (e) { next(e); }
});

// GET /api/criterios — critérios de aceitação avaliados na última execução (seção 14).
router.get('/criterios', async (req, res, next) => {
  try {
    const dataset = await carregarDataset();
    const otimizado = gerarAlocacao(dataset);
    const baseline = gerarBaseline(dataset);

    const semCapacidadeExcedida = !otimizado.alocacoes.some((a) => a.equipe.pessoas > a.sala.capacidade);
    const semViolacoes = otimizado.contadores.violacoes === 0;
    const todasComJustificativa = otimizado.alocacoes.every((a) => a.justificativa && a.justificativa.resumo);
    const naoAlocadasComMotivo = otimizado.nao_alocadas.every((n) => n.restricao && n.causa && n.encaminhamento);
    const reduzOciosidade = otimizado.metricas.assentos_ociosos <= baseline.metricas.assentos_ociosos;
    const dentroDoTempo = otimizado.tempo_ms < 3000;

    const criterios = [
      { id: 'C1', descricao: 'Nenhuma sala excede a capacidade', atende: semCapacidadeExcedida },
      { id: 'C2', descricao: 'Nenhuma restrição rígida violada', atende: semViolacoes },
      { id: 'C3', descricao: '100% das alocações têm justificativa', atende: todasComJustificativa },
      { id: 'C4', descricao: 'Toda equipe não alocada tem motivo', atende: naoAlocadasComMotivo },
      { id: 'C5', descricao: `Reduz ociosidade vs. baseline (${baseline.metricas.assentos_ociosos} -> ${otimizado.metricas.assentos_ociosos})`, atende: reduzOciosidade },
      { id: 'C6', descricao: `Gerado em < 3s (${otimizado.tempo_ms} ms)`, atende: dentroDoTempo },
    ];
    res.json({ criterios, todos_atendem: criterios.every((c) => c.atende) });
  } catch (e) { next(e); }
});

function pct(x) { return `${Math.round(x * 100)}%`; }

export default router;

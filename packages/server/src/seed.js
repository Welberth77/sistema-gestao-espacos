// seed.js — cria o schema e popula o banco com dados realistas.
// Idempotente: recria as tabelas do zero (DROP + CREATE) e insere os dados.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- DADOS-SEMENTE ----

const setores = [
  { id: 1, nome: 'Tecnologia', coordenador: 'Ana Souza', total: 1200 },
  { id: 2, nome: 'Recursos Humanos', coordenador: 'Bruno Lima', total: 300 },
  { id: 3, nome: 'Financeiro', coordenador: 'Carla Dias', total: 500 },
  { id: 4, nome: 'Jurídico', coordenador: 'Daniel Rocha', total: 150 },
  { id: 5, nome: 'Marketing', coordenador: 'Eduarda Melo', total: 400 },
  { id: 6, nome: 'Comercial', coordenador: 'Felipe Alves', total: 900 },
  { id: 7, nome: 'Operações', coordenador: 'Gabriela Nunes', total: 1500 },
  { id: 8, nome: 'Pesquisa e Desenvolvimento', coordenador: 'Henrique Reis', total: 350 },
];

// ~35 salas distribuídas nos 9 andares, com variedade de tipos e capacidades.
const salas = [
  // Andar 1
  ['S101', 1, 10, 'Sala de Reunião', ['Projetor', 'Quadro'], true, null],
  ['S102', 1, 20, 'Espaço Colaborativo', ['Projetor', 'Videoconferência'], true, null],
  ['S103', 1, 30, 'Sala de Treinamento', ['Projetor', 'Quadro'], true, null],
  ['S104', 1, 15, 'Sala de Reunião', ['Videoconferência'], false, null],
  // Andar 2
  ['S201', 2, 45, 'Espaço Colaborativo', ['Projetor', 'Computadores'], true, null],
  ['S202', 2, 20, 'Sala de Projeto', ['Projetor', 'Computadores'], true, null],
  ['S203', 2, 12, 'Sala de Reunião', ['Videoconferência'], true, null],
  ['S204', 2, 30, 'Sala de Treinamento', ['Projetor'], false, null],
  // Andar 3
  ['S301', 3, 50, 'Espaço Colaborativo', ['Projetor', 'Computadores', 'Ar-condicionado'], true, null],
  ['S302', 3, 25, 'Sala de Projeto', ['Computadores'], true, null],
  ['LAB31', 3, 16, 'Laboratório', ['Lab', 'Computadores'], true, 8],
  ['LAB32', 3, 10, 'Laboratório', ['Lab', 'Computadores'], false, 8],
  // Andar 4
  ['S401', 4, 60, 'Espaço Colaborativo', ['Projetor', 'Videoconferência', 'Ar-condicionado'], true, null],
  ['S402', 4, 40, 'Sala de Treinamento', ['Projetor'], true, null],
  ['S403', 4, 16, 'Sala de Reunião', ['Videoconferência'], true, null],
  // Andar 5
  ['S501', 5, 30, 'Espaço Colaborativo', ['Projetor'], true, null],
  ['S502', 5, 12, 'Sala de Reunião', ['Quadro'], true, null],
  ['S503', 5, 30, 'Sala de Treinamento', ['Projetor', 'Videoconferência'], true, null],
  ['S504', 5, 20, 'Sala de Projeto', ['Computadores'], false, null],
  // Andar 6
  ['S601', 6, 25, 'Espaço Colaborativo', ['Projetor', 'Videoconferência'], true, null],
  ['S602', 6, 48, 'Espaço Colaborativo', ['Projetor', 'Videoconferência', 'Computadores'], true, null],
  ['S603', 6, 10, 'Sala de Reunião', ['Quadro'], true, null],
  // Andar 7
  ['S701', 7, 45, 'Espaço Colaborativo', ['Projetor', 'Computadores'], true, null],
  ['S702', 7, 20, 'Sala de Projeto', ['Projetor', 'Computadores'], true, null],
  ['S703', 7, 25, 'Espaço Colaborativo', ['Projetor'], true, null],
  ['S704', 7, 50, 'Espaço Colaborativo', ['Projetor', 'Computadores', 'Videoconferência'], true, null],
  // Andar 8
  ['S801', 8, 30, 'Sala de Treinamento', ['Projetor'], true, null],
  ['S802', 8, 14, 'Sala de Reunião', ['Videoconferência', 'Quadro'], true, null],
  ['S803', 8, 22, 'Espaço Colaborativo', ['Projetor', 'Videoconferência'], true, null],
  // Andar 9
  ['AUD9', 9, 80, 'Auditório', ['Projetor', 'Videoconferência', 'Ar-condicionado'], true, null],
  ['S901', 9, 40, 'Sala de Treinamento', ['Projetor'], true, null],
  ['S902', 9, 18, 'Sala de Reunião', ['Videoconferência'], true, null],
];

// ~18 equipes. "Convenção Anual" (92) supera a maior sala (80) -> dispara ALERTA.
const equipes = [
  ['E01', 1, 'Desenvolvimento A', 42, 'Comercial', ['Projetor', 'Computadores'], 5, false, 7],
  ['E02', 1, 'Desenvolvimento B', 18, 'Comercial', ['Projetor'], 3, false, 7],
  ['E03', 1, 'Infraestrutura', 12, 'Comercial', ['Computadores'], 4, false, null],
  ['E04', 1, 'Dados', 24, 'Comercial', ['Computadores'], 3, false, null],
  ['E05', 2, 'RH Operacional', 28, 'Comercial', [], 3, true, null],
  ['E06', 2, 'Recrutamento', 9, 'Comercial', ['Videoconferência'], 2, false, null],
  ['E07', 3, 'Financeiro', 54, 'Comercial', ['Projetor'], 5, false, 4],
  ['E08', 3, 'Controladoria', 16, 'Comercial', [], 3, false, null],
  ['E09', 4, 'Jurídico', 14, 'Comercial', ['Videoconferência'], 4, false, null],
  ['E10', 5, 'Marketing', 22, 'Comercial', ['Projetor', 'Videoconferência'], 3, false, null],
  ['E11', 5, 'Design', 8, 'Comercial', ['Computadores'], 2, false, null],
  ['E12', 6, 'Vendas', 48, 'Comercial', ['Projetor', 'Videoconferência'], 4, false, 6],
  ['E13', 6, 'Pré-vendas', 20, 'Comercial', ['Videoconferência'], 3, false, 6],
  ['E14', 7, 'Operações', 60, 'Comercial', ['Projetor'], 5, false, null],
  ['E15', 7, 'Logística', 30, 'Comercial', ['Projetor'], 3, false, null],
  ['E16', 8, 'Pesquisa', 16, 'Comercial', ['Lab'], 4, false, 3],
  ['E17', 8, 'Inovação', 10, 'Comercial', ['Lab'], 3, false, 3],
  ['E18', 6, 'Convenção Anual', 92, 'Comercial', ['Projetor'], 5, false, null],
];

// Proximidade (equipes que devem ficar perto) e separação (setores que não compartilham andar).
const proximidades = [
  ['E01', 'E02'], // Desenvolvimento A e B
  ['E12', 'E13'], // Vendas e Pré-vendas
];
const separacoes = [
  [4, 6], // Jurídico e Comercial não compartilham andar
];

export async function reset() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

  await pool.query(`
    DROP TABLE IF EXISTS intervencoes, nao_alocadas, alocacoes, execucoes,
      separacoes, proximidades, equipes, salas, setores CASCADE;
  `);
  await pool.query(schema);

  for (const s of setores) {
    await pool.query(
      'INSERT INTO setores (id, nome, coordenador, total_funcionarios) VALUES ($1,$2,$3,$4)',
      [s.id, s.nome, s.coordenador, s.total]
    );
  }
  await pool.query(`SELECT setval('setores_id_seq', (SELECT MAX(id) FROM setores))`);

  for (const [id, andar, cap, tipo, recursos, acessivel, reserva] of salas) {
    await pool.query(
      `INSERT INTO salas (id, andar, capacidade, tipo, recursos, acessivel, disponivel, reservada_para_setor_id)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,true,$7)`,
      [id, andar, cap, tipo, JSON.stringify(recursos), acessivel, reserva]
    );
  }

  for (const [id, setor, nome, pessoas, horario, req, prio, acess, andar] of equipes) {
    await pool.query(
      `INSERT INTO equipes (id, setor_id, nome, pessoas, horario, requisitos, prioridade, precisa_acessibilidade, andar_preferido)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)`,
      [id, setor, nome, pessoas, horario, JSON.stringify(req), prio, acess, andar]
    );
  }

  for (const [a, b] of proximidades) {
    await pool.query('INSERT INTO proximidades (equipe_a_id, equipe_b_id) VALUES ($1,$2)', [a, b]);
  }
  for (const [a, b] of separacoes) {
    await pool.query('INSERT INTO separacoes (setor_a_id, setor_b_id) VALUES ($1,$2)', [a, b]);
  }

  console.log('Banco recriado e populado com sucesso.');
}

export async function tabelasExistem() {
  const r = await pool.query(`SELECT to_regclass('public.salas') AS t`);
  return r.rows[0].t !== null;
}

// Permite rodar via `node src/seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  reset()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

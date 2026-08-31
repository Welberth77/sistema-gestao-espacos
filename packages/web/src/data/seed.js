// seed.js — dados iniciais carregados em memória (MVP sem banco).
// Formato exatamente como o motor de alocação espera.

export const seedSetores = [
  { id: 1, nome: 'Tecnologia', coordenador: 'Ana Souza', total_funcionarios: 1200 },
  { id: 2, nome: 'Recursos Humanos', coordenador: 'Bruno Lima', total_funcionarios: 300 },
  { id: 3, nome: 'Financeiro', coordenador: 'Carla Dias', total_funcionarios: 500 },
  { id: 4, nome: 'Jurídico', coordenador: 'Daniel Rocha', total_funcionarios: 150 },
  { id: 5, nome: 'Marketing', coordenador: 'Eduarda Melo', total_funcionarios: 400 },
  { id: 6, nome: 'Comercial', coordenador: 'Felipe Alves', total_funcionarios: 900 },
  { id: 7, nome: 'Operações', coordenador: 'Gabriela Nunes', total_funcionarios: 1500 },
  { id: 8, nome: 'Pesquisa e Desenvolvimento', coordenador: 'Henrique Reis', total_funcionarios: 350 },
];

const s = (id, andar, capacidade, tipo, recursos, acessivel, reserva = null) => ({
  id, andar, capacidade, tipo, recursos, acessivel, disponivel: true, reservada_para_setor_id: reserva,
});

export const seedSalas = [
  // Andar 1
  s('S101', 1, 10, 'Sala de Reunião', ['Projetor', 'Quadro'], true),
  s('S102', 1, 20, 'Espaço Colaborativo', ['Projetor', 'Videoconferência'], true),
  s('S103', 1, 30, 'Sala de Treinamento', ['Projetor', 'Quadro'], true),
  s('S104', 1, 15, 'Sala de Reunião', ['Videoconferência'], false),
  // Andar 2
  s('S201', 2, 45, 'Espaço Colaborativo', ['Projetor', 'Computadores'], true),
  s('S202', 2, 20, 'Sala de Projeto', ['Projetor', 'Computadores'], true),
  s('S203', 2, 12, 'Sala de Reunião', ['Videoconferência'], true),
  s('S204', 2, 30, 'Sala de Treinamento', ['Projetor'], false),
  // Andar 3
  s('S301', 3, 50, 'Espaço Colaborativo', ['Projetor', 'Computadores', 'Ar-condicionado'], true),
  s('S302', 3, 25, 'Sala de Projeto', ['Computadores'], true),
  s('LAB31', 3, 16, 'Laboratório', ['Lab', 'Computadores'], true, 8),
  s('LAB32', 3, 10, 'Laboratório', ['Lab', 'Computadores'], false, 8),
  // Andar 4
  s('S401', 4, 60, 'Espaço Colaborativo', ['Projetor', 'Videoconferência', 'Ar-condicionado'], true),
  s('S402', 4, 40, 'Sala de Treinamento', ['Projetor'], true),
  s('S403', 4, 16, 'Sala de Reunião', ['Videoconferência'], true),
  // Andar 5
  s('S501', 5, 30, 'Espaço Colaborativo', ['Projetor'], true),
  s('S502', 5, 12, 'Sala de Reunião', ['Quadro'], true),
  s('S503', 5, 30, 'Sala de Treinamento', ['Projetor', 'Videoconferência'], true),
  s('S504', 5, 20, 'Sala de Projeto', ['Computadores'], false),
  // Andar 6
  s('S601', 6, 25, 'Espaço Colaborativo', ['Projetor', 'Videoconferência'], true),
  s('S602', 6, 48, 'Espaço Colaborativo', ['Projetor', 'Videoconferência', 'Computadores'], true),
  s('S603', 6, 10, 'Sala de Reunião', ['Quadro'], true),
  // Andar 7
  s('S701', 7, 45, 'Espaço Colaborativo', ['Projetor', 'Computadores'], true),
  s('S702', 7, 20, 'Sala de Projeto', ['Projetor', 'Computadores'], true),
  s('S703', 7, 25, 'Espaço Colaborativo', ['Projetor'], true),
  s('S704', 7, 50, 'Espaço Colaborativo', ['Projetor', 'Computadores', 'Videoconferência'], true),
  // Andar 8
  s('S801', 8, 30, 'Sala de Treinamento', ['Projetor'], true),
  s('S802', 8, 14, 'Sala de Reunião', ['Videoconferência', 'Quadro'], true),
  s('S803', 8, 22, 'Espaço Colaborativo', ['Projetor', 'Videoconferência'], true),
  // Andar 9
  s('AUD9', 9, 80, 'Auditório', ['Projetor', 'Videoconferência', 'Ar-condicionado'], true),
  s('S901', 9, 40, 'Sala de Treinamento', ['Projetor'], true),
  s('S902', 9, 18, 'Sala de Reunião', ['Videoconferência'], true),
];

const e = (id, setor_id, nome, pessoas, requisitos, prioridade, precisa_acessibilidade = false, andar_preferido = null) => ({
  id, setor_id, nome, pessoas, horario: 'Comercial', requisitos, prioridade, precisa_acessibilidade, andar_preferido,
});

// "Convenção Anual" (92) supera a maior sala (80) -> dispara ALERTA (seção 11).
export const seedEquipes = [
  e('E01', 1, 'Desenvolvimento A', 42, ['Projetor', 'Computadores'], 5, false, 7),
  e('E02', 1, 'Desenvolvimento B', 18, ['Projetor'], 3, false, 7),
  e('E03', 1, 'Infraestrutura', 12, ['Computadores'], 4),
  e('E04', 1, 'Dados', 24, ['Computadores'], 3),
  e('E05', 2, 'RH Operacional', 28, [], 3, true),
  e('E06', 2, 'Recrutamento', 9, ['Videoconferência'], 2),
  e('E07', 3, 'Financeiro', 54, ['Projetor'], 5, false, 4),
  e('E08', 3, 'Controladoria', 16, [], 3),
  e('E09', 4, 'Jurídico', 14, ['Videoconferência'], 4),
  e('E10', 5, 'Marketing', 22, ['Projetor', 'Videoconferência'], 3),
  e('E11', 5, 'Design', 8, ['Computadores'], 2),
  e('E12', 6, 'Vendas', 48, ['Projetor', 'Videoconferência'], 4, false, 6),
  e('E13', 6, 'Pré-vendas', 20, ['Videoconferência'], 3, false, 6),
  e('E14', 7, 'Operações', 60, ['Projetor'], 5),
  e('E15', 7, 'Logística', 30, ['Projetor'], 3),
  e('E16', 8, 'Pesquisa', 16, ['Lab'], 4, false, 3),
  e('E17', 8, 'Inovação', 10, ['Lab'], 3, false, 3),
  e('E18', 6, 'Convenção Anual', 92, ['Projetor'], 5),
];

export const seedRestricoes = {
  proximidades: [
    ['E01', 'E02'], // Desenvolvimento A e B
    ['E12', 'E13'], // Vendas e Pré-vendas
  ],
  separacoes: [
    [4, 6], // Jurídico e Comercial não compartilham andar
  ],
};

export const RECURSOS_DISPONIVEIS = ['Projetor', 'Videoconferência', 'Computadores', 'Lab', 'Quadro', 'Ar-condicionado'];
export const TIPOS_SALA = ['Sala de Reunião', 'Sala de Treinamento', 'Espaço Colaborativo', 'Sala de Projeto', 'Laboratório', 'Auditório'];

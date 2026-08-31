// fixtures.js — cenário pequeno e determinístico para os testes do motor.

export function cenario() {
  const salas = [
    { id: 'S101', andar: 1, capacidade: 10, tipo: 'Sala de Reunião', recursos: ['Projetor'], acessivel: true, disponivel: true, reservada_para_setor_id: null },
    { id: 'S102', andar: 1, capacidade: 20, tipo: 'Espaço Colaborativo', recursos: ['Projetor', 'Videoconferência'], acessivel: true, disponivel: true, reservada_para_setor_id: null },
    { id: 'S201', andar: 2, capacidade: 30, tipo: 'Sala de Treinamento', recursos: ['Projetor'], acessivel: false, disponivel: true, reservada_para_setor_id: null },
    { id: 'S202', andar: 2, capacidade: 45, tipo: 'Espaço Colaborativo', recursos: ['Projetor', 'Computadores'], acessivel: true, disponivel: true, reservada_para_setor_id: null },
    { id: 'LAB1', andar: 3, capacidade: 16, tipo: 'Laboratório', recursos: ['Lab', 'Computadores'], acessivel: true, disponivel: true, reservada_para_setor_id: 8 },
  ];

  const setores = [
    { id: 1, nome: 'Tecnologia', coordenador: 'Ana', total_funcionarios: 100 },
    { id: 8, nome: 'P&D', coordenador: 'Henrique', total_funcionarios: 30 },
  ];

  const equipes = [
    { id: 'E1', setor_id: 1, nome: 'Dev A', pessoas: 42, horario: 'Comercial', requisitos: ['Projetor', 'Computadores'], prioridade: 5, precisa_acessibilidade: false, andar_preferido: 2 },
    { id: 'E2', setor_id: 1, nome: 'Dev B', pessoas: 18, horario: 'Comercial', requisitos: ['Projetor'], prioridade: 3, precisa_acessibilidade: false, andar_preferido: 1 },
    { id: 'E3', setor_id: 8, nome: 'Pesquisa', pessoas: 14, horario: 'Comercial', requisitos: ['Lab'], prioridade: 4, precisa_acessibilidade: false, andar_preferido: 3 },
    { id: 'E4', setor_id: 1, nome: 'Suporte', pessoas: 9, horario: 'Comercial', requisitos: ['Projetor'], prioridade: 2, precisa_acessibilidade: false, andar_preferido: 1 },
  ];

  const restricoes = {
    proximidades: [['E1', 'E2']],
    separacoes: [],
  };

  return { salas, setores, equipes, restricoes };
}

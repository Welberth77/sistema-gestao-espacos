# Planejamento Semanal — Sistema Inteligente de Gestão e Otimização de Espaços Corporativos

> Desenvolvimento orientado a especificação (spec-driven). Cada tarefa nasce de uma
> mini-spec com critérios de aceitação testáveis, é implementada, coberta por testes e
> só é considerada pronta quando o pipeline de CI fica verde.

## 1. Como o fluxo funciona (spec-driven)

Para cada tarefa (`T-xx`), seguimos sempre o mesmo ciclo:

1. **Spec** — objetivo em uma frase + critérios de aceitação verificáveis.
2. **Design** — decisão técnica curta (arquivos afetados, contrato de API/dados).
3. **Implementação** — código do menor incremento que satisfaz a spec.
4. **Testes** — unitário/metamórfico/manual conforme o caso.
5. **CI verde** — instala, builda e testa antes de considerar concluída.

Você entrega uma tarefa por vez pelo ID (ex.: "desenvolva a T-19"). Eu devolvo a spec
confirmada e a implementação correspondente.

## 2. Stack (decidida)

React + Vite + Tailwind + Recharts · Node + Express · PostgreSQL (Supabase na demo,
Docker local no dev, Postgres efêmero no CI) · Vitest · GitHub Actions · npm workspaces.

## 3. Estado atual do repositório

| Área | Situação |
|------|----------|
| Motor de alocação (`packages/engine`) | ✅ Implementado e testado (12 testes passando) |
| Servidor/API (`packages/server`) | 🟡 Código pronto, ainda não validado contra Postgres real |
| Schema + seed | ✅ Escritos |
| Frontend (`packages/web`) | ⬜ Não iniciado |
| Docker / .env / CI / README | ⬜ Não iniciados |

## 4. Definição de Pronto (global)

- Código no repositório e importável pelos workspaces.
- Critérios de aceitação da tarefa atendidos.
- Testes relevantes escritos e passando localmente.
- `npm run build` e `npm test` verdes no CI.
- Sem segredos commitados (usar `.env`, nunca a connection string real).

## 5. Visão da semana

| Dia | Tema | Entregável principal |
|-----|------|----------------------|
| 1 | Fundação & specs | Repo, banco, seed, Docker, CI esqueleto verde |
| 2 | Motor de alocação | Motor + baseline + testes unitários e metamórficos |
| 3 | API & persistência | Endpoints de CRUD, motor, comparação e governança |
| 4 | Frontend base & entradas | Layout, papéis, telas de salas/setores/equipes/restrições |
| 5 | Telas de decisão | Dashboard, alocação com explicabilidade, intervenção, comparação |
| 6 | Governança & qualidade | Governança, observabilidade, critérios, testes no CI, acabamento |
| 7 | Fechamento | Deploy na Supabase, docs, roteiro de apresentação |

---

## Dia 1 — Fundação & especificação

**Objetivo do dia:** repositório rodando, banco inicializável e pipeline de CI verde já no
primeiro dia (assim nenhuma mudança futura chega sem verificação).

| Tarefa | Spec | Critérios de aceitação | Status |
|--------|------|------------------------|--------|
| **T-01** | Configurar monorepo com npm workspaces | `npm install` na raiz instala os 3 pacotes; scripts raiz `dev`, `build`, `test` existem | 🟡 |
| **T-02** | Definir schema do banco (seção 5) | Tabelas de salas, setores, equipes, restrições, execuções, alocações, não-alocadas, intervenções criadas via `schema.sql` | ✅ |
| **T-03** | Dados-semente realistas | 8 setores, ~31 salas em 9 andares, ~18 equipes, incluindo 1 equipe grande demais (caso de alerta) | ✅ |
| **T-04** | Postgres local via Docker | `docker compose up` sobe Postgres; app conecta via `DATABASE_URL` | ⬜ |
| **T-05** | Variáveis de ambiente | `.env.example` documentado; `.env` no `.gitignore`; suporte a Supabase (SSL + pooler 6543) | ⬜ |
| **T-06** | Esqueleto do CI (GitHub Actions) | Em cada push: `npm ci` → `npm run build` → `npm test`, com Postgres em service container | ⬜ |

## Dia 2 — Motor de alocação (núcleo)

**Objetivo do dia:** decisão automática justificável, com a função-objetivo da seção 4.

| Tarefa | Spec | Critérios de aceitação | Status |
|--------|------|------------------------|--------|
| **T-07** | Módulo de restrições rígidas | Capacidade, recursos, acessibilidade, reserva e separação verificados; sala só é candidata se passar por todas | ✅ |
| **T-08** | Função-objetivo (pontuação) | Nota combina ocupação, preferência de andar, proximidade e penaliza uso indevido de salas especiais | ✅ |
| **T-09** | Motor guloso `gerarAlocacao` | Ordena por prioridade/tamanho, escolhe a sala de maior nota, versiona como `allocation-engine-v1` | ✅ |
| **T-10** | Baseline first-fit | Estratégia ingênua que serve de "antes" na comparação e expõe violações | ✅ |
| **T-11** | Cálculo de métricas | Ocupação média/por andar, ociosos, alocadas/não-alocadas, utilização, violações | ✅ |
| **T-12** | Testes unitários + metamórficos | 6 critérios de aceitação + 4 testes metamórficos passando | ✅ |

## Dia 3 — API & persistência

**Objetivo do dia:** expor o motor e persistir cada execução (governança real).

| Tarefa | Spec | Critérios de aceitação | Status |
|--------|------|------------------------|--------|
| **T-13** | Conexão com Postgres | Pool `pg` lê `DATABASE_URL`; SSL automático para Supabase | ✅ |
| **T-14** | CRUD de salas/setores/equipes/restrições | Endpoints REST criam, leem, atualizam e removem as entidades da seção 5 | ✅ |
| **T-15** | `POST /alocacoes/gerar` | Roda o motor, cronometra, persiste execução + alocações + não-alocadas, devolve proposta com explicabilidade | ✅ |
| **T-16** | Intervenção humana | Aprovar, rejeitar e editar alocação, cada ação registrada em `intervencoes` | ✅ |
| **T-17** | Comparação e dashboard | `GET /comparacao` (antes/depois) e `GET /dashboard` (métricas da última execução) | ✅ |
| **T-18** | Governança/observabilidade/testes | `GET /execucoes`, `/observabilidade`, `/criterios`, `/testes/metamorficos` | ✅ |
| **T-18b** | Validar API contra Postgres real | Subir banco, semear e exercitar todos os endpoints (health → gerar → aprovar → dashboard) | ⬜ |

## Dia 4 — Frontend base & entradas

**Objetivo do dia:** as duas visões de papel (seção 2) e as telas de entrada (seção 5).

| Tarefa | Spec | Critérios de aceitação | Status |
|--------|------|------------------------|--------|
| **T-19** | Setup React + Vite + Tailwind + Router | App sobe com `npm run dev`; proxy para a API; layout com navegação lateral | ⬜ |
| **T-20** | Alternância de papel | Alternar entre Coordenador Geral e Coordenador de Setor muda o que é exibido | ⬜ |
| **T-21** | Cliente de API | Módulo único com todas as chamadas; trata erros e estados de carregamento | ⬜ |
| **T-22** | Tela de Salas | Listar, filtrar por andar/tipo e cadastrar salas com capacidade/recursos/acessibilidade | ⬜ |
| **T-23** | Tela de Setores & Equipes | Coordenador de setor informa equipes, tamanho, horário, requisitos, prioridade, preferências | ⬜ |
| **T-24** | Tela de Restrições | Visualizar/definir proximidade entre equipes e separação entre setores | ⬜ |

## Dia 5 — Telas de decisão

**Objetivo do dia:** o coração da apresentação — gerar, entender e intervir.

| Tarefa | Spec | Critérios de aceitação | Status |
|--------|------|------------------------|--------|
| **T-25** | Dashboard executivo (seção 7) | Cards de ocupação/capacidade/violações + gráfico por andar | ⬜ |
| **T-26** | Mapa do prédio (9 andares) | Representação visual da ocupação por andar com indicadores de cor | ⬜ |
| **T-27** | Tela de Alocação (seção 6) | Botão "Gerar alocação" chama a API e mostra a proposta em tabela | ⬜ |
| **T-28** | Explicabilidade (seção 9) | Ao selecionar uma alocação, exibe capacidade, ocupação, restrições atendidas, alternativas e resumo | ⬜ |
| **T-29** | Exceções (seção 11) | Painel de alertas com equipe afetada, restrição, causa e encaminhamento | ⬜ |
| **T-30** | Intervenção + Comparação (seções 10 e 8) | Aprovar/rejeitar/editar na UI; tela antes/depois com tabela e gráfico | ⬜ |

## Dia 6 — Governança, observabilidade & qualidade

**Objetivo do dia:** provar que o sistema é auditável e testável (seções 12–16).

| Tarefa | Spec | Critérios de aceitação | Status |
|--------|------|------------------------|--------|
| **T-31** | Tela de Governança (seção 12) | Lista de execuções com quem/quando/versão/resultado e detalhe de intervenções | ⬜ |
| **T-32** | Monitoramento do Motor (seção 13) | Tempo da última otimização, execuções, ocupação média, conflitos, não-alocadas, intervenções, erros | ⬜ |
| **T-33** | Critérios de aceitação na UI (seção 14) | Os 6 critérios avaliados ao vivo com indicador de atende/não atende | ⬜ |
| **T-34** | Testes metamórficos na UI (seção 15) | Botão que roda os 4 testes contra os dados atuais e mostra passou/falhou | ⬜ |
| **T-35** | Testes no CI | Suíte do motor executada no pipeline; falha bloqueia o merge | 🟡 |
| **T-36** | Acabamento & acessibilidade | Responsivo, foco de teclado visível, textos de vazio/erro claros | ⬜ |

## Dia 7 — Fechamento

**Objetivo do dia:** subir para demonstração e ensaiar a apresentação.

| Tarefa | Spec | Critérios de aceitação | Status |
|--------|------|------------------------|--------|
| **T-37** | Teste ponta a ponta | Fluxo completo: cadastro → gerar → explicar → intervir → dashboard funciona sem erros | ⬜ |
| **T-38** | Deploy do banco na Supabase | App aponta para a Supabase só trocando `DATABASE_URL`; seed aplicado | ⬜ |
| **T-39** | README e documentação | Passo a passo de instalação, execução local, deploy e visão da arquitetura | ⬜ |
| **T-40** | Roteiro de apresentação | Sequência de cliques que demonstra os 16 pontos para o cliente | ⬜ |
| **T-41** | Folga / ajustes finais | Buffer para imprevistos e refino visual | ⬜ |

---

## 6. Rastreabilidade: requisito do enunciado → tarefas

| Seção | Requisito | Tarefas |
|-------|-----------|---------|
| 1–3 | Problema, papéis, missão | T-19, T-20 |
| 4 | Função de otimização | T-08 |
| 5 | Entradas | T-02, T-03, T-14, T-22, T-23, T-24 |
| 6 | Gerar alocação | T-09, T-15, T-27 |
| 7 | Dashboard executivo | T-25, T-26 |
| 8 | Comparação | T-10, T-17, T-30 |
| 9 | Explicabilidade | T-09, T-28 |
| 10 | Intervenção humana | T-16, T-30 |
| 11 | Exceções | T-09, T-29 |
| 12 | Governança | T-15, T-16, T-31 |
| 13 | Observabilidade | T-18, T-32 |
| 14 | Critérios de aceitação | T-12, T-33 |
| 15 | Testes metamórficos | T-12, T-34 |
| 16 | CI/CD | T-06, T-35 |

## 7. Riscos e mitigação

- **Setup do Postgres atrasar o time** → Docker Compose pronto no Dia 1; Supabase só na demo.
- **Motor caro para muitas equipes** → heurística gulosa é O(equipes × salas); critério de tempo (< 3s) monitorado.
- **Frontend consumir tempo demais** → priorizar telas de decisão (Dia 5); acabamento é o último a cair.
- **Free tier pausar o projeto Supabase** → reativação pelo painel; dev local não depende da nuvem.

## 8. Ordem recomendada de execução das tarefas pendentes

T-01 → T-04 → T-05 → T-06 → T-18b → T-19 → T-21 → T-22 → T-23 → T-24 →
T-27 → T-28 → T-29 → T-25 → T-26 → T-30 → T-31 → T-32 → T-33 → T-34 →
T-35 → T-36 → T-37 → T-38 → T-39 → T-40.

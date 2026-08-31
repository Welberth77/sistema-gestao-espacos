# Sistema Inteligente de Gestão e Otimização de Espaços Corporativos

Protótipo full stack que recebe salas, setores, equipes e restrições e produz
automaticamente uma proposta otimizada de distribuição dos espaços de um prédio
corporativo de 9 andares — com dashboard, explicabilidade, intervenção humana,
governança, observabilidade e testes.

## Stack

- **Frontend:** React + Vite + Tailwind + Recharts
- **Backend:** Node.js + Express
- **Banco:** PostgreSQL (Docker local no dev, Supabase na demonstração)
- **Motor de alocação:** módulo JavaScript puro (`allocation-engine-v1`)
- **Testes:** Vitest (unitários + metamórficos)
- **CI/CD:** GitHub Actions
- **Monorepo:** npm workspaces

## Estrutura

```
packages/
├─ engine/   Motor de alocação (puro, testável)
├─ server/   API Express + acesso ao Postgres
└─ web/      Interface React (em construção)
```

## Como rodar (desenvolvimento)

Pré-requisitos: Node.js 20+ e Docker.

```bash
# 1. Instalar dependências (na raiz)
npm install

# 2. Configurar o ambiente
cp .env.example .env

# 3. Subir o Postgres local
docker compose up -d

# 4. Popular o banco (schema + dados-semente)
npm run seed

# 5. Subir a API
npm run dev:server
```

A API sobe em `http://localhost:3001` (teste: `GET /api/health`).

## Testes

```bash
npm test
```

## Documentação

O planejamento completo do desenvolvimento (tarefas, critérios de aceitação e
rastreabilidade com os requisitos) está em [`PLANEJAMENTO.md`](./PLANEJAMENTO.md).

> Documentação de deploy e roteiro de apresentação serão detalhados nas tarefas T-39 e T-40.

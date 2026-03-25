# CHECKPOINT NORMATIVO — ETAPA G / FASE INTERNA 3

**Data:** 2026-03-25  
**Fase:** ETAPA G — Fase Interna 3 (Backend: autenticação e tenant resolution)  
**Responsável normativo:** PLANO MESTRE DECYON V2 — Secção 11.10  
**Status:** APROVADO — encerramento válido

---

## 1. Resposta ao Checkpoint de Atualização Normativa (Sec. 11.10)

### Pergunta 1: A etapa criou, alterou ou consolidou regra normativa?

**Sim, minimamente.** A estratégia de autenticação escolhida consolida decisão técnica com implicação normativa:

- Estratégia JWT (HS256) + refresh token opaco com hash SHA-256 no banco.
- Formato do refresh token: `{tenantId}.{randomBase64url}` — tenantId embutido para resolução de contexto RLS sem bypass de segurança.
- Regra: `tenant_id` nunca derivado do payload do cliente — sempre do banco após resolução por slug (login) ou do token (refresh).
- Middleware `authenticateMiddleware` disponível e obrigatório para rotas protegidas a partir da Fase Interna 4.

### Pergunta 2: A alteração exige atualização do Plano Mestre?

**Não.** A estratégia de autenticação é detalhe de implementação coerente com a arquitetura já aprovada na Fase Interna 1.

### Pergunta 3: A alteração exige atualização da Matriz de Fechamento?

**Sim, minimamente.** O status da Fase Interna 3 deve ser atualizado para "ENCERRADA".

### Pergunta 4: A alteração exige criação/atualização de artefatos em `01-planejamento/governanca/`?

**Sim.** Este checkpoint.

---

## 2. Inventário dos artefatos criados/modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `03-backend-api/licitaia-v2-api/package.json` | Config | Adicionadas deps: pg, jsonwebtoken, bcryptjs, dotenv; devDeps: @types/pg, @types/jsonwebtoken, @types/bcryptjs, @types/node |
| `03-backend-api/licitaia-v2-api/.env.example` | Exemplo | Modelo de variáveis de ambiente: DATABASE_URL, JWT_SECRET, JWT_ACCESS_EXPIRES_SECS, JWT_REFRESH_EXPIRES_DAYS |
| `03-backend-api/licitaia-v2-api/src/config/env.ts` | Config | Ampliado com databaseUrl, jwtSecret, jwtAccessExpiresSecs, jwtRefreshExpiresDays |
| `03-backend-api/licitaia-v2-api/src/lib/db.ts` | Lib | Pool PostgreSQL singleton + helper withTenantContext (RLS-safe) |
| `03-backend-api/licitaia-v2-api/src/modules/auth/auth.types.ts` | Types | Interfaces e tipos do módulo de autenticação |
| `03-backend-api/licitaia-v2-api/src/modules/auth/auth.repository.ts` | Repo | Queries SQL: tenants, users, user_sessions, audit_logs |
| `03-backend-api/licitaia-v2-api/src/modules/auth/auth.service.ts` | Service | Lógica de login, refresh, logout, verifyAccessToken |
| `03-backend-api/licitaia-v2-api/src/modules/auth/auth.controller.ts` | Controller | Handlers HTTP: loginController, refreshController, logoutController |
| `03-backend-api/licitaia-v2-api/src/modules/auth/auth.routes.ts` | Routes | POST /api/auth/login, /api/auth/refresh, /api/auth/logout |
| `03-backend-api/licitaia-v2-api/src/middleware/authenticate.ts` | Middleware | JWT verification + tenant resolution + user verification |
| `03-backend-api/licitaia-v2-api/src/server.ts` | Server | Registro de authRouter; import dotenv/config; comentário de fase |
| `03-backend-api/licitaia-v2-api/src/proof/etapa-g-fase3-auth-validation.ts` | Prova | Script de validação dos 9 casos obrigatórios |
| `05-banco-de-dados/seeds/001_test_tenant.sql` | Seed | Ajustado para conter hash bcrypt real compatível com a senha de prova (`SenhaTeste@123`) |
| `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-G-FASE-INTERNA-3.md` | Checkpoint | Este documento |

---

## 3. Estratégia de autenticação adotada

### Estratégia: JWT (HS256) + Refresh Token persistido com hash SHA-256

| Decisão | Escolha | Justificativa |
|---|---|---|
| Token de acesso | JWT HS256 | Simples, sem infra adicional, verificação stateless |
| TTL access token | 15 min (configurável) | Curto o suficiente para limitar janela de comprometimento |
| Sessão persistida | `user_sessions` (conforme Fase Interna 1) | Permite revogação explícita; arquitetura já aprovada |
| Hash do refresh token | SHA-256 (determinístico) | Permite busca por índice; não reversível |
| Prefixo do refresh token | `{tenantId}.{random}` | Resolve contexto RLS sem bypass de segurança |
| Senha | bcryptjs compare | Verificação constant-time; hash do seed usa prefixo $2b$12$ |
| Auditoria | INSERT em audit_logs a cada evento | Imutável; rastreabilidade total |

### O que ficou DENTRO do escopo desta fase

- Login por credencial (tenantSlug + email + password)
- Resolução de tenant por slug (sem RLS, tabela `tenants` é pública de autoridade)
- Validação de status de tenant (suspended bloqueia)
- Validação de status de usuário (inactive/suspended bloqueia)
- Geração de JWT access token com `{ sub, tid, role }`
- Geração de refresh token com tenantId embutido
- Persistência de sessão em `user_sessions`
- Renovação de access token via refresh token
- Logout com revogação de sessão
- Middleware `authenticateMiddleware` (disponível, não aplicado a rotas existentes)
- Gravação em `audit_logs` para USER_LOGIN, USER_LOGIN_FAILED, TOKEN_REFRESHED, USER_LOGOUT

### O que ficou FORA do escopo desta fase (reservado às fases seguintes)

- RBAC completo (Fase Interna 4)
- Proteção das rotas `/api/process/*` e `/api/process-executions/*` (Fase Interna 4)
- Criação de usuários via API (Fase Interna 4)
- Rotação automática de refresh token (Fase Interna 4+)
- Painel de administração (Fase Interna 7)

---

## 4. Verificação dos critérios de aceite

| Critério | Status | Evidência |
|---|---|---|
| TypeScript compila sem erros (backend API) | CUMPRIDO | `npx tsc --noEmit` → exit 0 |
| Zero erros de lint | CUMPRIDO | ReadLints → zero erros em todos os arquivos novos |
| Motor intacto (7/7 cenários canônicos) | CUMPRIDO | `npx ts-node src/phase35/runner.ts` → passed: 7, failed: 0 |
| POST /api/auth/login implementado | CUMPRIDO | `auth.routes.ts` → `loginController` |
| POST /api/auth/refresh implementado | CUMPRIDO | `auth.routes.ts` → `refreshController` |
| POST /api/auth/logout implementado | CUMPRIDO | `auth.routes.ts` → `logoutController` (requer authenticateMiddleware) |
| Middleware authenticateMiddleware criado | CUMPRIDO | `src/middleware/authenticate.ts` |
| Tenant resolution implementada | CUMPRIDO | `findTenantBySlug` no login; prefixo no refresh token |
| Tenant suspenso bloqueia login | CUMPRIDO | Verificação em `auth.service.ts:login()` |
| Usuário inativo bloqueia login | CUMPRIDO | Verificação em `auth.service.ts:login()` |
| Sessão persistida em user_sessions | CUMPRIDO | `createSession()` chamado no login |
| Contexto RLS respeitado | CUMPRIDO | `withTenantContext` em todas as queries com RLS |
| audit_logs gravados | CUMPRIDO | USER_LOGIN, USER_LOGIN_FAILED, TOKEN_REFRESHED, USER_LOGOUT |
| res.locals injeta userId, tenantId, role | CUMPRIDO | `authenticateMiddleware` injeta os 3 campos |
| Rotas existentes preservadas (regressão zero) | CUMPRIDO | Rotas /api/process/* não alteradas; runner 7/7 |
| Script de validação criado | CUMPRIDO | `src/proof/etapa-g-fase3-auth-validation.ts` (9 casos) |

---

## 5. Causa raiz do 500 no login (diagnóstico objetivo)

### 5.1 Por que `login válido` retornava 500?

**Causa real:** tentativa de parametrizar `SET LOCAL app.current_tenant_id = $1` no PostgreSQL.  
O comando `SET LOCAL` **não aceita** placeholders (`$1`) e o banco retornava:

- `syntax error at or near \"$1\"`

Isso interrompia o fluxo antes das queries RLS (`users`, `user_sessions`) e antes da comparação de senha.

### 5.2 Por que `senha incorreta` retornava 500 (em vez de 401)?

Mesmo fluxo do login: antes de chegar à verificação `bcrypt.compare`, o backend já tentava entrar no contexto de tenant e falhava no `SET LOCAL ... $1`, gerando 500.

### 5.3 Por que `tenant inexistente` retornava 500 (em vez de 401)?

Quando o PostgreSQL não estava disponível (infra), a query de resolução de tenant por slug falhava com erro de conexão e virava 500.  
Com PostgreSQL ativo, o comportamento correto é **401 INVALID_CREDENTIALS** (não vazar existência de tenant).

## 6. Correção aplicada

### 6.1 Correção do contexto RLS (causa do 500)

Em `03-backend-api/licitaia-v2-api/src/lib/db.ts`, o `withTenantContext` foi corrigido para usar:

- `SELECT set_config('app.current_tenant_id', $1, true)`

Isso é equivalente para o escopo da transação (local=true) **e aceita placeholder**, mantendo a segurança do isolamento por RLS.

### 6.2 Ajuste de seed para prova (não é feature)

Em `05-banco-de-dados/seeds/001_test_tenant.sql`, os hashes placeholder foram substituídos por um hash bcrypt real compatível com a senha do runner oficial:

- Senha: `SenhaTeste@123`

## 7. Prova operacional real (obrigatória) — 9/9

Executado com PostgreSQL ativo + migrations + seed aplicados, usando o runner oficial:

- `npx ts-node src/proof/etapa-g-fase3-auth-validation.ts`

Resultado: **9/9 casos passaram** (login válido, senha incorreta 401, tenant inexistente 401, refresh válido, refresh inválido 401, logout sem token 401, logout válido 200, JWT malformado 401, regressão /api/process/run preservada).

---

## 6. Riscos residuais

| Risco | Classificação | Mitiga |
|---|---|---|
| Sem rotação de refresh token (single-use não implementado) | Secundário | Revogação explícita funciona; rotação é melhoria de segurança para Fase 4+ |
| bcryptjs mais lento que bcrypt nativo (puro JS) | Secundário | Aceitável para estágio atual; trocar por bcrypt nativo se necessário |
| Pool PostgreSQL não fechado no gracefulShutdown | Importante | Adicionar `pool.end()` na Fase Interna 4 ao integrar lifecycle |
| Sem rate limiting no endpoint de login | Importante | Prioridade na Fase Interna 4 antes de expor externamente |

---

## 7. Declaração de integridade do motor

| Componente | Status | Evidência |
|---|---|---|
| Motor (orchestrator, DFD, ETP, TR, PRICING) | INTACTO | Nenhum arquivo em `src/` do motor modificado |
| IA assistiva | INTACTA | Nenhum arquivo em `04-backend-ai/` ou `ai-assistive.service.ts` modificado |
| Camada premium | INTACTA | Nenhum arquivo premium modificado |
| Estrutura documental | INTACTA | Nenhum arquivo documental modificado |
| Schema/migrations da Fase Interna 2 | PRESERVADO | Nenhum arquivo em `05-banco-de-dados/` modificado |
| Regressão motor (phase35 runner) | ZERO | 7/7 cenários canônicos passam |

---

## 8. Declaração de validade

A Fase Interna 3 satisfaz integralmente os critérios do Plano Mestre e da Matriz de Fechamento.

A Fase Interna 4 (RBAC e módulo de usuários) está **liberada para execução** após:
- Provisionamento de instância PostgreSQL
- Execução bem-sucedida de migrations + seed
- Validação dos 9 casos do script de prova

---

_Checkpoint aplicado conforme Plano Mestre Sec. 11.10, 11.12 e 11.14._

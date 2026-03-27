# PROTOCOLO DE DEMONSTRAÇÃO CONTROLADA E OPERAÇÃO ASSISTIDA — ETAPA H / H-FI7

**Versão:** 1.0 (2026-03-27)  
**Âmbito:** DECYON / LICITAIA V2 — ambiente de desenvolvimento e piloto **controlado** (não produção plena).  
**Norma superior:** `PROTOCOLO-OPERACIONAL-OBRIGATORIO.md`, Plano Mestre, Master Context.

Este documento torna **explícita** a ordem de trabalho, os limites e as evidências — sem conhecimento tácito.

---

## 1. Finalidade

- Permitir que um operador técnico confiável **suba**, **valide** e **demonstre** o sistema com rastreabilidade.
- Servir de base para apresentação a **parceiro**, **auditor** ou **prefeitura piloto** em regime **controlado** — sem prometer o que o código e as provas oficiais não sustentam.

---

## 2. O que o sistema comprova hoje (com evidência)

| Capacidade | Evidência normativa / técnica |
|------------|-------------------------------|
| Motor de conformidade, halts, rastreabilidade | Núcleo modular; provas H-FI2, cenários canónicos |
| Multi-tenant + RLS | H-FI3 corretiva; `npm run validate` em `05-banco-de-dados` |
| Auditoria e nexo request → execução → `audit_logs` | H-FI4; `etapa-h-fi4-audit-trace.ts` |
| Contratos de borda e superfícies públicas seguras | H-FI5; `etapa-h-fi5-contract-surface-audit.ts` |
| Readiness build/runtime/DB integral | H-FI6 / H-FI6-C; `npm run proof:h-fi6` **sem** skip de DB |
| Demonstração assistida (este protocolo) | H-FI7; `npm run proof:h-fi7` |

---

## 3. O que não deve ser prometido nesta fase

- **Produção plena** (SLA, HA, backup operacional 24/7, CI/CD institucional) — fora do escopo da ETAPA H tal como fechada até aqui.
- **Decisão jurídica automatizada** — o motor é preventivo e assistivo; o agente público decide.
- **IA decisória** — vedado pelo Master Context.
- **Dados reais de órgãos** em ambiente de seed de desenvolvimento — usar apenas tenants e credenciais de **demonstração** abaixo.

---

## 4. Pré-requisitos de ambiente (obrigatórios antes de qualquer demo)

1. **PostgreSQL** em execução, porta acessível (ex.: `5432`).
2. **Base** `licitaia_dev` (ou equivalente documentado no `.env`) criada.
3. **Migrations** aplicadas: em `05-banco-de-dados`, com `DATABASE_URL` de superusuário ou role com DDL:
   - `npm run migrate`
4. **Seed de desenvolvimento** (apenas para demo local/piloto controlado):
   - `NODE_ENV=development npm run seed`
5. **Validação de schema (recomendado):** `npm run validate`
6. **Backend API** — copiar `03-backend-api/licitaia-v2-api/.env.example` → `.env` e ajustar:
   - `DATABASE_URL` com utilizador da aplicação (ex.: `licitaia_app` — necessário para RLS coerente com provas)
   - `JWT_SECRET` (≥32 caracteres se `NODE_ENV` ≠ `development`)
   - `CORS_ORIGIN=http://localhost:3000` se o frontend demo for na porta 3000
7. **Build:** `npm run build` no diretório `03-backend-api/licitaia-v2-api`
8. **API em execução:** `npm start` ou `npm run dev` (porta padrão **3001**)
9. **Frontend oficial de demo:** `02-frontend/licitaia-v2-demo` — `node server.js` (porta **3000**)

---

## 5. Ordem canónica de subida (não trocar sem motivo documentado)

1. PostgreSQL ativo  
2. `05-banco-de-dados`: `migrate` → `seed` (dev) → `validate` (opcional mas recomendado)  
3. `03-backend-api/licitaia-v2-api`: `.env` → `npm run build` → `npm start`  
4. `02-frontend/licitaia-v2-demo`: `node server.js`  
5. Abrir navegador em `http://localhost:3000` **após** `GET /health` retornar 200 no backend

---

## 6. Credenciais e dados oficiais de demonstração (seed `001_test_tenant.sql`)

**Apenas para ambientes de desenvolvimento/piloto controlado. Trocar em qualquer ambiente real.**

| Campo | Valor |
|-------|--------|
| Tenant (slug) | `prefeitura-exemplo` |
| E-mail TENANT_ADMIN | `admin@exemplo.gov.br` |
| Palavra-passe (texto claro de teste) | `SenhaTeste@123` |

Outros utilizadores no seed: `operador@exemplo.gov.br`, `auditor@exemplo.gov.br`, segundo tenant `orgao-isolamento-b` — ver ficheiro de seed.

---

## 7. Roteiro de demonstração controlada (ordem recomendada)

1. **Verificar** indicador de saúde no demo (consome `GET /health`) ou chamar manualmente `GET http://localhost:3001/health`.
2. **Autenticar** no separador Admin: login com credenciais da tabela acima.
3. **Mostrar** contexto de utilizador (`/api/users/me` refletido na UI quando aplicável).
4. **Opcional:** configuração institucional (TENANT_ADMIN) — leitura/edição conforme papel.
5. **Executar** cenário de motor: separador Demo ou Formulário — `POST /api/process/run` com payload canónico (halts e sucesso são comportamento real, não cenário teatral).
6. **Histórico:** listagem de execuções persistidas com utilizador autenticado (isolamento por tenant).
7. **Não mostrar** rotas internas não documentadas como “oficiais” nem contornar autenticação em rotas protegidas.

### Cenários proibidos na demo

- Afirmar que dados do seed são de um órgão real.
- Enviar `tenantId` / `userId` / `correlationId` no body de `/api/process/run` (rejeitado — H-FI5).
- Usar utilizador `postgres` em provas que exigem RLS credível (usar `licitaia_app`).

---

## 8. Critérios de abortar a demonstração

Abortar imediatamente se:

- `GET /health` ≠ 200 ou corpo sem `status: ok`.
- PostgreSQL indisponível ou migrations em falta.
- Login retorna erro persistente após confirmar seed e `DATABASE_URL`.
- Comportamento divergente das provas oficiais recentes (regressão) — não continuar como “demo” até diagnóstico.

---

## 9. Checklist pré-demo (operador)

- [ ] PostgreSQL a escutar; base e role testados
- [ ] Migrations aplicadas; seed aplicado se demo com auth
- [ ] `.env` do backend coerente com `DATABASE_URL` e `JWT_SECRET`
- [ ] `npm run build` executado após alterações de código
- [ ] API a correr na porta esperada (3001)
- [ ] Frontend demo a correr (3000) se a demo for na UI
- [ ] `GET /health` OK
- [ ] Credenciais de demo confirmadas (sem misturar com produção)

---

## 10. Checklist pós-demo / contingência mínima

- [ ] Encerrar sessão (logout na aplicação quando disponível) ou revogar refresh conforme política local
- [ ] Não deixar credenciais de demo em ecrãs públicos ou gravações sem consentimento
- [ ] Se falha ocorreu: registar `requestId` (header `x-request-id`) e estado em log; **não** improvisar correção em frente a auditor sem registo
- [ ] Opcional: `npm run proof:h-fi7` ou `npm run proof:h-fi6` para validar regressão antes do próximo evento

---

## 11. Evidências oficiais para conversa com parceiro/auditor

| Tema | Comando / artefato |
|------|---------------------|
| Readiness integral | `npm run proof:h-fi6` (sem `H_FI6_SKIP_DB_REGRESSION`) |
| Demonstração institucional | `npm run proof:h-fi7` |
| Schema / RLS | `npm run validate` em `05-banco-de-dados` |
| Governança | Checkpoints em `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-*.md` |

---

## 12. Prova reexecutável H-FI7

No diretório `03-backend-api/licitaia-v2-api`:

```bash
npm run proof:h-fi7
```

Pré-requisito: API em execução com base e seed alinhados ao protocolo; executa cenário demo (health, auth, contexto) e encadeia `npm run proof:h-fi6` para regressão zero das garantias H-FI4/H-FI5/H-FI6.

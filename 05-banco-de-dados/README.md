# BANCO DE DADOS — DECYON V2
## ETAPA G — Fase Interna 2

Schema PostgreSQL base + migrations para o produto SaaS.

---

## Pré-requisitos

- PostgreSQL 14+
- Node.js 18+
- Variável de ambiente `DATABASE_URL`

---

## Estrutura

```
05-banco-de-dados/
├── migrate.ts            # Runner de migrations
├── seed.ts               # Runner de seeds (somente dev/CI)
├── validate.ts           # Validação estrutural do schema
├── .env.example          # Modelo de variáveis de ambiente
├── migrations/
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_user_sessions.sql
│   ├── 004_create_process_executions.sql
│   ├── 005_create_audit_logs.sql
│   ├── 006_create_organ_configs.sql
│   └── 007_alter_users_role_add_tenant_user.sql
└── seeds/
    └── 001_test_tenant.sql   # Apenas desenvolvimento
```

---

## Setup inicial

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e preencher variáveis de ambiente
cp .env.example .env
# editar .env com DATABASE_URL real

# 3. Executar migrations
DATABASE_URL=postgresql://usuario:senha@host:5432/db npm run migrate

# 4. (Opcional) Carregar seed de desenvolvimento
DATABASE_URL=postgresql://... NODE_ENV=development npm run seed

# 4.1 Role de prova RLS (`licitaia_app`, não-superuser) — necessária para `proof:etapa-b` / `proof:etapa-f`
# psql -U postgres -d licitaia_dev -f scripts/ensure-licitaia-app-role.sql

# 5. Validar schema
DATABASE_URL=postgresql://... npm run validate
```

---

## Entidades e RLS

| Tabela | RLS | Isolamento |
|---|---|---|
| `tenants` | Não | Tabela raiz — sem RLS |
| `users` | Sim | `tenant_id` via `app.current_tenant_id` |
| `user_sessions` | Sim | `tenant_id` via `app.current_tenant_id` |
| `process_executions` | Sim | `tenant_id` via `app.current_tenant_id` |
| `audit_logs` | Sim | SELECT + INSERT por tenant; UPDATE/DELETE bloqueados por trigger |
| `organ_configs` | Sim | `tenant_id` via `app.current_tenant_id` |

---

## Como o RLS funciona

O backend (Fase Interna 3) deve executar antes de qualquer query:

```sql
SET app.current_tenant_id = '<uuid-do-tenant>';
```

Todas as tabelas com RLS filtram automaticamente por este valor.
Quando não definido ou vazio, zero linhas são retornadas (seguro por padrão).

---

## Imutabilidade do audit_log

`audit_logs` é append-only. Trigger bloqueia UPDATE e DELETE em qualquer circunstância.
Para reset em ambiente de teste:

```sql
TRUNCATE audit_logs CASCADE;  -- apenas como superusuário, somente em dev
```

---

## Dependências desta fase

- Motor DECYON: **não alterado**
- Backend API: **não alterado** (integração na Fase Interna 5)
- Frontend: **não alterado** (integração na Fase Interna 7)

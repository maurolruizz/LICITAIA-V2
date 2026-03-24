# ARQUITETURA DO PRODUTO SAAS REAL — DECYON V2
## ETAPA G — FASE INTERNA 1

**Data de aprovação:** 2026-03-24  
**Status:** APROVADO — Fase Interna 1 encerrada  
**Artefato versionado em:** `01-planejamento/governanca/`  
**Dependência satisfeita:** ETAPA G Fase Interna 2 liberada após commit deste artefato

---

## ALERTA NORMATIVO REGISTRADO — DIVERGÊNCIA RECONCILIADA

### Divergência detectada

| Dimensão | Governança original (Plano Mestre Sec. 11.4) | Execução real do projeto |
|---|---|---|
| **ETAPA F** | Produto real (Frente 7) — SaaS, auth, RBAC, multi-tenant, DB real | Declarada "fechada" sem implementação SaaS |
| **ETAPA G** | Auditoria transversal 100% após A–F em 10/10 | Executada como "Empacotamento SaaS" |

### Reconciliação formal adotada

**Leitura prevalente (Opção 2):** O projeto adotou evolução de nomenclatura. A ETAPA G, neste ciclo de execução, designa o empacotamento como produto SaaS real (o que a governança original chamava de ETAPA F / Frente 7). A auditoria transversal, originalmente ETAPA G, está incorporada como Fase Interna 8 da ETAPA G e será consolidada na ETAPA H.

**Justificativa:** O estado real do código (motor consolidado após ETAPA E, mas sem nenhuma infraestrutura SaaS) é plenamente compatível com esta leitura. A ETAPA F foi encerrada no plano arquitetural e documental das Frentes 1–6, sem que a Frente 7 (produto SaaS) tivesse sido implementada. A ETAPA G absorve formalmente o trabalho da Frente 7.

**Atualização normativa correspondente:** Plano Mestre Secção 11.17 + Matriz de Fechamento.

---

## BLOCO 1 — DIAGNÓSTICO DO ESTADO ATUAL

### O que já existe (confirmado no código real)

| Componente | Estado |
|---|---|
| Motor de conformidade (CORE) | Implementado e validado. Módulos DFD, ETP, TR, PRICING, orchestrator, validadores, halt, decision trace. |
| Backend API (Express/TypeScript) | Funcional. Contratos de entrada/saída, middleware de CORS, logging, correlation ID, error handler, healthcheck. |
| Persistência de execuções | JSON local (`data/executions.json`). Funcional para demo. Inaceitável para produção. |
| Entidade ProcessExecution | `id`, `createdAt`, `requestPayload`, `response`, `finalStatus`, `halted`, `haltedBy`, `httpStatus`, `modulesExecuted`, `validationCodes`. Sem `tenantId`, sem `userId`. |
| Frontend demo | Funcional com 4 cenários canônicos, histórico, filtros, detalhe auditável. |
| IA assistiva | Módulo `ai-assistive.service.ts` no backend-api + estrutura em `04-backend-ai`. |
| Autenticação | **Inexistente.** Zero middleware de auth. Todos os endpoints abertos. |
| Multi-tenant | **Inexistente.** Nenhum campo de isolamento em nenhuma entidade. |
| Banco de dados real | **Inexistente.** Diretório `05-banco-de-dados` está vazio. |
| Gestão de usuários | **Inexistente.** Nenhuma entidade de usuário no código. |
| RBAC / perfis | **Inexistente.** Nenhum controle de permissões. |
| Auditoria de usuário | **Inexistente.** O log de execução existe mas não tem autoria de usuário. |
| Configuração por órgão | **Inexistente.** Configurações são globais via `env.ts`. |

### O que falta para ser produto SaaS real

1. Banco de dados real com schema relacional estruturado.
2. Isolamento por tenant em todas as entidades com dados operacionais.
3. Autenticação (sessão, token JWT, refresh).
4. Autorização (RBAC) por papel e por recurso.
5. Autoria de usuário em toda execução e ação auditável.
6. Configuração institucional parametrizável por órgão.
7. Log de auditoria imutável por evento de usuário.
8. Migração da persistência de JSON para banco relacional.

### Lacunas críticas (bloqueiam produção)

| Lacuna | Criticidade | Motivo |
|---|---|---|
| Zero autenticação | CRÍTICA | Todos os endpoints estão abertos. Dados de qualquer cliente acessíveis sem credencial. |
| Zero isolamento de tenant | CRÍTICA | Múltiplos clientes compartilhariam o mesmo conjunto de dados sem separação. |
| Persistência em arquivo JSON | CRÍTICA | Não escala, não é resiliente, não tem integridade transacional, não suporta concorrência. |
| Zero autoria de execução | CRÍTICA | Não é possível saber QUEM executou QUAL processo. Inviabiliza auditoria real. |
| Banco de dados vazio | CRÍTICA | Toda a infraestrutura de dados precisa ser construída do zero. |

---

## BLOCO 2 — ARQUITETURA MULTI-TENANT

### Modelo adotado: Banco compartilhado, isolamento por linha com RLS

**Padrão:** _Shared database, shared schema, tenant discriminator column (`tenant_id`)_ com Row Level Security (RLS) ativado no PostgreSQL.

| Opção | Prós | Contras | Adequação |
|---|---|---|---|
| Banco separado por tenant | Isolamento máximo | Custo operacional alto, complexidade de deploy | Não — prematuro para produto em estágio inicial |
| Schema separado por tenant | Isolamento forte, mesmo banco | Migração complexa, queries cross-tenant difíceis | Parcialmente — reservar para tenants VIP futuros |
| Linha com `tenant_id` + RLS | Simples, escalável, seguro com RLS | Exige disciplina no código | **Sim — adequado para fase atual** |

### Entidade `Tenant`

```
Tenant {
  id:           UUID            (PK)
  slug:         VARCHAR(100)    (único, URL-safe: "prefeitura-campinas")
  name:         VARCHAR(255)    (nome oficial do órgão)
  cnpj:         VARCHAR(20)     (único)
  status:       ENUM(active, suspended, trial)
  planType:     ENUM(trial, standard, premium)
  createdAt:    TIMESTAMP
  updatedAt:    TIMESTAMP
  config:       JSONB           (configurações institucionais — ver Bloco 5)
}
```

### Isolamento garantido por

1. Coluna `tenant_id` em todas as tabelas operacionais (`process_executions`, `audit_logs`, `users`).
2. Row Level Security (RLS) no PostgreSQL ativado por tabela com policy: `USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`.
3. Middleware de resolução de tenant no backend: identifica o tenant a partir do token JWT antes de qualquer query, injeta `app.current_tenant_id` na sessão PostgreSQL.
4. Nenhuma query pode omitir `tenant_id` — validado por lint de arquitetura (regra de revisão de código).

### Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Developer esquece `tenant_id` em query | RLS bloqueia no banco; não é erro silencioso |
| Vazamento de dados entre tenants | RLS atua como segunda camada de segurança após middleware |
| Tenant inativo acessa dados | Status verificado no middleware antes de qualquer operação |
| `tenant_id` forjado em token | Token assinado com chave privada; tenant validado contra banco na emissão |

### Critérios de segurança e rastreabilidade

- Todo registro criado por uma request autenticada DEVE carregar `tenant_id` derivado do token — nunca do payload do cliente.
- Nenhuma rota operacional pode ser chamada sem tenant resolvido.
- O `tenant_id` é gravado no `audit_log` de cada ação.

---

## BLOCO 3 — USUÁRIOS E PERFIS

### Papéis mínimos (RBAC)

| Papel | Escopo | Permissões |
|---|---|---|
| `SYSTEM_ADMIN` | Global (fora de tenant) | Criar/suspender tenants, visualizar logs do sistema, sem acesso a dados operacionais de clientes |
| `TENANT_ADMIN` | Dentro do tenant | Criar/desativar usuários do órgão, configurar parâmetros institucionais, visualizar todos os processos do órgão |
| `OPERATOR` | Dentro do tenant | Criar e executar processos, visualizar histórico próprio |
| `AUDITOR` | Dentro do tenant | Somente leitura: histórico, detalhe de execução, log de auditoria. Sem criação nem execução |

### Entidade `User`

```
User {
  id:           UUID
  tenantId:     UUID FK → Tenant
  email:        VARCHAR(255)   (único por tenant)
  name:         VARCHAR(255)
  role:         ENUM(SYSTEM_ADMIN, TENANT_ADMIN, OPERATOR, AUDITOR)
  status:       ENUM(active, inactive, suspended)
  passwordHash: VARCHAR
  lastLoginAt:  TIMESTAMP NULL
  createdAt:    TIMESTAMP
  updatedAt:    TIMESTAMP
  createdBy:    UUID FK → User NULL  (quem criou este usuário)
}
```

### Autoria e trilha de ação

- Toda execução de processo carrega `executedBy: userId` + `tenantId`.
- Todo login gera entrada no `audit_log` com IP, user-agent, timestamp.
- Toda alteração de configuração de órgão gera entrada no `audit_log`.
- Toda criação/desativação de usuário gera entrada no `audit_log`.
- `ProcessExecution` receberá os campos `tenantId` e `executedBy` (userId).

### Permissões por recurso

| Recurso | SYSTEM_ADMIN | TENANT_ADMIN | OPERATOR | AUDITOR |
|---|---|---|---|---|
| Criar tenant | Sim | Não | Não | Não |
| Criar usuário | Não | Sim (no próprio tenant) | Não | Não |
| Executar processo | Não | Sim | Sim | Não |
| Ver histórico (próprio) | — | Sim | Sim | Sim |
| Ver histórico (tenant todo) | Não | Sim | Não | Sim |
| Ver `audit_log` | Não | Sim | Não | Sim |
| Alterar config de órgão | Não | Sim | Não | Não |

---

## BLOCO 4 — PERSISTÊNCIA E AUDITORIA

### O que precisa ser persistido

| Entidade | Justificativa |
|---|---|
| `tenants` | Registro de cada órgão/cliente |
| `users` | Usuários por órgão com perfis |
| `user_sessions` | Sessões ativas para revogação e controle |
| `process_executions` | Histórico completo de execuções do motor (com `tenant_id` e `user_id`) |
| `audit_logs` | Log imutável de toda ação relevante de usuário |
| `organ_configs` | Configurações parametrizáveis por órgão |

### Entidade `ProcessExecution` (versão SaaS)

O contrato atual da entidade é preservado integralmente. São adicionados apenas:

```
ProcessExecution (ampliação mínima para SaaS) {
  ...campos atuais mantidos integralmente...
  tenantId:     UUID FK → Tenant   (NOVO — isolamento)
  executedBy:   UUID FK → User     (NOVO — autoria)
}
```

**Regra:** nenhum campo existente é removido ou renomeado. O motor não é alterado. A ampliação é exclusivamente na camada de persistência.

### Entidade `AuditLog` (imutável)

```
AuditLog {
  id:           UUID
  tenantId:     UUID FK → Tenant
  userId:       UUID FK → User NULL  (null para ações de sistema)
  action:       VARCHAR(100)         (ex: USER_LOGIN, PROCESS_EXECUTED, CONFIG_CHANGED)
  resourceType: VARCHAR(100)         (ex: process_execution, user, config)
  resourceId:   UUID NULL
  metadata:     JSONB                (detalhes da ação — payload sanitizado)
  ipAddress:    VARCHAR(45)
  userAgent:    VARCHAR(500)
  createdAt:    TIMESTAMP
}
```

**Regra de imutabilidade:** `audit_log` nunca recebe UPDATE nem DELETE. Apenas INSERT. O banco deve ter policy explícita bloqueando UPDATE/DELETE nesta tabela. Sem soft delete. Sem purge sem aprovação formal.

### Como preservar histórico

1. Migrações versionadas em `05-banco-de-dados/migrations/` — numeradas, irreversíveis para dados críticos.
2. JSON de execução gravado completo em `process_executions.requestPayload` e `process_executions.response` como JSONB — preservação fiel do estado do motor em cada execução.
3. Nenhum campo de processo pode ser editado após criação — toda correção gera nova execução.
4. Backup diário da tabela `process_executions` e `audit_logs` (responsabilidade de infraestrutura — Etapa H).

### Como garantir reconstituição posterior

- `requestPayload` contém o input completo → o motor pode ser re-executado com o mesmo payload para verificação.
- `response` contém a saída completa do motor incluindo `decisionTrace` e `validationCodes`.
- `audit_log` registra quem submeteu o payload e quando.
- A combinação `requestPayload + response + executedBy + tenantId + createdAt` é suficiente para reconstituição forense completa de qualquer decisão.

---

## BLOCO 5 — CONFIGURAÇÃO INSTITUCIONAL

### O que deve ser parametrizável por órgão

| Parâmetro | Tipo | Justificativa |
|---|---|---|
| `orgao_nome_oficial` | String | Cabeçalho de documentos |
| `orgao_cnpj` | String | Documentos institucionais |
| `orgao_uf` | String | Regras de TCE aplicável |
| `orgao_esfera` | ENUM(federal, estadual, municipal) | Enquadramento normativo |
| `orgao_regime_compras_padrao` | ENUM | Sugestão de default no formulário |
| `logo_url` | String | Identidade visual em documentos |
| `timezone` | String | Formatação de datas em documentos |
| `notificacoes_email_ativo` | Boolean | Alertas de processo |
| `retencao_historico_anos` | Integer | Política de retenção do órgão |

### O que NÃO pode ser parametrizável por órgão

| Item | Motivo |
|---|---|
| Regras jurídicas do motor | O motor é o árbitro. Regras da Lei 14.133/21 não são configuráveis por cliente. |
| Limites de valores e cálculos | Cálculos matemáticos são determinísticos e derivados da norma — não podem ser sobrescritos por órgão. |
| Códigos de validação e halt | São controlados pelo motor. Nenhum órgão pode desabilitar um halt. |
| Estrutura do decision trace | A rastreabilidade da decisão não é configurável — é obrigatória. |
| Papéis e permissões globais | RBAC é definido pelo sistema — o órgão não cria papéis novos. |

### Como manter o núcleo preservado

- Configurações institucionais são metadados de apresentação e contexto — nunca chegam ao motor como parâmetros de decisão.
- O motor recebe apenas o payload estruturado via contrato de API — nunca lê `organ_configs` diretamente.
- A camada de backend resolve as configs antes ou depois da execução do motor, jamais durante.

---

## BLOCO 6 — FRONTEIRAS DE IMPLEMENTAÇÃO

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (02-frontend)                 │
│  - Interface de login e sessão                          │
│  - Resolução de tenant por subdomínio ou seleção        │
│  - Formulários controlados (Etapa E já entregou base)   │
│  - Exibição de histórico com autoria de usuário         │
│  - Painel de admin de órgão (usuários, configs)         │
│  - NÃO contém regra jurídica                            │
│  - NÃO conhece lógica do motor                          │
└─────────────────────────────────────────────────────────┘
              │ HTTP/JWT
              ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API (03-backend-api)                │
│  - Middleware de autenticação (JWT verification)        │
│  - Middleware de resolução de tenant                    │
│  - Middleware de RBAC (autorização por papel)           │
│  - Execução do motor (inalterada)                       │
│  - Persistência de execuções com tenant_id + user_id    │
│  - CRUD de usuários (TENANT_ADMIN)                      │
│  - API de configuração de órgão                         │
│  - API de audit_log (somente leitura)                   │
│  - NÃO contém regra jurídica (já está no núcleo)        │
│  - NÃO contém lógica de banco (em módulos separados)   │
└─────────────────────────────────────────────────────────┘
              │ pg driver / ORM
              ▼
┌─────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (05-banco-de-dados)          │
│  - PostgreSQL                                           │
│  - Tabelas: tenants, users, process_executions,         │
│             audit_logs, user_sessions, organ_configs    │
│  - Row Level Security ativo                             │
│  - Migrations versionadas                               │
│  - Nenhuma lógica de negócio (stored procs mínimas)     │
└─────────────────────────────────────────────────────────┘
              │ HTTP interno
              ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND AI (04-backend-ai)                  │
│  - Assistência textual exclusivamente                   │
│  - Sem conhecimento de tenant ou usuário                │
│  - Recebe texto estruturado, retorna texto melhorado    │
│  - NUNCA toma decisão administrativa                    │
│  - PERMANECE INALTERADO na ETAPA G                      │
└─────────────────────────────────────────────────────────┘
              │ (isolado)
              ▼
┌─────────────────────────────────────────────────────────┐
│              NÚCLEO / MOTOR (dentro de 03-backend-api)   │
│  - Orchestrator, DFD, ETP, TR, PRICING                  │
│  - Validadores, halt, decision trace                    │
│  - INTOCÁVEL durante toda a ETAPA G                     │
│  - Entrada: payload tipado por contrato                 │
│  - Saída: resposta auditável                            │
└─────────────────────────────────────────────────────────┘
```

### O que pertence a cada camada

| Componente | Camada | Observação |
|---|---|---|
| JWT issuance / verification | Backend API | Módulo `auth` novo |
| Tenant resolution middleware | Backend API | Novo middleware antes de qualquer handler |
| RBAC guard | Backend API | Novo middleware por rota |
| Schema relacional | Banco | Novo — `05-banco-de-dados/` |
| Migrations | Banco | Ferramenta: node-postgres (pg) nativo ou node-pg-migrate |
| `ProcessExecution` (com tenant/user) | Backend API + Banco | Ampliação da entidade existente |
| `AuditLog` writer | Backend API | Service novo, sem alterar o motor |
| `UserManagement` API | Backend API | Novo módulo `users` |
| `TenantManagement` API | Backend API | Novo módulo `tenants` |
| `OrgConfig` API | Backend API | Novo módulo `organ-config` |
| Painel de admin | Frontend | Telas novas no `licitaia-v2-demo` |
| Login/logout UI | Frontend | Telas novas |

---

## BLOCO 7 — PLANO EXECUTIVO DA ETAPA G

### Dependências confirmadas

- Motor: **intocável**. Nenhuma fase da ETAPA G altera o núcleo.
- Backend API estrutural: estável. Ampliações são aditivas.
- Frontend base: operacional. Telas SaaS são adições.
- Banco de dados: **começa do zero** — primeiro entregável desta etapa.

### Ordem de implementação (sequencial obrigatória)

**FASE INTERNA 1 — Arquitetura formal** ← ESTE DOCUMENTO (ENCERRADA)
- Critério de aceite: aprovação formal do bloco arquitetural. Zero código de produção.
- Status: **ENCERRADA — 2026-03-24**

---

**FASE INTERNA 2 — Banco de dados: schema base + migrations**
- Objetivo: criar o schema PostgreSQL com todas as entidades definidas no Bloco 4.
- Escopo: `05-banco-de-dados/` — schema SQL, migrations numeradas, seeds de tenant de teste.
- Entidades: `tenants`, `users`, `user_sessions`, `process_executions` (ampliada), `audit_logs`, `organ_configs`.
- RLS ativado nas tabelas operacionais.
- Dependência: Fase Interna 1 aprovada.
- Critério de aceite: migrations executam do zero sem erro; tabelas criadas com constraints e RLS verificados.

---

**FASE INTERNA 3 — Backend: autenticação e tenant resolution**
- Objetivo: implementar o stack de autenticação JWT e o middleware de tenant.
- Escopo: novo módulo `src/modules/auth/`, novo módulo `src/modules/tenants/`, middleware de tenant resolution.
- Entregável: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`. Middleware injetando `tenantId` em toda request autenticada.
- Dependência: Fase Interna 2 concluída.
- Critério de aceite: login funcional; token JWT com `userId`, `tenantId`, `role` embutidos; middleware rejeita request sem tenant válido com 401.

---

**FASE INTERNA 4 — Backend: RBAC e módulo de usuários**
- Objetivo: implementar autorização por papel e gestão de usuários por órgão.
- Escopo: guard de RBAC como middleware; módulo `src/modules/users/` com CRUD restrito por papel.
- Dependência: Fase Interna 3 concluída.
- Critério de aceite: AUDITOR não consegue criar processo; OPERATOR não consegue criar usuário; TENANT_ADMIN só vê usuários do próprio tenant.

---

**FASE INTERNA 5 — Backend: ProcessExecution + AuditLog SaaS**
- Objetivo: ampliar `ProcessExecution` com `tenantId` e `executedBy`; implementar `AuditLog`.
- Escopo: alterar entidade e repositório de `process-execution` para persistir em PostgreSQL (substituindo JSON file); criar módulo `src/modules/audit-log/`; toda execução de processo grava automaticamente no `audit_log`.
- Dependência: Fase Interna 4 concluída. **O motor não é alterado.**
- Critério de aceite: execução via `POST /api/process/run` salva em banco com tenant e usuário; `audit_log` registra o evento; sem regressão nos 4 cenários canônicos DEMO-D1 a D4.

---

**FASE INTERNA 6 — Backend: configuração institucional**
- Objetivo: implementar módulo de config por órgão.
- Escopo: módulo `src/modules/organ-config/`; apenas TENANT_ADMIN pode alterar; config retornada no contexto de sessão para uso no frontend.
- Dependência: Fase Interna 4 concluída.
- Critério de aceite: TENANT_ADMIN altera config; OPERATOR lê config mas não altera; auditoria grava a alteração.

---

**FASE INTERNA 7 — Frontend: login, tenant, admin básico**
- Objetivo: adicionar telas de autenticação e painel mínimo de gestão de órgão ao frontend existente.
- Escopo: tela de login; fluxo de sessão; tab de administração (somente TENANT_ADMIN); exibição de autoria no histórico.
- Dependência: Fases Internas 3, 4 e 5 concluídas.
- Critério de aceite: percurso completo login → execução → histórico com autoria demonstrável. Sem regressão no fluxo existente.

---

**FASE INTERNA 8 — Validação e encerramento da ETAPA G**
- Objetivo: validação integrada ponta a ponta + checkpoint normativo + evidência Git.
- Escopo: regressão dos 4 cenários canônicos com auth ativo; prova de isolamento de tenant (dois tenants, dados não vazam); prova de RBAC; checklist de auditoria; commit + tag de encerramento.
- Dependência: todas as fases internas anteriores concluídas.
- Critério de aceite 10/10: regressão zero; isolamento verificado; RBAC verificado; `audit_log` gravado; checkpoint normativo aplicado; commit rastreável; sem pendência crítica aberta.

---

### Grafo de dependências

```
Fase 1 (Arquitetura) ──► Fase 2 (Banco) ──► Fase 3 (Auth)
                                                 │
                                                 ▼
                                          Fase 4 (RBAC + Users)
                                                 │
                                    ┌────────────┴────────────┐
                                    ▼                         ▼
                             Fase 5 (ProcessExec)      Fase 6 (OrgConfig)
                                    │                         │
                                    └────────────┬────────────┘
                                                 ▼
                                          Fase 7 (Frontend)
                                                 │
                                                 ▼
                                          Fase 8 (Validação)
```

---

## SÍNTESE EXECUTIVA

O sistema DECYON V2 é um motor de conformidade validado e auditável. Está pronto como produto técnico. Não está pronto como produto SaaS. As lacunas são objetivas, delimitadas e implementáveis sem tocar no núcleo.

A arquitetura definida neste documento adota o modelo mais pragmático e seguro para o estágio atual: banco PostgreSQL compartilhado com isolamento por linha e RLS, autenticação JWT, RBAC com 4 papéis mínimos, e extensão aditiva da entidade de execução. O motor não é tocado. A auditabilidade existente é preservada e ampliada com autoria real de usuário.

O risco principal a gerenciar é a migração da persistência JSON para banco real sem perder o histórico existente de demonstração — tema da Fase Interna 5, com estratégia de importação a ser definida antes da execução.

---

_Artefato versionado conforme REGRA DE GOVERNANÇA GIT (Plano Mestre Sec. 11.12)._

PLANO MESTRE — DECYON V2 (VERSÃO DEFINITIVA)
1. IDENTIDADE DO SISTEMA

A DECYON V2 é um:

motor de conformidade administrativa preventiva

orientado à estruturação da decisão administrativa

com foco em consistência, rastreabilidade e controle

Princípios fundamentais

não é gerador livre de texto

não é ferramenta opinativa

não substitui o agente público

IA é apenas assistiva e nunca decisória

toda saída deve ser:

estruturada

justificável

rastreável

2. ARQUITETURA MACRO (OBRIGATÓRIA)

O sistema é dividido em 3 blocos:

2.1 CÉREBRO (CORE)

orchestrator administrativo

módulos: DFD, ETP, TR, PRICING

validadores estruturais

validação jurídica

validação cruzada

decision trace

decision explanation

memória de cálculo

score explicável

👉 Regra absoluta: o núcleo não pode ser quebrado.

2.2 SISTEMA (BACKEND)

API estruturada

contratos de entrada e saída

controle de execução do motor

auditoria técnica

integração com persistência

2.3 PRODUTO (CAMADA OPERACIONAL)

frontend (painel)

autenticação

multi-tenant

auditoria de usuários

integrações externas

ambiente SaaS

3. PILARES INEGOCIÁVEIS

regressão zero

coerência entre documentos (DFD, ETP, TR, etc.)

trilha de auditoria completa

memória de cálculo estruturada

score explicável

bloqueio quando necessário

separação clara entre:

necessidade

justificativa

estratégia

diferenciação real entre:

regimes jurídicos

tipos de objeto

estrutura do objeto

## 4. ESTADO ATUAL DO PROJETO

O projeto DECYON (LICITAIA V2) encontra-se com o núcleo do motor administrativo **100% estruturado, validado e auditado**, tendo concluído integralmente as etapas A a E (núcleo validado 10/10), incluindo:

- motor de execução administrativa determinístico
- validações estruturais, jurídicas e de coerência
- memória de cálculo
- rastreabilidade completa das decisões
- geração estruturada de DFD, ETP e TR
- consolidação do resultado administrativo com status final controlado
- integração backend de execução (`/api/process/run`) com validação e normalização

Todas essas camadas foram implementadas com **regressão zero**, contratos estáveis e validação por prova operacional.

### 4.1. TRANSIÇÃO PARA CAMADA DE PRODUTO (ETAPA F → ETAPA G)

Conforme reconciliação formal registrada (Sec. 11.17), a evolução do projeto consolidou a seguinte interpretação:

- A **ETAPA F (Produto real)** foi absorvida operacionalmente
- A **ETAPA G passou a representar a materialização do produto SaaS real**
- A auditoria transversal foi deslocada para:
  - Fase Interna 8 da ETAPA G
  - ETAPA H (auditoria final completa)

Essa reconciliação mantém coerência com o plano original, sem perda de escopo ou integridade normativa.

### 4.2. ETAPA G — PRODUTO REAL (SaaS) — ESTADO ATUAL

A ETAPA G encontra-se **em execução ativa**, com as seguintes fases internas já concluídas:

#### 4.2.1. FASE INTERNA 1 — Arquitetura SaaS (sem código)

- definição formal da arquitetura multi-tenant
- separação de responsabilidades
- definição de isolamento por tenant
- diretrizes de segurança, auditoria e persistência

**Status:** **ENCERRADA — 2026-03-24**

#### 4.2.2. FASE INTERNA 2 — Banco de Dados

- implementação de schema PostgreSQL
- estrutura multi-tenant
- base para RLS (Row-Level Security)
- migrations versionadas e controladas

**Status:** **ENCERRADA — 2026-03-24**

#### 4.2.3. FASE INTERNA 3 — Autenticação + Tenant Resolution

**Escopo implementado:**

- login com resolução de tenant por slug
- autenticação com validação de credenciais
- geração de access token e refresh token
- isolamento por tenant via RLS
- validação de JWT
- fluxos de refresh e logout

**Problema crítico identificado:**

Durante a validação operacional, foi identificado erro estrutural no contexto transacional de tenant no PostgreSQL:

- uso de `SET LOCAL ... = $1`
- incompatibilidade com placeholder
- erro SQL (`syntax error at or near "$1"`)
- impacto direto: login retornando HTTP 500 indevido antes da validação de credenciais

**Correção aplicada:**

- substituição por `SELECT set_config('app.current_tenant_id', $1, true)`
- manutenção do escopo transacional
- compatibilidade com RLS
- preservação da arquitetura
- ajuste do seed de prova para hash bcrypt real compatível com `SenhaTeste@123`

**Prova operacional:**

Execução do script oficial `src/proof/etapa-g-fase3-auth-validation.ts`

**Resultado:**

- login válido → 200
- senha inválida → 401 controlado
- tenant inexistente → 401 controlado
- refresh válido → 200
- refresh inválido → 401
- logout com/sem token → comportamento correto
- JWT inválido → 401
- regressão de rotas preservada

**Status da prova:** 9/9 cenários aprovados

**Regressão zero confirmada:**

- motor administrativo intacto (runner canônico 7/7)
- IA intacta
- contratos intactos
- rota `/api/process/run` inalterada nesta fase

**Governança aplicada:**

- checkpoint normativo registrado
- matriz de fechamento atualizada
- commit formal realizado: `fix(etapa-g-fase3): corrigir RLS tenant context e seed de prova`
- evidência operacional documentada

**Status:** **ENCERRADA — 2026-03-25**

#### 4.2.4. FASE INTERNA 4 — RBAC + Módulo de Usuários

**Escopo implementado:**

- RBAC determinístico com papéis `TENANT_ADMIN` e `TENANT_USER`
- endpoints `POST /api/users`, `GET /api/users`, `PATCH /api/users/:id`, `GET /api/users/me`
- validação de papel no backend (não confiar apenas no banco)
- auditoria obrigatória em `audit_logs` (`USER_CREATED`, `USER_UPDATED`, `USER_ROLE_CHANGED`, `USER_DEACTIVATED`)
- proteção LGPD (sem exposição de `password_hash`)

**Prova operacional:**

Execução do script oficial `src/proof/etapa-g-fase4-rbac-validation.ts`

**Resultado:**

- admin cria usuário → 201
- admin lista usuários → 200
- tenant_user tenta criar → 403
- tenant_user tenta listar → 403
- admin altera role → 200
- admin desativa usuário → 200
- usuário desativado não loga → 403
- isolamento entre tenants → OK
- auditoria registrada + regressão `/api/process/run` sem auth indevido → OK

**Status da prova:** 9/9 cenários aprovados

**Regra operacional de prova (RLS):**

- validação de isolamento multi-tenant deve usar role PostgreSQL **não-superuser** e **sem BYPASSRLS** (ex.: `licitaia_app`)
- validação com role superuser (`postgres`) não é evidência válida de RLS

**Status:** **ENCERRADA — 2026-03-25**

#### 4.2.5. FASE INTERNA 5 — Backend: ProcessExecution + AuditLog SaaS

**Escopo implementado (FI5):**

- persistência real de execuções administrativas em `process_executions` (PostgreSQL) com vínculo de:
  - `tenant_id` (isolamento multi-tenant via RLS)
  - `executed_by` (autoria: `userId`)
- integração operacional com `audit_logs` (append-only) para cada execução relevante:
  - `action = PROCESS_EXECUTION`
  - `metadata` contendo `executionId`, `finalStatus`, `halted`, `httpStatus`
- endpoint seguro de histórico por tenant:
  - preferencial: `GET /api/process/executions`
  - compatibilidade: `GET /api/process-executions`
  - **somente** dados do tenant autenticado (RLS + tenant context)
- preservação de regressão zero:
  - `/api/process/run` permanece acessível sem JWT (fluxo consolidado)
  - persistência ocorre apenas quando `Authorization: Bearer <token>` está presente e válido (camada auxiliar)

**Nota técnica (consistência):**

- execuções com status **HALTED** também são persistidas e auditadas (a trilha de rastreabilidade registra o resultado final real, inclusive travas/halts), sem alterar o comportamento decisório do motor.

**Prova operacional real (FI5):**

Execução do script oficial `src/proof/etapa-g-fase5-process-execution-auditlog-validation.ts`.

**Evidências centrais (12/12):**

- tenant A e tenant B executam `/api/process/run` autenticados e geram persistência em `process_executions` com `tenantId` e `userId`
- cada execução gera `audit_logs` com `action = PROCESS_EXECUTION` e `metadata` coerente
- histórico via API retorna apenas registros do tenant autenticado
- isolamento multi-tenant por RLS comprovado usando role PostgreSQL **não-superuser** e **sem BYPASSRLS** (ex.: `licitaia_app`)
- regressão zero confirmada: `/api/process/run` permanece funcional sem auth indevido; auth e RBAC permanecem operacionais

**Status:** **ENCERRADA — 2026-03-26**

#### 4.2.6. FASE INTERNA 6 — Backend: Configuração Institucional por Tenant

**Escopo implementado (FI6):**

- backend de configuração institucional por tenant com persistência em `organ_configs`;
- endpoint seguro de leitura por tenant:
  - `GET /api/institutional-settings`
- endpoint seguro de atualização por tenant:
  - `PATCH /api/institutional-settings`
  - atualização restrita a `TENANT_ADMIN` (RBAC server-side);
- auditoria operacional obrigatória em `audit_logs`:
  - `action = INSTITUTIONAL_SETTINGS_UPDATED`;
- alinhamento físico do banco ao modelo canônico da fase:
  - migration `008_alter_organ_configs_add_fi6_institutional_fields.sql` aplicada com sucesso.

**Prova operacional real (FI6):**

Execução do script oficial `src/proof/etapa-g-fase6-institutional-settings-validation.ts`.

**Evidências centrais:**

- tenant A atualiza e lê apenas sua própria configuração institucional;
- tenant B atualiza e lê apenas sua própria configuração institucional;
- não há vazamento cross-tenant em API nem em banco;
- `TENANT_USER` recebe `403` no endpoint de atualização;
- `audit_logs` registra `INSTITUTIONAL_SETTINGS_UPDATED` por tenant;
- isolamento por RLS validado com role PostgreSQL não-superuser e sem `BYPASSRLS` (`licitaia_app`);
- regressão zero mantida para FI5, auth, RBAC e `/api/process/run`.

**Status da prova:** critérios obrigatórios aprovados (10/10)

**Status:** **ENCERRADA — 2026-03-26 (10/10)**

#### 4.2.7. FASE INTERNA 7 — Frontend administrativo básico (SaaS)

**Escopo implementado (FI7):**

- frontend operacional oficial utilizado: `02-frontend/licitaia-v2-demo`;
- login real integrado ao backend (`POST /api/auth/login`);
- persistência mínima de sessão no frontend para consumo autenticado da API;
- carregamento de contexto autenticado no frontend:
  - `GET /api/users/me` (usuário/papel/tenant);
  - `GET /api/institutional-settings` (configuração institucional por tenant);
- tela administrativa básica de configuração institucional no frontend com os campos canônicos da FI6:
  - `organizationName`;
  - `organizationLegalName`;
  - `documentNumber`;
  - `defaultTimezone`;
  - `defaultLocale`;
- atualização de configuração institucional pelo frontend para `TENANT_ADMIN`:
  - `PATCH /api/institutional-settings`;
- comportamento de RBAC refletido no frontend:
  - `TENANT_ADMIN` com edição/salvamento;
  - `TENANT_USER` em leitura somente;
  - backend preservando bloqueio `403` para update indevido;
- logout funcional integrado ao backend (`POST /api/auth/logout`);
- proteção do histórico frontend por sessão autenticada, sem alterar regras do motor.

**Saneamento de ambiente da prova FI7:**

- ambiente oficial unificado e validado:
  - frontend em `http://localhost:3000`;
  - backend em `http://localhost:3001`;
- eliminação de instâncias divergentes em portas concorrentes;
- validação da API oficial alinhada ao `src` atual (sem comportamento legado paralelo).

**Prova operacional real (FI7):**

Execução do script oficial:

`src/proof/etapa-g-fase7-frontend-admin-validation.ts`

**Evidências centrais:**

- cenário `TENANT_ADMIN`:
  - login `200`;
  - `/api/users/me` `200`;
  - leitura de `/api/institutional-settings` `200`;
  - atualização de settings `200`;
  - confirmação física no banco (`organ_configs`);
  - evidência de `audit_logs` (`INSTITUTIONAL_SETTINGS_UPDATED`);
- cenário `TENANT_USER`:
  - login `200`;
  - `/api/users/me` `200`;
  - leitura de `/api/institutional-settings` `200`;
  - tentativa de update bloqueada com `403`;
  - frontend refletindo bloqueio por perfil sem mascarar erro;
- cenário de regressão:
  - auth, RBAC, FI5, FI6 e `/api/process/run` preservados no ambiente oficial.

**Status da prova:** critérios obrigatórios aprovados (10/10)

**Status:** **ENCERRADA — 2026-03-26 (10/10)**

#### 4.2.8. FASE INTERNA 8 — Validação integrada final + encerramento técnico da ETAPA G

**Escopo implementado (FI8):**

- validação integrada final da ETAPA G, sem expansão funcional de escopo;
- confirmação do ambiente oficial único:
  - frontend `http://localhost:3000`;
  - backend `http://localhost:3001`;
- execução de prova multicamada com evidência real em:
  - frontend;
  - backend;
  - chamadas HTTP;
  - banco PostgreSQL;
  - RLS;
  - trilha de auditoria.

**Cenários integrados validados (A–E):**

- cenário A (`TENANT_ADMIN`):
  - login real;
  - sessão e contexto autenticado;
  - `/api/users/me`;
  - leitura e atualização de `/api/institutional-settings`;
  - evidência física em `organ_configs`;
  - evidência de `audit_logs`;
- cenário B (`TENANT_USER`):
  - login real;
  - sessão e contexto autenticado;
  - leitura de `/api/institutional-settings`;
  - tentativa de ação restrita bloqueada com `403`;
  - frontend refletindo corretamente o bloqueio;
- cenário C (histórico/execução):
  - execução autenticada relevante;
  - persistência em `process_executions`;
  - geração de `audit_logs`;
  - histórico por tenant sem overlap;
- cenário D (isolamento multi-tenant):
  - tenant A sem acesso a dados de tenant B;
  - tenant B sem acesso a dados de tenant A;
  - validação por API e por RLS;
  - role de prova: `licitaia_app` (não-superuser, sem `BYPASSRLS`);
- cenário E (regressão global):
  - FI3, FI4, FI5, FI6 e FI7 preservadas;
  - `/api/process/run` preservado.

**Artefato final de prova (reexecutável):**

`03-backend-api/licitaia-v2-api/src/proof/etapa-g-fase8-integrated-validation.ts`

**Status da prova:** critérios obrigatórios aprovados (10/10)

**Conclusão da fase:** **ENCERRADA — 2026-03-26 (10/10)**

**Conclusão técnica da ETAPA G:** encerramento técnico concluído com validação integrada final, sem divergência entre `src`, `dist` e banco no ambiente oficial.

### 4.3. SITUAÇÃO ATUAL DA ETAPA G

| Fase | Status |
|------|--------|
| Fase 1 — Arquitetura | ENCERRADA |
| Fase 2 — Banco de Dados | ENCERRADA |
| Fase 3 — Autenticação | ENCERRADA |
| Fase 4 — RBAC | ENCERRADA |
| Fase 5 — AuditLog / ProcessExecution | **ENCERRADA — 2026-03-26 (10/10)** |
| Fase 6 — Configuração institucional | **ENCERRADA — 2026-03-26 (10/10)** |
| Fase 7 — Frontend SaaS | **ENCERRADA — 2026-03-26 (10/10)** |
| Fase 8 — Validação integrada + auditoria transversal | **ENCERRADA — 2026-03-26 (10/10)** |

### 4.4. POSIÇÃO REAL DO PROJETO

O sistema encontra-se:

- com o **motor administrativo completo e validado**
- com a **base SaaS iniciada e operacional**
- com autenticação e isolamento multi-tenant funcionando
- com persistência estruturada ativa
- com rastreabilidade preservada

Ainda pendente:

ETAPA H:

- ENCERRADA formalmente em 10/10 (vide Secção 11.28)
- prontidão controlada validada
- sistema apto para demonstração, validação externa e piloto controlado

### 4.5. CONCLUSÃO DO ESTADO ATUAL

O DECYON evoluiu de:

- motor validado (Etapas A–E)

para

- sistema SaaS em construção real (ETAPA G)

com:

- núcleo sólido
- autenticação funcional e auditada
- base pronta para expansão controlada

Sem regressão, sem perda de coerência e com preservação integral de 100% das diretrizes normativas.

5. COMPONENTES OBRIGATÓRIOS (VERSÃO ORIGINAL DO PLANO — REGISTRO HISTÓRICO)
Observação normativa:

Esta seção representa o estado original de planejamento.

O estado atual de implementação encontra-se atualizado na Secção 11.32.

Em caso de divergência, prevalece a Secção 11.32.
5.1 Persistência (BANCO DE DADOS)

armazenamento de processos

histórico completo de execução

trilha auditável por evento

versionamento de decisões

5.2 Multi-tenant

isolamento por cliente (prefeitura)

segregação lógica obrigatória

possibilidade futura de isolamento físico

5.3 Auditoria de usuários

log completo por ação

rastreabilidade por usuário

painel de auditoria

5.4 LGPD

controle de acesso

minimização de dados

política de retenção

possibilidade de exclusão/exportação

5.5 Segurança

autenticação robusta

controle de permissões (RBAC)

proteção de dados sensíveis

5.6 Perfis de usuário

administrador

operador

auditor

5.7 Painel administrativo

gestão de usuários

gestão de permissões

visualização de auditoria

5.8 Documentos institucionais

geração determinística

zero fingerprint de IA

padrão compatível com TCU

5.9 Integrações externas

PNCP

IBGE

outras fontes oficiais

5.10 DevOps / SaaS

ambientes:

dev

staging

produção

CI/CD

deploy automatizado

infraestrutura segura (AWS ou equivalente)

backup e recuperação

6. GOVERNANÇA DE DADOS

Obrigatório garantir:

isolamento por tenant

rastreabilidade total

histórico imutável

controle de acesso por perfil

política de retenção

possibilidade de auditoria externa

7. ROADMAP DE FASES

fases estruturadas até a Fase 49

evolução controlada

sem saltos de etapa

sem antecipação indevida de camadas

👉 O roadmap deve ser atualizado continuamente.

7.1 RELAÇÃO ENTRE FASES 1–49 E O FECHAMENTO (ETAPAS A–H)

As Fases 1 a 49 são marcos numerados do roadmap estrutural do projeto (evolução do núcleo, backend, produto e componentes obrigatórios definidos neste plano), regidas pelas Secções 4, 7 e 8.

O Plano de Finalização do Sistema (Secção 11), com as Etapas A a H e as Frentes 1 a 7, inicia somente após a Fase 49 estar concluída em 10/10.

Nenhuma Etapa A–H substitui uma Fase: são instrumentos distintos. O desdobramento executivo por Frente está em 01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md, sem alterar a hierarquia normativa deste Plano Mestre.

8. CRITÉRIO DE ACEITE DE FASE (REGRA 10/10)

Uma fase só é considerada concluída quando:

não há regressão

comportamento é consistente com o núcleo

testes passam integralmente

resultado é auditável

não há ambiguidade técnica

código está coerente com arquitetura

documentação mínima existe

👉 Qualquer nota abaixo de 10/10 impede avanço.

9. REGRAS DE EVOLUÇÃO

nenhuma fase pode quebrar o núcleo

nenhuma fase pode ignorar este plano

nenhuma decisão pode ser tomada fora deste plano

qualquer novo requisito:
→ deve ser registrado aqui antes de implementação

10. REGRA OPERACIONAL CRÍTICA (NOVA)

Antes de qualquer implementação em qualquer fase:

Revisar este arquivo (PLANO-MESTRE-DECYON-V2.md)

Confirmar aderência total

Validar que não há conflito com:

arquitetura

pilares

governança (pacote normativo em 01-planejamento/governanca/)

roadmap

Se houver qualquer divergência:

👉 O PLANO MESTRE PREVALECE.

11. PLANO DE FINALIZAÇÃO DO SISTEMA (NOVA CAMADA ESTRUTURAL OBRIGATÓRIA)

Após a consolidação das fases estruturais até a Fase 49, o projeto entra em uma etapa crítica de fechamento total do sistema.

Esta etapa NÃO é opcional.

Ela define a transição do sistema de:
→ funcional e estruturado
para:
→ completo, seguro, auditável e pronto para uso real institucional

11.1 DIRETRIZ CENTRAL

O foco deixa de ser:

→ construir funcionalidades

e passa a ser:

→ eliminar qualquer possibilidade de erro no sistema

O objetivo é garantir que o DECYON:

- conduza totalmente o usuário
- impeça erros estruturais, jurídicos e matemáticos
- aplique travas obrigatórias em todos os cenários relevantes
- gere documentos perfeitos, auditáveis e defensáveis

11.2 VOCABULÁRIO NORMATIVO (FASE, FRENTE, ETAPA)

Fase: marco numerado do roadmap histórico e estrutural do projeto (ex.: Fase 35), regido pelas Secções 4, 7, 7.1 e 8 deste plano, até a Fase 49.

Frente: dimensão obrigatória de trabalho do fechamento final do sistema (Frentes 1 a 7). Cada Frente representa um eixo material de fechamento; nenhuma pode ser ignorada.

Etapa: macro-ordem obrigatória de execução do fechamento final (Etapas A a H), iniciada somente após a Fase 49 em 10/10 (vide Secção 7.1).

As Etapas A a F organizam a execução principal do fechamento material: cada uma corresponde às Frentes indicadas na Secção 11.4.

A Etapa G é transversal: audita o conjunto consolidado das Frentes 1 a 7 após a conclusão em 10/10 das Etapas A a F.

A Etapa H é transversal: consolida deploy, apresentação institucional e readiness final após a Etapa G em 10/10.

As Etapas G e H não constituem uma “oitava” ou “nona” Frente: são etapas transversais obrigatórias sobre o trabalho já dimensionado nas Frentes 1 a 7.

11.3 ESTRUTURA DO PLANO DE FINALIZAÇÃO — FRENTES (DIMENSÕES DE TRABALHO)

O fechamento material do sistema está organizado nas seguintes Frentes:

FRENTE 1 — Core de compliance  
FRENTE 2 — Jurídico e matemático  
FRENTE 3 — Estrutura documental  
FRENTE 4 — Camada documental premium  
FRENTE 5 — IA assistiva de precisão  
FRENTE 6 — Condução total do usuário  
FRENTE 7 — Produto real (SaaS)

Cada Frente representa uma dimensão obrigatória de fechamento material.

Nenhuma pode ser ignorada.

O desdobramento mínimo de objetivo, travas, provas de aceite, dependências e correspondência Etapa ↔ Frente está em 01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md.

11.4 ETAPAS DE EXECUÇÃO (ORDEM OBRIGATÓRIA)

ETAPA A — Fechamento total do core de compliance (Frentes 1 e 2)

ETAPA B — Estrutura documental determinística (Frente 3)

ETAPA C — Camada documental premium (Frente 4)

ETAPA D — IA assistiva controlada (Frente 5)

ETAPA E — Condução total do usuário (Frente 6)

ETAPA F — Produto real (Frente 7)

ETAPA G — Auditoria 100% completa (transversal ao conjunto das Frentes 1 a 7, após A–F)

ETAPA H — Deploy e apresentação institucional (transversal; readiness final após G)

Regra obrigatória:

→ Nenhuma etapa pode ser pulada  
→ Nenhuma etapa pode ser antecipada  
→ Nenhuma etapa pode ser considerada concluída abaixo de 10/10  

11.5 REGRA DE NÃO GERAÇÃO PREMATURA (ETAPA A)

Durante a ETAPA A:

- NÃO introduzir nem consolidar a camada documental final institucional premium nem o arquivo documental externo além do que o núcleo já produz hoje para compliance estrutural; não antecipar o trabalho reservado às Etapas B, C e posteriores.

- NÃO usar IA para lógica decisória, enquadramento jurídico ou governo de fluxo.

- NÃO expandir escopo funcional além do necessário ao fechamento de compliance das Frentes 1 e 2.

- NÃO alterar frontend sem necessidade crítica comprovada para evidência de compliance, regressão ou auditoria técnica do motor.

Permitido e exigível quando necessário ao 10/10:

- executar testes automatizados e manuais do motor, cenários canônicos e matrizes de cobertura oficiais;

- produzir evidências estruturais, logs, traces e relatórios de auditoria técnica;

- validar e endurecer travas, validações cruzadas e comportamento de halt, inclusive com uso dos artefatos estruturados já previstos no núcleo (DFD, ETP, TR na qualidade de outputs técnicos do pipeline existente), desde que a finalidade seja verificação, regressão e compliance — e não criação de nova linha de documentação institucional premium nem redação livre assistida.

Foco exclusivo:

→ travas de compliance  
→ coerência estrutural  
→ eliminação de inconsistências  

11.6 REGRA DE BLOQUEIO ABSOLUTO

O sistema deve, obrigatoriamente:

- bloquear inconsistências
- explicar o motivo do bloqueio
- impedir avanço indevido entre as etapas do processo administrativo
- impedir geração de documento

Nenhuma inconsistência pode ser tolerada.

11.7 REGRA DE INTEGRAÇÃO COM O NÚCLEO

Todas as evoluções do Plano de Finalização devem:

- respeitar integralmente o núcleo existente
- não quebrar módulos atuais
- não alterar contratos sem justificativa formal
- preservar decision trace e auditabilidade

11.8 REGRA DE CONTEXTO OBRIGATÓRIO

O Plano de Finalização deve ser interpretado em conjunto com os artefatos oficiais versionados:

- 01-planejamento/governanca/MASTER-CONTEXT-LICITAIA.md
- 01-planejamento/governanca/REGRAS-DE-DESENVOLVIMENTO-LICITAIA.md
- 01-planejamento/governanca/CHECKLIST-DE-AUDITORIA-LICITAIA.md
- 01-planejamento/governanca/PROMPT-PADRAO-CURSOR.md

Nenhuma decisão pode contrariar esses documentos nem o presente Plano Mestre.

11.9 REGRA FINAL

O sistema só será considerado pronto quando:

- eliminar o “complexo da página em branco”
- conduzir integralmente o usuário
- impedir erro em qualquer cenário relevante
- gerar documentação perfeita e auditável
- estar apto para uso real por órgãos públicos

Até lá:

→ o sistema NÃO está pronto

11.10 REGRA DE CHECKPOINT DE ATUALIZAÇÃO NORMATIVA (OBRIGATÓRIA)

Antes de encerrar qualquer etapa ou fase interna, é obrigatório responder formalmente:

1) a etapa criou, alterou ou consolidou regra normativa;
2) se a alteração exige atualização deste Plano Mestre;
3) se a alteração exige atualização da Matriz de Fechamento;
4) se a alteração exige criação/atualização de artefatos em `01-planejamento/governanca/`.

Se qualquer resposta for positiva, a atualização normativa correspondente deve ocorrer na mesma etapa, antes do encerramento.

Se qualquer resposta for negativa, a justificativa formal deve ser registrada no relatório de encerramento da etapa.

Encerramento sem aplicação explícita deste checkpoint é inválido para critério 10/10.

11.11 PRINCÍPIO DE SUPREMACIA DO MOTOR SOBRE A IA

Fica estabelecido como regra estrutural do sistema:

1) O DECYON V2 é motor de decisão administrativa preventiva, não gerador de texto.
2) A IA não possui papel decisório em nenhuma camada.
3) Nenhuma decisão jurídica, estrutural ou matemática pode ser tomada por IA.
4) Toda decisão administrativa obrigatória deve estar resolvida antes da ETAPA D.
5) A IA só pode atuar após:
   - validação completa do motor;
   - estrutura documental determinística concluída;
   - camada documental premium consolidada.
6) A IA só pode executar funções assistivas de:
   - reescrita;
   - padronização;
   - melhoria de clareza textual.
7) A IA não pode:
   - criar conteúdo novo sem lastro estrutural;
   - alterar sentido técnico, jurídico ou administrativo;
   - justificar decisão que pertence ao motor;
   - corrigir erro estrutural ou de compliance.
8) Em qualquer conflito entre saída de IA e decisão do motor, o motor prevalece.
9) Em falha da IA, o sistema deve manter e retornar o conteúdo original válido derivado do motor.

11.12 REGRA DE GOVERNANÇA GIT E RASTREABILIDADE DE ENCERRAMENTO

Fica obrigatório, para qualquer etapa/fase concluída:

1) existir commit de encerramento rastreável no Git oficial do projeto;
2) existir tag de marco aprovado quando aplicável;
3) registrar hash de commit e tag no relatório de encerramento;
4) aplicar checkpoint Git de status limpo antes do fechamento.

Encerramento sem evidência Git rastreável é inválido para critério 10/10.

A regra operacional detalhada está consolidada em:

`01-planejamento/governanca/PADRAO-OFICIAL-DE-VERSIONAMENTO-GIT.md`.

11.13 REGRA DE CONTINUIDADE HISTÓRICA FASES 1–49 -> ETAPAS A–H

Fica obrigatório manter catálogo mestre oficial das Fases 1–49 com evidência de:

1) status documental/técnico de cada fase;
2) vínculo de commit/tag quando houver;
3) lacuna histórica formal quando a evidência for insuficiente.

Fica obrigatório manter matriz de continuidade entre o ciclo histórico (Fases 1–49) e o ciclo de fechamento (Etapas A–H), sem perda de contexto.

Artefatos oficiais:

- `01-planejamento/governanca/CATALOGO-MESTRE-FASES-1-A-49.md`
- `01-planejamento/governanca/MATRIZ-DE-CONTINUIDADE-FASES-1-49-PARA-ETAPAS-A-H.md`

11.14 REGRA DE PROTOCOLO OPERACIONAL OBRIGATÓRIO (BLOQUEIO ABSOLUTO)

Fica obrigatório aplicar, em toda execução futura, o protocolo oficial:

`01-planejamento/governanca/PROTOCOLO-OPERACIONAL-OBRIGATORIO.md`.

Sem aplicação explícita e integral deste protocolo:

→ nenhuma fase, etapa, frente ou fase interna é válida para critério 10/10;  
→ o avanço operacional deve ser bloqueado;  
→ o encerramento é normativamente inválido.

11.15 REGRA DE EXECUÇÃO CONTROLADA DO CURSOR

Toda execução do Cursor deve, obrigatoriamente:

1) declarar leitura obrigatória dos artefatos centrais de governança;
2) declarar aderência ao PROTOCOLO OPERACIONAL OBRIGATÓRIO;
3) aplicar checkpoint normativo antes de declarar conclusão;
4) manter coerência integral entre código, arquitetura, norma e rastreabilidade.

Sem cumprimento cumulativo desta regra, a execução não pode ser aceita como fechamento 10/10.

11.17 RECONCILIAÇÃO OFICIAL DE NOMENCLATURA — ETAPAS F E G

Registrado em: 2026-03-24
Artefato de referência: `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-G-FASE-INTERNA-1.md`

Durante a execução do projeto, ocorreu evolução formal de nomenclatura entre o planejamento original (Secções 11.4) e a execução real:

| Nomenclatura original | Nomenclatura adotada na execução |
|---|---|
| ETAPA F = Produto real (Frente 7 / SaaS) | ETAPA G = Produto real (Frente 7 / SaaS) |
| ETAPA G = Auditoria transversal 100% | Incorporada como Fase Interna 8 da ETAPA G + ETAPA H |

Justificativa formal: As ETAPAS A a E foram executadas e encerradas. A ETAPA F, conforme originalmente planejada para o produto SaaS real, não foi implementada no ciclo A–E. O ciclo atual (ETAPA G) absorve formalmente o escopo da Frente 7 (Produto real). A auditoria transversal, originalmente designada ETAPA G, está incorporada na Fase Interna 8 da ETAPA G e na ETAPA H.

Regra: esta reconciliação não altera nenhum dos pilares inegociáveis (Secção 3), nenhuma regra arquitetural (Secção 2) e nenhuma regra operacional do motor. Altera apenas o mapeamento Etapa ↔ Frente para refletir a realidade de execução.

A Matriz de Fechamento foi atualizada para refletir esta reconciliação.

Estado de execução (registro factual):
- ETAPA G — Fase Interna 3 (Autenticação + Tenant Resolution) — **ENCERRADA — 2026-03-25** (prova operacional 9/9 em `src/proof/etapa-g-fase3-auth-validation.ts`).

---

11.16 DIRETRIZ CANÔNICA DA ETAPA E (FRENTE 6) — CAMADA OPERACIONAL DE CONDUÇÃO

Para a ETAPA E (Condução total do usuário), fica estabelecido:

1) frontend oficial de condução operacional:
- `02-frontend/licitaia-v2-demo`.

2) frontend de núcleo modular:
- `02-frontend/licitaia-v2-web`, com foco em módulos, contratos, validações e orquestração estrutural.

3) relação obrigatória entre camadas:
- a UI conduz, mas não decide;
- a camada operacional deve consumir e respeitar as capacidades e travas do núcleo;
- é proibido duplicar regra jurídica, matemática ou de conformidade central no frontend operacional;
- em conflito, o motor prevalece.

4) fronteiras inalteráveis nesta etapa:
- a ETAPA E não altera o motor central;
- a ETAPA E não altera backend de IA;
- a ETAPA E não altera camada premium documental;
- a ETAPA E não altera a estrutura documental determinística consolidada.

5) objetivo material da ETAPA E:
- converter validações e travas já existentes em condução operacional preventiva, sem página em branco em decisões críticas e sem salto indevido de fluxo.

---

11.18 REGISTRO NORMATIVO — ETAPA H / H-FI1 (CORREÇÃO ESTRUTURAL DO NÚCLEO E BORDA API)

Registrado em: 2026-03-26
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI1-CORRECAO-ESTRUTURAL-2026-03-26.md`

Objetivo do registro:
- formalizar correção estrutural cirúrgica da H-FI1 sem expansão de escopo;
- remover risco de divergência silenciosa entre fonte de verdade (`src`) e execução crítica;
- reforçar rastreabilidade e coerência de identidade/autoria no fluxo administrativo.

Correções estruturais registradas:
1) Execução crítica do backend alinhada ao núcleo em `src` (remoção de dependência crítica de `modules-dist`).
2) Persistência crítica da rota administrativa convertida para fluxo aguardado (`await`) com falha explícita em erro de trilha.
3) Blindagem semântica de identidade: `tenantId` e `userId` deixam de ser aceitos via body em superfície pública.
4) Redução de duplicação arriscada de contratos locais redundantes no backend.
5) Redução de duplicação estrutural transversal nos módulos DFD/ETP/TR/PRICING por extração de helper comum de invalidação.
6) Superfície canônica de orquestração reforçada por redução de export público ambíguo (`executeFlow` fora da API pública do núcleo).

Regra de status:
- este registro não declara encerramento total da ETAPA H;
- este registro declara somente a execução corretiva da H-FI1 com prova reexecutável e sem regressão operacional nas rotas consolidadas.

---

11.19 REGISTRO NORMATIVO — ETAPA H / H-FI2 (AUDITORIA DE FLUXO + HARDENING CANÔNICO)

Registrado em: 2026-03-27
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI2-FLUXO-E-HARDENING-2026-03-27.md`

Objetivo do registro:
- auditar e blindar o fluxo administrativo canônico (DFD -> ETP -> TR -> PRICING);
- remover ambiguidade de superfícies de execução do núcleo;
- concluir hardening da execução canônica sem dependência implícita de `ts-node/register` em modo de produção.

Consolidações estruturais:
1) loader canônico com modo explícito (`source`/`compiled`/`auto`) e telemetria de runtime para auditoria técnica;
2) build do backend passa a gerar runtime canônico do núcleo a partir do `src` oficial do frontend modular;
3) runners de prova internos do backend passam a usar a mesma superfície canônica da API (sem caminho paralelo);
4) superfície pública ambígua de orquestração (`executeFlow`) removida do núcleo exportável;
5) prova H-FI2 criada para cobrir:
   - sucesso completo;
   - bloqueios por dependência em cadeia;
   - bloqueio por validação jurídica;
   - coerência entre `executedModules`, `events`, `validations` e `finalStatus`;
   - validação de hardening em modo `compiled`.

Regra de status:
- este registro não encerra a ETAPA H completa;
- este registro formaliza somente a execução da H-FI2 com evidência técnica reexecutável.

---

11.20 REGISTRO NORMATIVO — ETAPA H / H-FI3 (AUDITORIA HOSTIL MULTI-TENANT PROFUNDA)

Registrado em: 2026-03-27
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI3-AUDITORIA-MULTI-TENANT-PROFUNDA-2026-03-27.md`

Objetivo do registro:
- executar auditoria hostil de isolamento multi-tenant no backend e na persistência;
- provar ausência de vazamento e contaminação entre tenants em leitura, gravação e trilha;
- reforçar que RLS não seja apenas declarativo, mas efetivo contra bypass estrutural.

Consolidações estruturais:
1) blindagem de RLS contra bypass de owner com `FORCE ROW LEVEL SECURITY` nas tabelas multi-tenant críticas (`users`, `user_sessions`, `process_executions`, `audit_logs`, `organ_configs`);
2) prova hostil reexecutável H-FI3 criada para validar:
   - leitura e gravação isoladas por tenant;
   - ausência de overlap de histórico;
   - tentativa hostil de leitura cruzada bloqueada por RLS;
   - tentativa hostil de escrita cruzada bloqueada por policy;
   - postura de segurança do banco (`licitaia_app` sem superuser/BYPASSRLS + tabelas com force RLS);
3) manutenção de escopo cirúrgico sem expansão funcional de produto.

Regra de status:
- este registro não encerra a ETAPA H completa;
- este registro formaliza a execução da H-FI3 e a atualização de blindagem estrutural multi-tenant.

---

11.21 REGISTRO NORMATIVO — ETAPA H / H-FI3-C (CORRETIVA CIRÚRGICA DE FORCE RLS + HISTÓRICO)

Registrado em: 2026-03-27
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI3-CORRETIVA-FORCE-RLS-E-HISTORICO-SEM-OVERLAP-2026-03-27.md`

Motivação da corretiva:
- na reexecução hostil da H-FI3 surgiram duas falhas objetivas:
  - `c10=false` (force RLS não efetivo no banco de prova);
  - `c7=false` (overlap real no histórico entre tenants).

Causa estrutural consolidada:
1) migration 009 existia em código, mas não havia sido aplicada no banco efetivo de prova;
2) endpoint de histórico dependia somente de RLS/contexto transacional, sem filtro explícito por `tenant_id` na query de listagem/consulta por id;
3) o processo ativo na porta 3001 estava em instância anterior durante tentativas de validação, exigindo reinicialização para carregar a correção.

Correções cirúrgicas aplicadas:
1) aplicação efetiva da migration `009_force_row_level_security_tenant_tables.sql` no banco `licitaia_dev` com owner das tabelas;
2) endurecimento da superfície de histórico com filtro explícito por `tenant_id` em:
   - listagem (`listProcessExecutions`);
   - busca por id (`findProcessExecutionById`);
3) reexecução completa da prova H-FI3 com 10/10 checks aprovados.

Regra de status:
- H-FI3 corretiva: concluída nesta execução com prova reexecutável aprovada;
- ETAPA H completa: permanece não encerrada.

---

11.22 REGISTRO NORMATIVO — ETAPA H / H-FI4 (AUDITORIA DE AUDIT LOGS E RASTREABILIDADE TOTAL)

Registrado em: 2026-03-27
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI4-AUDIT-LOGS-E-RASTREABILIDADE-2026-03-27.md`
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI4.md`

Objetivo do registro:
- auditar completude, causalidade e encadeamento de rastreabilidade entre request, execução, validações, eventos, decisão e persistência;
- eliminar ambiguidade de `correlationId` na superfície `/api/process/run`;
- fortalecer semântica de `audit_logs` para reconstrução forense.

Consolidações estruturais aplicadas:
1) `correlationId` do motor passa a ser derivado da borda HTTP (`requestId`) em vez de aceitar valor de cliente como fonte de verdade;
2) persistência de execução incorpora `correlationId` confiável no `request_payload` salvo;
3) metadados de `audit_logs` para `PROCESS_EXECUTION` passam a registrar:
   - `requestId`, `correlationId`, `processId`,
   - `finalStatus`, `halted`, `haltedBy`, `httpStatus`,
   - `modulesExecuted`, `validationCodes`, `eventsCount`, `decisionMetadataCount`;
4) prova reexecutável dedicada da H-FI4 criada em:
   - `03-backend-api/licitaia-v2-api/src/proof/etapa-h-fi4-audit-traceability-validation.ts`.

Prova real executada e evidência SQL consolidada:
1) PostgreSQL ativo e conectividade validada para `postgres` e `licitaia_app` no banco `licitaia_dev`;
2) prova reexecutável H-FI4 executada com sucesso (`src/proof/etapa-h-fi4-audit-trace.ts`) cobrindo:
   - cenário de sucesso;
   - cenário de halted por validação;
   - cenário de halted por dependência;
3) consultas SQL diretas em `process_executions` e `audit_logs` confirmaram:
   - persistência de payload e response;
   - correlação `requestId/correlationId/processId/tenantId/userId`;
   - coerência temporal e causal;
   - reconstrução completa da execução a partir do banco.

Regra de status:
- H-FI4: concluída em 10/10 com prova real no PostgreSQL e regressão zero;
- ETAPA H completa: permanece não encerrada (demais frentes transversais não fazem parte deste registro).

---

11.23 REGISTRO NORMATIVO — ETAPA H / H-FI5 (AUDITORIA HOSTIL DE CONTRATOS, SUPERFÍCIES E RESPOSTAS CANÔNICAS)

Registrado em: 2026-03-27
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI5.md`

Objetivo do registro:
- provar coerência semântica entre contratos públicos da API e comportamento real do motor;
- eliminar superfícies públicas perigosas que aceitem contexto de identidade pela borda;
- validar previsibilidade das respostas canônicas para integradores/auditores.

Consolidações estruturais aplicadas:
1) endurecimento de contrato de entrada em `/api/process/run`:
   - `tenantId`, `userId` e `correlationId` passam a ser rejeitados no body (400);
   - identidade e correlação permanecem derivadas do contexto autenticado e do `x-request-id`;
2) normalização semântica de erro interno:
   - resposta 500 passa a usar `process.status='failure'` (alinhado ao contrato canônico), removendo `status='error'` fora da semântica declarada;
3) prova reexecutável H-FI5 criada:
   - `03-backend-api/licitaia-v2-api/src/proof/etapa-h-fi5-contract-surface-audit.ts`.

Prova real executada:
1) cenário de sucesso canônico (`200`, `status=success`, `finalStatus=SUCCESS`);
2) cenário de halted por validação (`409`, `status=halted`, `finalStatus=HALTED_BY_VALIDATION`);
3) cenário de halted por dependência (`409`, `status=halted`, `finalStatus=HALTED_BY_DEPENDENCY`);
4) prova de superfície perigosa bloqueada:
   - envio de `tenantId/userId/correlationId` no body -> `400 INVALID_PROCESS_RUN_REQUEST`;
5) regressão zero confirmada por reexecução das provas:
   - H-FI2 (fluxo/hardening canônico);
   - H-FI4 (rastreabilidade PostgreSQL).

Regra de status:
- H-FI5: concluída em 10/10 com prova real reexecutável e sem lacunas críticas de contrato no escopo auditado;
- ETAPA H completa: permanece não encerrada (subfases transversais subsequentes fora deste registro).

---

11.24 REGISTRO NORMATIVO — ETAPA H / H-FI6 (AUDITORIA HOSTIL DE READINESS REAL)

Registrado em: 2026-03-27  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI6.md`

Objetivo do registro:
- provar coerência entre código-fonte, build, runtime, configuração e borda HTTP para ambiente controlado;
- documentar caminho canônico de subida e prova reexecutável única;
- eliminar lacuna de CORS para o header de correlação `x-request-id` em preflight de browsers.

Consolidações estruturais aplicadas:
1) `Access-Control-Allow-Headers` atualizado para incluir `x-request-id` (`middleware/cors.ts`), alinhado à correlação canônica da borda (H-FI4/H-FI5);
2) prova reexecutável H-FI6 adicionada:
   - `03-backend-api/licitaia-v2-api/src/proof/etapa-h-fi6-readiness-controlled-environment.ts`;
3) script npm oficial: `npm run proof:h-fi6` no backend;
4) ordem canônica documentada: build backend → runtime `dist/server.js` → frontend demo `node server.js` (porta 3000) → PostgreSQL para provas com persistência (FI4/FI5 embutidas quando o banco está acessível).

Prova real executada (níveis):
1) `npm run build` no backend — OK;
2) regressão H-FI2 in-process — OK;
3) camada HTTP: `/health`, `/diagnostics`, CORS preflight, POST `/api/process/run` (motor público) — OK com API em execução;
4) regressões H-FI4/H-FI5 na mesma prova — exigem PostgreSQL ativo e `DATABASE_URL` válida; em ambiente sem servidor de banco, usar apenas `H_FI6_SKIP_DB_REGRESSION=1` para prova parcial documentada (não substitui prova integral para piloto).

Regra de status (atualizada por H-FI6-C em 2026-03-27):
- H-FI6: **encerrada formalmente em 10/10** após H-FI6-C — prova integral `npm run proof:h-fi6` sem skip, com PostgreSQL real, migrations/seed e regressões H-FI4/H-FI5 no mesmo fluxo (ver Secção 11.25);
- ETAPA H completa: permanece não encerrada (demais subfases transversais fora deste registro).

---

11.25 REGISTRO NORMATIVO — ETAPA H / H-FI6-C (CORRETIVA FINAL DE READINESS FULL-STACK)

Registrado em: 2026-03-27  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI6-C.md`

Objetivo do registro:
- eliminar o bloqueador ambiental que impedia prova multicamada integral da H-FI6;
- comprovar, com evidência reexecutável, PostgreSQL acessível, migrations aplicadas, seed coerente e execução de `npm run proof:h-fi6` **sem** `H_FI6_SKIP_DB_REGRESSION`.

Consolidações aplicadas:
1) PostgreSQL iniciado e validado (`licitaia_dev`, role `licitaia_app`);
2) migrations verificadas/aplicadas (incl. 009 RLS quando pendente);
3) correção cirúrgica do seed `001_test_tenant.sql`: `TRUNCATE TABLE audit_logs` antes da limpeza idempotente, evitando UPDATE implícito via FK `ON DELETE SET NULL` que violava imutabilidade de `audit_logs`;
4) `npm run validate` (schema) em verde;
5) `npm run proof:h-fi6` integral: FI2 + HTTP + FI5 + FI4 — **OK**.

Regra de status:
- H-FI6-C: **concluída em 10/10** com prova full-stack integral;
- H-FI6 (subfase): **encerrada formalmente**;
- ETAPA H completa: permanece não encerrada (demais subfases transversais fora deste registro).

---

11.26 REGISTRO NORMATIVO — ETAPA H / H-FI7 (DEMONSTRAÇÃO CONTROLADA E OPERAÇÃO ASSISTIDA)

Registrado em: 2026-03-27  
Artefatos:
- `01-planejamento/governanca/PROTOCOLO-DEMONSTRACAO-CONTROLADA-ETAPA-H-FI7.md`
- `03-backend-api/licitaia-v2-api/src/proof/etapa-h-fi7-institutional-demo-readiness.ts`
- `npm run proof:h-fi7` no `package.json` do backend

Objetivo: protocolo explícito de subida, roteiro de demo, limites institucionais e prova reexecutável que encadeia H-FI6.

---

11.27 REGISTRO NORMATIVO — ETAPA H / H-FI8 (AUDITORIA HOSTIL FINAL DE PRONTIDÃO PARA APRESENTAÇÃO REAL)

Registrado em: 2026-03-27  
Artefato: `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI8.md`

Objetivo: simular apresentação real, classificar riscos (técnico, operacional, percepção, institucional, demonstração, questionamento) e fechar apenas se não houver bloqueador crítico sem mitigação documental.

Consolidações:
1) achado crítico A1 — script `proof:h-fi7` ausente no `package.json` — **corrigido**;
2) simulação reexecutada: `npm run proof:h-fi7` em verde (inclui encadeamento `npm run proof:h-fi6`);
3) riscos importantes residuais (PostgreSQL manual, dual `DATABASE_URL`, credenciais de seed) **mitigados** pelo protocolo H-FI7 e comunicação de limites, não por feature nova.

Regra de status:
- H-FI8: **concluída em 10/10** no escopo de auditoria hostil + correção mínima + prova;
- ETAPA H completa: permanece não encerrada se ainda houver subfases/transversais previstas no Plano Mestre fora deste registro.

---

11.28 ENCERRAMENTO FORMAL GLOBAL DA ETAPA H (GOVERNANÇA)

Registrado em: **2026-03-27**  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ENCERRAMENTO-ETAPA-H.md`

Objetivo desta secção:
- declarar o **encerramento formal da ETAPA H** em **10/10**, sem alterar o significado histórico dos registos normativos 11.18 a 11.27 (que documentam cada subfase no momento da execução);
- fixar o **estado normativo vigente** quanto ao fecho global da etapa.

Subfases concluídas (todas documentadas nos registos 11.18 a 11.27 e na Matriz de Fechamento):

| Subfase | Designação resumida |
|---------|----------------------|
| H-FI1 | Correção estrutural do núcleo e borda API |
| H-FI2 | Auditoria de fluxo + hardening canônico |
| H-FI3 | Auditoria hostil multi-tenant profunda |
| H-FI3-C | Corretiva cirúrgica (FORCE RLS + histórico sem overlap) |
| H-FI4 | Audit logs e rastreabilidade total |
| H-FI5 | Contratos, superfícies e respostas canônicas |
| H-FI6 / H-FI6-C | Readiness real + corretiva full-stack integral |
| H-FI7 | Demonstração controlada e operação assistida |
| H-FI8 | Auditoria hostil final de prontidão para apresentação real |

Prontidão declarada (no âmbito **controlado** e com limites institucionais explícitos, conforme protocolos e checkpoints da ETAPA H):

- **Demonstração controlada:** SIM (sujeita ao `PROTOCOLO-DEMONSTRACAO-CONTROLADA-ETAPA-H-FI7.md` e provas `proof:h-fi6` / `proof:h-fi7` quando aplicável).
- **Validação externa técnica:** SIM (em regime de consultoria ou revisão técnica, com comunicação de limites e dados de seed/dev).
- **Piloto controlado:** SIM (não equivalendo a produção nacional ou carga irrestrita).

Declaração explícita de limite:

- **NÃO** se declara **produção plena irrestrita** nem equivalência a go-live nacional sem governança operacional, infraestrutura e compliance adicionais fora do escopo desta etapa.

Revogação normativa pontual:

- Quanto ao **estado de encerramento global da ETAPA H**, prevalece a presente Secção **11.28** sobre qualquer menção anterior de “ETAPA H completa não encerrada” ou equivalente constante dos registos **11.18 a 11.27** (essas menções permanecem como **registo histórico** do momento da subfase; não impedem o fecho global ora declarado).

Veredito:

- **ETAPA H: ENCERRADA formalmente em 10/10** ao abrigo desta secção e do checkpoint global referenciado.

🔒 ENCERRAMENTO FORMAL — ONDA 1 (HARDENING INICIAL)

A ONDA 1 foi concluída, validada e auditada com base em código real, testes operacionais e evidência em banco de dados.

Status: ✅ ENCERRADA
Resultado:
Escopo implementado integralmente
Nenhum bloqueador crítico identificado
Validação operacional completa
Auditoria externa concluída
Commit formal realizado (2389739)
Escopo confirmado:
autenticação obrigatória em /api/process/run
processId gerado no servidor
refresh token rotation
detecção de reuse
hardening do loader
_NO_OVERLAP como bloqueio
Evidência:
login, refresh e logout validados
persistência em user_sessions confirmada
trilha em audit_logs confirmada
execução autenticada do motor validada
Referência de auditoria:

01-planejamento/governanca/REGISTRO-OFICIAL-AUDITORIA-EXTERNA-ONDA-1.md

⚠️ PENDÊNCIA ARQUITETURAL REGISTRADA
Rota /preflight
executa o motor sem autenticação
não exige tenant ou user
sem controle explícito de uso
Ação obrigatória:

Definir tratamento da rota antes do hardening final:

autenticar
OU
aplicar rate limiting e controle
OU
formalizar como endpoint público controlado
PRÓXIMO PASSO

Início da ONDA 2 — Inteligência jurídica e coerência estrutural ampliada
REGISTRO HISTÓRICO:

Este trecho refere-se ao momento original de transição após o encerramento da Onda 1.

Situação atual:
- Onda 2: ENCERRADA
- Onda 3: em definição arquitetural
---

11.29 REGISTRO NORMATIVO — CONSOLIDAÇÃO DAS ONDAS 1 E 2

Registrado em: 2026-03-30

Objetivo:
- formalizar o encerramento das Ondas 1 e 2 como marcos arquiteturais oficiais;
- alinhar o Plano Mestre ao estado real do sistema;
- eliminar lacunas entre execução prática e governança normativa.

### ONDA 1 — HARDENING INICIAL

Status: ENCERRADA (mantida como registro histórico válido)

Escopo consolidado:
- hardening inicial do backend e borda API
- autenticação, sessão e segurança base
- trilha de auditoria inicial
- validação operacional completa

Observação normativa:
- quaisquer trechos deste plano que indiquem “próximo passo = início da Onda 2” passam a ser considerados REGISTRO HISTÓRICO, não instrução vigente.

---

### ONDA 2 — CONSOLIDAÇÃO DO MOTOR NORMATIVO

Status: ENCERRADA — 10/10

Escopo implementado e validado:

- regime-behavior-engine como seletor-mestre
- diferenciação completa entre:
  - LICITAÇÃO
  - DISPENSA
  - INEXIGIBILIDADE
- bloqueio normativo por regime aplicado corretamente
- correção de bypass de fundamento mínimo
- integração correta com módulo de pricing
- sincronização de runtime e execução canônica
- preservação integral da arquitetura do núcleo
- validações estruturais, jurídicas e cruzadas funcionando em conjunto
- testes completos aprovados
- auditoria externa validada
- commit formal realizado

Resultado arquitetural:

O sistema passa a ser:

- determinístico
- auditável
- normativamente coerente
- preparado para operação real

---

### ESTADO PÓS-ONDA 2

O sistema encontra-se:

- com motor administrativo completo e estável
- com coerência normativa entre regimes
- com validações estruturais e jurídicas consolidadas
- com rastreabilidade completa
- pronto para receber camada de condução operacional

---
Regra de prevalência:

Esta secção substitui a interpretação normativa anterior da ONDA 1 e ONDA 2 no plano.

Registos anteriores permanecem válidos apenas como histórico técnico, não como diretriz vigente.

11.30 REGISTRO NORMATIVO — CAMADA DE ONDAS (INTERPRETAÇÃO EXECUTIVA)

Objetivo:
- formalizar o conceito de ONDAS como camada executiva de evolução arquitetural;
- complementar (sem substituir) as Fases 1–49 e as Etapas A–H.

Definição:

- Onda 1 — hardening inicial
- Onda 2 — consolidação normativa e comportamental do motor
- Onda 3 — condução operacional do processo administrativo

Regra:

As Ondas:
- NÃO substituem Fases nem Etapas;
- NÃO alteram a hierarquia normativa do Plano Mestre;
- funcionam como camada de organização estratégica da evolução real do sistema.

---

11.31 REGISTRO NORMATIVO — TRANSIÇÃO PARA ONDA 3

Objetivo:
- formalizar o próximo passo arquitetural do sistema.

Diagnóstico:

Após a Onda 2:
- o sistema sabe decidir
- o sistema ainda não conduz operacionalmente o usuário

Definição:

A Onda 3 é a camada de condução operacional do sistema.

---

### PRINCÍPIO CENTRAL

O FlowController é uma:

máquina de estados determinística do processo administrativo

---

### RESPONSABILIDADES DO FLOWCONTROLLER

- controlar etapa atual
- impedir saltos indevidos
- executar fluxo obrigatório
- acumular snapshot incremental
- registrar histórico de execução
- reagir aos resultados dos engines existentes

---

### PROIBIÇÕES ABSOLUTAS

O FlowController NÃO PODE:

- reimplementar regra jurídica
- duplicar validações existentes
- substituir o motor (`runAdministrativeProcess`)
- tomar decisão normativa

---

### FLUXO INICIAL OBRIGATÓRIO

INIT → CONTEXT → REGIME → DFD → ETP → TR → PRICING → REVIEW → OUTPUT

---

### REGRAS CRÍTICAS

- snapshot deve ser imutável por etapa
- `legalRegime` e `procurementStrategy` devem ser congelados após REGIME
- REVIEW deve executar validação total via motor existente
- OUTPUT não recalcula, apenas expõe resultado

---

### STATUS

ONDA 3: ENCERRADA FORMALMENTE (CONTINUACAO OPERACIONAL CONCLUIDA)

Status normativo vigente:
- Onda 3 inicialmente aberta para a camada de conducao operacional do usuario;
- base tecnica da Onda 3 (FlowController / state machine / conducao operacional v1) concluida e encerrada em 10/10;
- conducao operacional da continuacao da Onda 3 concluida e formalmente encerrada em 10/10;
- encerramento da Onda 3 limitado ao escopo de conducao operacional, sem declarar produto completo encerrado;
- proxima fase definida: persistencia real da conducao + integracao SaaS.

---

11.32 ATUALIZAÇÃO NORMATIVA — COMPONENTES OBRIGATÓRIOS (REVISÃO DE ESTADO)

Objetivo:
- alinhar o plano com o estado real de implementação.

### JÁ IMPLEMENTADOS / INICIADOS

- persistência estruturada de execuções
- multi-tenant com RLS
- autenticação e sessão
- RBAC básico
- audit_logs e rastreabilidade
- configuração institucional por tenant
- histórico de execuções
- frontend administrativo básico

---

### PENDENTES (EVOLUÇÃO CONTROLADA)

- painel de auditoria completo
- LGPD avançado
- perfis adicionais
- integrações externas (PNCP, IBGE)
- DevOps completo (staging, produção, CI/CD, backup)
- readiness institucional ampliado

---

11.33 CORREÇÃO NORMATIVA — SUPERFÍCIE /api/process/run

Objetivo:
- eliminar contradição histórica no plano.

Correção:

A rota `/api/process/run` permanece como superfície canônica do motor administrativo.

Regras:

- pode operar sem autenticação (modo público controlado)
- quando autenticada:
  - permite persistência
  - permite auditoria vinculada
- identidade nunca é aceita via body (apenas via contexto seguro)

---

Observação:

Qualquer menção anterior a "autenticação obrigatória" nesta rota deve ser interpretada como estado histórico anterior, não regra vigente.

---

11.34 REGISTRO NORMATIVO — ONDA 3 (FLOWCONTROLLER / BASE TECNICA DA CONDUCAO OPERACIONAL V1)

Registrado em: 2026-03-30  
Artefato de referencia:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ONDA-3-FLOWCONTROLLER-BASE-2026-03-30.md`

Objetivo do registro:
- formalizar o encerramento da base tecnica da Onda 3 com aprovacao 10/10;
- preservar a distincao entre a entrega estrutural aprovada e a Onda 3 completa como resultado operacional mais amplo.

Escopo consolidado da entrega aprovada:
1) implementacao do FlowController como maquina de estados deterministica;
2) fluxo obrigatorio v1 (`INIT -> CONTEXT -> REGIME -> DFD -> ETP -> TR -> PRICING -> REVIEW -> OUTPUT`);
3) integracao canonica com o nucleo sem duplicacao de motor/regra;
4) testes da entrega da Onda 3 em verde (15/15);
5) eliminacao do erro de registry (`Modulo nao registrado: DFD`);
6) evidencia de regressao zero no escopo da propria entrega.

Registro de limite de escopo:
- este registro encerra a base tecnica da Onda 3;
- este registro nao deve ser interpretado, por si so, como encerramento integral da Onda 3 (conducao operacional completa), salvo formalizacao posterior expressa.

Registro de item externo:
- a divergencia `S5_DISPENSA_SEM_BASE_LEGAL_WARNING` no runner canonico da Fase 35 foi classificada como externa ao escopo desta entrega e nao bloqueia este fechamento.

---

11.35 REGISTRO NORMATIVO — ONDA 3 (CONTINUACAO OPERACIONAL E ENCERRAMENTO FORMAL)

Registrado em: 2026-03-30  
Artefato de referencia:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ONDA-3-CONTINUACAO-ENCERRAMENTO-2026-03-30.md`

Objetivo do registro:
- formalizar o encerramento normativo da continuacao da Onda 3 com foco em conducao operacional completa do usuario;
- registrar limite de escopo e transicao para proxima fase sem extrapolacao de readiness final do sistema.

Consolidacao factual:
1) Onda 3 inicialmente aberta apos consolidacao das Ondas 1 e 2;
2) base tecnica FlowController concluida em 10/10;
3) conducao operacional (continuidade por incrementos) concluida em 10/10;
4) Onda 3 encerrada formalmente no escopo da Frente 6 / Etapa E.

Limite explicito:
- este encerramento nao declara sistema completo pronto;
- este encerramento nao declara produto SaaS final concluido;
- este encerramento nao declara persistencia real da conducao como concluida;
- este encerramento nao declara readiness institucional final.

Proxima fase:
- persistencia real da conducao operacional;
- integracao SaaS ampliada.

---

## ONDA 4 — CONCLUÍDA

Status: **100% concluída**

Resumo:
- Persistência operacional SaaS consolidada com estado oficial em PostgreSQL (`processes`, `flow_sessions`, `flow_session_revisions`), substituindo dependência de memória local.
- Pipeline oficial de mutação consolidado no backend com transação, concorrência atômica por `revision + render_token`, trilha de auditoria estruturada e histórico imutável por revisão.
- Superfícies legadas de mutação em memória removidas, incluindo eliminação do módulo legado `src/modules/flow-ui`, preservando regressão zero do fluxo persistido.

Decisões críticas:
- banco como única fonte de concorrência
- FlowController como motor único (sem duplicação)
- snapshot como estado canônico
- auditoria obrigatória por evento
- tenant enforcement no banco (RLS)

Garantias obtidas:
- retomada real de processos
- concorrência segura
- isolamento multi-tenant validado
- rastreabilidade completa
- ausência de bypass

---

## ONDA 5 — CONCLUÍDA

Status: **100% concluída**

Resumo:
- Contratos formais de evidência, relatório e dossiê institucional consolidados no backend.
- Agregação de evidências a partir de fontes canônicas (`processes`, `flow_sessions`, `flow_session_revisions`, `audit_logs`) com rastreabilidade explícita por `sourceRefs`.
- Composição prudente do `ComplianceReport` com `verdict`, `summary`, `validations`, `blockings`, `automaticReactions`, `timeline`, `score` explicável e `documents`.
- Materialização da Prova de Conformidade em UX institucional e criação do Dossiê Exportável derivado do relatório canônico.

Decisões críticas:
- prova de conformidade derivada apenas de fatos canônicos
- backend compõe; frontend apresenta
- score explicável sem mascarar impeditivos
- UX institucional e não cosmética
- dossiê exportável derivado do ComplianceReport

Garantias obtidas:
- cliente consegue visualizar o motor de conformidade
- relatório e score são explicáveis e rastreáveis
- dossiê institucional preserva vínculo com evidências
- frontend não possui lógica decisória de conformidade

---

11.36 REGISTRO NORMATIVO — ETAPA A (REVIEW REAL) — ENCERRAMENTO FORMAL

Registrado em: 2026-04-02  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-A-REVIEW-REAL.md`

Status normativo:
- **ETAPA A — CONCLUÍDA (10/10)**.

Resumo técnico consolidado:
1) integração real do motor administrativo na ação `TRIGGER_REVIEW` (remoção de retorno `SUCCESS` hardcoded);
2) implementação de adaptadores puros de entrada/saída para acoplamento controlado do snapshot com o motor;
3) contrato de erro de review consolidado com `FLOW_REVIEW_ERROR` restrito para falha técnica, sem confundir com bloqueio normativo;
4) política de hash corrigida: cálculo fora do adaptador, com separação de responsabilidade preservada;
5) testes completos de ETAPA A aprovados (unitário + integração), cobrindo sucesso, falha normativa, erro técnico e regressão sem fallback silencioso.

Regra de fechamento:
- este registro formaliza o encerramento integral da ETAPA A no escopo das Frentes 1 e 2 para o fluxo de review real;
- encerramento condicionado a evidência reexecutável e rastreabilidade Git no mesmo ciclo documental.

---

11.37 REGISTRO NORMATIVO — ETAPA B (FORCE RLS ESTRUTURAL EM TABELAS OPERACIONAIS CRITICAS)

Registrado em: 2026-04-02  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-B-FORCE-RLS-2026-04-02.md`

Objetivo do registro:
- eliminar risco crítico de isolamento multi-tenant incompleto por ausência de `FORCE ROW LEVEL SECURITY` nas tabelas operacionais da condução;
- elevar a blindagem estrutural para depender do banco (e não apenas da aplicação).

Consolidações estruturais:
1) migration `012_etapa_b_force_rls_process_flow_tables.sql` aplicada para:
   - `processes`
   - `flow_sessions`
   - `flow_session_revisions`
2) rollback formal obrigatório criado em:
   - `05-banco-de-dados/migrations/rollback/012_etapa_b_force_rls_process_flow_tables.down.sql`
3) prova executável real criada:
   - `03-backend-api/licitaia-v2-api/src/proof/etapa-b-force-rls-multitenant-validation.ts`
4) validação em banco real do catálogo (`relrowsecurity=true`, `relforcerowsecurity=true`) nas três tabelas alvo;
5) isolamento hostil comprovado com role não-superuser e sem `BYPASSRLS` (`licitaia_app`), incluindo:
   - leitura cross-tenant bloqueada;
   - update/delete cross-tenant bloqueados;
   - ausência de acesso amplo sem tenant context.

Regra de status:
- este registro declara o fechamento da ETAPA B no escopo de blindagem estrutural FORCE RLS das tabelas operacionais críticas;
- a conclusão depende de evidência reexecutável, rastreabilidade Git e checkpoint normativo no mesmo ciclo.

---

11.38 REGISTRO NORMATIVO — ETAPA C (FREEZE EFETIVO DE REGIME NO FLOWCONTROLLER)

Registrado em: 2026-04-02  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-C-FREEZE-REGIME-2026-04-02.md`

Objetivo do registro:
- eliminar a brecha de mutação tardia de regime após consolidação do passo `REGIME`;
- garantir bloqueio explícito de campos críticos de regime, sem fallback silencioso;
- assegurar invalidação downstream determinística com razão auditável quando houver reabertura de contexto/regime.

Consolidações estruturais:
1) endurecimento do freeze no `FlowController` para permanecer ativo após consolidação do regime, inclusive quando houver retorno de navegação ao passo `REGIME`;
2) bloqueio explícito de tentativa inválida com `FLOW_REGIME_FROZEN` e registro de evento imutável `REGIME_FREEZE_VIOLATION`;
3) classificação determinística de invalidação downstream:
   - `INVALIDATION_REGIME_OR_CONTEXT_REOPEN` para mutações em `CONTEXT`/`REGIME`;
   - `INVALIDATION_EXPLICIT_SEGMENT_RESET` para demais passos;
4) cobertura de prova executável adicionada para:
   - bloqueio de mutação crítica após consolidação;
   - auditoria de violação de freeze;
   - razão de invalidação por reabertura de contexto.
5) prova E2E real adicionada no backend (`proof:etapa-c`) usando `FlowController` do runtime canônico, com cenário hostil de violação após retorno para `REGIME`.

Regra de status:
- este registro declara o fechamento da ETAPA C no escopo de freeze efetivo de regime no fluxo de condução;
- a conclusão depende de evidência reexecutável, rastreabilidade Git e checkpoint normativo no mesmo ciclo.

---

11.39 REGISTRO NORMATIVO — ETAPA D (HARDENING HTTP: ANTI-SPOOF DE IP + RATE LIMIT EM /api/users)

Registrado em: 2026-04-02  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-D-HARDENING-2026-04-02.md`

Objetivo do registro:
- eliminar risco de spoof de IP por confiança indevida em `X-Forwarded-For`;
- endurecer controle de abuso de endpoint administrativo em `/api/users`;
- consolidar prova executável real e reexecutável do cenário hostil.

Consolidações estruturais:
1) resolução de IP centralizada em `src/lib/client-ip.ts` com política determinística:
   - base segura em `req.socket.remoteAddress`;
   - `X-Forwarded-For` só considerado com `trust proxy` explicitamente habilitado;
   - validação de IP antes de uso.
2) `trust proxy` explicitamente configurado em `server.ts` via `config.trustProxyHops`:
   - padrão fechado (`0`) para não confiar em proxy por omissão;
   - sem uso de configuração aberta `true`.
3) hardening do rate limit:
   - chave por IP resolvido de forma segura;
   - resposta explícita em falha de resolução de IP (`CLIENT_IP_RESOLUTION_FAILED`);
   - estrutura desacoplada por `RateLimitStore` (in-memory atual, pronta para troca por Redis sem refatoração estrutural).
4) ativação de rate limit efetivo em `/api/users` com bloqueio `HTTP 429`.
5) eliminação de captura de IP duplicada e insegura em controllers críticos (auth/users/institutional-settings), migrando para resolvedor central.
6) prova executável real criada em:
   - `03-backend-api/licitaia-v2-api/src/proof/etapa-d-http-hardening-validation.ts`
   - script oficial: `npm run proof:etapa-d`.

Critérios de evidência desta etapa:
- spoof de `X-Forwarded-For` bloqueado;
- abuso de `/api/users` bloqueado por rate limit com `429`;
- fluxo normal preservado sem regressão.

---

11.40 REGISTRO NORMATIVO — ETAPA E (VALIDADORES: BASE LEGAL ESTRUTURAL + COERÊNCIA CROSS-MODULE)

Registrado em: 2026-04-02  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-E-VALIDADORES-2026-04-02.md`

Objetivo do registro:
- exigir referência normativa **estruturalmente verificável** (artigo, lei, ato numerado), rejeitando termos genéricos isolados;
- unificar a verificação entre **motor de regime** e **validação jurídica** do pipeline (mesma função determinística);
- padronizar bloqueios **cross-module** com código canônico `CROSS_MODULE_INCONSISTENCY` e regra específica em `details`;
- manter prova executável no backend: `npm run proof:etapa-e`.

Consolidações estruturais:
1) utilitário central `legal-basis-structure.util.ts` com padrões normativos auditáveis;
2) `hasMinimumLegalBasisSupport` (regime) alinhado a `hasVerifiableNormativeStructure`;
3) `evaluateRegimeLegalBasisCompliance` passa a emitir `INVALID_LEGAL_BASIS_STRUCTURE` quando o agregado textual não contém citação verificável;
4) `validateLegalBasis` com códigos `MISSING_LEGAL_REFERENCE` / `INVALID_LEGAL_BASIS_STRUCTURE`;
5) validação cruzada DFD↔ETP↔TR↔PRICING: itens de bloqueio com `CROSS_MODULE_INCONSISTENCY`;
6) cenários canônicos Fase 35 ajustados (S2 coerente TR×PRICING; S5 com código de bloqueio `REGIME_FUNDAMENTO_MINIMO_AUSENTE`).

Critérios de evidência desta etapa:
- prova `proof:etapa-e` verde com tags `[ETAPA_E_VALIDATORS_OK]` e evidências declaradas;
- runner Fase 35 (7/7) sem regressão.

---

11.41 REGISTRO NORMATIVO — ETAPA F (CONSOLIDAÇÃO DE TESTES CRÍTICOS E PROVA TRANSVERSAL)

Registrado em: 2026-04-04  
Artefato de referência:
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-F-TESTES-2026-04-04.md`

Objetivo do registro:
- consolidar, num fluxo único reproduzível, a integridade transversal dos mecanismos homologados nas ETAPAS A a E (review real, FORCE RLS, freeze de regime, hardening HTTP, validadores e regressão canônica);
- evitar provas duplicadas ou cosméticas: reutiliza testes e scripts já auditados;
- exigir prova executável central no backend: `npm run proof:etapa-f` (`src/proof/etapa-f-system-integrity-validation.ts`).

Escopo técnico:
1) `test:etapa-a-review` — unitários dos adaptadores + integração `TRIGGER_REVIEW` (ETAPA A);
2) `proof:etapa-b` — catálogo PostgreSQL (`FORCE RLS`) + isolamento tenant + `withTenantContext` + negação sem contexto (ETAPA B; conexão com role não-superuser `licitaia_app` via `ETAPA_B_DATABASE_URL` ou padrão; tenants alinhados ao seed);
3) `proof:etapa-c` — freeze de regime no FlowController runtime (ETAPA C);
4) `proof:etapa-d` — anti-spoof, rate limit em `/api/users`, `Retry-After` em 429, `/health` íntegro (ETAPA D);
5) `proof:etapa-e` — base legal estrutural, cross-module, regressão S1 (ETAPA E).

Saída obrigatória da prova consolidada (sucesso):
- `[ETAPA_F_TESTS_OK]` e linhas `[ETAPA_F_EVIDENCE]` para cada bloco crítico (`review_real`, `force_rls`, `regime_freeze`, `http_hardening`, `validators`, `regression`).

Nota de convivência com a Secção 11.17:
- a reconciliação histórica de nomenclatura (Frente 7 / produto real absorvido na ETAPA G) permanece válida;
- o presente registro **11.41** formaliza uma **ETAPA F de robustez e testes transversais**, ortogonal àquela ambiguidade, com foco em consolidação de provas A–E.
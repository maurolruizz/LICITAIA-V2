# MATRIZ DE FECHAMENTO — DECYON V2

## 1. Função normativa

Matriz **mínima executável** do fechamento final (Frentes 1–7 e Etapas A–H). Complementa o **PLANO MESTRE — DECYON V2**, Secção 11. **Não cria novas frentes** nem altera a ordem aprovada no Plano Mestre.

**Vocabulário:** Fase (1–49) ≠ Frente (1–7) ≠ Etapa (A–H) — definições no Plano Mestre, Secção 11.2.

---

## 2. Mapa Etapa → Frente (execução principal)

| Etapa | Frente(s) material(is) | Natureza |
|-------|-------------------------|----------|
| A | 1 e 2 | Sequencial obrigatória |
| B | 3 | Sequencial obrigatória |
| C | 4 | Sequencial obrigatória |
| D | 5 | Sequencial obrigatória |
| E | 6 | Sequencial obrigatória |
| F | 7 | Sequencial obrigatória |
| G | — | **Transversal:** audita o conjunto das Frentes 1–7 já executadas em A–F |
| H | — | **Transversal:** deploy, apresentação institucional e readiness final **após** G |

As Etapas **G** e **H** **não** são Frentes adicionais: incidem sobre o trabalho já consolidado nas sete frentes.

---

## 3. Frentes — executabilidade mínima

### FRENTE 1 — Core de compliance

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | Cobertura de compliance do núcleo: travas, halts e validações estruturais aplicam-se a **todos** os cenários relevantes declarados; nenhuma inconsistência silenciosa. |
| **Escopo do fechamento** | Orchestrator, encadeamento de módulos, validadores, halt, códigos de validação, coerência com decision trace e explicabilidade. |
| **Travas obrigatórias** | Inconsistência bloqueia avanço; motivo do bloqueio registrado e auditável; sem atalho que contorne o núcleo. |
| **Prova de aceite 10/10** | Matriz de cenários / regressão oficial do núcleo em verde; evidências de halt e códigos para casos negativos; revisão cruzada com pilares do Plano Mestre (Secção 3). |
| **Dependências principais** | Estado consolidado até Fase 49; contratos de API e motor estáveis. |
| **Etapa** | **A** (com Frente 2) |

---

### FRENTE 2 — Jurídico e matemático

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | Regras jurídicas e cálculos administrativos **centralizados** no núcleo; respostas determinísticas para o mesmo input; memória de cálculo e pricing coerentes com travas. |
| **Escopo do fechamento** | Validação jurídica, validação cruzada, memória de cálculo, PRICING, score explicável, diferenciação real regime/objeto/estrutura. |
| **Travas obrigatórias** | Violação normativa ou inconsistência matemática → bloqueio; explicação estruturada do motivo. |
| **Prova de aceite 10/10** | Conjunto de casos canônicos positivos/negativos cobrindo regimes e objetos relevantes; ausência de divergência entre documentos (DFD, ETP, TR) quando o núcleo exige coerência. |
| **Dependências principais** | Frente 1 estável; especificações normativas usadas pelo motor versionadas ou referenciadas. |
| **Etapa** | **A** (com Frente 1) |

---

### FRENTE 3 — Estrutura documental

| **Objetivo verificável** | Documentos e artefatos **estruturados e determinísticos** derivados do motor; rastreabilidade ponta a ponta do que foi gerado ou validado. |
| **Escopo do fechamento** | Modelo documental alinhado ao pipeline; geração compatível com auditabilidade (sem texto livre indevido em campos críticos). |
| **Travas obrigatórias** | Não gerar documento final se pré-condições de compliance não satisfeitas; campos críticos estruturados. |
| **Prova de aceite 10/10** | Amostras de execução reproduzíveis; verificação de consistência entre payload, decisão e documento. |
| **Dependências principais** | Etapa **A** concluída em 10/10. |
| **Etapa** | **B** |

---

### FRENTE 4 — Camada documental premium

| **Objetivo verificável** | Camada **premium** (layout institucional, padrões externos exigidos) **sem** comprometer determinismo nem auditabilidade; zero fingerprint de IA indevido (Plano Mestre, Secção 5.8). |
| **Escopo do fechamento** | Templates, renderização, padrão compatível com exigências institucionais (ex.: TCU onde aplicável). |
| **Travas obrigatórias** | Premium não pode mascarar inconsistência nem omitir travas do núcleo; não antecipar esta frente antes da **C**. |
| **Prova de aceite 10/10** | Documentos de referência aprovados institucionalmente; revisão de rastreabilidade e de ausência de vazamento de lógica para camada errada. |
| **Dependências principais** | Etapa **B** em 10/10. |
| **Etapa** | **C** |

---

### FRENTE 5 — IA assistiva de precisão

| **Objetivo verificável** | IA **apenas assistiva**: sugere, estrutura ou refina texto **sem** decidir; saídas encapsuladas e revisáveis; fluxo e travas permanecem no núcleo. |
| **Escopo do fechamento** | Serviços de IA, adaptadores de saída, limites de escopo; alinhamento a ARQUITETURA — CAMADAS (Backend AI). |
| **Travas obrigatórias** | IA não governa fluxo; não define enquadramento jurídico; não remove bloqueios do motor; não altera decisão estrutural ou matemática; em conflito, prevalece o motor; em falha de IA, mantém-se conteúdo original válido. |
| **Prova de aceite 10/10** | Testes de que decisões e halts permanecem inalterados com IA ligada ou desligada para o mesmo caso de validação estrutural; prova de fallback obrigatório para conteúdo original válido. |
| **Dependências principais** | Etapas **A–C** em 10/10. |
| **Etapa** | **D** |

---

### FRENTE 6 — Condução total do usuário

| **Objetivo verificável** | Usuário conduzido **sem página em branco** nem ambiguidade operacional crítica; estados e próximos passos claros; alinhamento a travas do núcleo. |
| **Escopo do fechamento** | UX de fluxo, orientação de etapas, mensagens de erro e halt compreensíveis institucionalmente. |
| **Travas obrigatórias** | UI não pode burlar validações; bloqueios do servidor prevalecem. |
| **Prova de aceite 10/10** | Percurso completo demonstrável por persona alvo; ausência de atalhos que gerem decisão inválida. |
| **Dependências principais** | Etapas **A–D** em 10/10. |
| **Etapa** | **E** |
| **Status operacional vigente** | **CONCLUIDA (10/10)** — condução total do usuário comprovada no escopo da Onda 3. |
| **Vinculo normativo** | Encerramento formal da Onda 3 no escopo de condução operacional (`CHECKPOINT-NORMATIVO-ONDA-3-CONTINUACAO-ENCERRAMENTO-2026-03-30.md`). |

Diretriz operacional vinculante da Frente 6:

- frontend oficial da ETAPA E: `02-frontend/licitaia-v2-demo`;
- núcleo modular de referência: `02-frontend/licitaia-v2-web`;
- a condução em UI deve ser subordinada ao núcleo, sem duplicar regra central.

Critérios adicionais de conformidade para a ETAPA E:

- não iniciar decisão crítica em campo livre;
- bloquear avanço de microetapa sem pré-condição mínima;
- invalidar downstream impactado quando decisão estrutural upstream for alterada;
- preservar rastreabilidade e leitura de códigos/eventos oficiais do motor.

---

### FRENTE 7 — Produto real (SaaS)

| **Objetivo verificável** | Produto **operável** em ambiente real: multi-tenant, segurança, observabilidade, deploy, continuidade — conforme Secções 5 e 6 do Plano Mestre. |
| **Escopo do fechamento** | Auth, RBAC, ambientes, CI/CD, backup, integrações oficiais previstas, governança de dados. |
| **Travas obrigatórias** | Isolamento por tenant; auditoria de ações; dados sensíveis protegidos. |
| **Prova de aceite 10/10** | Checklist de segurança e operações mínimas cumprido; evidências de segregação e de auditoria. |
| **Dependências principais** | Etapas **A–E** em 10/10. |
| **Etapa** | **F** |

---

## 4. ETAPA G — Produto real (SaaS) — RECONCILIAÇÃO APLICADA

> **Nota de reconciliação (2026-03-24):** Por evolução formal de nomenclatura registrada no Plano Mestre Sec. 11.17, a ETAPA G absorve o escopo da Frente 7 (Produto real). A auditoria transversal, originalmente designada ETAPA G, está incorporada na Fase Interna 8 da ETAPA G e na ETAPA H.

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | Produto **operável** em ambiente real: multi-tenant, segurança, observabilidade, deploy, continuidade — conforme Secções 5 e 6 do Plano Mestre e arquitetura formal aprovada em `ARQUITETURA-SAAS-ETAPA-G-FASE-INTERNA-1.md`. |
| **Escopo** | Auth, RBAC, banco PostgreSQL, isolamento por tenant (RLS), auditoria de usuário, configuração institucional por órgão, migração de persistência JSON → banco. |
| **Travas obrigatórias** | Isolamento por tenant; auditoria de ações; dados sensíveis protegidos; motor intocável; regressão zero em DEMO-D1 a D4. |
| **Prova de aceite 10/10** | Checklist de segurança e operações mínimas cumprido; evidências de segregação e de auditoria; percurso completo login → execução → histórico com autoria demonstrável. |
| **Dependências** | Etapas A–E em 10/10. |

### Fases internas da ETAPA G

| Fase | Descrição | Status |
|---|---|---|
| 1 | Arquitetura formal (sem código) | **ENCERRADA — 2026-03-24** |
| 2 | Banco de dados: schema base + migrations | **ENCERRADA — 2026-03-24** |
| 3 | Backend: autenticação e tenant resolution | **ENCERRADA — 2026-03-25** |
| 4 | Backend: RBAC e módulo de usuários | **ENCERRADA — 2026-03-25** |
| 5 | Backend: ProcessExecution + AuditLog SaaS | **ENCERRADA — 2026-03-26 (10/10, prova real: persistência + audit_logs + histórico por tenant + isolamento RLS com role não-superuser/sem BYPASSRLS)** |
| 6 | Backend: configuração institucional | **ENCERRADA — 2026-03-26 (10/10, prova real: migration 008 aplicada + leitura por tenant + update admin-only + 403 para TENANT_USER + audit log INSTITUTIONAL_SETTINGS_UPDATED + isolamento RLS)** |
| 7 | Frontend: login, tenant, admin básico | **ENCERRADA — 2026-03-26 (10/10, prova real: frontend oficial em 02-frontend/licitaia-v2-demo + login real + /api/users/me + /api/institutional-settings + edição TENANT_ADMIN + bloqueio TENANT_USER(403) + logout + ambiente saneado 3000/3001 + regressão zero FI3/FI4/FI5/FI6//api/process/run)** |
| 8 | Validação integrada + encerramento + auditoria transversal | **ENCERRADA — 2026-03-26 (10/10, prova real integrada: ambiente oficial 3000/3001 + cenários A–E + evidência em organ_configs/process_executions/audit_logs + RLS com licitaia_app + regressão global FI3/FI4/FI5/FI6/FI7//api/process/run + encerramento técnico da ETAPA G)** |

Artefato arquitetural de referência: `01-planejamento/governanca/ARQUITETURA-SAAS-ETAPA-G-FASE-INTERNA-1.md`

**Nota de auditoria — FI4 (2026-03-25):** A matriz chegou a registrar a Fase Interna 4 como **ENCERRADA** antes da existência de **prova operacional real 9/9**. Na auditoria, esse encerramento foi **revertido** (sem apagar o registo histórico: ver checkpoint) e a prova completa foi executada (PostgreSQL, migrations incl. 007, seed, API, script oficial), com resultado **9/9**. O encerramento formal foi então restabelecido em 10/10. Regra operacional de evidência RLS: validar com utilizador PostgreSQL **não-superuser** e **sem BYPASSRLS** (ex.: `licitaia_app`), pois com `postgres` o PostgreSQL ignora RLS e invalida a prova de isolamento multi-tenant.

---

## 5. ETAPA H — Transversal (deploy e institucional)

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo verificável** | **Readiness** para uso institucional: deploy aprovado, apresentação e pacote de evidências alinhados ao Plano Mestre (Secção 11.9). |
| **Escopo** | Go-live controlado, comunicação institucional, handover operacional mínimo. |
| **Travas** | **H** só inicia com **G** em 10/10. |
| **Prova 10/10** | Critérios de prontidão verificados e documentados; nenhuma etapa anterior pulada. |
| **Status** | **ENCERRADA — 2026-03-27 (10/10).** Subfases H-FI1 a H-FI8 concluídas. Encerramento global: `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ENCERRAMENTO-ETAPA-H.md`; Plano Mestre Secção 11.28. |

---

## 6. Encerramento

Esta matriz é **enxuta por desenho**. Detalhamento técnico adicional deve constar de relatórios de fase ou de anexos **sem** contradizer o Plano Mestre.

---

## 7. Checkpoint de atualização normativa (obrigatório)

Antes de declarar qualquer etapa/fase interna como 10/10, deve haver checkpoint formal respondendo:

1. se houve criação/alteração/consolidação de regra normativa;
2. se houve necessidade de atualizar o Plano Mestre;
3. se houve necessidade de atualizar esta Matriz de Fechamento;
4. se houve necessidade de criar/atualizar artefatos em `01-planejamento/governanca/`.

Se a resposta for positiva em qualquer item, a atualização normativa deve ser executada na mesma etapa.

Sem checkpoint aplicado e executado, o encerramento não é válido.

## 8. Checkpoint Git obrigatório (rastreabilidade de encerramento)

Antes de declarar qualquer etapa/fase em 10/10, registrar formalmente:

1. hash do commit de encerramento;
2. tag de marco aprovado (quando aplicável);
3. confirmação de `git status` limpo para o escopo de encerramento;
4. evidência de que o padrão oficial de versionamento foi seguido.

Sem checkpoint Git aplicado, o encerramento não é válido.

## 9. Continuidade histórica obrigatória

Toda execução de Etapas A–H deve preservar vínculo explícito com o histórico das Fases 1–49 por meio de:

1. consulta obrigatória ao catálogo mestre de fases;
2. consulta obrigatória à matriz de continuidade passado -> plano atual;
3. registro explícito de lacuna histórica quando não houver prova suficiente.

Artefatos de referência:

- `01-planejamento/governanca/CATALOGO-MESTRE-FASES-1-A-49.md`
- `01-planejamento/governanca/MATRIZ-DE-CONTINUIDADE-FASES-1-49-PARA-ETAPAS-A-H.md`

## 10. Protocolo operacional obrigatório (validade de fase/etapa)

Toda execução de fase, etapa, frente ou fase interna depende de aplicação integral do:

- `01-planejamento/governanca/PROTOCOLO-OPERACIONAL-OBRIGATORIO.md`

Regra de validade:

1. sem protocolo aplicado, não há 10/10 válido;
2. sem protocolo aplicado, o avanço deve ser bloqueado;
3. sem protocolo aplicado, o encerramento é inválido para governança.

## 11. Regra de execução controlada do Cursor

Para qualquer execução operacional com Cursor, é obrigatório:

1. declarar leitura obrigatória dos artefatos normativos centrais;
2. declarar aderência ao protocolo operacional obrigatório;
3. aplicar checkpoint normativo na mesma etapa da alteração;
4. preservar coerência integral entre implementação, arquitetura e governança.

Sem cumprimento cumulativo destes itens, a execução não pode ser classificada como concluída.

## 12. Registro operacional — ETAPA H / H-FI1 (corretiva estrutural)

Registro factual em 2026-03-26:

- natureza: correção estrutural cirúrgica (sem expansão funcional);
- foco: alinhamento da rota crítica ao `src`, rastreabilidade de persistência e blindagem semântica de identidade;
- artefato normativo de evidência:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI1-CORRECAO-ESTRUTURAL-2026-03-26.md`.

Critérios estruturais aplicados nesta corretiva:

1. sem dependência ambígua entre `src` e artefato derivado na execução crítica;
2. persistência crítica aguardada na borda da API com erro explícito de trilha quando necessário;
3. identidade/autoria de tenant e usuário não derivada de body público;
4. redução de duplicação estrutural de contratos e da espinha comum dos módulos;
5. superfície canônica de orquestração reforçada para evitar dupla porta conceitual.

## 13. Registro operacional — ETAPA H / H-FI2 (fluxo administrativo + hardening canônico)

Registro factual em 2026-03-27:

- natureza: auditoria técnica de fluxo + hardening de execução canônica (sem expansão de feature);
- foco: ordem determinística do pipeline, sem bypass de dependência e com semântica de halt auditável;
- artefato normativo:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI2-FLUXO-E-HARDENING-2026-03-27.md`.

Critérios estruturais aplicados:

1. superfície canônica única de execução para API e runners internos;
2. hardening de runtime canônico com modo compilado explícito para produção;
3. prova reexecutável de dependência, validação e coerência de `finalStatus`;
4. preservação de regressão dos cenários canônicos já homologados (Fase 35 e Fase 37).

## 14. Registro operacional — ETAPA H / H-FI3 (auditoria hostil multi-tenant profunda)

Registro factual em 2026-03-27:

- natureza: auditoria hostil de isolamento multi-tenant (sem expansão de feature);
- foco: provar ausência de leitura, escrita, trilha e configuração cruzadas entre tenants;
- artefato normativo:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI3-AUDITORIA-MULTI-TENANT-PROFUNDA-2026-03-27.md`.

Critérios estruturais aplicados:

1. blindagem de RLS em modo obrigatório com `FORCE ROW LEVEL SECURITY` nas tabelas multi-tenant críticas;
2. validação hostil reexecutável cobrindo leitura cruzada, escrita cruzada, overlap de histórico e segregação de trilha;
3. validação explícita da postura de role de prova (`licitaia_app` não-superuser e sem `BYPASSRLS`);
4. preservação de regressão dos fluxos válidos já consolidados por tenant.

## 15. Registro operacional — ETAPA H / H-FI3-C (corretiva cirúrgica)

Registro factual em 2026-03-27:

- natureza: corretiva cirúrgica focada em blindagem efetiva de RLS e segregação inequívoca da superfície de histórico;
- foco: eliminar `c10=false` (force RLS não aplicado no banco alvo) e `c7=false` (overlap real de histórico entre tenants);
- artefato normativo:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI3-CORRETIVA-FORCE-RLS-E-HISTORICO-SEM-OVERLAP-2026-03-27.md`.

Critérios estruturais aplicados:

1. migration de force RLS aplicada efetivamente no banco operacional de prova;
2. endpoint de histórico endurecido com filtro explícito por `tenant_id` em listagem e busca por id;
3. prova H-FI3 reexecutada com evidência completa de:
   - force RLS ativo nas tabelas críticas;
   - ausência de overlap entre tenants;
   - isolamento hostil de leitura e escrita mantido.

## 16. Registro operacional — ETAPA H / H-FI4 (audit logs e rastreabilidade total)

Registro factual em 2026-03-27:

- natureza: auditoria estrutural de trilha de auditoria e nexo causal ponta a ponta (sem expansão funcional de produto);
- foco: garantir reconstrução forense entre request/contexto, execução do motor, validações, eventos, decisão e persistência;
- artefato normativo:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI4-AUDIT-LOGS-E-RASTREABILIDADE-2026-03-27.md`.

Critérios estruturais aplicados:

1. `correlationId` do fluxo `/api/process/run` passa a ser derivado do `requestId` de borda (fonte confiável), removendo dependência de dado enviado pelo cliente;
2. `audit_logs` de `PROCESS_EXECUTION` enriquecido com metadados de rastreabilidade completa (`requestId`, `correlationId`, `processId`, resultado e contadores de validação/eventos/metadados);
3. prova reexecutável específica da H-FI4 adicionada em `src/proof/etapa-h-fi4-audit-traceability-validation.ts`;
4. prova real no PostgreSQL executada com cenários `success`, `validation halt` e `dependency halt` em verde;
5. evidência SQL direta validou persistência, correlação completa e reconstrução integral da execução.

Status de fechamento:

- H-FI4: **CONCLUÍDA (10/10, regressão zero)**.
- Referência de fechamento:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI4.md`
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-H-FI4-AUDIT-LOGS-E-RASTREABILIDADE-2026-03-27.md`

## 17. Registro operacional — ETAPA H / H-FI5 (contratos, superfícies e respostas canônicas)

Registro factual em 2026-03-27:

- natureza: auditoria hostil de contratos de entrada/saída, superfícies públicas e semântica de respostas (sem expansão funcional);
- foco: garantir previsibilidade externa e eliminação de ambiguidades de integração na API canônica;
- artefato normativo:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI5.md`.

Critérios estruturais aplicados:

1. bloqueio explícito de campos de identidade/correlação na borda pública (`tenantId`, `userId`, `correlationId` no body);
2. manutenção de identidade/correlação canônicas derivadas de autenticação e `x-request-id`;
3. alinhamento semântico da resposta 500 para `process.status='failure'`;
4. prova reexecutável dedicada H-FI5 cobrindo:
   - `success`,
   - `validation halt`,
   - `dependency halt`,
   - coerência entre HTTP status e body,
   - bloqueio de superfícies públicas perigosas;
5. regressão zero revalidada com provas H-FI2 e H-FI4.

Status de fechamento:

- H-FI5: **CONCLUÍDA (10/10, regressão zero)**.

## 18. Registro operacional — ETAPA H / H-FI6 (readiness real controlado)

Registro factual em 2026-03-27:

- natureza: auditoria hostil de build, runtime, configuração, borda HTTP e exposição controlada (sem feature nova);
- foco: caminho canônico reproduzível, CORS alinhado a `x-request-id`, prova única `npm run proof:h-fi6`, coerência `src` → `dist` → execução;
- artefato normativo:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI6.md`.

Critérios estruturais aplicados:

1. build oficial: `npm run build` (inclui `build:frontend-core-runtime` + `tsc`);
2. runtime oficial: `npm run dev` ou `npm start` → `dist/server.js`;
3. frontend oficial ETAPA E: `02-frontend/licitaia-v2-demo` — `node server.js` (sem pipeline de build separado; estático servido na porta 3000);
4. variáveis obrigatórias em não-development: `CORS_ORIGIN`, `DATABASE_URL`, `JWT_SECRET` (≥32) — fail-fast em `config/env.ts`;
5. prova H-FI6 integra regressão FI2 + HTTP; FI4/FI5 quando `DATABASE_URL` aponta para PostgreSQL acessível;
6. prova parcial apenas com `H_FI6_SKIP_DB_REGRESSION=1` explícito, documentada como não substituto de piloto full-stack.

Status de fechamento:

- H-FI6: **CONCLUÍDA (10/10 no escopo declarado: auditoria + correção CORS + prova reexecutável + documentação canônica)**.

## 19. Registro operacional — ETAPA H / H-FI6-C (readiness full-stack integral)

Registro factual em 2026-03-27:

- natureza: corretiva final ambiental — sem feature nova; seed ajustado para compatibilidade com imutabilidade de `audit_logs`;
- foco: PostgreSQL real, migrations, seed, prova `npm run proof:h-fi6` sem skip (FI4/FI5 embutidas);
- artefato normativo:
  - `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ETAPA-H-FI6-C.md`.

Critérios:

1. `TRUNCATE audit_logs` antes de limpeza idempotente no seed de desenvolvimento;
2. prova integral reexecutável documentada no checkpoint H-FI6-C;
3. encerramento formal da subfase **H-FI6** após H-FI6-C.

Status de fechamento:

- H-FI6-C: **CONCLUÍDA (10/10)**;
- H-FI6 (readiness integral com prova full-stack): **FORMALMENTE ENCERRADA**.

## 20. Registro operacional — ETAPA H / H-FI7 (demonstração controlada)

Registro factual em 2026-03-27:

- artefato operacional: `PROTOCOLO-DEMONSTRACAO-CONTROLADA-ETAPA-H-FI7.md`;
- prova: `npm run proof:h-fi7` (backend);
- encadeamento regressivo: H-FI6 no mesmo fluxo.

Status: **H-FI7 concluída** no escopo institucional e operacional assistido.

## 21. Registro operacional — ETAPA H / H-FI8 (prontidão para apresentação real)

Registro factual em 2026-03-27:

- natureza: auditoria hostil final — sem feature; simulação de apresentação e classificação de riscos;
- artefato: `CHECKPOINT-NORMATIVO-ETAPA-H-FI8.md`;
- correção mínima: inclusão de `proof:h-fi7` em `package.json` (coerência com protocolo).

Status: **H-FI8 concluída** — apresentação externa em regime controlado sustentada por protocolo e provas, com riscos importantes residuais documentados (não críticos após mitigação).

## 22. Encerramento global da ETAPA H

Registro normativo em **2026-03-27**:

- **ETAPA H** encontra-se **ENCERRADA em 10/10** ao nível de governança, com subfases H-FI1 a H-FI8 concluídas e alinhamento ao Plano Mestre (Secção 11.28).
- Artefato único de fecho: `CHECKPOINT-NORMATIVO-ENCERRAMENTO-ETAPA-H.md`.

## 23. Registro operacional — ONDA 3 / FlowController (base da conducao operacional v1)

Registro factual em 2026-03-30:

| Campo | Conteúdo |
|---|---|
| **Nome da entrega** | Onda 3 — FlowController / base tecnica da conducao operacional v1 |
| **Status** | **ENCERRADA (entrega da base tecnica) — 10/10** |
| **Escopo consolidado** | FlowController como maquina de estados deterministica; fluxo obrigatorio v1; integracao canonica com nucleo; sem duplicacao de motor/regra |
| **Evidencias principais** | testes 15/15 em verde; eliminacao do erro `Modulo nao registrado: DFD`; validacao de comportamento; snapshot imutavel; prova de nao duplicacao do motor; regressao zero da entrega |
| **Checkpoint correspondente** | `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ONDA-3-FLOWCONTROLLER-BASE-2026-03-30.md` |
| **Limite explicito de escopo** | Este encerramento formaliza a base tecnica da Onda 3 e **nao** declara encerramento integral da Onda 3 como objetivo final de produto |
| **Registro de item externo** | Divergencia `S5_DISPENSA_SEM_BASE_LEGAL_WARNING` (runner canonico Fase 35) classificada como externa ao escopo desta entrega |

Observacao normativa de validade:

- este registro de matriz trabalha em nivel de entrega estrutural aprovada da Onda 3 (base tecnica);
- qualquer fechamento de Onda 3 completa exige formalizacao posterior especifica.

## 24. Registro operacional — ONDA 3 / Encerramento da continuacao operacional (Frente 6 / Etapa E)

Registro factual em 2026-03-30:

| Campo | Conteúdo |
|---|---|
| **Nome da entrega** | Onda 3 — continuacao operacional da conducao total do usuario |
| **Status** | **ENCERRADA — 10/10** |
| **Vinculo etapa/frente** | Etapa E / Frente 6 concluida operacionalmente |
| **Consolidacao material** | contrato operacional aplicado; nucleo de conducao ativo; invalidacao downstream; stale protection; UI subordinada; anti-bypass; eliminacao da pagina em branco |
| **Checkpoint correspondente** | `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ONDA-3-CONTINUACAO-ENCERRAMENTO-2026-03-30.md` |
| **Limite de escopo** | encerramento da Onda 3 no recorte de conducao operacional; sem declarar produto completo encerrado |
| **Proxima fase** | persistencia real da conducao + integracao SaaS |

---

## 25. Registro de fechamento por ondas (executivo)

| Onda | Escopo | Status | Nota | Evidência |
|---|---|---|---|---|
| ONDA 4 | Persistência operacional | CONCLUÍDA | 10/10 | Evidências registradas |

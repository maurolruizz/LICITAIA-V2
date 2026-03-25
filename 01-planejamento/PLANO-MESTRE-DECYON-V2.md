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

### 4.3. SITUAÇÃO ATUAL DA ETAPA G

| Fase | Status |
|------|--------|
| Fase 1 — Arquitetura | ENCERRADA |
| Fase 2 — Banco de Dados | ENCERRADA |
| Fase 3 — Autenticação | ENCERRADA |
| Fase 4 — RBAC | Pendente |
| Fase 5 — AuditLog / ProcessExecution | Pendente |
| Fase 6 — Configuração institucional | Pendente |
| Fase 7 — Frontend SaaS | Pendente |
| Fase 8 — Validação integrada + auditoria transversal | Pendente |

### 4.4. POSIÇÃO REAL DO PROJETO

O sistema encontra-se:

- com o **motor administrativo completo e validado**
- com a **base SaaS iniciada e operacional**
- com autenticação e isolamento multi-tenant funcionando
- com persistência estruturada ativa
- com rastreabilidade preservada

Ainda pendente:

- RBAC completo
- auditoria de usuário
- interface SaaS
- consolidação final e auditoria transversal

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

5. COMPONENTES OBRIGATÓRIOS (A IMPLEMENTAR)
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
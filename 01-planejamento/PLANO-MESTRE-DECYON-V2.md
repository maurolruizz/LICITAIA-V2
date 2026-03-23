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

4. ESTADO ATUAL DO PROJETO
Já implementado (até Fase 36)

núcleo administrativo completo

módulos DFD, ETP, TR, PRICING

validadores estruturais

orchestrator

backend API funcional

contratos de entrada e saída

blindagem de request (Fase 33)

padronização de response (Fase 34)

matriz de cobertura do motor (Fase 35)

correção de lacunas estruturais (Fase 36)

multi-itens

lote

fallback auditável de NEED

caso misto validado

cenários canônicos de demonstração institucional (Fase 37)

4 cenários oficiais selecionados (DEMO-D1 a DEMO-D4)

runner de demonstração auditável e repetível

catálogo com classificação demonstrativa

regressão zero preservada (Fase 35: 7/7, Fase 37: 4/4)

backend operacional mínimo para uso externo controlado (Fase 38)

healthcheck oficial (GET /health)

configuração centralizada por ambiente (config/env.ts)

CORS mínimo controlado configurável

logging operacional estruturado

404 e error handler global

regressão zero preservada (Fase 35: 7/7)

frontend mínimo de demonstração funcional ponta a ponta (Fase 39)

interface de demonstração institucional (02-frontend/licitaia-v2-demo)

servidor estático mínimo (Node.js built-in, porta 3000, zero dependências externas)

4 cenários oficiais selecionáveis (DEMO-D1 a DEMO-D4)

integração real com POST /api/process/run e GET /health

exibição de finalStatus, halt, módulos executados e códigos de validação

tratamento de loading, erro de conexão e backend indisponível

regressão zero preservada (Fase 37: 4/4)

base operacional com persistência, histórico e formulário controlado (Fase 40)

persistência de execuções em arquivo JSON auditável (zero dependências externas)

módulo process-execution no backend (entity, repository, service, controller, routes)

POST /api/process/run agora persiste cada execução automaticamente

GET /api/process-executions → lista de execuções com metadados essenciais

GET /api/process-executions/:id → execução completa com payload, resposta e rastreabilidade total

formulário controlado no frontend: seleções estruturadas, zero texto livre em campos críticos

tab de histórico na UI: lista ordenada por data, clique abre detalhe completo

regressão zero preservada (Fase 37: 4/4)

consolidação operacional: histórico utilizável, detalhe auditável e fechamento do ciclo de demonstração (Fase 41)

ProcessExecutionSummary enriquecido com haltedBy, validationCodesCount e modulesExecuted

histórico com 7 colunas: halt, processo/finalStatus, data, HTTP, validações, módulos, seta

filtros mínimos no histórico: busca por processId, filtro por halt, filtro por finalStatus

execution-summary.js: helper explícito de resumo operacional (baseado em finalStatus, halted, haltedBy, validationCodes)

detalhe auditável com duas leituras: executiva (métricas) + técnica (payload + JSON bruto)

resumo operacional no topo do detalhe: leitura institucional sem inventar lógica

botão de gerar novo ID no formulário controlado

ciclo ponta a ponta fechado e demonstrável

regressão zero preservada (Fase 37: 4/4)

👉 O núcleo está consolidado e protegido.

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
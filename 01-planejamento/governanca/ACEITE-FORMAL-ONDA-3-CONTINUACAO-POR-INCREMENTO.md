# ACEITE FORMAL — ONDA 3 — CONTINUAÇÃO POR INCREMENTO

## 1. Identificação

| Campo | Conteúdo |
|--------|-----------|
| **Nome do artefato** | Aceite formal da continuação da Onda 3 por incremento |
| **Data de emissão** | 2026-03-30 |
| **Sistema** | DECYON V2 / LICITAIA V2 |
| **Objetivo do documento** | Definir critérios de aceite 10/10 **verificáveis e cumulativos** para a continuação da Onda 3 após o encerramento da base técnica, **sem** antecipar implementação nem misturar incrementos. |
| **Vínculo com Onda 3** | A Onda 3 é a camada de condução operacional (Plano Mestre, Sec. 11.30–11.31). A **base técnica** (FlowController / state machine v1) está encerrada em 10/10. A **Onda 3 integral** permanece em continuação até condução operacional materializada e provada. |
| **Relação com Plano Mestre** | Complementa Sec. 11.31–11.34 e Sec. 11.16 (ETAPA E / Frente 6: UI conduz, não decide). Em divergência material, prevalece o Plano Mestre. |
| **Relação com Matriz de Fechamento** | Alinha-se à Frente 6 (condução total do usuário): frontend oficial `02-frontend/licitaia-v2-demo`; núcleo modular `02-frontend/licitaia-v2-web`. |

**Referências normativas obrigatórias para esta continuação:**

- `01-planejamento/PLANO-MESTRE-DECYON-V2.md`
- `01-planejamento/governanca/MATRIZ-DE-FECHAMENTO-DECYON-V2.md`
- `01-planejamento/governanca/PROTOCOLO-OPERACIONAL-OBRIGATORIO.md`
- `01-planejamento/governanca/PADRAO-OFICIAL-DE-VERSIONAMENTO-GIT.md`
- `01-planejamento/governanca/CHECKPOINT-NORMATIVO-ONDA-3-FLOWCONTROLLER-BASE-2026-03-30.md`

---

## 2. Estado de partida

| Afirmação | Status |
|-----------|--------|
| Onda 1 encerrada | Vigente conforme Plano Mestre |
| Onda 2 encerrada (10/10) | Vigente conforme Plano Mestre Sec. 11.29 |
| Base técnica da Onda 3 encerrada (10/10) | Vigente: checkpoint 2026-03-30; testes 15/15; fluxo v1 fixo |
| FlowController aprovado como máquina de estados determinística | Vigente |
| Integração canônica com motor em `REVIEW` via `runAdministrativeProcess()` | Vigente |
| Congelamento de `legalRegime` e `procurementStrategy` após `REGIME` | Vigente |
| `OUTPUT` não recalcula | Vigente |
| Onda 3 **completa** encerrada | **Não** — continuação obrigatória até critérios deste documento e do Plano Mestre |

**Premissas já consolidadas (não reabertas nesta continuação sem checkpoint explícito):**

- Contrato operacional de estado, invariantes globais, modelo formal de invalidação e sincronização por `renderToken` estão **definidos** como especificação de referência para implementação futura; este documento **formaliza o aceite por incremento**, não substitui a especificação técnica detalhada produzida em sessão de arquitetura.

---

## 3. Definição dos incrementos

Ordem **estrita**: A → B → C → D → E → F. Nenhum incremento inicia sem o anterior em 10/10.

---

### Incremento A — Especificação operacional verificável

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo** | Produzir especificação **fechada** que permita implementação e auditoria sem interpretação: estados, transições, pré-condições, pós-condições, matriz de invalidação, semântica de `renderToken`/`revision`, e requisitos de histórico append-only. |
| **Escopo** | Documentação e diagramas formais (texto/tabelas); **zero** alteração de código de produto. |
| **Entregáveis** | (1) Documento de especificação operacional versionado em `01-planejamento/governanca/` ou anexo referenciado; (2) tabela de transições permitidas/proibidas; (3) matriz upstream → downstream de invalidação; (4) lista de invariantes globais reproduzíveis em revisão; (5) glossário de códigos de bloqueio (`BlockingReason.code`) alinhado a códigos do motor onde aplicável. |
| **Critérios de aceite 10/10** | (1) Todo caminho de fluxo v1 está coberto sem lacuna; (2) nenhuma regra jurídica/matemática é atribuída ao FlowController ou à UI; (3) `REVIEW` é o único ponto de execução total do motor no fluxo guiado; (4) `OUTPUT` documentado como somente leitura de resultado consolidado; (5) invalidação documentada com granularidade mínima por etapa e sem ambiguidade; (6) dois revisores independentes (normativo + técnico) declaram aderência ao Plano Mestre e Matriz. |
| **Bloqueadores** | Lacuna na matriz de invalidação; conflito com checkpoint da base técnica; atribuição de decisão normativa ao FlowController. |
| **Evidências esperadas** | Documento versionado no repositório; registro de revisão (data, responsáveis, resultado); ausência de itens abertos classificados como críticos. |
| **Dependências** | Base técnica Onda 3 encerrada (checkpoint 2026-03-30). |
| **Condição de passagem** | Incremento A declarado 10/10 por checklist desta secção + checkpoint normativo (Sec. 7). |

---

### Incremento B — Contratos e catálogos canônicos

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo** | Congelar **contratos** (schema do estado operacional, DTOs de comando/resposta, catálogo de `messageKey`, severidades HARD/SOFT) e **proibir** texto normativo livre na UI. |
| **Escopo** | Definição de contratos (OpenAPI/JSON Schema/TypeScript types **como especificação** — arquivo de contrato ou documento que referencia tipos canônicos); catálogo de mensagens; **sem** lógica de negócio nova além de orquestração e apresentação. |
| **Entregáveis** | (1) Versão `schemaVersion` inicial do contrato operacional; (2) catálogo `messageKey` → institucional (sem copy dinâmico que altere sentido normativo); (3) especificação de `renderToken` e campos que o compõem; (4) contrato de erro de conflito de estado (`STATE_STALE` ou equivalente documentado). |
| **Critérios de aceite 10/10** | (1) UI não possui campo obrigatório não mapeado no contrato; (2) toda mensagem exibida resolve-se por `messageKey` + parâmetros estruturais; (3) `allowedActions` e `nextRequiredAction` são enumerados fechados; (4) compatibilidade retroativa documentada para evolução de `schemaVersion`; (5) revisão cruzada: nenhuma chave órfã; (6) aderência ao Incremento A. |
| **Bloqueadores** | Contrato ambíguo; enum aberto demais; mensagens sem chave canônica. |
| **Evidências esperadas** | Artefato em repositório; tabela de cobertura mensagem × etapa × severidade; diff de versão do schema. |
| **Dependências** | Incremento A em 10/10. |
| **Condição de passagem** | Incremento B em 10/10 + checkpoint normativo. |

---

### Incremento C — Núcleo de condução operacional

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo** | Implementar (no **nícleo modular**) o núcleo que materializa a state machine, snapshots por etapa, histórico append-only, invalidação e emissão do contrato operacional conforme Incrementos A e B. |
| **Escopo** | Código em `02-frontend/licitaia-v2-web` (módulos/orquestração conforme estrutura real do projeto); **proibido** alterar `runAdministrativeProcess` ou substituir o motor; **proibido** duplicar validação jurídica. |
| **Entregáveis** | Implementação do núcleo de condução; testes unitários/integrados do FlowController estendidos ou equivalentes que provem transição, anti-salto, congelamento pós-`REGIME`, invalidação e imutabilidade de snapshot por etapa; prova de que `REVIEW` chama o motor canônico. |
| **Critérios de aceite 10/10** | (1) 100% das transições proibidas falham com causa codificada; (2) `revision` monotônico; (3) histórico append-only verificável em teste; (4) alteração upstream dispara invalidação conforme matriz do Incremento A; (5) regressão zero nas provas canônicas já exigidas pelo repositório para o escopo tocado; (6) ausência de validador jurídico novo no núcleo de condução. |
| **Bloqueadores** | Falha em anti-bypass; snapshot mutável indevidamente; execução do motor fora de `REVIEW` no fluxo guiado. |
| **Evidências esperadas** | Log de testes em verde; referência a arquivos de prova; checklist de invariantes executado. |
| **Dependências** | Incrementos A e B em 10/10. |
| **Condição de passagem** | Incremento C em 10/10 + checkpoint Git + checkpoint normativo. |

---

### Incremento D — Integração UI subordinada ao contrato

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo** | Integrar o frontend oficial de condução (`02-frontend/licitaia-v2-demo`) para consumir **exclusivamente** o contrato operacional; eliminar página em branco e ambiguidade de próximo passo. |
| **Escopo** | UI: renderização de etapa, ações habilitadas, bloqueios, sincronização via `renderToken`; **zero** regra jurídica local; **zero** decisão de fluxo por heurística de componente. |
| **Entregáveis** | Telas ou fluxo único guiado por etapa; integração com emissão do estado canônico (fonte: núcleo Incremento C ou adaptador documentado); tratamento obrigatório de `STATE_STALE`; mapa UI × `messageKey`. |
| **Critérios de aceite 10/10** | (1) Nenhum botão de avanço sem `allowedActions` correspondente; (2) bloqueio HARD impede submit; (3) conflito de `renderToken` bloqueia ação e força recarga do estado; (4) percurso feliz demonstrável sem campo livre para decisão crítica inicial (Frente 6); (5) evidência de que strings normativas não são inventadas no cliente; (6) regressão zero nos fluxos SaaS já homologados que compartilhem a mesma borda. |
| **Bloqueadores** | UI calcula permissão fora do contrato; mensagem genérica sem `messageKey`; bypass por rota/manual URL não bloqueado. |
| **Evidências esperadas** | Roteiro de demonstração registrado; capturas ou vídeo curto institucional (opcional) **e** prova automatizada ou checklist assinado para anti-bypass básico de UI. |
| **Dependências** | Incremento C em 10/10. |
| **Condição de passagem** | Incremento D em 10/10 + checkpoint normativo + checkpoint Git. |

---

### Incremento E — Provas de condução e anti-bypass

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo** | Provar que o usuário **não** consegue erro estrutural de fluxo nem burlar etapas; provar alinhamento motor × condução × UI. |
| **Escopo** | Suíte de provas reexecutáveis (scripts de prova do projeto ou testes E2E) cobrindo personas, tentativas hostis de salto, alteração upstream com invalidação, `REVIEW` halted vs success, e consistência de `finalStatus`. |
| **Entregáveis** | Script(s) ou suíte documentada em `src/proof/` ou caminho oficial do repositório; matriz cenário × resultado esperado × evidência; relatório de execução. |
| **Critérios de aceite 10/10** | (1) 100% dos cenários críticos definidos no Incremento A executados com resultado esperado; (2) tentativa de salto bloqueada em todos os pares proibidos; (3) após invalidação, `OUTPUT` inacessível até novo `REVIEW` válido; (4) regressão das provas H-FI2/H-FI5 ou equivalentes canônicos do backend quando o escopo tocar borda HTTP; (5) nenhum cenário com falha silenciosa. |
| **Bloqueadores** | Cenário crítico sem prova; divergência entre UI e estado servidor não detectada. |
| **Evidências esperadas** | Output de prova arquivado ou comando documentado com resultado verde; hash de commit. |
| **Dependências** | Incremento D em 10/10. |
| **Condição de passagem** | Incremento E em 10/10 + checkpoint normativo + checkpoint Git. |

---

### Incremento F — Fechamento normativo da entrega seguinte

| Campo | Conteúdo |
|--------|-----------|
| **Objetivo** | Declarar formalmente o encerramento da **entrega de continuação da Onda 3** (condução operacional materializada) ou delimitar explicitamente o que permanece pendente para uma **nova** onda/entrega, **sem** auto-declarar Onda 3 completa sem evidência. |
| **Escopo** | Apenas governança: atualização do Plano Mestre (Sec. 11.x se necessário), Matriz, checkpoint normativo final, referência Git. |
| **Entregáveis** | `CHECKPOINT-NORMATIVO-ONDA-3-CONTINUACAO-<DATA>.md`; atualização pontual do Plano Mestre e da Matriz se o encerramento alterar status normativo; tag `marco/` se institucionalmente aplicável. |
| **Critérios de aceite 10/10** | (1) Todos os incrementos A–E em 10/10; (2) checkpoint normativo obrigatório respondido integralmente; (3) hash de commit registrado; (4) `git status` limpo para escopo; (5) declaração explícita se Onda 3 **integral** está encerrada ou se permanece trabalho residual; (6) aderência ao Protocolo Operacional. |
| **Bloqueadores** | Qualquer incremento anterior abaixo de 10/10; ausência de commit de encerramento. |
| **Evidências esperadas** | Artefatos em `01-planejamento/governanca/` + commit rastreável. |
| **Dependências** | Incremento E em 10/10. |
| **Condição de passagem** | Incremento F encerrado; veredito explícito no checkpoint. |

---

## 4. Invariantes obrigatórios da continuação

### 4.1 O que a UI **não pode** fazer

- Decidir regime, validade jurídica, resultado administrativo ou substituir `runAdministrativeProcess`.
- Calcular permissão de avanço fora dos campos `allowedActions` / `nextRequiredAction` do contrato.
- Exibir mensagem normativa sem `messageKey` canônico (exceto dados puramente descritivos não decisórios, explicitamente listados no Incremento B).
- Progredir após resposta `STATE_STALE` sem recarregar estado canônico.
- Burlar etapa por navegação, atalho ou chamada direta não validada pelo núcleo de condução.

### 4.2 O que o FlowController **não pode** fazer

- Reimplementar regra jurídica, validação estrutural/jurídica do motor ou motor paralelo.
- Substituir ou alterar o contrato canônico de `runAdministrativeProcess`.
- Recalcular saída em `OUTPUT`.
- Aceitar salto de etapa não previsto na ordem v1.

### 4.3 O que permanece **exclusivo** do motor

- Validação jurídica e decisão administrativa final.
- Halt por validação ou dependência com semântica canônica de `finalStatus`.
- Memória de cálculo, score e decisões que impactem compliance central.

### 4.4 O que **nunca** pode ser quebrado

- Regressão zero nas áreas tocadas.
- Separação motor / orquestração / UI definida no Plano Mestre e Matriz.
- Rastreabilidade: histórico append-only e correlação com execução quando persistida.
- Congelamento pós-`REGIME` e fluxo v1 obrigatório até alteração normativa explícita.

---

## 5. Critérios de reprovação

Um incremento **não** é 10/10 se ocorrer **qualquer** item abaixo:

1. Duplicação de regra jurídica/matemática fora do motor.
2. Execução total do motor fora de `REVIEW` no fluxo guiado.
3. `OUTPUT` recalculando ou alterando resultado do motor.
4. Transição de etapa sem verificação de pré-condição documentada no Incremento A.
5. Invalidação silenciosa (downstream `COMPLETED` com upstream alterado sem evento de invalidação).
6. Critério de aceite do incremento não demonstrável por evidência objetiva.
7. Ausência de checkpoint normativo quando obrigatório (Sec. 7).
8. Ausência de commit rastreável quando o incremento contiver alteração de código (Incrementos C–E, e F).
9. Conflito não resolvido com Plano Mestre ou Matriz.

---

## 6. Regra de progressão

1. Nenhum incremento é pulado.
2. Nenhum incremento inicia sem o anterior em **10/10** com evidência registrada.
3. Implementação de código (Incrementos C–E) **não** inicia sem Incrementos **A** e **B** fechados.
4. Alteração de contrato (`schemaVersion`) após congelamento do Incremento B exige novo incremento ou subversão documentada + revisão de impacto (tratada como mudança normativa).
5. Itens “fora de escopo” da Onda 3 (painel auditoria completo, integrações PNCP, etc., Plano Mestre Sec. 11.32) **não** entram nesta trilha sem novo aceite.

---

## 7. Regra de governança

### 7.1 Checkpoint normativo

Obrigatório **ao final de cada incremento** e **antes** de declarar 10/10, responder:

1. Criou/alterou/consolidou regra normativa?
2. Exigiu atualizar o Plano Mestre?
3. Exigiu atualizar a Matriz de Fechamento?
4. Exigiu criar/atualizar artefatos em `01-planejamento/governanca/`?
5. As atualizações foram executadas na mesma etapa?

Conforme `PROTOCOLO-OPERACIONAL-OBRIGATORIO.md` Sec. 11.

### 7.2 Atualização do Plano Mestre e Matriz

- **Incrementos A–B:** atualizar apenas se a especificação alterar status ou definir marco novo reconhecido pelo projeto.
- **Incrementos C–E:** atualizar se o estado real do sistema divergir do descrito nas Sec. 11.31–11.34.
- **Incremento F:** atualização **obrigatória** se houver encerramento parcial ou total da Onda 3 ou mudança de interpretação normativa.

### 7.3 Git e commit formal

- Incrementos **sem código** (A, B, F parcialmente documental): commit de governança com mensagem conforme `PADRAO-OFICIAL-DE-VERSIONAMENTO-GIT.md`.
- Incrementos **com código** (C, D, E, e F se incluir código): commit de encerramento com hash registrado no checkpoint; tag `marco/` quando institucionalmente aprovado; `git status` limpo.

### 7.4 Padrão de evidência

- **Documental:** artefato versionado + checklist rubricado.
- **Técnica:** saída de testes/provas reexecutáveis + referência a commit.
- **Auditoria:** rastreabilidade entre requisito (Incremento A) → contrato (B) → código (C) → UI (D) → prova (E) → fecho (F).

---

## 8. Caminho oficial do arquivo

`01-planejamento/governanca/ACEITE-FORMAL-ONDA-3-CONTINUACAO-POR-INCREMENTO.md`

---

## 9. Veredito de criação deste artefato

| Pergunta | Resposta |
|----------|----------|
| Este documento formaliza aceite por incremento sem implementar a continuação? | **SIM** |
| Implementação de código faz parte deste arquivo? | **NÃO** |

---

*Fim do documento.*

# Relatório — Fase 29: Motor de Rastreabilidade da Decisão Administrativa (DecisionTrace)

**Data:** 2026-03-16  
**Projeto:** LICITAIA V2  
**Fase:** 29 — Motor de Rastreabilidade da Decisão Administrativa  

---

## 1. Estrutura (verificação inicial obrigatória)

Foi lido o documento oficial de estrutura do repositório:  
`01-planejamento/ESTRUTURA REAL DO PROJETO — LICITAIA V2.md`

Confirmações:

- **Uso exclusivo de `modules/`** no frontend (`02-frontend/licitaia-v2-web/modules`).
- **Inexistência de estruturas paralelas** como `src/modules`.
- **Caminhos físicos** preservados e compatíveis com a arquitetura registrada.

Não houve divergência estrutural; a implementação da Fase 29 prosseguiu.

---

## 2. Modelagem (obrigatória)

Implementação em `modules/domain/shared`:

- `AdministrativeDecisionTrace`
- `AdministrativeDecisionStep`
- `SupportingElement`

Arquivo:

- `modules/domain/shared/administrative-decision-trace.types.ts`

Campos críticos atendidos:

- `sourceReference`: sempre preenchido em steps e supporting elements, em formato determinístico.
- `referenceId`: sempre preenchido, com padrão determinístico por alvo (ex.: `need:item:0`, `calc:item:1`, `strategy:process`).

---

## 3. Engine (obrigatório)

Arquivo:

- `modules/domain/shared/administrative-decision-trace.engine.ts`

Assinatura implementada conforme especificação:

- `executeAdministrativeDecisionTraceEngine(input: { structure; calculationMemory; administrativeNeed; administrativeJustification; procurementStrategy; documentConsistency }): AdministrativeDecisionTrace[]`

Regras críticas atendidas:

- **Regra 1 (sempre explicar):** todo trace sempre possui `decisionSteps` com os 6 steps obrigatórios.
- **Regra 2 (sempre ter evidência):** todo step tem `supportingElementIds` válidos (não vazios).
- **Regra 3 (não inventar dados):** conteúdo dos steps e excerpts deriva apenas de dados presentes nos objetos de entrada.
- **Regra 4 (determinismo):** mesma entrada → mesmo trace (inclui ordenação estável e `generatedAt` determinístico).
- **Regra 5 (inconsistência):** se `documentConsistency.hasIssues === true`, traces marcam `hasInconsistency: true` e populam `inconsistencyReasons` com `issueTypes`.
- **Regra 6 (incompletude):** `isComplete: false` quando faltar `need`, `calculation` (para item/lot), `justification` ou `strategy` (quando aplicável). Não bloqueia fluxo.

Observação determinística:

- `traceId` é determinístico: `TRACE:<moduleId>:<targetType>:<targetId>`.
- `generatedAt` é determinístico (epoch ISO) para garantir “mesma entrada → mesma saída”.

---

## 4. Eventos (obrigatório)

Arquivo:

- `modules/shared/event-builders/administrative-decision-trace-event.builder.ts`

Eventos:

- `ADMINISTRATIVE_DECISION_TRACE_GENERATED`
  - payload: `{ totalTraces, hasInconsistency, hasIncomplete }`
- `ADMINISTRATIVE_DECISION_TRACE_INCOMPLETE`
  - emitido quando houver qualquer trace incompleto
  - payload: `{ totalTraces, hasIncomplete }`

**Eventos não carregam traces completos**, apenas o resumo obrigatório.

---

## 5. Metadata (obrigatório)

Arquivo:

- `modules/shared/metadata/metadata-composer.ts`

Adicionado:

- `buildDecisionTraceMetadata(traces)`

Estrutura:

```json
decisionTrace: {
  hasTrace: boolean;
  totalTraces: number;
  tracesPerTargetType: { process: number; item: number; lot: number };
  hasInconsistency: boolean;
  hasIncomplete: boolean;
}
```

---

## 6. Integração (obrigatória)

Integração realizada **após DocumentConsistency** e sem alterar o orquestrador.

Módulos atualizados:

- `modules/domain/dfd/dfd.module.ts`
- `modules/domain/etp/etp.module.ts`
- `modules/domain/tr/tr.module.ts`
- `modules/domain/pricing/pricing.module.ts`

Estratégia:

- Execução passiva do engine ao final do pipeline interno do módulo.
- Emissão de eventos e inclusão de metadados.
- **Sem dependências circulares** e sem alterações em contratos/orquestrador.

Arquivos proibidos preservados (sem alterações):

- `modules/core/contracts/module-input.contract.ts`
- `modules/core/contracts/module-output.contract.ts`
- `modules/orchestrator/administrative-process-engine.ts`

---

## 7. Testes (obrigatório)

Arquivo criado:

- `modules/domain/shared/administrative-decision-trace.test.ts`

Cenários cobertos:

- trace completo por item
- trace por processo
- múltiplos itens
- ausência de justificativa → `isComplete: false`
- inconsistência → `hasInconsistency: true` e `inconsistencyReasons`
- determinismo (deepEqual em duas execuções)

---

## 8. Regressão (obrigatório)

Executados e aprovados (regressão zero):

- `modules/orchestrator/administrative-process-engine.test.ts`
- `modules/domain/shared/calculation-memory.test.ts`
- `modules/domain/shared/administrative-need.test.ts`
- `modules/domain/shared/administrative-justification.test.ts`
- `modules/domain/shared/procurement-strategy.test.ts`
- `modules/domain/shared/administrative-coherence.test.ts`
- `modules/domain/shared/administrative-document-consistency.test.ts`
- `modules/domain/shared/administrative-decision-trace.test.ts`

---

## 9. Riscos

- **Ausência de IDs em `single_item`** no extractor de estrutura: não é possível gerar trace de item sem inventar dados. O engine não cria item/lot sem IDs.
- **Escopo de incoerências por alvo:** o `documentConsistency` atual não expõe um mapeamento objetivo por alvo; por isso, `hasInconsistency` é propagado por trace quando `documentConsistency.hasIssues` estiver ativo, sem inferir alvo via parsing de mensagens.

---

## 10. Nota técnica final

A Fase 29 introduz rastreabilidade **estrutural, determinística e auditável** da decisão administrativa, sem alterar decisões e sem interferir no fluxo.

Critérios de aprovação atendidos:

- decisões rastreáveis com steps obrigatórios
- evidência estruturada por step (`supportingElementIds`)
- inconsistências visíveis via `documentConsistency`
- determinismo absoluto confirmado em testes
- regressão zero confirmada


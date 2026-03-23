# Relatório Corretivo — Fase 28: Motor de Consistência Documental

**Data:** 2025-03-16  
**Escopo:** Auditoria e endurecimento do Motor de Consistência Documental Administrativa (Fase 28) do LICITAIA V2.  
**Objetivo:** Corrigir lacunas conceituais, eliminar duplicidade semântica e formalizar critérios para homologação antes da Fase 29.

---

## 1. Verificação da estrutura do projeto

Foram auditados exclusivamente os componentes da Fase 28 e sua integração:

| Componente | Caminho | Status |
|------------|--------|--------|
| Tipos | `modules/domain/shared/administrative-document-consistency.types.ts` | Corrigido |
| Engine | `modules/domain/shared/administrative-document-consistency.engine.ts` | Corrigido |
| Validator | `modules/domain/shared/administrative-document-consistency.validator.ts` | Sem alteração (apenas consome resultado do engine) |
| Testes | `modules/domain/shared/administrative-document-consistency.test.ts` | Expandido |
| Event builder | `modules/shared/event-builders/administrative-document-consistency-event.builder.ts` | Sem alteração |
| Integração DFD | `modules/domain/dfd/dfd.module.ts`, `dfd.validators.ts` | Sem alteração (regra absoluta: core/orchestrator não alterados) |
| Integração ETP/TR/Pricing | `etp.module.ts`, `tr.module.ts`, `pricing.module.ts` e respectivos validators | Sem alteração |

**Regra absoluta respeitada:** Nenhuma alteração em `module-input.contract.ts`, `module-output.contract.ts` ou `administrative-process-engine.ts`.

---

## 2. Diagnóstico das lacunas detectadas

A auditoria identificou as seguintes lacunas e o tratamento aplicado:

| Lacuna | Tratamento |
|--------|------------|
| Possível duplicação com validações de fases anteriores | **NEED_STRUCTURE_MISMATCH** identificado como duplicata de **ADMINISTRATIVE_NEED_TARGET_NOT_FOUND** (Fase 26). Regra removida da Fase 28. |
| Critérios heurísticos pouco definidos | Listas explícitas criadas em `administrative-document-consistency.types.ts`: `NEED_RECURRING_KEYWORDS`, `NEED_CONSUMPTION_KEYWORDS`, `NEED_SIZING_KEYWORDS`, `LEGAL_BASIS_REQUIRED_MODALITIES`, `LEGAL_BASIS_REQUIRED_KEYWORDS`. Engine passou a utilizá-las. |
| Ausência de matriz formal de severidade | Criada **DOCUMENT_CONSISTENCY_SEVERITY_MATRIX** em `administrative-document-consistency.types.ts` com `issueCode`, `severity` e `rationale` para cada regra. |
| Expressões vagas nos critérios de detecção | Documentados **detectionCriteria** objetivos no engine (comentários por regra) e heurísticas baseadas em listas. |
| Delimitação arquitetural incompleta | Documentação no relatório: pipeline conceitual vs ordem real de execução e justificativa de cada regra na Fase 28. |

---

## 3. Auditoria de duplicidade semântica

### 3.1 Códigos da Fase 28 (antes e depois)

| Código | Situação | Decisão |
|--------|----------|---------|
| **NEED_STRUCTURE_MISMATCH** | Equivalente a **ADMINISTRATIVE_NEED_TARGET_NOT_FOUND** (Fase 26 — Need validator). Mesma condição: necessidade referencia item/lote inexistente na estrutura. | **Removido** da Fase 28. A Fase 28 não repete validações estruturais locais. |
| CALCULATION_NEED_MISMATCH | Nenhum motor anterior cruza tipo de cálculo (CONSUMPTION/INSTITUTIONAL_SIZING) com texto da necessidade. | **Mantido** — regra cruzada. |
| STRATEGY_STRUCTURE_MISMATCH | Nenhum validator anterior verifica coerência divisionStrategy vs structureType (ex.: single_item + LOTS). | **Mantido** — regra cruzada. |
| STRATEGY_NEED_MISMATCH | Nenhum motor anterior cruza modalidade DISPENSA/INEXIGIBILIDADE com necessidade recorrente. | **Mantido** — regra cruzada. |
| JUSTIFICATION_NEED_MISMATCH | Nenhum validator anterior cruza justificativa e necessidade para o mesmo alvo (overlap de termos). | **Mantido** — regra cruzada. |
| JUSTIFICATION_STRATEGY_MISMATCH | Nenhum motor anterior exige base legal na justificativa quando estratégia é dispensa/inexigibilidade. | **Mantido** — regra cruzada. |

### 3.2 Lista final de códigos da Fase 28 (após correção)

- `CALCULATION_NEED_MISMATCH`
- `STRATEGY_STRUCTURE_MISMATCH`
- `STRATEGY_NEED_MISMATCH`
- `JUSTIFICATION_NEED_MISMATCH`
- `JUSTIFICATION_STRATEGY_MISMATCH`

---

## 4. Matriz formal de severidade

A matriz **DOCUMENT_CONSISTENCY_SEVERITY_MATRIX** foi criada em `administrative-document-consistency.types.ts` com o formato obrigatório: `issueCode`, `severity`, `rationale`.

| issueCode | severity | rationale |
|-----------|----------|-----------|
| CALCULATION_NEED_MISMATCH | BLOCK | Cálculo incompatível com a natureza da necessidade (consumo vs dimensionamento) compromete a decisão administrativa e a rastreabilidade do objeto. |
| STRATEGY_STRUCTURE_MISMATCH | BLOCK | Estratégia de parcelamento (LOTS/multiple_items) incompatível com a estrutura do objeto (single_item/não-lote) invalida a decisão de como contratar. |
| STRATEGY_NEED_MISMATCH | WARNING | Modalidade de dispensa/inexigibilidade com necessidade declarada como recorrente ou previsível pode exigir licitação; alerta para revisão. |
| JUSTIFICATION_NEED_MISMATCH | WARNING | Justificativa para o mesmo alvo sem termos compartilhados com a necessidade declarada indica possível desconexão documental. |
| JUSTIFICATION_STRATEGY_MISMATCH | WARNING | Estratégia de dispensa/inexigibilidade exige que a justificativa mencione base legal (ex.: art. 75 Lei 14.133/2021); ausência sugere incompletude. |

---

## 5. Critérios de detecção formalizados

Cada regra do engine possui **detectionCriteria** documentados em comentário no código. Resumo:

| Regra | detectionCriteria (objetivos e verificáveis) |
|-------|----------------------------------------------|
| **CALCULATION_NEED_MISMATCH** | Mesmo targetId (item/lote); needText contém NEED_CONSUMPTION_KEYWORDS sem NEED_SIZING_KEYWORDS e calculationType === INSTITUTIONAL_SIZING, ou needText contém NEED_SIZING_KEYWORDS sem NEED_CONSUMPTION_KEYWORDS e calculationType === CONSUMPTION. |
| **STRATEGY_STRUCTURE_MISMATCH** | structure.structureType === 'single_item' e (divisionStrategy normalizado === 'lots'\|'lotes'\|'multiple_items' ou contém 'multiple'); ou structure.structureType !== 'lot' e divisionStrategy indica lotes. |
| **STRATEGY_NEED_MISMATCH** | procurementModality em LEGAL_BASIS_REQUIRED_MODALITIES (DISPENSA/INEXIGIBILIDADE) e texto agregado das need.entries contém algum NEED_RECURRING_KEYWORDS. |
| **JUSTIFICATION_NEED_MISMATCH** | targetType (item\|lote) e targetId iguais entre justificativa e necessidade; needText e justText com comprimento >= 20; needWords (palavras > 3 caracteres) sem nenhuma presente em justText; needWords.length >= 3. |
| **JUSTIFICATION_STRATEGY_MISMATCH** | modality em LEGAL_BASIS_REQUIRED_MODALITIES; texto agregado das justificativas (problemStatement, administrativeNeed, legalBasis) com comprimento >= 10; ausência de qualquer LEGAL_BASIS_REQUIRED_KEYWORDS no texto. |

Não foram mantidas expressões vagas (“parece incompatível”, “não corresponde” sem definição).

---

## 6. Endurecimento de heurísticas

As listas abaixo foram definidas como **constantes** no domínio compartilhado (`administrative-document-consistency.types.ts`) e utilizadas pelo engine:

| Constante | Uso |
|-----------|-----|
| **NEED_RECURRING_KEYWORDS** | Termos que indicam necessidade recorrente ou previsível (ex.: recorrente, previsível, anual, contínuo, permanente, contrato). |
| **NEED_CONSUMPTION_KEYWORDS** | Termos que indicam demanda/consumo (ex.: consumo, demanda, histórico, mensal, reposição). |
| **NEED_SIZING_KEYWORDS** | Termos que indicam dimensionamento institucional (ex.: dimensionamento, postos, estrutura, quantidade de, número de, vagas). |
| **LEGAL_BASIS_REQUIRED_MODALITIES** | Modalidades que exigem base legal na justificativa: DISPENSA, INEXIGIBILIDADE. |
| **LEGAL_BASIS_REQUIRED_KEYWORDS** | Termos que indicam base legal para dispensa/inexigibilidade (ex.: dispensa, inexigibilidade, art. 75, lei 14.133). |

A lógica de detecção passou a usar exclusivamente essas listas, sem lógica implícita ou tokens dispersos no código.

---

## 7. Separação: pipeline conceitual vs execução real

### 7.1 Pipeline conceitual do núcleo administrativo

Ordem lógica dos conceitos no núcleo (documentação de domínio):

1. **Need** — Necessidade administrativa (problema, resultado esperado).
2. **Structure** — Estrutura do objeto (single_item, multiple_items, lot).
3. **Calculation** — Memória de cálculo (CONSUMPTION, INSTITUTIONAL_SIZING).
4. **Justification** — Justificativa administrativa (problemStatement, base legal).
5. **Coherence** — Coerência entre Structure, Calculation e Justification (Fase 25).
6. **Strategy** — Estratégia de contratação (modalidade, parcelamento).
7. **DocumentConsistency** — Consistência documental cruzada (Fase 28).

### 7.2 Ordem real de execução nos módulos (DFD, ETP, TR, Pricing)

Nos validators (`dfd.validators.ts`, `etp.validators.ts`, etc.), a sequência de chamadas é:

1. Validações de campos obrigatórios do módulo (ex.: DFD_FIELD_*).
2. **ObjectStructure** — `extractProcurementStructure` + `applyObjectStructureValidations`.
3. **CalculationMemory** — `extractCalculationMemory` + `applyCalculationMemoryValidations`.
4. **AdministrativeJustification** — `extractAdministrativeJustification` + `applyAdministrativeJustificationValidations`.
5. **AdministrativeCoherence** — `executeAdministrativeCoherenceEngine` + `applyAdministrativeCoherenceValidations`.
6. **AdministrativeNeed** — `extractAdministrativeNeed` + `applyAdministrativeNeedValidations`.
7. **ProcurementStrategy** — `extractProcurementStrategy` + `applyProcurementStrategyValidations`.
8. **DocumentConsistency** — `executeAdministrativeDocumentConsistencyEngine` + `applyAdministrativeDocumentConsistencyValidations`.

Ou seja: **Structure → Calculation → Justification → Coherence → Need → Strategy → DocumentConsistency**. O motor de consistência documental executa por último, após todos os extraídos e validações locais, consolidando a coerência entre os cinco motores anteriores.

---

## 8. Delimitação arquitetural do motor

- **Responsabilidade:** Validar **apenas** inconsistências **cruzadas** entre Need, Structure, Calculation, Justification e Strategy. Não validar regras estruturais locais (ex.: “necessidade referencia item inexistente”), já cobertas pelas Fases 26 (Need), 27 (Strategy), 24 (Justification), etc.
- **Entradas:** Extraídos de structure, calculationMemory, administrativeNeed, administrativeJustification, procurementStrategy.
- **Saída:** `AdministrativeDocumentConsistencyResult` (issues, totalIssues, blockingIssues, warningIssues).
- **Integração:** O resultado é aplicado como itens de validação (`ADMIN_DOCUMENT_CONSISTENCY_*`) e incluído nos metadados e eventos dos módulos DFD, ETP, TR e Pricing.

---

## 9. Justificativa da existência de cada regra na Fase 28

| Regra | Por que pertence à Fase 28 e não aos motores anteriores |
|-------|--------------------------------------------------------|
| **CALCULATION_NEED_MISMATCH** | Exige análise **cruzada** entre memória de cálculo (tipo CONSUMPTION/INSTITUTIONAL_SIZING) e texto da necessidade. O validator de Calculation (Fase 23) não analisa conteúdo da necessidade; o de Need não analisa tipo de cálculo. Apenas o motor de consistência documental cruza os dois. |
| **STRATEGY_STRUCTURE_MISMATCH** | Exige comparação entre **estrutura do objeto** (structureType) e **estratégia de parcelamento** (divisionStrategy). O validator de Strategy valida target existente e modalidade; o de Structure valida lotes/itens. Nenhum deles valida “estratégia LOTS com estrutura single_item”. |
| **STRATEGY_NEED_MISMATCH** | Exige cruzamento entre **modalidade** (DISPENSA/INEXIGIBILIDADE) e **texto da necessidade** (termos recorrentes). O motor de Strategy não analisa conteúdo da necessidade; o de Need não analisa modalidade. |
| **JUSTIFICATION_NEED_MISMATCH** | Exige **mesmo alvo** (targetType + targetId) e overlap de termos entre justificativa e necessidade. O validator de Justification valida estrutura e conteúdo mínimo; não compara com necessidade. Pertence à Fase 28 por ser regra cruzada. |
| **JUSTIFICATION_STRATEGY_MISMATCH** | Exige que, quando a **estratégia** é dispensa/inexigibilidade, a **justificativa** mencione base legal. O validator de Justification não conhece a estratégia; o de Strategy não analisa texto da justificativa. Regra necessariamente cruzada. |

---

## 10. Novos testes implementados

Foram adicionados/ajustados os seguintes cenários em `administrative-document-consistency.test.ts`:

| Cenário | Descrição |
|---------|-----------|
| **test1RemovedRuleNoLongerFires** | Necessidade referencia item inexistente (i99); motor **não** emite NEED_STRUCTURE_MISMATCH (regra removida); resultado sem issues de consistência documental. |
| **test2CalculationNeedMismatch** | Mantido; adicionada asserção de que **severidade BLOCK** é aplicada a CALCULATION_NEED_MISMATCH. |
| **test3StrategyStructureMismatch** | Mantido. |
| **test4JustificationStrategyMismatch** | Mantido; adicionada asserção de que **severidade WARNING** é aplicada a JUSTIFICATION_STRATEGY_MISMATCH. |
| **test5TotallyConsistent** | Mantido. |
| **test6DuplicationWithPreviousValidator** | Payload DFD com need→item inexistente (i99); validação global deve emitir **ADMINISTRATIVE_NEED_TARGET_NOT_FOUND** (Fase 26) e **não** emitir **ADMIN_DOCUMENT_CONSISTENCY_NEED_STRUCTURE_MISMATCH**. |
| **test7MultipleInconsistencies** | Caso com structure single_item, need de consumo, calculation INSTITUTIONAL_SIZING e strategy LOTS; devem ser detectadas **pelo menos** CALCULATION_NEED_MISMATCH e STRATEGY_STRUCTURE_MISMATCH no mesmo run. |

---

## 11. Prova de regressão zero

Foram executados os seguintes arquivos de teste (script com `npx tsx`), com resultado **0 regressões**:

| Arquivo | Resultado |
|---------|-----------|
| `modules/domain/shared/administrative-document-consistency.test.ts` | OK — todos os cenários passaram. |
| `modules/domain/shared/administrative-need.test.ts` | OK — todos os cenários passaram. |
| `modules/domain/shared/administrative-justification.test.ts` | OK. |
| `modules/domain/shared/procurement-strategy.test.ts` | OK — todos os cenários passaram. |
| `modules/domain/shared/administrative-coherence.test.ts` | OK — todos os cenários passaram. |
| `modules/domain/shared/calculation-memory.test.ts` | OK. |
| `modules/orchestrator/administrative-process-engine.test.ts` | OK. |

**Conclusão:** Regressão zero confirmada.

---

## 12. Nota técnica final

O Motor de Consistência Documental (Fase 28) foi auditado e corrigido conforme os critérios de homologação:

- **Nenhuma duplicação** com motores anteriores (NEED_STRUCTURE_MISMATCH removido).
- **Critérios de detecção** objetivos e documentados (detectionCriteria por regra e listas explícitas).
- **Matriz de severidade** formalizada (DOCUMENT_CONSISTENCY_SEVERITY_MATRIX).
- **Heurísticas** explicitadas em constantes de domínio (NEED_*_KEYWORDS, LEGAL_BASIS_*).
- **Pipeline conceitual** e **ordem real de execução** documentados neste relatório.
- **Regressão zero** confirmada nos testes listados.

O motor permanece **formal**, **explicável**, **auditável**, **determinístico** e **sem duplicidade**, responsável por validar a coerência completa da decisão administrativa consolidando todos os motores anteriores do núcleo do LICITAIA.

**Recomendação:** Fase 28 considerada **pronta para homologação**; arquitetura liberada para avançar para a **Fase 29**.

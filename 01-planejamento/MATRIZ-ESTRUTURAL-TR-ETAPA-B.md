# MATRIZ ESTRUTURAL — TR (ETAPA B)

## Função normativa

Congela a anatomia estrutural mínima do TR com vínculo obrigatório ao PRICING quando houver dados de estimativa no snapshot.

## Blocos oficiais do TR

| Bloco | Seção técnica | Fonte de verdade | Obrigatoriedade | Condição formal | Proibição |
|---|---|---|---|---|---|
| TR_IDENTIFICACAO_TERMO | IDENTIFICATION | `requestingDepartment`, `responsibleAuthor`, `referenceDate`, classificadores | OBRIGATÓRIO | sempre | vedado dado externo ao snapshot |
| TR_OBJETO_E_FINALIDADE | NEED | `objectDescription`, `contractingPurpose` + explanation | OBRIGATÓRIO | sempre | vedado divergência com DFD/ETP |
| TR_ENQUADRAMENTO_ESTRUTURAL | STRUCTURE | `objectStructure`, `structureType`, `items`, `lots` | OBRIGATÓRIO | sempre | vedado contrariar estrutura derivada |
| TR_ESTIMATIVA_E_MEMORIA_CALCULO | CALCULATION | `estimatedUnitValue`, `estimatedTotalValue`, `pricingJustification`, `pricingSourceDescription`, `calculationMemory(s)` | CONDICIONAL/PROIBIDO | required quando `hasPricingData=true`; prohibited quando `hasPricingData=false` | vedado preencher sem dado de pricing validado |
| TR_REQUISITOS_E_EXECUCAO | JUSTIFICATION | `technicalRequirements`, `executionConditions`, `acceptanceCriteria` | OBRIGATÓRIO | sempre | vedado texto sem lastro no snapshot |
| TR_ESTRATEGIA_CONTRATACAO | STRATEGY | `procurementStrategy(s)` | OBRIGATÓRIO | sempre | vedado estratégia sem validação |
| TR_COERENCIA_RASTREAVEL | COHERENCE | trace + validações da execução | OBRIGATÓRIO | sempre | vedado ocultar inconsistência |

## Regras de coerência aplicáveis

- ETP_TR_OBJECT_ALIGNMENT
- DFD_ETP_TR_NEED_OBJECT_ALIGNMENT
- STRUCTURE_CLASSIFICATION_CONSISTENCY
- TR_PRICING_ALIGNMENT
- ETP_TR_TECHNICAL_ALIGNMENT
- STRATEGY_STRUCTURE_CONSISTENCY
- TRACE_EXPLANATION_DOCUMENT_ALIGNMENT
- DFD_ETP_TR_COHERENCE

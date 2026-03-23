# MATRIZ ESTRUTURAL — ETP (ETAPA B)

## Função normativa

Congela a anatomia estrutural mínima do ETP e o mapeamento determinístico de derivação documental subordinado ao `processSnapshot`.

## Blocos oficiais do ETP

| Bloco | Seção técnica | Fonte de verdade | Obrigatoriedade | Condição formal | Proibição |
|---|---|---|---|---|---|
| ETP_IDENTIFICACAO_ESTUDO | IDENTIFICATION | `requestingDepartment`, `responsibleAnalyst`, `analysisDate`, classificadores | OBRIGATÓRIO | sempre | vedado dado externo ao snapshot |
| ETP_NECESSIDADE_E_RESULTADOS | NEED | `needDescription`, `expectedResults` + explanation | OBRIGATÓRIO | sempre | vedado conteúdo sem lastro no motor |
| ETP_ENQUADRAMENTO_ESTRUTURAL | STRUCTURE | `objectStructure`, `structureType`, `items`, `lots` | OBRIGATÓRIO | sempre | vedado contrariar estrutura derivada |
| ETP_MEMORIA_CALCULO | CALCULATION | `calculationMemory`, `calculationMemories` | CONDICIONAL/PROIBIDO | required quando `hasCalculationData=true`; prohibited quando `executionForm=ENTREGA_UNICA` e `hasCalculationData=false`; not_applicable nos demais casos sem cálculo | vedado inserir números sem snapshot |
| ETP_SOLUCAO_E_JUSTIFICATIVA_TECNICA | JUSTIFICATION | `solutionSummary`, `technicalJustification` | OBRIGATÓRIO | sempre | vedado usar texto livre não validado |
| ETP_ESTRATEGIA_CONTRATACAO | STRATEGY | `procurementStrategy(s)` | OBRIGATÓRIO | sempre | vedado estratégia não validada |
| ETP_COERENCIA_RASTREAVEL | COHERENCE | trace + validações da execução | OBRIGATÓRIO | sempre | vedado ocultar bloqueio/inconsistencia |

## Regras de coerência aplicáveis

- DFD_ETP_CLASSIFICATION_ALIGNMENT
- DFD_ETP_NEED_ALIGNMENT
- ETP_TR_OBJECT_ALIGNMENT
- STRUCTURE_CLASSIFICATION_CONSISTENCY
- CALCULATION_NEED_CONSISTENCY
- JUSTIFICATION_NEED_CONSISTENCY
- LEGAL_BASIS_COMPLIANCE_WHEN_DIRECT
- STRATEGY_NEED_CONSISTENCY
- TRACE_EXPLANATION_DOCUMENT_ALIGNMENT
- DFD_ETP_TR_COHERENCE

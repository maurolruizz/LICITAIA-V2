# MATRIZ ESTRUTURAL — DFD (ETAPA B)

## Função normativa

Congela a anatomia estrutural mínima do DFD e o mapeamento determinístico de derivação documental a partir do `processSnapshot` e derivados oficiais do motor.

## Blocos oficiais do DFD

| Bloco | Seção técnica | Fonte de verdade | Obrigatoriedade | Condição formal | Proibição |
|---|---|---|---|---|---|
| DFD_IDENTIFICACAO_PROCESSUAL | IDENTIFICATION | `requestingDepartment`, `requesterName`, `requestDate`, classificadores do snapshot | OBRIGATÓRIO | sempre | vedado preencher com dado externo ao snapshot |
| DFD_DEMANDA_FORMALIZADA | NEED | `demandDescription`, `administrativeObjective` + explanation oficial | OBRIGATÓRIO | sempre | vedado usar texto não sustentado por snapshot/explanation |
| DFD_ENQUADRAMENTO_ESTRUTURAL | STRUCTURE | `objectStructure`, `structureType`, `items`, `lots` | OBRIGATÓRIO | sempre | vedado divergir da estrutura derivada validada |
| DFD_MEMORIA_CALCULO_REFERENCIAL | CALCULATION | `calculationMemory`, `calculationMemories` | CONDICIONAL/PROIBIDO | required quando `hasCalculationData=true`; prohibited quando `executionForm=ENTREGA_UNICA` e `hasCalculationData=false`; not_applicable nos demais casos sem cálculo | vedado inventar cálculo ausente |
| DFD_JUSTIFICATIVA_CONTRATACAO | JUSTIFICATION | `hiringJustification`, `administrativeJustification(s)` | OBRIGATÓRIO | sempre | vedado base legal fictícia |
| DFD_ESTRATEGIA_CONTRATACAO | STRATEGY | `procurementStrategy(s)`, `legalRegime` | OBRIGATÓRIO | sempre | vedado estratégia fora do snapshot |
| DFD_COERENCIA_RASTREAVEL | COHERENCE | trace + validações da execução | OBRIGATÓRIO | sempre | vedado omitir inconsistencia/completeza |

## Regras de coerência aplicáveis

- DFD_ETP_CLASSIFICATION_ALIGNMENT
- DFD_ETP_NEED_ALIGNMENT
- STRUCTURE_CLASSIFICATION_CONSISTENCY
- CALCULATION_NEED_CONSISTENCY
- JUSTIFICATION_NEED_CONSISTENCY
- LEGAL_BASIS_COMPLIANCE_WHEN_DIRECT
- STRATEGY_STRUCTURE_CONSISTENCY
- TRACE_EXPLANATION_DOCUMENT_ALIGNMENT

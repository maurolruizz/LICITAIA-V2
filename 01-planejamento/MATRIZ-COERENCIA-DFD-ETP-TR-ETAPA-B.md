# MATRIZ DE COERÊNCIA — DFD ↔ ETP ↔ TR ↔ PRICING (ETAPA B)

## Função normativa

Materializa as regras de coerência interdocumental que impedem montagem documental arbitrária.

## Regras estruturais obrigatórias

| Regra | Relação | Critério objetivo | Efeito obrigatório |
|---|---|---|---|
| DFD_ETP_CLASSIFICATION_ALIGNMENT | DFD ↔ ETP | `legalRegime`, `objectType`, `objectStructure`, `executionForm` iguais no snapshot | divergência bloqueia consistência documental |
| DFD_ETP_NEED_ALIGNMENT | DFD ↔ ETP | necessidade formal do ETP deve responder à demanda formalizada no DFD | ausência de alinhamento gera incoerência rastreável |
| ETP_TR_OBJECT_ALIGNMENT | ETP ↔ TR | objeto/finalidade do TR compatíveis com solução e necessidade do ETP | desalinhamento gera incoerência rastreável |
| DFD_ETP_TR_NEED_OBJECT_ALIGNMENT | DFD ↔ ETP ↔ TR | trilha NEED/OBJECT sem contradição entre os três documentos | quebra invalida coerência do conjunto |
| STRUCTURE_CLASSIFICATION_CONSISTENCY | Todos | estrutura documental respeita classificador + estrutura derivada (`ITEM_UNICO`, `MULTIPLOS_ITENS`, `LOTE`) | conflito é inválido por definição |
| CALCULATION_NEED_CONSISTENCY | DFD/ETP/TR | cálculo compatível com necessidade associada ao mesmo alvo | incompatibilidade gera issue de consistência |
| STRATEGY_STRUCTURE_CONSISTENCY | DFD/ETP/TR | estratégia compatível com estrutura derivada | estratégia incompatível é inválida |
| JUSTIFICATION_NEED_CONSISTENCY | DFD/ETP | justificativa responde ao need do mesmo alvo | desconexão gera incoerência |
| LEGAL_BASIS_COMPLIANCE_WHEN_DIRECT | DFD/ETP/TR | regimes diretos exigem base legal nos campos pertinentes | ausência fere compliance jurídico |
| TR_PRICING_ALIGNMENT | TR ↔ PRICING | bloco TR de estimativa usa apenas dados de pricing no snapshot | vedado estimativa sem pricing validado |
| ETP_TR_TECHNICAL_ALIGNMENT | ETP ↔ TR | requisitos técnicos do TR compatíveis com justificativa técnica do ETP | divergência gera incoerência |
| TRACE_EXPLANATION_DOCUMENT_ALIGNMENT | Todos | seção documental referencia trace/explanation da mesma execução | quebra de trilha invalida auditabilidade |
| DFD_ETP_TR_COHERENCE | DFD ↔ ETP ↔ TR | bloco COHERENCE apresenta estado real de completude/inconsistência do trace | vedado mascarar estado |

## Política de severidade estrutural

- Divergência de classificação, estrutura, estratégia-estrutura e vínculo TR-PRICING: **crítica**.
- Desalinhamento semântico de necessidade/justificativa/objeto entre documentos: **importante**.
- Falha de referência rastreável em seção: **crítica**.

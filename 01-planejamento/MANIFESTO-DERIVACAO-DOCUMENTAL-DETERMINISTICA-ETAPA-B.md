# MANIFESTO — DERIVAÇÃO DOCUMENTAL DETERMINÍSTICA (ETAPA B)

## Objetivo

Fixar a regra executável de derivação documental da ETAPA B: DFD, ETP e TR são montados a partir da verdade única do motor.

## Regra de fonte de verdade

1. Prevalência absoluta: `processSnapshot` da execução corrente.
2. Complementos válidos: `decisionMetadata`, `validations`, traces e explanations oficiais da mesma execução.
3. Proibição: payload bruto como fonte autônoma downstream.

## Fluxo determinístico oficial

1. API valida classificação na fronteira (`payload-classification.validator`).
2. Orquestrador executa pipeline DFD → ETP → TR → PRICING.
3. `processSnapshot` recebe merge controlado de `result.data` sem sobrescrever classificadores protegidos.
4. Cada módulo gera trace, explanation e documento técnico com regras estruturais fixas.
5. Documento técnico por target é montado com anatomia oficial por módulo:
   - DFD: blocos `DFD_*`
   - ETP: blocos `ETP_*`
   - TR: blocos `TR_*`
6. Seção documental usa:
   - explanation quando existente para o mesmo target;
   - fallback determinístico no snapshot para as `sourcePaths` do bloco;
   - estado de coerência vindo do trace.
7. Blocos condicionais assumem três estados formais:
   - `required` quando condição de dados é satisfeita;
   - `prohibited` quando a regra estrutural veta preenchimento no cenário;
   - `not_applicable` quando não há dado e não há proibição explícita.

## Matriz de condicionalidade oficial

- CALCULATION no DFD/ETP: aplicável quando há memória de cálculo no snapshot.
- CALCULATION no DFD/ETP: proibido quando `executionForm=ENTREGA_UNICA` e não há memória de cálculo.
- CALCULATION no TR: aplicável quando há dados de pricing no snapshot e proibido quando não há dados de pricing.
- Demais blocos mínimos dos três documentos: obrigatórios.

## Regras de integridade

- Não há seção sem `sourceOfTruth`, `sourcePaths` e `coherenceChecks`.
- Não há conteúdo documental que não possa ser rastreado para snapshot ou derivados oficiais.
- Não há preenchimento de seção com dados inexistentes no estado validado da execução.

## Fronteira de etapas

- ETAPA B encerra estrutura documental determinística.
- ETAPA C tratará camada premium/final de apresentação.
- ETAPA D tratará IA assistiva.

Não há antecipação de C nem D neste manifesto.

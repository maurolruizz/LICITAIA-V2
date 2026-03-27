# CHECKPOINT NORMATIVO — ETAPA H / H-FI5

Data: 2026-03-27  
Escopo: Auditoria hostil de contratos, superfícies e respostas canônicas da API backend

## Objetivo da fase

Comprovar que os contratos públicos e as respostas expostas pela API estão semanticamente alinhados ao comportamento real do motor, sem ambiguidade perigosa para integradores/auditores.

## Diagnóstico

Achados centrais antes da corretiva:

1. **IMPORTANTE** — superfície de entrada aceitava implicitamente campos de identidade no body (`tenantId`, `userId`) sem rejeição explícita;
2. **IMPORTANTE** — `correlationId` no body era aceito, apesar de a correlação canônica ser de borda (`x-request-id`);
3. **SECUNDÁRIO** — resposta de erro interno usava `process.status='error'`, fora do vocabulário canônico (`success|failure|halted`).

## Correções aplicadas

Arquivos alterados:

- `03-backend-api/licitaia-v2-api/src/validators/process-run-request.validator.ts`
- `03-backend-api/licitaia-v2-api/src/dto/process-run-request.types.ts`
- `03-backend-api/licitaia-v2-api/src/factories/process-run-response.factory.ts`
- `03-backend-api/licitaia-v2-api/src/proof/etapa-h-fi5-contract-surface-audit.ts`

Ajustes:

1. Rejeição explícita em 400 para `tenantId`, `userId` e `correlationId` no body;
2. Comentário contratual atualizado para reforçar que correlação canônica vem do header `x-request-id`;
3. Resposta 500 ajustada para `process.status='failure'`.

## Prova executada

Comando principal:

- `npx ts-node src/proof/etapa-h-fi5-contract-surface-audit.ts`

Cobertura validada:

1. sucesso canônico (`200`, `success=true`, `process.status=success`, `finalStatus=SUCCESS`);
2. halted por validação (`409`, `process.status=halted`, `finalStatus=HALTED_BY_VALIDATION`);
3. halted por dependência (`409`, `process.status=halted`, `finalStatus=HALTED_BY_DEPENDENCY`);
4. coerência entre HTTP status e body;
5. bloqueio de superfície perigosa:
   - envio de `tenantId` no body -> `400`;
   - envio de `userId` no body -> `400`;
   - envio de `correlationId` no body -> `400`;
6. correlação canônica confirmada no banco (`process_executions.request_payload.correlationId == x-request-id`).

## Evidência técnica complementar

Regressão zero executada:

- `npx ts-node src/proof/etapa-h-fi2-flow-hardening-validation.ts` -> OK
- `npx ts-node src/proof/etapa-h-fi4-audit-trace.ts` -> OK
- `npm run build` -> OK

## Conclusão técnica

A superfície pública auditada está semanticamente mais rígida e previsível: campos de identidade/correlação indevidos são rejeitados, respostas canônicas mantêm coerência por cenário e não houve regressão nas garantias consolidadas.

## Riscos residuais

- **SECUNDÁRIO**: consumidores legados que enviavam `correlationId` no body passam a receber `400` e devem migrar para `x-request-id`.

## Veredito final

- H-FI5 concluída: SIM  
- contratos públicos semanticamente íntegros: SIM  
- superfícies públicas canônicas e seguras: SIM  
- existe bloqueador para avançar: NÃO  
- fase pode ser encerrada: SIM

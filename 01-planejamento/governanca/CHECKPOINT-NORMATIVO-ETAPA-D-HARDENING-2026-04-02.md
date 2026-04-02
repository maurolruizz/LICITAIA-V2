# CHECKPOINT NORMATIVO — ETAPA D — HARDENING HTTP (ANTI-SPOOF DE IP + RATE LIMIT) — 2026-04-02

## 1. Identificacao

- Data: 2026-04-02
- Etapa: ETAPA D (Frente 5)
- Escopo: blindagem da camada HTTP contra spoof de IP e abuso de endpoint administrativo

## 2. Objetivo do registro

Formalizar o encerramento normativo da ETAPA D no escopo de hardening HTTP, com:

- resolucao de IP segura e deterministica;
- configuracao explicita de `trust proxy`;
- rate limit efetivo em `/api/users`;
- prova executavel real com cenario hostil de spoof e abuso.

## 3. Escopo implementado

1) centralizacao da resolucao de IP:
- `03-backend-api/licitaia-v2-api/src/lib/client-ip.ts`
- base segura: `req.socket.remoteAddress`
- `X-Forwarded-For` apenas quando `trust proxy` esta explicitamente habilitado
- validacao de IP antes do uso

2) configuracao explicita de trust proxy:
- `03-backend-api/licitaia-v2-api/src/server.ts`
- `app.set('trust proxy', config.trustProxyHops)`
- padrao fechado (`TRUST_PROXY_HOPS=0`) por default

3) hardening de rate limit:
- `03-backend-api/licitaia-v2-api/src/middleware/rate-limit.ts`
- chave por IP resolvido com politica segura
- bloqueio com `HTTP 429` para abuso
- erro explicito para falha de resolucao de IP (`CLIENT_IP_RESOLUTION_FAILED`)
- desacoplamento por interface `RateLimitStore` (pronto para Redis)

4) aplicacao de rate limit em `/api/users`:
- `03-backend-api/licitaia-v2-api/src/server.ts`

5) remocao de capturas inseguras/duplicadas de IP em controllers:
- `src/modules/auth/auth.controller.ts`
- `src/modules/users/users.controller.ts`
- `src/modules/institutional-settings/institutional-settings.controller.ts`

## 4. Prova executavel real

Artefato:
- `03-backend-api/licitaia-v2-api/src/proof/etapa-d-http-hardening-validation.ts`

Script oficial:
- `npm run proof:etapa-d`

Cenarios obrigatorios cobertos:
1. spoof de `X-Forwarded-For` bloqueado;
2. abuso de `/api/users` bloqueado por rate limit com `429`;
3. fluxo normal preservado (`/health` responde `200`).

Saida obrigatoria registrada pela prova:
- `[ETAPA_D_HARDENING_OK]`
- `[ETAPA_D_EVIDENCE] spoof_blocked=OK`
- `[ETAPA_D_EVIDENCE] rate_limit=OK`

## 5. Checkpoint normativo obrigatorio

1. Criou/alterou/consolidou regra normativa?
   - SIM (hardening HTTP anti-spoof + rate limit administrativo)
2. Exigiu atualizar o Plano Mestre?
   - SIM
3. Exigiu atualizar a Matriz de Fechamento?
   - SIM
4. Exigiu criar/atualizar artefato em `01-planejamento/governanca/`?
   - SIM (este checkpoint)
5. Atualizacoes foram executadas na mesma etapa?
   - SIM

## 6. Veredito

- Etapa D no escopo de hardening HTTP: **APROVADA (10/10)**
- Prova executavel real: **DISPONIVEL E REEXECUTAVEL**
- Apta para commit formal rastreavel: **SIM**

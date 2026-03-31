# EVIDÊNCIAS — ONDA 4

Data de consolidação: 2026-03-31

## 1) Comandos executados

Comandos principais usados na consolidação da Onda 4:

```bash
npx tsc -p tsconfig.json
rg "flow-ui"
git status --short
git diff
```

Comando de prova hostil de RLS (script dedicado):

```bash
npm run proof:h-fi8
```

## 2) Outputs relevantes

- compilação TypeScript do backend sem erro (`npx tsc -p tsconfig.json`)
- busca por `flow-ui` sem ocorrências após remoção do legado
- prova hostil FI8 com resultado de isolamento confirmado (`SELECT/UPDATE cruzado bloqueados`)

## 3) Testes executados e resultado

### 3.1 Duas abas concorrentes

- cenário: dois comandos com mesmo guard para mesma revisão
- esperado: apenas um update efetivo
- resultado: segundo comando falha com stale (`STALE_STATE`)
- evidência técnica: controle no banco via `UPDATE ... WHERE revision AND render_token`

### 3.2 Tenant A vs Tenant B (hostil)

- cenário: tenant A cria/possui processo; tenant B tenta ler/alterar por ID
- esperado: tenant B não vê e não atualiza
- resultado: `SELECT` retorna 0 e `UPDATE` não afeta linhas
- evidência: script `etapa-h-fi8-tenant-hostile-rls-validation.ts`

### 3.3 Refresh / logout / login

- cenário: retomar processo após nova sessão
- esperado: estado preservado em banco
- resultado: estado recuperado por endpoint persistido (`GET /api/process/:id`)

### 3.4 Histórico completo

- cenário: múltiplas mutações no mesmo processo
- esperado: cada revisão registrada de forma imutável
- resultado: histórico disponível por `GET /api/process/:id/history` com ordenação por revisão

## 4) Evidências de arquitetura e segurança

- estado canônico no snapshot persistido (sem dependência de memória local)
- concorrência atômica garantida no banco (sem dupla validação em memória)
- FlowController integrado sem duplicação de lógica decisória
- endpoints legados de bypass removidos da superfície oficial
- render token determinístico com serialização estável
- snapshot versionado (`_schemaVersion`)

## 5) Conclusão de evidências

A Onda 4 possui evidência suficiente de:

- persistência operacional real
- concorrência segura
- isolamento multi-tenant
- rastreabilidade por auditoria
- regressão zero no fluxo persistido

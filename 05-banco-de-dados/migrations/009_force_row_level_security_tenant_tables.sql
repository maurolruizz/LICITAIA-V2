-- ETAPA H — H-FI3
-- Blindagem estrutural de RLS contra bypass por owner de tabela.
--
-- Contexto:
-- ENABLE ROW LEVEL SECURITY ativa policies, mas o owner da tabela pode
-- contornar RLS por padrão. Em ambiente multi-tenant hostil, isso é risco.
--
-- Correção:
-- FORCE ROW LEVEL SECURITY torna as policies obrigatórias inclusive para owner.
-- Aplica apenas nas tabelas multi-tenant protegidas por app.current_tenant_id.

ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE user_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE process_executions FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE organ_configs FORCE ROW LEVEL SECURITY;

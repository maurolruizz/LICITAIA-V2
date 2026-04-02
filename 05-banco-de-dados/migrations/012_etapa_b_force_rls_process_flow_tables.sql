-- ETAPA B — Blindagem estrutural multi-tenant
-- Objetivo: tornar obrigatório o RLS nas tabelas operacionais críticas da condução.
-- Escopo: processes, flow_sessions, flow_session_revisions.
--
-- Nota:
-- As policies de isolamento por tenant já existem desde a migration 011.
-- Esta migration endurece a execução no banco com FORCE RLS.

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes FORCE ROW LEVEL SECURITY;

ALTER TABLE flow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE flow_session_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_session_revisions FORCE ROW LEVEL SECURITY;

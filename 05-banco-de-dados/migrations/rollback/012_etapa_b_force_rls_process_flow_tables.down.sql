-- ETAPA B — Rollback formal da blindagem FORCE RLS
-- Reverte apenas o endurecimento FORCE, preservando RLS habilitado.
-- Uso controlado: executar somente em cenário de reversão formal autorizada.

ALTER TABLE processes NO FORCE ROW LEVEL SECURITY;
ALTER TABLE flow_sessions NO FORCE ROW LEVEL SECURITY;
ALTER TABLE flow_session_revisions NO FORCE ROW LEVEL SECURITY;

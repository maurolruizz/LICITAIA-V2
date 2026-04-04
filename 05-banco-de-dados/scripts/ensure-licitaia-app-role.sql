-- Role de prova: não-superuser, sem BYPASSRLS (RLS aplicável).
-- Executar como superuser (ex.: postgres) no banco alvo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'licitaia_app') THEN
    CREATE ROLE licitaia_app LOGIN PASSWORD 'licitaia_app' NOSUPERUSER NOBYPASSRLS;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE licitaia_dev TO licitaia_app;
GRANT USAGE ON SCHEMA public TO licitaia_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO licitaia_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO licitaia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO licitaia_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO licitaia_app;

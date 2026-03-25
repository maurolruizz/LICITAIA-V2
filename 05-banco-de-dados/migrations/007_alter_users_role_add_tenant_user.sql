-- ETAPA G — Fase Interna 4
-- Inclui o papel TENANT_USER no CHECK da coluna users.role (RBAC tenant explícito).
-- Mantém papéis existentes para regressão de dados e migrações anteriores.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
    role IN ('SYSTEM_ADMIN', 'TENANT_ADMIN', 'TENANT_USER', 'OPERATOR', 'AUDITOR')
);

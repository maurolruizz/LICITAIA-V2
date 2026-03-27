-- ETAPA G — Fase Interna 2
-- Seed 001: tenant de teste + usuários mínimos por papel
--
-- USO: apenas em ambientes de desenvolvimento e CI.
-- NUNCA executar em produção.
--
-- Cria:
--   2 tenants de teste (Prefeitura de Exemplo + Órgão B — isolamento)
--   1 usuário TENANT_ADMIN (tenant A)
--   1 usuário TENANT_USER (tenant A)
--   1 usuário AUDITOR (tenant A)
--   1 usuário TENANT_ADMIN (tenant B)
--   1 organ_config associada ao tenant A
--
-- Senhas são hashes bcrypt de "SenhaTeste@123" (apenas para teste).
-- Em produção, hashes reais devem ser gerados pelo backend.

-- Limpa dados de teste anteriores (idempotente)
-- NOTA: audit_logs é append-only (DELETE/UPDATE bloqueados por trigger).
-- DELETE em users dispara FK ON DELETE SET NULL em audit_logs (UPDATE implícito) — falha.
-- TRUNCATE não dispara os triggers BEFORE DELETE desta tabela; executar como superusuário no seed.
TRUNCATE TABLE audit_logs;

DELETE FROM organ_configs      WHERE tenant_id IN (SELECT id FROM tenants WHERE slug IN ('prefeitura-exemplo', 'orgao-isolamento-b'));
DELETE FROM process_executions WHERE tenant_id IN (SELECT id FROM tenants WHERE slug IN ('prefeitura-exemplo', 'orgao-isolamento-b'));
DELETE FROM user_sessions      WHERE tenant_id IN (SELECT id FROM tenants WHERE slug IN ('prefeitura-exemplo', 'orgao-isolamento-b'));
DELETE FROM users              WHERE tenant_id IN (SELECT id FROM tenants WHERE slug IN ('prefeitura-exemplo', 'orgao-isolamento-b'));
DELETE FROM tenants            WHERE slug IN ('prefeitura-exemplo', 'orgao-isolamento-b');

-- Tenant de teste
INSERT INTO tenants (id, slug, name, cnpj, status, plan_type)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'prefeitura-exemplo',
    'Prefeitura Municipal de Exemplo',
    '00.000.000/0001-00',
    'trial',
    'trial'
);

-- TENANT_ADMIN
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash)
VALUES (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@exemplo.gov.br',
    'Administrador Exemplo',
    'TENANT_ADMIN',
    'active',
    '$2b$12$wjFnUGF01iQCPlAcWd.aT.BDDjjj.6jVKCFh/ovbp5U53rm0aRb2.'
);

-- TENANT_USER
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, created_by)
VALUES (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'operador@exemplo.gov.br',
    'Operador Exemplo',
    'TENANT_USER',
    'active',
    '$2b$12$wjFnUGF01iQCPlAcWd.aT.BDDjjj.6jVKCFh/ovbp5U53rm0aRb2.',
    '00000000-0000-0000-0001-000000000001'
);

-- AUDITOR
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, created_by)
VALUES (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'auditor@exemplo.gov.br',
    'Auditor Exemplo',
    'AUDITOR',
    'active',
    '$2b$12$wjFnUGF01iQCPlAcWd.aT.BDDjjj.6jVKCFh/ovbp5U53rm0aRb2.',
    '00000000-0000-0000-0001-000000000001'
);

-- Segundo tenant (isolamento multi-tenant nas provas)
INSERT INTO tenants (id, slug, name, cnpj, status, plan_type)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    'orgao-isolamento-b',
    'Órgão B — isolamento',
    '11.111.111/0001-11',
    'trial',
    'trial'
);

INSERT INTO users (id, tenant_id, email, name, role, status, password_hash)
VALUES (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'admin-b@exemplo.gov.br',
    'Administrador Órgão B',
    'TENANT_ADMIN',
    'active',
    '$2b$12$wjFnUGF01iQCPlAcWd.aT.BDDjjj.6jVKCFh/ovbp5U53rm0aRb2.'
);

-- Configuração institucional do tenant de teste
INSERT INTO organ_configs (
    tenant_id,
    orgao_nome_oficial,
    orgao_cnpj,
    orgao_uf,
    orgao_esfera,
    orgao_regime_compras_padrao,
    timezone,
    notificacoes_email_ativo,
    retencao_historico_anos
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Prefeitura Municipal de Exemplo',
    '00.000.000/0001-00',
    'SP',
    'municipal',
    'PREGAO_ELETRONICO',
    'America/Sao_Paulo',
    false,
    5
);

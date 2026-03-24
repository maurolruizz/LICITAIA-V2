-- ETAPA G — Fase Interna 2
-- Seed 001: tenant de teste + usuários mínimos por papel
--
-- USO: apenas em ambientes de desenvolvimento e CI.
-- NUNCA executar em produção.
--
-- Cria:
--   1 tenant de teste (Prefeitura de Exemplo)
--   1 usuário TENANT_ADMIN
--   1 usuário OPERATOR
--   1 usuário AUDITOR
--   1 organ_config associada ao tenant
--
-- Senhas são hashes bcrypt de "SenhaTeste@123" (apenas para teste).
-- Em produção, hashes reais devem ser gerados pelo backend.

-- Limpa dados de teste anteriores (idempotente)
-- NOTA: audit_logs é append-only (trigger bloqueia DELETE).
-- Para reset completo, use TRUNCATE diretamente no banco como superusuário.
DELETE FROM organ_configs      WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'prefeitura-exemplo');
DELETE FROM process_executions WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'prefeitura-exemplo');
DELETE FROM user_sessions      WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'prefeitura-exemplo');
DELETE FROM users              WHERE tenant_id IN (SELECT id FROM tenants WHERE slug = 'prefeitura-exemplo');
DELETE FROM tenants            WHERE slug = 'prefeitura-exemplo';

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
    '$2b$12$PLACEHOLDER_HASH_ADMIN_DO_NOT_USE_IN_PRODUCTION'
);

-- OPERATOR
INSERT INTO users (id, tenant_id, email, name, role, status, password_hash, created_by)
VALUES (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'operador@exemplo.gov.br',
    'Operador Exemplo',
    'OPERATOR',
    'active',
    '$2b$12$PLACEHOLDER_HASH_OPERATOR_DO_NOT_USE_IN_PRODUCTION',
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
    '$2b$12$PLACEHOLDER_HASH_AUDITOR_DO_NOT_USE_IN_PRODUCTION',
    '00000000-0000-0000-0001-000000000001'
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

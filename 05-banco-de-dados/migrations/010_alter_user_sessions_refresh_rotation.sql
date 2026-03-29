-- Rotação de refresh token: permite detectar reuso do token anterior após rotação.
-- Hash anterior armazenado para distinguir token inválido de tentativa de reuso (replay).

ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS previous_refresh_token_hash VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_previous_refresh_token_uq
  ON user_sessions (previous_refresh_token_hash)
  WHERE previous_refresh_token_hash IS NOT NULL;

COMMENT ON COLUMN user_sessions.previous_refresh_token_hash IS
  'Hash do refresh token substituído na última rotação; usado para detecção de reuso.';

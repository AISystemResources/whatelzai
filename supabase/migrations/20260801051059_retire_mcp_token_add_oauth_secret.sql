-- SPRINT-100: retire the singleton MCP_TOKEN. OAuth now issues per-login
-- auth_tokens; the shared secret is no longer authoritative for anything.
DELETE FROM system_config WHERE key = 'mcp_token';

-- New key: HMAC signing secret for OAuth authorization codes. Auto-generated
-- on first insert. Rotating this invalidates in-flight codes (10-min TTL);
-- issued auth_tokens are unaffected.
INSERT INTO system_config (key, value)
VALUES ('oauth_code_secret', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

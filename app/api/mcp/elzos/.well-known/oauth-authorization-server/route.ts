import { baseUrl, jsonWithCors } from "@/lib/mcp-discovery";

export async function GET(req: Request) {
  const base = baseUrl(req);
  return jsonWithCors({
    issuer: `${base}/api/mcp/elzos`,
    authorization_endpoint: `${base}/api/mcp/elzos/oauth/authorize`,
    token_endpoint: `${base}/api/mcp/elzos/oauth/token`,
    registration_endpoint: `${base}/api/mcp/elzos/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    // RFC 9207 — we include `iss` in the authorization redirect.
    authorization_response_iss_parameter_supported: true,
  });
}

import { NextResponse } from "next/server";

export function baseUrl(req: Request): string {
  if (process.env.NEXT_PUBLIC_MCP_BASE_URL) {
    return process.env.NEXT_PUBLIC_MCP_BASE_URL;
  }
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export function jsonWithCors(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

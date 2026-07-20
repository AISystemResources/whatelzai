#!/usr/bin/env node
import { Command } from "commander";
import { login, loadToken, clearToken, ORIGIN } from "./auth.js";
import { callVerb } from "./mcp.js";

const program = new Command();
program
  .name("whatelz")
  .description(
    "CLI for whatelz.ai — token-efficient companion to the HTTP MCP",
  )
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate against whatelz.ai via browser OAuth (PKCE)")
  .action(async () => {
    const t = await login();
    console.log(`Logged in to ${t.origin}`);
    console.log(`Token stored at ~/.config/whatelz/token.json (chmod 600)`);
    console.log(`Expires: ${new Date(t.expires_at * 1000).toISOString()}`);
  });

program
  .command("logout")
  .description("Remove stored credentials")
  .action(async () => {
    await clearToken();
    console.log("Logged out.");
  });

program
  .command("whoami")
  .description("Show current login state and ping the MCP")
  .action(async () => {
    const t = await loadToken();
    if (!t) {
      console.log("Not logged in.");
      process.exit(1);
    }
    console.log(`origin:  ${t.origin}`);
    console.log(`expires: ${new Date(t.expires_at * 1000).toISOString()}`);
    try {
      const info = (await callVerb("describe_tools")) as {
        tools?: Array<unknown>;
      };
      const n = Array.isArray(info?.tools) ? info.tools.length : 0;
      console.log(`mcp:     reachable (${n} verbs)`);
    } catch (err) {
      console.log(`mcp:     unreachable — ${(err as Error).message}`);
      process.exit(1);
    }
  });

program
  .command("call <verb>")
  .description("Call an MCP verb by name; args as JSON via --args")
  .option("--args <json>", "JSON-encoded arguments object", "{}")
  .action(async (verb: string, opts: { args: string }) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(opts.args);
    } catch {
      console.error(`invalid --args JSON: ${opts.args}`);
      process.exit(1);
    }
    const result = await callVerb(verb, args);
    console.log(
      typeof result === "string" ? result : JSON.stringify(result, null, 2),
    );
  });

program
  .command("verbs")
  .description("List every MCP verb this server exposes with descriptions")
  .action(async () => {
    const info = (await callVerb("describe_tools")) as {
      tools?: Array<{ name: string; description: string }>;
    };
    for (const t of info.tools ?? []) {
      console.log(`${t.name}\n  ${t.description}\n`);
    }
  });

// Show the resolved origin in --help output for debugging env overrides.
program.addHelpText(
  "after",
  `\nOrigin: ${ORIGIN}\nOverride with WHATELZ_ORIGIN=<url>`,
);

await program.parseAsync(process.argv);

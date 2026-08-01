#!/usr/bin/env node
import { Command } from "commander";
import {
  login,
  loadToken,
  clearToken,
  listProfiles,
  ORIGIN,
  currentProfile,
} from "./auth.js";
import { callVerb } from "./mcp.js";
import { runStdioServer } from "./stdio.js";

const program = new Command();
program
  .name("whatelz")
  .description("CLI for whatelz.ai — token-efficient companion to the HTTP MCP")
  .version("0.2.0")
  .option(
    "--profile <name>",
    "credential profile (default: WHATELZ_PROFILE or 'default')",
  )
  .hook("preAction", (thisCmd) => {
    const opts = thisCmd.opts<{ profile?: string }>();
    if (opts.profile) process.env.WHATELZ_PROFILE = opts.profile;
  });

program
  .command("login")
  .description("Authenticate against whatelz.ai via browser OAuth (PKCE)")
  .action(async () => {
    const profile = currentProfile();
    const t = await login(profile);
    console.log(`Logged in to ${t.origin} as profile "${profile}"`);
    console.log(
      `Token stored at ~/.config/whatelz/credentials/${profile}.json (chmod 600)`,
    );
    console.log(
      `Recommended refresh: ${new Date(t.expires_at * 1000).toISOString()}`,
    );
  });

program
  .command("logout")
  .description("Remove stored credentials for the active profile")
  .action(async () => {
    const profile = currentProfile();
    await clearToken(profile);
    console.log(`Logged out of profile "${profile}".`);
  });

program
  .command("profiles")
  .description("List all local credential profiles")
  .action(async () => {
    const profiles = await listProfiles();
    if (profiles.length === 0) {
      console.log("No profiles found. Run 'whatelz login' to create one.");
      return;
    }
    const active = currentProfile();
    for (const p of profiles) {
      console.log(`${p === active ? "* " : "  "}${p}`);
    }
  });

program
  .command("whoami")
  .description("Show current login state and ping the MCP")
  .action(async () => {
    const profile = currentProfile();
    const t = await loadToken(profile);
    if (!t) {
      console.log(`Not logged in (profile: ${profile}).`);
      process.exit(1);
    }
    console.log(`profile: ${profile}`);
    console.log(`origin:  ${t.origin}`);
    console.log(`refresh: ${new Date(t.expires_at * 1000).toISOString()}`);
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

program
  .command("mcp")
  .description(
    "Run an MCP server over stdio (register in Claude Code .mcp.json)",
  )
  .action(async () => {
    await runStdioServer();
  });

// Show the resolved origin in --help output for debugging env overrides.
program.addHelpText(
  "after",
  `\nOrigin: ${ORIGIN}\nOverride with WHATELZ_ORIGIN=<url>\nProfile: ${currentProfile()}\nOverride with --profile <name> or WHATELZ_PROFILE=<name>`,
);

await program.parseAsync(process.argv);

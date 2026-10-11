#!/usr/bin/env bun
import { Command } from "commander";
import pc from "picocolors";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { parse as parseYaml } from "yaml";
import { PersonaResolver } from "../src/core/loader.ts";
import { AdapterRegistry } from "../src/adapters/registry.ts";
import { buildIR } from "../src/core/ir.ts";
import { renderPrompt } from "../src/core/render.ts";
import { findUnknownPlaceholders } from "../src/core/variables.ts";

const program = new Command();

program
  .name("personaforge")
  .description("Universal Persona AI Engine: Compile rich personas to multi-agent harnesses (Ollama, Claude, Cursor, CrewAI, etc.)")
  .version("2.0.0");

const registry = AdapterRegistry.getInstance();
const customHarnessCount = registry.autoDiscoverCustomHarnesses("./custom_harnesses");
const resolver = new PersonaResolver();

function parseKeyValuePairs(items?: string[]): Record<string, string> {
  if (!items || items.length === 0) return {};
  const out: Record<string, string> = {};
  for (const item of items) {
    const idx = item.indexOf("=");
    if (idx === -1) throw new Error(`Format variabel harus key=value: '${item}'`);
    out[item.slice(0, idx).trim()] = item.slice(idx + 1).trim();
  }
  return out;
}

function parseSetPairs(items?: string[]): Array<[string, unknown]> {
  if (!items || items.length === 0) return [];
  const out: Array<[string, unknown]> = [];
  for (const item of items) {
    const idx = item.indexOf("=");
    if (idx === -1) throw new Error(`Format --set harus path=value: '${item}'`);
    const path = item.slice(0, idx).trim();
    const rawVal = item.slice(idx + 1).trim();
    let val: unknown = rawVal;
    try {
      val = parseYaml(rawVal);
    } catch {
      val = rawVal;
    }
    out.push([path, val]);
  }
  return out;
}

// 1. Command: list
program
  .command("list")
  .description("List all available personas in presets and local directories")
  .action(() => {
    const personas = resolver.listPersonas();
    console.log(pc.bold(pc.cyan(`\n🎭 Available Personas (${personas.length}):`)));
    console.log(pc.gray("---------------------------------------------------------------------------------------------------------"));
    console.log(`${pc.bold("ID").padEnd(30)} ${pc.bold("NAME").padEnd(16)} ${pc.bold("ROLE").padEnd(20)} ${pc.bold("TAGLINE")}`);
    console.log(pc.gray("---------------------------------------------------------------------------------------------------------"));

    for (const p of personas) {
      const roleStr = p.role ? pc.yellow(p.role.padEnd(20)) : pc.dim("-".padEnd(20));
      console.log(`${pc.green(p.id.padEnd(30))} ${pc.bold(p.name.padEnd(16))} ${roleStr} ${pc.white(p.tagline)}`);
    }
    console.log("");
  });

// 2. Command: roles
program
  .command("roles")
  .description("List all modular roles available for composition")
  .action(() => {
    const roles = resolver.listRoles();
    console.log(pc.bold(pc.yellow(`\n💼 Available Roles (${roles.length}):`)));
    console.log(pc.gray("--------------------------------------------------------------------------------"));
    console.log(`${pc.bold("ID").padEnd(24)} ${pc.bold("NAME").padEnd(28)} ${pc.bold("DESCRIPTION")}`);
    console.log(pc.gray("--------------------------------------------------------------------------------"));

    for (const r of roles) {
      console.log(`${pc.cyan(r.id.padEnd(24))} ${pc.bold(r.name.padEnd(28))} ${pc.white(r.description)}`);
    }
    console.log("");
  });

// 3. Command: traits
program
  .command("traits")
  .description("List all mixin traits that can be attached to personas")
  .action(() => {
    const traits = resolver.listTraits();
    console.log(pc.bold(pc.magenta(`\n🧩 Available Traits (${traits.length}):`)));
    console.log(pc.gray("--------------------------------------------------------------------------------"));
    console.log(`${pc.bold("ID").padEnd(22)} ${pc.bold("NAME").padEnd(24)} ${pc.bold("DESCRIPTION")}`);
    console.log(pc.gray("--------------------------------------------------------------------------------"));

    for (const t of traits) {
      console.log(`${pc.green(t.id.padEnd(22))} ${pc.bold(t.name.padEnd(24))} ${pc.white(t.description)}`);
    }
    console.log("");
  });

// 4. Command: harnesses
program
  .command("harnesses")
  .description("List all supported agentic harnesses and output targets")
  .action(() => {
    const harnesses = registry.list();
    console.log(pc.bold(pc.magenta(`\n⚡ Supported Harnesses (${harnesses.length}):`)));
    if (customHarnessCount > 0) {
      console.log(pc.dim(`  (${customHarnessCount} custom harness(es) loaded from ./custom_harnesses)`));
    }
    console.log(pc.gray("-----------------------------------------------------------------------------------------------------"));
    console.log(`${pc.bold("HARNESS ID").padEnd(18)} ${pc.bold("CATEGORY").padEnd(14)} ${pc.bold("TYPE").padEnd(12)} ${pc.bold("DESCRIPTION")}`);
    console.log(pc.gray("-----------------------------------------------------------------------------------------------------"));

    for (const h of harnesses) {
      const typeTag = h.isCustom ? pc.cyan("[CUSTOM]") : pc.green("[BUILTIN]");
      const cat = pc.yellow((h.category || "general").padEnd(14));
      console.log(`${pc.bold(h.id.padEnd(18))} ${cat} ${typeTag.padEnd(20)} ${pc.white(h.description)}`);
    }
    console.log("");
  });

// 5. Command: inspect
program
  .command("inspect <id>")
  .description("Inspect detailed attributes, variables, role, and layers of a persona")
  .option("--var <key=value...>", "Custom variable value overrides")
  .option("--role <role>", "Override role")
  .option("--with-trait <trait...>", "Attach traits")
  .action((id: string, options: { var?: string[]; role?: string; withTrait?: string[] }) => {
    try {
      const vars = parseKeyValuePairs(options.var);
      const res = resolver.resolve(id, {
        vars,
        role: options.role,
        traits: options.withTrait,
      });
      const p = res.persona;
      const c = p.character;

      console.log(pc.bold(pc.cyan(`\n🔍 Persona Inspection: ${p.name} (${p.id})`)));
      console.log(pc.gray("===================================================================="));
      console.log(`${pc.bold("Name:")}         ${p.name}`);
      console.log(`${pc.bold("Tagline:")}      ${p.tagline || "-"}`);
      console.log(`${pc.bold("Language:")}     ${p.language.primary} (code-switch: ${p.language.code_switch.join(", ") || "-"})`);
      console.log(`${pc.bold("Role:")}         ${p.role ? `${p.role.name} (${p.role.id})` : "-"}`);
      console.log(`${pc.bold("Tone:")}         ${p.voice.tone}`);
      console.log(`${pc.bold("Register:")}     ${p.voice.register}`);
      console.log(`${pc.bold("Verbosity:")}    ${p.voice.verbosity}`);
      console.log(`${pc.bold("Boundaries:")}   ${p.boundaries.preset}`);

      if (Object.keys(p.variables).length > 0) {
        console.log(pc.bold("\nVariables:"));
        for (const [k, v] of Object.entries(p.variables)) {
          const current = res.variables[k] || v.default;
          console.log(`  - ${pc.yellow(k)} = ${pc.green(`"${current}"`)} (default: "${v.default}"${v.enum ? `, enum: [${v.enum.join(", ")}]` : ""})`);
        }
      }

      if (c.personality.traits.length > 0) {
        console.log(`\n${pc.bold("Personality Traits:")} ${c.personality.traits.join(", ")}`);
      }

      if (c.personality.big_five) {
        console.log(pc.bold("\nBig-Five Profile:"));
        for (const [k, v] of Object.entries(c.personality.big_five)) {
          console.log(`  - ${k.padEnd(20)}: ${pc.yellow(String(v))}`);
        }
      }

      if (p.examples.length > 0) {
        console.log(`\n${pc.bold("Few-Shot Examples:")} ${p.examples.length} dialogues defined`);
      }

      console.log(`\n${pc.bold("Layers Resolved:")}`);
      for (const l of res.layers) {
        console.log(`  ${pc.green("•")} ${l}`);
      }
      console.log("");
    } catch (e: any) {
      console.error(pc.red(`Error: ${e.message}`));
      process.exit(1);
    }
  });

// 6. Command: preview
program
  .command("preview <id>")
  .description("Preview the rendered system prompt directly on console")
  .option("--style <style>", "Render style: markdown, xml, plain", "markdown")
  .option("--var <key=value...>", "Variable overrides")
  .option("--role <role>", "Override role")
  .option("--with-trait <trait...>", "Attach traits")
  .action((id: string, options: { style: string; var?: string[]; role?: string; withTrait?: string[] }) => {
    try {
      const vars = parseKeyValuePairs(options.var);
      const res = resolver.resolve(id, {
        vars,
        role: options.role,
        traits: options.withTrait,
      });
      const ir = buildIR(res);
      const text = renderPrompt(ir, { style: options.style as any });
      console.log("\n" + text + "\n");
    } catch (e: any) {
      console.error(pc.red(`Error: ${e.message}`));
      process.exit(1);
    }
  });

// 7. Command: validate
program
  .command("validate <ref>")
  .description("Validate a persona or file against UPS v2 schema and check placeholders")
  .action((ref: string) => {
    try {
      const res = resolver.resolve(ref);
      const unknown = findUnknownPlaceholders(res.persona);
      console.log(pc.green(`✔ Persona '${res.persona.name}' (${res.persona.id}) is valid!`));
      console.log(`  - Tagline: ${res.persona.tagline}`);
      console.log(`  - Language: ${res.persona.language.primary}`);
      console.log(`  - Role: ${res.persona.role?.name ?? "(none)"}`);
      console.log(`  - Examples: ${res.persona.examples.length}`);
      if (unknown.length > 0) {
        console.log(pc.yellow(`  ⚠ Warning: Unrecognized template placeholders: ${unknown.join(", ")}`));
      }
    } catch (e: any) {
      console.error(pc.red(`✖ Validation failed: ${e.message}`));
      process.exit(1);
    }
  });

// 8. Command: export
program
  .command("export <persona-id>")
  .description("Compile a persona into a specific agentic harness output")
  .option("-t, --target <harness>", "Target harness (e.g. prompt, ollama, claude, openai, cursor, crewai, hermes, etc.)", "prompt")
  .option("-o, --out <path>", "Output file path (default: stdout)")
  .option("--var <key=value...>", "Custom variable overrides")
  .option("--role <role>", "Override role")
  .option("--with-trait <trait...>", "Attach traits")
  .option("--set <path=value...>", "Direct path overrides (e.g. voice.verbosity=0.2)")
  .action((personaId: string, options: { target: string; out?: string; var?: string[]; role?: string; withTrait?: string[]; set?: string[] }) => {
    try {
      const vars = parseKeyValuePairs(options.var);
      const sets = parseSetPairs(options.set);

      const resolved = resolver.resolve(personaId, {
        vars,
        role: options.role,
        traits: options.withTrait,
        set: sets,
      });

      const adapter = registry.get(options.target);
      if (!adapter) {
        console.error(pc.red(`Error: Target harness '${options.target}' is not registered.`));
        console.log(pc.yellow(`Run 'personaforge harnesses' to view all available harnesses.`));
        process.exit(1);
      }

      const ir = buildIR(resolved);
      const output = adapter.compile(ir);

      if (options.out) {
        const targetPath = resolve(options.out);
        const dir = dirname(targetPath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(targetPath, output.content, "utf-8");
        console.log(pc.green(`✔ Successfully compiled '${resolved.persona.name}' to ${adapter.name}!`));
        console.log(pc.cyan(`  Saved to: ${targetPath}`));
      } else {
        console.log(output.content);
      }
    } catch (e: any) {
      console.error(pc.red(`Error: ${e.message}`));
      process.exit(1);
    }
  });

// 9. Command: export-all
program
  .command("export-all <persona-id>")
  .description("Compile a persona to ALL registered harnesses simultaneously into a directory")
  .option("-d, --dir <directory>", "Target directory", "./dist/manifests")
  .option("--var <key=value...>", "Custom variable overrides")
  .option("--role <role>", "Override role")
  .option("--with-trait <trait...>", "Attach traits")
  .option("--set <path=value...>", "Direct path overrides")
  .action((personaId: string, options: { dir: string; var?: string[]; role?: string; withTrait?: string[]; set?: string[] }) => {
    try {
      const vars = parseKeyValuePairs(options.var);
      const sets = parseSetPairs(options.set);

      const resolved = resolver.resolve(personaId, {
        vars,
        role: options.role,
        traits: options.withTrait,
        set: sets,
      });

      const harnesses = registry.list();
      const outDir = resolve(options.dir, resolved.persona.id);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

      console.log(pc.bold(pc.cyan(`\n🚀 Compiling '${resolved.persona.name}' to ${harnesses.length} Harnesses...`)));

      const ir = buildIR(resolved);
      for (const h of harnesses) {
        const adapter = registry.get(h.id)!;
        const res = adapter.compile(ir);
        const dest = resolve(outDir, res.filename);
        writeFileSync(dest, res.content, "utf-8");
        console.log(`  ${pc.green("✔")} ${adapter.name.padEnd(42)} -> ${pc.yellow(res.filename)}`);
      }

      console.log(pc.bold(pc.green(`\n✨ Complete! All manifests generated in: ${outDir}\n`)));
    } catch (e: any) {
      console.error(pc.red(`Error: ${e.message}`));
      process.exit(1);
    }
  });

// 10. Command: new (create persona from template or extend base)
program
  .command("new <id>")
  .description("Create a new persona YAML file in ./personas/")
  .option("--from <base>", "Base persona to inherit from via 'extends'")
  .option("-n, --name <name>", "Display name for the persona")
  .action((id: string, options: { from?: string; name?: string }) => {
    const dir = resolve("./personas");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const filePath = join(dir, `${id}.yaml`);
    if (existsSync(filePath)) {
      console.error(pc.red(`Error: File already exists: ${filePath}`));
      process.exit(1);
    }

    const personaName = options.name || id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    const content = options.from
      ? `# yaml-language-server: $schema=../src/schema/persona.schema.json
kind: persona
schema_version: "2.0"
id: "${id}"
name: "${personaName}"
extends: "${options.from}"

# Override or extend specific attributes below:
voice:
  tone: "customized tone"
`
      : `# yaml-language-server: $schema=../src/schema/persona.schema.json
kind: persona
schema_version: "2.0"
id: "${id}"
name: "${personaName}"
tagline: "Brief description of your persona"
version: "1.0.0"

language:
  primary: "id"

variables:
  user_name:
    default: "kamu"

character:
  bio: "Bio and core identity of ${personaName}."
  backstory:
    - "First backstory entry."
  personality:
    traits: ["friendly", "helpful"]
  relationship:
    role_to_user: "companion"
    address_user_as: "{{user_name}}"

voice:
  tone: "warm and clear"
  register: "conversational"
  verbosity: 0.5
  catchphrases:
    - "Senang bisa membantu {{user_name}}!"

examples:
  - user: "Halo!"
    assistant: "Halo {{user_name}}, ada yang bisa kubantu hari ini?"

boundaries:
  preset: "standard"

runtime:
  temperature: 0.7
`;

    writeFileSync(filePath, content, "utf-8");
    console.log(pc.green(`✔ Created persona: ${filePath}`));
    if (options.from) {
      console.log(pc.cyan(`  Inheriting from '${options.from}'. Try previewing: personaforge preview ${id}`));
    }
  });

// 11. Command: add-harness
program
  .command("add-harness <id> <name>")
  .description("Create a new custom harness definition template in ./custom_harnesses/")
  .option("-f, --format <format>", "Output format: markdown, json, yaml, python", "markdown")
  .action((id: string, name: string, options: { format: string }) => {
    const harnessDir = resolve("./custom_harnesses");
    if (!existsSync(harnessDir)) mkdirSync(harnessDir, { recursive: true });

    const filePath = resolve(harnessDir, `${id}.yaml`);
    if (existsSync(filePath)) {
      console.error(pc.red(`Error: Harness definition already exists: ${filePath}`));
      process.exit(1);
    }

    const templateContent = `schema_version: "1.0"
id: "${id}"
name: "${name}"
description: "Custom declarative agent harness for ${name}"
output_format: "${options.format}"
default_filename: "{id}.${id}.${options.format === "python" ? "py" : options.format === "json" ? "json" : "txt"}"

sections:
  header: "# Custom Agent Harness: ${name}\\n"
  identity_prefix: "### IDENTITY\\n"
  psychometrics_prefix: "### PSYCHOMETRICS\\n"
  style_prefix: "### STYLE & TONE\\n"
  reasoning_prefix: "### REASONING\\n"
  tools_prefix: "### TOOLS\\n"

tool_calling_convention:
  type: "json_markdown"
  call_tag: "action"
`;

    writeFileSync(filePath, templateContent, "utf-8");
    console.log(pc.green(`✔ Created custom harness template: ${filePath}`));
  });

program.parse(process.argv);

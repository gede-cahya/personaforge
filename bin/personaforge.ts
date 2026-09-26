#!/usr/bin/env bun
import { Command } from "commander";
import pc from "picocolors";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { PersonaLoader } from "../src/core/loader.ts";
import { AdapterRegistry } from "../src/adapters/registry.ts";

const program = new Command();

program
  .name("personaforge")
  .description("Universal Persona AI Engine: Compile rich personas to multi-agent harnesses (Hermes, Antigravity, Custom, etc.)")
  .version("1.0.0");

// Inisialisasi Registry & Loader
const registry = AdapterRegistry.getInstance();

// Auto-discover custom harnesses dari folder lokal jika ada
const customHarnessCount = registry.autoDiscoverCustomHarnesses("./custom_harnesses");

const loader = new PersonaLoader();

// 1. Command: list
program
  .command("list")
  .description("List all available personas in presets and local directories")
  .action(() => {
    const personas = loader.listAvailablePersonas();
    console.log(pc.bold(pc.cyan(`\n🎭 Available Personas (${personas.length}):`)));
    console.log(pc.gray("--------------------------------------------------------------------------------"));
    console.log(`${pc.bold("ID").padEnd(32)} ${pc.bold("NAME").padEnd(30)} ${pc.bold("TITLE")}`);
    console.log(pc.gray("--------------------------------------------------------------------------------"));
    
    for (const p of personas) {
      console.log(`${pc.green(p.id.padEnd(32))} ${pc.yellow(p.name.padEnd(30))} ${pc.white(p.title)}`);
    }
    console.log("");
  });

// 2. Command: harnesses
program
  .command("harnesses")
  .description("List all supported agentic harnesses (including Hermes, Antigravity, and Custom)")
  .action(() => {
    const harnesses = registry.list();
    console.log(pc.bold(pc.magenta(`\n⚡ Supported Agentic Harnesses (${harnesses.length}):`)));
    if (customHarnessCount > 0) {
      console.log(pc.dim(`  (${customHarnessCount} custom harness(es) loaded from ./custom_harnesses)`));
    }
    console.log(pc.gray("--------------------------------------------------------------------------------"));
    console.log(`${pc.bold("HARNESS ID").padEnd(16)} ${pc.bold("TYPE").padEnd(12)} ${pc.bold("DESCRIPTION")}`);
    console.log(pc.gray("--------------------------------------------------------------------------------"));

    for (const h of harnesses) {
      const typeTag = h.isCustom ? pc.cyan("[CUSTOM]") : pc.green("[BUILTIN]");
      console.log(`${pc.bold(h.id.padEnd(16))} ${typeTag.padEnd(20)} ${pc.white(h.description)}`);
    }
    console.log("");
  });

// 3. Command: inspect
program
  .command("inspect <id>")
  .description("Inspect detailed attributes, psychometrics, and reasoning mode of a persona")
  .action((id: string) => {
    try {
      const persona = loader.loadById(id);
      console.log(pc.bold(pc.cyan(`\n🔍 Persona Inspection: ${persona.name} (${persona.id})`)));
      console.log(pc.gray("===================================================================="));
      console.log(`${pc.bold("Title:")}       ${persona.identity.title}`);
      console.log(`${pc.bold("Bio:")}         ${persona.identity.bio}`);
      console.log(`${pc.bold("Tone:")}        ${persona.linguistic_style.tone}`);
      console.log(`${pc.bold("Conciseness:")} ${persona.linguistic_style.conciseness}`);
      console.log(`${pc.bold("Reasoning:")}   ${persona.reasoning_protocol.mode}`);
      console.log(`${pc.bold("Big-5 Profile:")}`);
      console.log(`  - Openness:          ${pc.yellow(String(persona.psychometrics.openness))}`);
      console.log(`  - Conscientiousness: ${pc.yellow(String(persona.psychometrics.conscientiousness))}`);
      console.log(`  - Extraversion:      ${pc.yellow(String(persona.psychometrics.extraversion))}`);
      console.log(`  - Agreeableness:     ${pc.yellow(String(persona.psychometrics.agreeableness))}`);
      console.log(`  - Neuroticism:       ${pc.yellow(String(persona.psychometrics.neuroticism))}`);
      
      if (persona.identity.lore.length > 0) {
        console.log(`${pc.bold("Lore:")}`);
        for (const l of persona.identity.lore) {
          console.log(`  * ${l}`);
        }
      }
      console.log("");
    } catch (e: any) {
      console.error(pc.red(`Error: ${e.message}`));
      process.exit(1);
    }
  });

// 4. Command: export
program
  .command("export <persona-id>")
  .description("Compile a persona into a specific agentic harness output")
  .requiredOption("-t, --target <harness>", "Target harness (e.g. hermes, antigravity, claude, openai, autogen, dify)")
  .option("-o, --out <path>", "Output file path (default: printed to stdout or auto-named)")
  .action((personaId: string, options: { target: string; out?: string }) => {
    try {
      const persona = loader.loadById(personaId);
      const adapter = registry.get(options.target);

      if (!adapter) {
        console.error(pc.red(`Error: Target harness '${options.target}' is not registered.`));
        console.log(pc.yellow(`Run 'personaforge harnesses' to view all available harnesses.`));
        process.exit(1);
      }

      const output = adapter.compile(persona);

      if (options.out) {
        const targetPath = resolve(options.out);
        const dir = dirname(targetPath);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        writeFileSync(targetPath, output.content, "utf-8");
        console.log(pc.green(`✔ Successfully compiled '${persona.name}' to ${adapter.name}!`));
        console.log(pc.cyan(`  Saved to: ${targetPath}`));
      } else {
        console.log(output.content);
      }
    } catch (e: any) {
      console.error(pc.red(`Error: ${e.message}`));
      process.exit(1);
    }
  });

// 5. Command: export-all
program
  .command("export-all <persona-id>")
  .description("Compile a persona to ALL registered harnesses simultaneously into a directory")
  .option("-d, --dir <directory>", "Target directory", "./dist/manifests")
  .action((personaId: string, options: { dir: string }) => {
    try {
      const persona = loader.loadById(personaId);
      const harnesses = registry.list();
      const outDir = resolve(options.dir, persona.id);
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

      console.log(pc.bold(pc.cyan(`\n🚀 Compiling '${persona.name}' to ${harnesses.length} Agentic Harnesses...`)));

      for (const h of harnesses) {
        const adapter = registry.get(h.id)!;
        const res = adapter.compile(persona);
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

// 6. Command: harness add (Wizard template)
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
  header: "# Custom Agent Harness: ${name}\n"
  identity_prefix: "### IDENTITY\n"
  psychometrics_prefix: "### PSYCHOMETRICS\n"
  style_prefix: "### STYLE & TONE\n"
  reasoning_prefix: "### REASONING\n"
  tools_prefix: "### TOOLS\n"

tool_calling_convention:
  type: "json_markdown"
  call_tag: "action"

# Optional custom template with variable interpolation:
# custom_template: |
#   Role: {{name}} ({{title}})
#   Bio: {{bio}}
#   Tone: {{tone}}
#   Mode: {{reasoning_mode}}
`;

    writeFileSync(filePath, templateContent, "utf-8");
    console.log(pc.green(`✔ Created custom harness template: ${filePath}`));
    console.log(pc.cyan(`You can now customize it and export personas with: personaforge export <id> -t ${id}`));
  });

program.parse(process.argv);

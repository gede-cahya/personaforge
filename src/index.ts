import { PersonaResolver, type ResolveOptions } from "./core/loader.ts";
import { buildIR, type PromptIR } from "./core/ir.ts";
import { renderPrompt, type RenderStyle } from "./core/render.ts";
import { AdapterRegistry } from "./adapters/registry.ts";
import type { HarnessOutput } from "./adapters/base.ts";
import type { PersonaSpec } from "./schema/ups.ts";

export * from "./schema/ups.ts";
export * from "./schema/custom-harness.ts";
export * from "./schema/migrate.ts";
export * from "./core/merge.ts";
export * from "./core/variables.ts";
export * from "./core/sources.ts";
export * from "./core/loader.ts";
export * from "./core/escape.ts";
export * from "./core/ir.ts";
export * from "./core/render.ts";
export * from "./core/composer.ts";
export * from "./adapters/base.ts";
export * from "./adapters/hermes.ts";
export * from "./adapters/antigravity.ts";
export * from "./adapters/custom.ts";
export * from "./adapters/claude.ts";
export * from "./adapters/openai.ts";
export * from "./adapters/crewai.ts";
export * from "./adapters/langgraph.ts";
export * from "./adapters/ollama.ts";
export * from "./adapters/elizaos.ts";
export * from "./adapters/smara.ts";
export * from "./adapters/prompt.ts";
export * from "./adapters/json.ts";
export * from "./adapters/agents-md.ts";
export * from "./adapters/cursor.ts";
export * from "./adapters/claude-code.ts";
export * from "./adapters/character-card.ts";
export * from "./adapters/registry.ts";

export interface CompileOptions extends ResolveOptions {
  /** Target harness ID (default: "prompt") */
  target?: string;
  /** Gaya render system prompt markdown/xml/plain (jika memakai target prompt) */
  renderStyle?: RenderStyle;
  /** Custom harnesses directory to scan */
  customHarnessesDir?: string;
}

export interface CompileResult {
  persona: PersonaSpec;
  output: HarnessOutput;
  systemPrompt: string;
  ir: PromptIR;
  layers: string[];
  variables: Record<string, string>;
}

/**
 * High-level API: Resolve dan compile persona ke harness target dalam satu pemanggilan fungsi.
 *
 * Contoh penggunaan:
 * ```ts
 * const { output, systemPrompt } = compile("yandere-girlfriend", {
 *   target: "ollama",
 *   vars: { user_name: "Cahya" },
 *   traits: ["concise"],
 * });
 * ```
 */
export function compile(ref: string, options: CompileOptions = {}): CompileResult {
  const resolver = new PersonaResolver();
  const registry = AdapterRegistry.getInstance();

  if (options.customHarnessesDir) {
    registry.autoDiscoverCustomHarnesses(options.customHarnessesDir);
  }

  const resolved = resolver.resolve(ref, options);
  const ir = buildIR(resolved);

  const targetId = options.target || "prompt";
  const adapter = registry.get(targetId);

  if (!adapter) {
    const available = registry.list().map((h) => h.id);
    throw new Error(`Target harness '${targetId}' tidak terdaftar. Pilihan: ${available.join(", ")}`);
  }

  const output = adapter.compile(ir);
  const systemPrompt = renderPrompt(ir, { style: options.renderStyle || "markdown" });

  return {
    persona: resolved.persona,
    output,
    systemPrompt,
    ir,
    layers: resolved.layers,
    variables: resolved.variables,
  };
}

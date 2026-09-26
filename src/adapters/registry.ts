import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { HarnessAdapter } from "./base.ts";
import { HermesAdapter } from "./hermes.ts";
import { AntigravityAdapter } from "./antigravity.ts";
import { ClaudeAdapter } from "./claude.ts";
import { OpenAIAdapter } from "./openai.ts";
import { CrewAIAdapter } from "./crewai.ts";
import { LangGraphAdapter } from "./langgraph.ts";
import { OllamaAdapter } from "./ollama.ts";
import { ElizaOSAdapter } from "./elizaos.ts";
import { SmaraAdapter } from "./smara.ts";
import { CustomHarnessAdapter } from "./custom.ts";
import { CustomHarnessSchema, type CustomHarnessSpec } from "../schema/custom-harness.ts";

export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters: Map<string, HarnessAdapter> = new Map();
  private customIds: Set<string> = new Set();

  private constructor() {
    this.registerBuiltins();
  }

  public static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  private registerBuiltins(): void {
    // Built-in primary adapters
    this.register(new HermesAdapter());
    this.register(new AntigravityAdapter());
    this.register(new ClaudeAdapter());
    this.register(new OpenAIAdapter());
    this.register(new CrewAIAdapter());
    this.register(new LangGraphAdapter());
    this.register(new OllamaAdapter());
    this.register(new ElizaOSAdapter());
    this.register(new SmaraAdapter());
  }

  public register(adapter: HarnessAdapter, isCustom = false): void {
    this.adapters.set(adapter.id.toLowerCase(), adapter);
    if (isCustom) {
      this.customIds.add(adapter.id.toLowerCase());
    }
  }

  public get(id: string): HarnessAdapter | undefined {
    return this.adapters.get(id.toLowerCase());
  }

  public list(): Array<{ id: string; name: string; description: string; isCustom: boolean }> {
    return Array.from(this.adapters.values()).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      isCustom: this.customIds.has(a.id.toLowerCase()),
    }));
  }

  public registerCustomFromSpec(spec: CustomHarnessSpec): HarnessAdapter {
    const validated = CustomHarnessSchema.parse(spec);
    const adapter = new CustomHarnessAdapter(validated);
    this.register(adapter, true);
    return adapter;
  }

  public registerCustomFromFile(filePath: string): HarnessAdapter {
    const fullPath = resolve(filePath);
    if (!existsSync(fullPath)) {
      throw new Error(`Custom harness definition file not found: ${fullPath}`);
    }
    const raw = readFileSync(fullPath, "utf-8");
    const data = fullPath.endsWith(".json") ? JSON.parse(raw) : parseYaml(raw);
    const validated = CustomHarnessSchema.parse(data);
    const adapter = new CustomHarnessAdapter(validated);
    this.register(adapter, true);
    return adapter;
  }

  /**
   * Memindai folder direktori untuk auto-discovery custom harness definitions
   */
  public autoDiscoverCustomHarnesses(dirPath: string): number {
    const targetDir = resolve(dirPath);
    if (!existsSync(targetDir)) return 0;

    let loadedCount = 0;
    const files = readdirSync(targetDir);
    for (const file of files) {
      if (file.endsWith(".yaml") || file.endsWith(".yml") || file.endsWith(".json")) {
        try {
          this.registerCustomFromFile(join(targetDir, file));
          loadedCount++;
        } catch (e) {
          console.warn(`[AdapterRegistry] Failed to load custom harness from ${file}:`, e);
        }
      }
    }
    return loadedCount;
  }
}

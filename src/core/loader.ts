import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { PersonaSchema, type PersonaSpec } from "../schema/ups.ts";
import { PersonaComposer } from "./composer.ts";

export class PersonaLoader {
  private searchPaths: string[] = [];
  private cache: Map<string, PersonaSpec> = new Map();

  constructor(additionalPaths: string[] = []) {
    this.searchPaths = [
      resolve("./presets/personas"),
      resolve("./presets/traits"),
      resolve("./personas"),
      ...additionalPaths.map((p) => resolve(p)),
    ];
  }

  public loadFromFile(filePath: string): PersonaSpec {
    const fullPath = resolve(filePath);
    if (!existsSync(fullPath)) {
      throw new Error(`Persona file not found: ${fullPath}`);
    }

    const raw = readFileSync(fullPath, "utf-8");
    const data = fullPath.endsWith(".json") ? JSON.parse(raw) : parseYaml(raw);

    let spec = PersonaSchema.parse(data);

    // Selesaikan extends jika ada
    if (spec.extends) {
      const baseSpec = this.loadById(spec.extends);
      spec = PersonaComposer.merge(baseSpec, spec);
    }

    // Selesaikan mixins jika ada
    if (spec.mixins && spec.mixins.length > 0) {
      for (const mixinRef of spec.mixins) {
        const mixinSpec = this.loadByIdOrPath(mixinRef);
        spec = PersonaComposer.merge(spec, mixinSpec);
      }
    }

    this.cache.set(spec.id, spec);
    return spec;
  }

  public loadById(id: string): PersonaSpec {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    for (const basePath of this.searchPaths) {
      if (!existsSync(basePath)) continue;

      const candidates = [
        join(basePath, `${id}.yaml`),
        join(basePath, `${id}.yml`),
        join(basePath, `${id}.json`),
      ];

      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          return this.loadFromFile(candidate);
        }
      }
    }

    throw new Error(`Persona with ID '${id}' could not be located in search paths: ${this.searchPaths.join(", ")}`);
  }

  public loadByIdOrPath(ref: string): Partial<PersonaSpec> {
    if (existsSync(ref)) {
      const raw = readFileSync(ref, "utf-8");
      return ref.endsWith(".json") ? JSON.parse(raw) : parseYaml(raw);
    }
    return this.loadById(ref);
  }

  public listAvailablePersonas(): Array<{ id: string; name: string; title: string; filePath: string }> {
    const results: Array<{ id: string; name: string; title: string; filePath: string }> = [];

    for (const basePath of this.searchPaths) {
      if (!existsSync(basePath)) continue;

      const files = readdirSync(basePath, { recursive: true }) as string[];
      for (const file of files) {
        if (file.endsWith(".yaml") || file.endsWith(".yml") || file.endsWith(".json")) {
          const full = join(basePath, file);
          try {
            const raw = readFileSync(full, "utf-8");
            const parsed = full.endsWith(".json") ? JSON.parse(raw) : parseYaml(raw);
            if (parsed && parsed.id && parsed.name) {
              results.push({
                id: parsed.id,
                name: parsed.name,
                title: parsed.identity?.title || "Autonomous Agent",
                filePath: full,
              });
            }
          } catch {
            // Abaikan file non-persona
          }
        }
      }
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }
}

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, extname, join, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { EMBEDDED_PRESETS } from "../generated/presets.generated.ts";

/**
 * Pencarian sumber persona / role / trait / harness dari beberapa "root",
 * berurutan dari prioritas tertinggi:
 *
 *   1. --path <dir>                      (opsi CLI / API)
 *   2. ./personas                        (project saat ini)
 *   3. ./custom_harnesses                (khusus harness, kompatibilitas v1)
 *   4. $PERSONAFORGE_HOME atau ~/.config/personaforge
 *   5. preset bawaan (folder presets/ saat development, atau ter-embed di binary)
 *
 * Setiap root boleh berisi subfolder `personas/`, `roles/`, `traits/`, `harnesses/`.
 * File YAML/JSON langsung di root diklasifikasikan lewat field `kind`
 * (default: persona; atau harness jika punya `output_format`).
 */

export type SourceKind = "persona" | "role" | "trait" | "harness";
export type SourceOrigin = "path" | "project" | "user" | "builtin";

export interface SourceEntry {
  kind: SourceKind;
  id: string;
  /** Path di disk, atau `builtin:<rel>` untuk preset ter-embed */
  path: string;
  origin: SourceOrigin;
  data: Record<string, any>;
}

export const KIND_DIRS: Record<SourceKind, string> = {
  persona: "personas",
  role: "roles",
  trait: "traits",
  harness: "harnesses",
};

const DATA_EXT = new Set([".yaml", ".yml", ".json"]);

export function parseDataFile(text: string, pathHint: string): Record<string, any> {
  const data = pathHint.endsWith(".json") ? JSON.parse(text) : parseYaml(text);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`File ${pathHint} bukan objek YAML/JSON yang valid`);
  }
  return data as Record<string, any>;
}

export function readDataFile(path: string): Record<string, any> {
  return parseDataFile(readFileSync(path, "utf-8"), path);
}

function classifyFlat(data: Record<string, any>): SourceKind {
  if (data.kind && ["persona", "role", "trait", "harness"].includes(data.kind)) return data.kind;
  if ("output_format" in data || "custom_template" in data) return "harness";
  return "persona";
}

function idFromFile(data: Record<string, any>, file: string): string {
  return typeof data.id === "string" ? data.id : basename(file, extname(file));
}

function listDataFiles(dir: string, recursive: boolean): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const entries = readdirSync(dir, { recursive, withFileTypes: false }) as string[];
  return entries
    .filter((f) => DATA_EXT.has(extname(f)))
    .map((f) => join(dir, f))
    .sort();
}

interface Root {
  origin: SourceOrigin;
  scan(kind: SourceKind): Array<{ path: string; data: Record<string, any> }>;
  label: string;
}

/** Folder presets/ di repo (dipakai saat development). Tidak ada di dalam binary. */
export const BUILTIN_DIR = resolve(import.meta.dir, "../../presets");

export class SourceRegistry {
  private roots: Root[] = [];
  private cache = new Map<SourceKind, SourceEntry[]>();
  public readonly warnings: string[] = [];

  constructor(options: { paths?: string[]; cwd?: string; includeBuiltin?: boolean; userDir?: string | null } = {}) {
    const cwd = options.cwd ?? process.cwd();

    for (const p of options.paths ?? []) this.roots.push(this.diskRoot(resolve(cwd, p), "path"));
    this.roots.push(this.diskRoot(resolve(cwd, "personas"), "project"));
    this.roots.push(this.harnessOnlyRoot(resolve(cwd, "custom_harnesses")));

    const userDir =
      options.userDir === null
        ? null
        : (options.userDir ?? process.env.PERSONAFORGE_HOME ?? join(homedir(), ".config", "personaforge"));
    if (userDir) this.roots.push(this.diskRoot(userDir, "user"));

    if (options.includeBuiltin !== false) {
      this.roots.push(existsSync(BUILTIN_DIR) ? this.diskRoot(BUILTIN_DIR, "builtin") : this.embeddedRoot());
    }
  }

  get searchLocations(): string[] {
    return this.roots.map((r) => r.label);
  }

  private safeRead(path: string): Record<string, any> | undefined {
    try {
      return readDataFile(path);
    } catch (e: any) {
      this.warnings.push(`Gagal membaca ${path}: ${e.message}`);
      return undefined;
    }
  }

  private diskRoot(dir: string, origin: SourceOrigin): Root {
    return {
      origin,
      label: dir,
      scan: (kind) => {
        const out: Array<{ path: string; data: Record<string, any> }> = [];
        for (const file of listDataFiles(join(dir, KIND_DIRS[kind]), true)) {
          const data = this.safeRead(file);
          if (data) out.push({ path: file, data });
        }
        for (const file of listDataFiles(dir, false)) {
          const data = this.safeRead(file);
          if (data && classifyFlat(data) === kind) out.push({ path: file, data });
        }
        return out;
      },
    };
  }

  private harnessOnlyRoot(dir: string): Root {
    return {
      origin: "project",
      label: dir,
      scan: (kind) => {
        if (kind !== "harness") return [];
        return listDataFiles(dir, false)
          .map((file) => ({ path: file, data: this.safeRead(file) }))
          .filter((e): e is { path: string; data: Record<string, any> } => !!e.data);
      },
    };
  }

  private embeddedRoot(): Root {
    return {
      origin: "builtin",
      label: "builtin (embedded)",
      scan: (kind) => {
        const prefix = `${KIND_DIRS[kind]}/`;
        const out: Array<{ path: string; data: Record<string, any> }> = [];
        for (const [rel, text] of Object.entries(EMBEDDED_PRESETS)) {
          if (!rel.startsWith(prefix)) continue;
          try {
            out.push({ path: `builtin:${rel}`, data: parseDataFile(text, rel) });
          } catch (e: any) {
            this.warnings.push(`Preset bawaan rusak ${rel}: ${e.message}`);
          }
        }
        return out;
      },
    };
  }

  /** Semua entri sebuah kind, dedupe per ID (root prioritas tertinggi menang). */
  list(kind: SourceKind): SourceEntry[] {
    const cached = this.cache.get(kind);
    if (cached) return cached;

    const seen = new Set<string>();
    const out: SourceEntry[] = [];
    for (const root of this.roots) {
      for (const { path, data } of root.scan(kind)) {
        const id = idFromFile(data, path);
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ kind, id, path, origin: root.origin, data });
      }
    }
    this.cache.set(kind, out);
    return out;
  }

  find(kind: SourceKind, id: string): SourceEntry | undefined {
    return this.list(kind).find((e) => e.id === id);
  }

  /** Dukung referensi berupa path file langsung (./my-persona.yaml). */
  findByRef(kind: SourceKind, ref: string, cwd = process.cwd()): SourceEntry | undefined {
    const looksLikePath = ref.includes("/") || DATA_EXT.has(extname(ref));
    if (looksLikePath) {
      const full = resolve(cwd, ref);
      if (existsSync(full)) {
        const data = readDataFile(full);
        return { kind, id: idFromFile(data, full), path: full, origin: "path", data };
      }
    }
    return this.find(kind, ref);
  }

  /** Path relatif yang enak dibaca untuk output CLI. */
  static displayPath(entry: SourceEntry, cwd = process.cwd()): string {
    if (entry.path.startsWith("builtin:")) return entry.path;
    const rel = relative(cwd, entry.path);
    return rel.startsWith("..") ? entry.path : rel;
  }
}

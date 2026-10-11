import { PersonaSchema, RoleSchema, type PersonaSpec } from "../schema/ups.ts";
import { isLegacyPersona, migrateLegacyPersona } from "../schema/migrate.ts";
import { deepMerge, isPlainObject, setPath, stripDirectives, type Plain } from "./merge.ts";
import { SourceRegistry, readDataFile, type SourceEntry } from "./sources.ts";
import { applyVariables } from "./variables.ts";
import { resolve } from "node:path";

/**
 * PersonaResolver — memuat persona dan menyusun semua lapisannya.
 *
 * Urutan prioritas (kanan menang):
 *   persona induk (extends) → [trait milik file → isi file] → --role → --trait
 *   → file override → --set → variabel (--var)
 *
 * Validasi Zod + pengisian default dilakukan SEKALI di akhir, sehingga
 * nilai default anak tidak pernah menimpa nilai induk.
 */

export interface ResolveOptions {
  /** Nilai variabel, mis. { user_name: "Cahya" } */
  vars?: Record<string, string>;
  /** Trait tambahan yang ditempel paling akhir */
  traits?: string[];
  /** Ganti role (ID atau path). `null` = hapus role. */
  role?: string | null;
  /** File override (path) atau objek override parsial */
  overrides?: Array<string | Plain>;
  /** Override per path, mis. [["voice.verbosity", 0.3]] */
  set?: Array<[string, unknown]>;
}

export interface ResolvedPersona {
  persona: PersonaSpec;
  variables: Record<string, string>;
  /** Daftar lapisan yang diterapkan (untuk `inspect`) */
  layers: string[];
  source: SourceEntry;
}

export class PersonaValidationError extends Error {
  constructor(
    public readonly personaId: string,
    public readonly issues: string[],
  ) {
    super(`Persona '${personaId}' tidak valid:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
  }
}

const HEADER_KEYS = ["kind", "description", "$schema"];

function withoutKeys(obj: Plain, keys: string[]): Plain {
  const out: Plain = {};
  for (const [k, v] of Object.entries(obj)) if (!keys.includes(k)) out[k] = v;
  return out;
}

function normalizePersonaData(data: Plain): Plain {
  const migrated = isLegacyPersona(data) ? migrateLegacyPersona(data) : data;
  return withoutKeys(migrated, HEADER_KEYS);
}

function combine(...layers: unknown[]): Plain {
  let acc: unknown = {};
  for (const l of layers) acc = deepMerge(acc, l);
  return (acc ?? {}) as Plain;
}

export class PersonaResolver {
  constructor(
    public readonly sources: SourceRegistry = new SourceRegistry(),
    private readonly cwd: string = process.cwd(),
  ) {}

  // ─── Pencarian ────────────────────────────────────────────────────────────
  findPersona(ref: string): SourceEntry {
    const entry = this.sources.findByRef("persona", ref, this.cwd);
    if (!entry) {
      const available = this.sources.list("persona").map((e) => e.id);
      throw new Error(
        `Persona '${ref}' tidak ditemukan.\n  Tersedia: ${available.join(", ") || "(kosong)"}\n  Lokasi dicari: ${this.sources.searchLocations.join(", ")}`,
      );
    }
    return entry;
  }

  loadRole(ref: string, stack: string[] = []): Plain {
    if (stack.includes(ref)) throw new Error(`Siklus role terdeteksi: ${[...stack, ref].join(" → ")}`);
    const entry = this.sources.findByRef("role", ref, this.cwd);
    if (!entry) {
      const available = this.sources.list("role").map((e) => e.id);
      throw new Error(`Role '${ref}' tidak ditemukan. Tersedia: ${available.join(", ") || "(kosong)"}`);
    }
    return this.expandRole(withoutKeys(entry.data, ["$schema"]), [...stack, ref]);
  }

  /** Role inline boleh `extends: <role-id>` lalu override sebagian. */
  private expandRole(role: Plain, stack: string[] = []): Plain {
    if (typeof role.extends !== "string") return withoutKeys(role, ["kind"]);
    const base = this.loadRole(role.extends, stack);
    return stripDirectives(combine(base, withoutKeys(role, ["extends", "kind"]))) as Plain;
  }

  loadTrait(ref: string, stack: string[] = []): Plain {
    if (stack.includes(ref)) throw new Error(`Siklus trait terdeteksi: ${[...stack, ref].join(" → ")}`);
    const entry = this.sources.findByRef("trait", ref, this.cwd);
    if (!entry) {
      const available = this.sources.list("trait").map((e) => e.id);
      throw new Error(`Trait '${ref}' tidak ditemukan. Tersedia: ${available.join(", ") || "(kosong)"}`);
    }
    const body = withoutKeys(entry.data, ["kind", "id", "name", "description", "schema_version", "$schema"]);
    return this.expandLayer(body, [...stack, ref]);
  }

  /**
   * Satu lapisan: trait yang dideklarasikan di lapisan itu dipasang DI BAWAH
   * isi lapisan (isi file sendiri tetap menang), role string di-resolve jadi objek.
   */
  private expandLayer(layer: Plain, traitStack: string[]): Plain {
    const own: Plain = { ...layer };

    if (typeof own.role === "string") {
      own.role = { $replace: this.loadRole(own.role) };
    } else if (isPlainObject(own.role) && typeof own.role.extends === "string") {
      own.role = { $replace: this.expandRole(own.role) };
    }

    const traitIds = Array.isArray(own.traits) ? (own.traits as string[]) : [];
    const traitLayers = traitIds.map((t) => this.loadTrait(t, traitStack));

    return combine(...traitLayers, own);
  }

  private resolveChain(entry: SourceEntry, stack: string[], layers: string[]): Plain {
    if (stack.includes(entry.id)) {
      throw new Error(`Siklus 'extends' terdeteksi: ${[...stack, entry.id].join(" → ")}`);
    }
    const raw = normalizePersonaData(entry.data);

    let base: Plain = {};
    if (typeof raw.extends === "string") {
      base = this.resolveChain(this.findPersona(raw.extends), [...stack, entry.id], layers);
    }

    const traits = Array.isArray(raw.traits) ? (raw.traits as string[]) : [];
    layers.push(
      `persona:${entry.id} (${SourceRegistry.displayPath(entry, this.cwd)})` +
        (traits.length ? ` + traits[${traits.join(", ")}]` : ""),
    );
    return combine(base, this.expandLayer(raw, []));
  }

  // ─── API utama ────────────────────────────────────────────────────────────
  resolve(ref: string, options: ResolveOptions = {}): ResolvedPersona {
    const entry = this.findPersona(ref);
    const layers: string[] = [];
    const stack: unknown[] = [this.resolveChain(entry, [], layers)];

    if (options.role !== undefined) {
      stack.push({ role: options.role === null ? null : { $replace: this.loadRole(options.role) } });
      layers.push(options.role === null ? "role: (dihapus)" : `role:${options.role}`);
    }

    for (const t of options.traits ?? []) {
      stack.push(this.loadTrait(t), { traits: [t] });
      layers.push(`trait:${t}`);
    }

    for (const o of options.overrides ?? []) {
      const data = typeof o === "string" ? readDataFile(resolve(this.cwd, o)) : o;
      stack.push(this.expandLayer(normalizePersonaData(data), []));
      layers.push(typeof o === "string" ? `override:${o}` : "override:(object)");
    }

    for (const [path, value] of options.set ?? []) {
      stack.push(setPath(path, value));
      layers.push(`set:${path}`);
    }

    const merged = stripDirectives(combine(...stack)) as Plain;

    // Runtime dari role menjadi default; runtime milik persona tetap menang.
    if (isPlainObject(merged.role) && isPlainObject(merged.role.runtime)) {
      merged.runtime = stripDirectives(deepMerge(merged.role.runtime, merged.runtime ?? {}));
    }

    const parsed = PersonaSchema.safeParse(merged);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
      throw new PersonaValidationError(String(merged.id ?? entry.id), issues);
    }

    const { persona, values } = applyVariables(parsed.data, options.vars);
    return { persona, variables: values, layers, source: entry };
  }

  /** Ringkasan semua persona untuk `list` (tanpa resolve penuh). */
  listPersonas(): Array<{ id: string; name: string; tagline: string; role?: string; entry: SourceEntry }> {
    return this.sources.list("persona").map((entry) => {
      const raw = normalizePersonaData(entry.data);
      const role = typeof raw.role === "string" ? raw.role : isPlainObject(raw.role) ? String(raw.role.extends ?? raw.role.id ?? "inline") : undefined;
      return {
        id: entry.id,
        name: String(raw.name ?? entry.id),
        tagline: String(raw.tagline ?? ""),
        role,
        entry,
      };
    });
  }

  listRoles(): Array<{ id: string; name: string; description: string; entry: SourceEntry }> {
    return this.sources.list("role").map((entry) => {
      const parsed = RoleSchema.partial().safeParse(withoutKeys(entry.data, ["extends", "$schema"]));
      const d = parsed.success ? parsed.data : entry.data;
      return { id: entry.id, name: String(d.name ?? entry.id), description: String(d.description ?? ""), entry };
    });
  }

  listTraits(): Array<{ id: string; name: string; description: string; entry: SourceEntry }> {
    return this.sources.list("trait").map((entry) => ({
      id: entry.id,
      name: String(entry.data.name ?? entry.id),
      description: String(entry.data.description ?? ""),
      entry,
    }));
  }
}

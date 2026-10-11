/**
 * Migrasi otomatis persona format v1 (UPS 1.x) ke v2.
 * Dipanggil oleh loader setiap kali memuat file, jadi persona lama tetap bisa dipakai.
 */

type Obj = Record<string, any>;

const REGISTER_MAP: Record<string, string> = {
  conversational: "conversational",
  casual: "casual",
  professional: "professional",
  academic_engineering: "technical",
  poetic: "poetic",
  minimalist: "professional",
};

const REASONING_FIX: Record<string, string> = {
  reflact_and_verify: "reflect_and_verify",
};

export function isLegacyPersona(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Obj;
  if (typeof r.schema_version === "string" && r.schema_version.startsWith("1")) return true;
  return "identity" in r || "linguistic_style" in r || "psychometrics" in r || "harness_hints" in r;
}

/** Pisahkan "Aoi (Cewek Jepang Yandere)" menjadi { name: "Aoi", extra: "Cewek Jepang Yandere" }. */
export function splitDecoratedName(name: string): { name: string; extra?: string } {
  const m = name.match(/^\s*([^()]+?)\s*\((.+)\)\s*$/);
  if (!m) return { name: name.trim() };
  return { name: m[1]!.trim(), extra: m[2]!.trim() };
}

export function migrateLegacyPersona(raw: Obj): Obj {
  const out: Obj = { schema_version: "2.0" };

  for (const key of ["kind", "id", "version", "author", "tags", "extends", "custom"]) {
    if (raw[key] !== undefined) out[key] = raw[key];
  }
  if (Array.isArray(raw.mixins) && raw.mixins.length > 0) out.traits = raw.mixins;

  if (typeof raw.name === "string") {
    out.name = splitDecoratedName(raw.name).name;
  }

  const identity: Obj = raw.identity ?? {};
  if (identity.title) out.tagline = identity.title;

  if (identity.bio || identity.lore || raw.psychometrics) {
    out.character = {};
    if (identity.bio) out.character.bio = identity.bio;
    if (Array.isArray(identity.lore)) out.character.backstory = identity.lore;
    if (raw.psychometrics) out.character.personality = { big_five: raw.psychometrics };
  }

  if (identity.avatar) out.meta = { avatar: identity.avatar };

  const ls: Obj | undefined = raw.linguistic_style;
  if (ls) {
    out.voice = {};
    if (ls.tone) out.voice.tone = ls.tone;
    if (ls.vocabulary_level) out.voice.register = REGISTER_MAP[ls.vocabulary_level] ?? "conversational";
    if (typeof ls.conciseness === "number") {
      out.voice.verbosity = Math.round((1 - ls.conciseness) * 100) / 100;
    }
    if (Array.isArray(ls.catchphrases)) out.voice.catchphrases = ls.catchphrases;
    if (Array.isArray(ls.forbidden_patterns) && ls.forbidden_patterns.length > 0) {
      out.rules = { dont: ls.forbidden_patterns };
    }
  }

  // v1 mencampur protokol kerja ke dalam persona → jadikan inline role.
  const rp: Obj | undefined = raw.reasoning_protocol;
  const hh: Obj | undefined = raw.harness_hints;
  const fp: Obj | undefined = ls?.formatting_preferences;
  if (rp || fp || hh?.agentic_capabilities) {
    const role: Obj = {
      id: `${raw.id ?? "legacy"}-role`,
      name: identity.title ?? "Legacy Role",
    };
    if (rp) {
      role.reasoning = {};
      if (rp.mode) role.reasoning.mode = REASONING_FIX[rp.mode] ?? rp.mode;
      if (rp.thought_process?.verify_edge_cases) role.reasoning.verify = rp.thought_process.verify_edge_cases;
    }
    if (fp) {
      role.output_format = {
        code_first: fp.code_first ?? false,
        use_mermaid: fp.use_mermaid ?? false,
        tables: fp.table_comparisons ?? false,
        headings: fp.structured_headings ?? false,
      };
    }
    if (Array.isArray(hh?.agentic_capabilities)) {
      role.capabilities = hh!.agentic_capabilities;
      role.agentic = hh!.agentic_capabilities.some((c: string) =>
        ["tool_calling", "bash_execution", "file_io", "ooda_loop"].includes(c),
      );
    }
    out.role = role;
  }

  if (hh) {
    out.runtime = {};
    for (const k of ["temperature", "top_p", "max_tokens"]) {
      if (hh[k] !== undefined) out.runtime[k] = hh[k];
    }
    if (Array.isArray(hh.preferred_models) && hh.preferred_models.length > 0) {
      out.custom = { ...(out.custom ?? {}), legacy_preferred_models: hh.preferred_models };
    }
  }

  return out;
}

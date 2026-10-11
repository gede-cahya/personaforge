import type { PersonaSpec, Variable } from "../schema/ups.ts";

/**
 * Interpolasi variabel persona: `{{user_name}}`, `{{intensity}}`, dst.
 *
 * - Variabel dideklarasikan di `variables:` persona (dengan default, opsional enum).
 * - Nilai bisa di-override lewat CLI `--var key=value` atau API `vars: {...}`.
 * - Variabel bawaan: `{{name}}` (nama persona) dan `{{persona_id}}`.
 * - Placeholder yang tidak dikenal dibiarkan apa adanya (berguna untuk
 *   template milik harness lain seperti `{{user}}`/`{{char}}` SillyTavern).
 */

const PLACEHOLDER = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export class VariableError extends Error {}

export function resolveVariableValues(
  declared: Record<string, Variable>,
  overrides: Record<string, string> = {},
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, def] of Object.entries(declared)) {
    values[key] = def.default;
  }

  for (const [key, val] of Object.entries(overrides)) {
    const def = declared[key];
    if (!def) {
      const available = Object.keys(declared);
      throw new VariableError(
        `Variabel '${key}' tidak dikenal.` +
          (available.length ? ` Variabel yang tersedia: ${available.join(", ")}` : " Persona ini tidak punya variabel."),
      );
    }
    if (def.enum && !def.enum.includes(val)) {
      throw new VariableError(`Nilai '${val}' tidak valid untuk variabel '${key}'. Pilihan: ${def.enum.join(", ")}`);
    }
    values[key] = val;
  }

  return values;
}

export function interpolate(text: string, values: Record<string, string>): string {
  return text.replace(PLACEHOLDER, (match, key: string) => (key in values ? values[key]! : match));
}

function interpolateDeep(value: unknown, values: Record<string, string>): unknown {
  if (typeof value === "string") return interpolate(value, values);
  if (Array.isArray(value)) return value.map((v) => interpolateDeep(v, values));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = interpolateDeep(v, values);
    return out;
  }
  return value;
}

/** Terapkan variabel ke semua string persona (kecuali definisi variabel itu sendiri). */
export function applyVariables(
  persona: PersonaSpec,
  overrides: Record<string, string> = {},
): { persona: PersonaSpec; values: Record<string, string> } {
  const values: Record<string, string> = {
    name: persona.name,
    persona_id: persona.id,
    ...resolveVariableValues(persona.variables, overrides),
  };
  // Nilai variabel boleh mereferensikan variabel lain satu tingkat (mis. default "{{name}}").
  for (const k of Object.keys(values)) values[k] = interpolate(values[k]!, values);

  const { variables, ...rest } = persona;
  const interpolated = interpolateDeep(rest, values) as Omit<PersonaSpec, "variables">;
  return { persona: { ...interpolated, variables } as PersonaSpec, values };
}

/** Cari placeholder `{{x}}` yang tidak terdefinisi (untuk peringatan di `validate`). */
export function findUnknownPlaceholders(persona: PersonaSpec): string[] {
  const known = new Set(["name", "persona_id", ...Object.keys(persona.variables)]);
  const unknown = new Set<string>();
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      for (const m of v.matchAll(PLACEHOLDER)) if (!known.has(m[1]!)) unknown.add(m[1]!);
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  const { variables: _ignored, ...rest } = persona;
  walk(rest);
  return [...unknown];
}

/**
 * Deep-merge berlapis untuk persona.
 *
 * Aturan:
 * - object  → di-merge rekursif
 * - array   → digabung (append) + dedupe
 * - scalar  → lapisan atas menang
 * - null    → menghapus key dari hasil (mis. `role: null`, `greeting: null`)
 * - { $replace: X } → mengganti total nilai di bawahnya dengan X (array/object)
 */

export type Plain = Record<string, unknown>;

export function isPlainObject(v: unknown): v is Plain {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isReplace(v: unknown): v is { $replace: unknown } {
  return isPlainObject(v) && Object.keys(v).length === 1 && "$replace" in v;
}

/** Hapus wrapper `$replace` yang tersisa (mis. ketika tidak ada nilai base). */
export function stripDirectives(v: unknown): unknown {
  if (isReplace(v)) return stripDirectives(v.$replace);
  if (Array.isArray(v)) return v.map(stripDirectives);
  if (isPlainObject(v)) {
    const out: Plain = {};
    for (const [k, val] of Object.entries(v)) {
      if (val === null) continue;
      out[k] = stripDirectives(val);
    }
    return out;
  }
  return v;
}

function dedupe(items: unknown[]): unknown[] {
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const item of items) {
    const key = typeof item === "string" ? `s:${item}` : `j:${JSON.stringify(item)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function deepMerge(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return base;
  if (overlay === null) return undefined;
  if (isReplace(overlay)) return stripDirectives(overlay.$replace);

  if (Array.isArray(overlay)) {
    const b = Array.isArray(base) ? base : [];
    return dedupe([...b, ...(stripDirectives(overlay) as unknown[])]);
  }

  if (isPlainObject(overlay)) {
    const b = isPlainObject(base) ? base : {};
    const out: Plain = { ...b };
    for (const [k, v] of Object.entries(overlay)) {
      const merged = deepMerge(b[k], v);
      if (merged === undefined) delete out[k];
      else out[k] = merged;
    }
    return out;
  }

  return overlay;
}

export function mergeLayers(...layers: unknown[]): Plain {
  let acc: unknown = {};
  for (const layer of layers) acc = deepMerge(acc, layer);
  return (stripDirectives(acc) as Plain) ?? {};
}

/**
 * Ubah `voice.verbosity=0.3` menjadi objek bersarang `{ voice: { verbosity: 0.3 } }`.
 * Nilai di-parse sebagai YAML scalar oleh pemanggil.
 */
export function setPath(path: string, value: unknown): Plain {
  const parts = path.split(".").filter(Boolean);
  if (parts.length === 0) throw new Error(`Path --set tidak valid: '${path}'`);
  const root: Plain = {};
  let cur: Plain = root;
  parts.forEach((p, i) => {
    if (i === parts.length - 1) cur[p] = value;
    else {
      const next: Plain = {};
      cur[p] = next;
      cur = next;
    }
  });
  return root;
}

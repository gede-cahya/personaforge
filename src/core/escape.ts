/**
 * Helper escaping agar teks persona (yang bisa berisi kutip, backtick, kurung kurawal, dll.)
 * selalu menghasilkan file target yang valid.
 */

/** Isi untuk string Python triple-quoted `"""..."""`. */
export function escapePyTriple(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Literal string Python satu baris (aman untuk nilai pendek). */
export function pyString(s: string): string {
  return JSON.stringify(s);
}

/** Isi untuk template literal JS/TS `` `...` ``. */
export function escapeTemplateLiteral(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

/** Isi untuk blok `"""..."""` di Ollama Modelfile (tidak mendukung escape). */
export function escapeModelfileTriple(s: string): string {
  return s.replace(/"""/g, "'''");
}

/** Escape karakter khusus XML di dalam konten tag. */
export function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Escape kurung kurawal untuk template f-string (LangChain, Python str.format). */
export function escapeBraces(s: string): string {
  return s.replace(/\{/g, "{{").replace(/\}/g, "}}");
}

/** Nilai YAML double-quoted (JSON string adalah YAML yang valid). */
export function yamlString(s: string): string {
  return JSON.stringify(s);
}

/** Indentasi setiap baris (untuk block scalar YAML, dsb.). */
export function indent(s: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return s
    .split("\n")
    .map((line) => (line.length ? pad + line : line))
    .join("\n");
}

/** ID aman untuk identifier Python/TS: `yandere-girlfriend` → `yandere_girlfriend`. */
export function safeIdentifier(id: string): string {
  const s = id.replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

/** camelCase: `yandere-girlfriend` → `yandereGirlfriend`. */
export function camelIdentifier(id: string): string {
  const s = id.replace(/[-_]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "");
  return /^[0-9]/.test(s) ? `_${s}` : s;
}

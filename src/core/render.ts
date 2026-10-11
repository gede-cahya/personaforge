import type { PromptIR, PromptSection, SectionKey } from "./ir.ts";
import { escapeXml } from "./escape.ts";

/**
 * Renderer IR → teks system prompt dalam 3 gaya:
 *   - markdown : heading `##` (default; cocok untuk hampir semua harness)
 *   - xml      : tag XML (direkomendasikan Anthropic untuk Claude)
 *   - plain    : judul KAPITAL tanpa markup (Modelfile, ChatML, dsb.)
 */

export type RenderStyle = "markdown" | "xml" | "plain";

export interface RenderOptions {
  style?: RenderStyle;
  /** Level heading markdown (default 2 → `##`) */
  headingLevel?: number;
  /** Sertakan contoh percakapan (default true) */
  includeExamples?: boolean;
  /** Hanya section ini (urutan tetap mengikuti IR) */
  only?: SectionKey[];
  /** Kecualikan section ini */
  exclude?: SectionKey[];
}

function tagName(key: string): string {
  return key.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
}

export function renderSection(section: PromptSection, style: RenderStyle, headingLevel = 2): string {
  const body = section.lines.join("\n");
  switch (style) {
    case "xml":
      return `<${tagName(section.key)}>\n${escapeXml(body)}\n</${tagName(section.key)}>`;
    case "plain":
      return `${section.title.toUpperCase()}:\n${body}`;
    default:
      return `${"#".repeat(headingLevel)} ${section.title}\n${body}`;
  }
}

export function renderExamples(ir: PromptIR, style: RenderStyle, headingLevel = 2): string {
  if (ir.examples.length === 0) return "";
  const intro = "These examples show your voice and attitude. Use them as a style reference — don't copy them verbatim.";
  const name = ir.persona.name;

  if (style === "xml") {
    const items = ir.examples
      .map((e) => `<example>\n<user>${escapeXml(e.user)}</user>\n<assistant>${escapeXml(e.assistant)}</assistant>\n</example>`)
      .join("\n");
    return `<examples>\n${escapeXml(intro)}\n${items}\n</examples>`;
  }

  if (style === "plain") {
    const items = ir.examples.map((e) => `User: ${e.user}\n${name}: ${e.assistant}`).join("\n\n");
    return `EXAMPLE EXCHANGES:\n${intro}\n\n${items}`;
  }

  const items = ir.examples.map((e) => `**User:** ${e.user}\n**${name}:** ${e.assistant}`).join("\n\n");
  return `${"#".repeat(headingLevel)} Example Exchanges\n${intro}\n\n${items}`;
}

/** Render system prompt lengkap dari IR. */
export function renderPrompt(ir: PromptIR, options: RenderOptions = {}): string {
  const style = options.style ?? "markdown";
  const level = options.headingLevel ?? 2;

  const sections = ir.sections.filter(
    (s) => (!options.only || options.only.includes(s.key)) && !options.exclude?.includes(s.key),
  );

  const parts = sections.map((s) => renderSection(s, style, level));
  if (options.includeExamples !== false) {
    const ex = renderExamples(ir, style, level);
    if (ex) parts.push(ex);
  }
  return parts.join("\n\n");
}

/** Bentuk "messages" few-shot untuk API chat (OpenAI, Ollama, dll.). */
export function exampleMessages(ir: PromptIR): Array<{ role: "user" | "assistant"; content: string }> {
  return ir.examples.flatMap((e) => [
    { role: "user" as const, content: e.user },
    { role: "assistant" as const, content: e.assistant },
  ]);
}

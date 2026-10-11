import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import type { CustomHarnessSpec } from "../schema/custom-harness.ts";
import { renderPrompt } from "../core/render.ts";
import { escapePyTriple, safeIdentifier } from "../core/escape.ts";

/**
 * Dynamic & Declarative Custom Harness Adapter
 * Mengompilasi Prompt IR ke format harness kustom apa pun yang didefinisikan pengguna.
 */
export class CustomHarnessAdapter implements HarnessAdapter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category = "custom" as const;
  private spec: CustomHarnessSpec;

  constructor(spec: CustomHarnessSpec) {
    this.id = spec.id;
    this.name = spec.name;
    this.description = spec.description || `Custom adapter for ${spec.name}`;
    this.spec = spec;
  }

  compile(ir: PromptIR): HarnessOutput {
    let content = "";
    const systemPrompt = renderPrompt(ir, { style: "markdown" });

    if (this.spec.custom_template) {
      content = this.interpolateTemplate(this.spec.custom_template, ir, systemPrompt);
    } else {
      content = this.buildStructuredContent(ir, systemPrompt);
    }

    const filename = this.spec.default_filename.replace("{id}", ir.persona.id);

    return {
      harnessId: this.id,
      filename: filename.includes(".") ? filename : `${ir.persona.id}.${this.spec.output_format}`,
      mimeType: this.resolveMimeType(this.spec.output_format),
      content,
      metadata: {
        custom: true,
        tool_convention: this.spec.tool_calling_convention,
      },
    };
  }

  private interpolateTemplate(template: string, ir: PromptIR, systemPrompt: string): string {
    const { persona, runtime } = ir;
    const { character, voice } = persona;

    const replacements: Record<string, string> = {
      "{{id}}": persona.id,
      "{{safe_id}}": safeIdentifier(persona.id),
      "{{name}}": persona.name,
      "{{title}}": persona.tagline || ir.role?.name || "Agent",
      "{{tagline}}": persona.tagline || "",
      "{{bio}}": character.bio,
      "{{lore}}": character.backstory.map((l) => `- ${l}`).join("\n"),
      "{{backstory}}": character.backstory.map((l) => `- ${l}`).join("\n"),
      "{{tone}}": voice.tone,
      "{{vocabulary}}": voice.register,
      "{{conciseness}}": String(voice.verbosity),
      "{{system_prompt}}": systemPrompt,
      "{{catchphrases}}": voice.catchphrases.map((c) => `- "${c}"`).join("\n"),
      "{{forbidden}}": persona.rules.dont.map((p) => `- DO NOT: ${p}`).join("\n"),
      "{{reasoning_mode}}": ir.role?.reasoning.mode || "reflect_and_verify",
      "{{temperature}}": String(runtime.temperature),
      "{{top_p}}": String(runtime.top_p),
      "{{max_tokens}}": String(runtime.max_tokens),
      "{{capabilities}}": (ir.role?.capabilities ?? []).join(", "),
      "{{escape_py_system_prompt}}": escapePyTriple(systemPrompt),
    };

    let result = template;
    for (const [key, val] of Object.entries(replacements)) {
      result = result.replaceAll(key, val);
    }
    return result;
  }

  private buildStructuredContent(ir: PromptIR, systemPrompt: string): string {
    const parts: string[] = [];
    const { sections, tool_calling_convention } = this.spec;

    if (sections.header) {
      parts.push(sections.header);
    }

    parts.push(systemPrompt);

    // Tools Convention Section
    if (tool_calling_convention.type !== "none") {
      let toolDoc = `Type: ${tool_calling_convention.type}\n`;
      if (tool_calling_convention.type === "json_markdown") {
        toolDoc += `Execute tools by wrapping action payload in \`\`\`${tool_calling_convention.call_tag} {\"tool\": \"...\", \"args\": {...}} \`\`\`\n`;
      } else if (tool_calling_convention.type === "xml_tags") {
        toolDoc += `Execute tools by enclosing calls inside <${tool_calling_convention.call_tag}>...</${tool_calling_convention.call_tag}> tags.\n`;
      }
      if (tool_calling_convention.format_example) {
        toolDoc += `Example:\n${tool_calling_convention.format_example}\n`;
      }
      parts.push(sections.tools_prefix + toolDoc);
    }

    if (sections.footer) {
      parts.push(sections.footer);
    }

    return parts.join("\n\n");
  }

  private resolveMimeType(format: string): string {
    switch (format) {
      case "json": return "application/json";
      case "yaml": return "application/x-yaml";
      case "python": return "text/x-python";
      case "typescript": return "text/typescript";
      default: return "text/plain";
    }
  }
}

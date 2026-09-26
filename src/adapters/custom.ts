import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";
import type { CustomHarnessSpec } from "../schema/custom-harness.ts";

/**
 * Dynamic & Declarative Custom Harness Adapter
 * Mengompilasi persona ke format harness kustom apa pun yang didefinisikan pengguna.
 */
export class CustomHarnessAdapter implements HarnessAdapter {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  private spec: CustomHarnessSpec;

  constructor(spec: CustomHarnessSpec) {
    this.id = spec.id;
    this.name = spec.name;
    this.description = spec.description || `Custom adapter for ${spec.name}`;
    this.spec = spec;
  }

  compile(persona: PersonaSpec): HarnessOutput {
    let content = "";

    // Jika pengguna menyediakan custom_template lengkap dengan interpolasi variabel
    if (this.spec.custom_template) {
      content = this.interpolateTemplate(this.spec.custom_template, persona);
    } else {
      // Susun otomatis berdasarkan sections deklaratif
      content = this.buildStructuredContent(persona);
    }

    const filename = this.spec.default_filename.replace("{id}", persona.id);

    return {
      harnessId: this.id,
      filename: filename.includes(".") ? filename : `${persona.id}.${this.spec.output_format}`,
      mimeType: this.resolveMimeType(this.spec.output_format),
      content,
      metadata: {
        custom: true,
        tool_convention: this.spec.tool_calling_convention,
      },
    };
  }

  private interpolateTemplate(template: string, persona: PersonaSpec): string {
    const replacements: Record<string, string> = {
      "{{id}}": persona.id,
      "{{safe_id}}": persona.id.replace(/-/g, "_"),
      "{{name}}": persona.name,
      "{{title}}": persona.identity.title,
      "{{bio}}": persona.identity.bio,
      "{{lore}}": persona.identity.lore.map((l) => `- ${l}`).join("\n"),
      "{{tone}}": persona.linguistic_style.tone,
      "{{vocabulary}}": persona.linguistic_style.vocabulary_level,
      "{{conciseness}}": String(persona.linguistic_style.conciseness),
      "{{catchphrases}}": persona.linguistic_style.catchphrases.map((c) => `- "${c}"`).join("\n"),
      "{{forbidden}}": persona.linguistic_style.forbidden_patterns.map((p) => `- DO NOT: ${p}`).join("\n"),
      "{{reasoning_mode}}": persona.reasoning_protocol.mode,
      "{{temperature}}": String(persona.harness_hints.temperature),
      "{{top_p}}": String(persona.harness_hints.top_p),
      "{{max_tokens}}": String(persona.harness_hints.max_tokens),
      "{{preferred_models}}": persona.harness_hints.preferred_models.join(", "),
      "{{capabilities}}": persona.harness_hints.agentic_capabilities.join(", "),
    };

    let result = template;
    for (const [key, val] of Object.entries(replacements)) {
      result = result.replaceAll(key, val);
    }
    return result;
  }

  private buildStructuredContent(persona: PersonaSpec): string {
    const parts: string[] = [];
    const { sections, tool_calling_convention } = this.spec;

    if (sections.header) {
      parts.push(sections.header);
    }

    // Identity Section
    parts.push(sections.identity_prefix + 
      `Name: ${persona.name}\nRole: ${persona.identity.title}\nBio: ${persona.identity.bio}\n` +
      (persona.identity.lore.length > 0 ? `Lore:\n${persona.identity.lore.map(l => `- ${l}`).join("\n")}\n` : "")
    );

    // Psychometrics Section
    parts.push(sections.psychometrics_prefix +
      `Openness: ${persona.psychometrics.openness}\n` +
      `Conscientiousness: ${persona.psychometrics.conscientiousness}\n` +
      `Extraversion: ${persona.psychometrics.extraversion}\n` +
      `Agreeableness: ${persona.psychometrics.agreeableness}\n` +
      `Neuroticism: ${persona.psychometrics.neuroticism}\n`
    );

    // Linguistic Style Section
    parts.push(sections.style_prefix +
      `Tone: ${persona.linguistic_style.tone}\n` +
      `Vocabulary: ${persona.linguistic_style.vocabulary_level}\n` +
      `Conciseness: ${persona.linguistic_style.conciseness}\n` +
      (persona.linguistic_style.catchphrases.length > 0 
        ? `Catchphrases:\n${persona.linguistic_style.catchphrases.map(c => `- "${c}"`).join("\n")}\n` 
        : "") +
      (persona.linguistic_style.forbidden_patterns.length > 0 
        ? `Forbidden:\n${persona.linguistic_style.forbidden_patterns.map(p => `- ${p}`).join("\n")}\n` 
        : "")
    );

    // Reasoning Section
    parts.push(sections.reasoning_prefix +
      `Mode: ${persona.reasoning_protocol.mode}\n` +
      `Step-by-step: ${persona.reasoning_protocol.thought_process.step_by_step_mandatory}\n` +
      `Verify: ${persona.reasoning_protocol.thought_process.verify_edge_cases.join(", ")}\n`
    );

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

    return parts.join("\n");
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

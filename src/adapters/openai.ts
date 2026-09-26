import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

export class OpenAIAdapter implements HarnessAdapter {
  readonly id = "openai";
  readonly name = "OpenAI Developer / Assistant Harness";
  readonly description = "Format Developer Message & Assistants API config";

  compile(persona: PersonaSpec): HarnessOutput {
    const { identity, psychometrics, linguistic_style, reasoning_protocol, harness_hints } = persona;

    const developerMessage = `You are ${persona.name} (${identity.title}).\n\n` +
      `BIO & BACKGROUND:\n${identity.bio}\n` +
      (identity.lore.length > 0 ? `LORE:\n${identity.lore.map((l) => `- ${l}`).join("\n")}\n\n` : "\n") +
      `BEHAVIORAL TRAITS:\n` +
      `- Tone: ${linguistic_style.tone}\n` +
      `- Conciseness: ${linguistic_style.conciseness}\n` +
      `- Reasoning Mode: ${reasoning_protocol.mode}\n\n` +
      `CONSTRAINTS:\n${linguistic_style.forbidden_patterns.map((p) => `- DO NOT: ${p}`).join("\n")}`;

    const payload = {
      name: persona.id,
      description: `${persona.name} - ${identity.title}`,
      model: harness_hints.preferred_models[0] || "gpt-4o",
      temperature: harness_hints.temperature,
      top_p: harness_hints.top_p,
      instructions: developerMessage,
      metadata: {
        persona_id: persona.id,
        version: persona.version,
      },
    };

    return {
      harnessId: this.id,
      filename: `${persona.id}.openai.json`,
      mimeType: "application/json",
      content: JSON.stringify(payload, null, 2),
      metadata: payload,
    };
  }
}

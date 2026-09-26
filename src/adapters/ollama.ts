import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PersonaSpec } from "../schema/ups.ts";

export class OllamaAdapter implements HarnessAdapter {
  readonly id = "ollama";
  readonly name = "Ollama Modelfile Harness";
  readonly description = "Modelfile siap deploy ke runtime Ollama lokal";

  compile(persona: PersonaSpec): HarnessOutput {
    const baseModel = persona.harness_hints.preferred_models[0] || "qwen2.5-coder:32b";
    const { identity, linguistic_style, reasoning_protocol, harness_hints } = persona;

    const systemText = `You are ${persona.name}, ${identity.title}.\n\n` +
      `${identity.bio}\n\n` +
      `Tone: ${linguistic_style.tone}\n` +
      `Reasoning: ${reasoning_protocol.mode}\n` +
      `Constraints:\n${linguistic_style.forbidden_patterns.map(p => `- ${p}`).join("\n")}`;

    const content = `FROM ${baseModel}

# Runtime Hyperparameters
PARAMETER temperature ${harness_hints.temperature}
PARAMETER top_p ${harness_hints.top_p}
PARAMETER num_ctx 8192

# System Instructions
SYSTEM """
${systemText}
"""
`;

    return {
      harnessId: this.id,
      filename: `Modelfile.${persona.id}`,
      mimeType: "text/plain",
      content,
      metadata: {
        baseModel,
      },
    };
  }
}

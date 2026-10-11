import type { HarnessAdapter, HarnessOutput } from "./base.ts";
import type { PromptIR } from "../core/ir.ts";
import { targetConfig } from "../core/ir.ts";
import { renderPrompt } from "../core/render.ts";

export class OpenAIAdapter implements HarnessAdapter {
  readonly id = "openai";
  readonly name = "OpenAI Developer & Assistants API Harness";
  readonly description = "Konfigurasi Developer Message & OpenAI Assistants API siap pakai";
  readonly category = "chat-api";

  compile(ir: PromptIR): HarnessOutput {
    const openaiCfg = targetConfig(ir, "openai");
    const model = openaiCfg.model || "gpt-4o";

    const instructions = renderPrompt(ir, { style: "markdown" });

    const payload = {
      name: ir.persona.id,
      description: `${ir.persona.name}${ir.persona.tagline ? ` - ${ir.persona.tagline}` : ""}`,
      model,
      temperature: ir.runtime.temperature,
      top_p: ir.runtime.top_p,
      instructions,
      metadata: {
        persona_id: ir.persona.id,
        version: ir.persona.version,
        role: ir.role?.id ?? "none",
        language: ir.persona.language.primary,
      },
    };

    return {
      harnessId: this.id,
      filename: `${ir.persona.id}.openai.json`,
      mimeType: "application/json",
      content: JSON.stringify(payload, null, 2),
      metadata: payload,
    };
  }
}
